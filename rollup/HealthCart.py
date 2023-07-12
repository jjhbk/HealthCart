# Copyright 2022 Cartesi Pte. Ltd.
#
# SPDX-License-Identifier: Apache-2.0
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use
# this file except in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.

from os import environ
import traceback
import logging
import requests
import sqlite3
import json
import sys
import random
from assetmgmt.utils import logger
from assetmgmt.routes import Router
import assetmgmt.wallet as Wallet
from assetmgmt.outputs import Output, Log, Error, Notice, Voucher
from urllib.parse import urlparse
from assetmgmt.utils import hex_to_str
logger.info("HealthCart DApp started")

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
network = environ["NETWORK"]

logger.info(f"HTTP rollup_server url is {rollup_server}")
logger.inf(f"Network is {network}")

# setup contracts addresses
erc20_portal_file = open(f'./deployments/{network}/ERC20Portal.json')
erc20_portal = json.load(erc20_portal_file)

erc721_portal_file = open(f'./deployments/{network}/ERC721Portal.json')
erc721_portal = json.load(erc721_portal_file)

HCRT_file = open(f'../backend/deployments/{network}/HCRT.json')
HCRT_ADDRESS = json.load(HCRT_file)

HCRT_BADGE_file = open(f'../backend/deployments/{network}/HCRTBADGE.json')
HCRT_BADGE_ADDRESS = json.load(HCRT_BADGE_file)

dapp_address_relay_file = open(
    f'./deployments/{network}/DAppAddressRelay.json')
dapp_address_relay = json.load(dapp_address_relay_file)

DAPP_ASSET_HOLDER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"


router = None


CREATE_USER_TABLE_STATEMENT = 'CREATE TABLE USERS(userId INTEGER PRIMARY KEY UNIQUE NOT NULL,	first_name TEXT ,	last_name TEXT,address TEXT NOT NULL UNIQUE	,height INTEGER , weight INTEGER,total_rewards INTEGER,timestamp TEXT NOT NULL );'
CREATE_DATA_TABLE_STATEMENT = 'CREATE TABLE USERDATA(Id INTEGER PRIMARY KEY UNIQUE NOT NULL, userId INTEGER ,steps INTEGER NOT NULL,reward INTEGER,timestamp TEXT NOT NULL);'
ADD_DATA_ACTION = "activity"
REGISTER_USER_ACTION = "user"
GET_USER_ACTION = "get-user"
GET_USER_DATA_ACTION = "get-userdata"
CREATE_TABLES_ACTION = "create_tables"
INITIALIZE_ASSETS_ACTION = "initialize_assets"
ASSETS_ACTION = "assets"
NOTICE_TYPE = "notice"
REPORT_TYPE = "report"

# connect to internal sqlite database
con = sqlite3.connect("healthdata.db")


def hex2str(hex):
    """
    Decodes a hex string into a regular string
    """
    return bytes.fromhex(hex[2:]).decode("utf-8")


def str2hex(str):
    """
    Encodes a string as a hex string
    """
    return "0x" + str.encode("utf-8").hex()


def post(endpoint, payloadStr, loglevel):
    logger.log(loglevel, f"Adding {endpoint} with payload: {payloadStr}")
    payload = str2hex(payloadStr)
    response = requests.post(
        f"{rollup_server}/{endpoint}", json={"payload": payload})
    logger.info(
        f"Received {endpoint} status {response.status_code} body {response.content}")


def send_request(output):
    if isinstance(output, Output):
        request_type = type(output).__name__.lower()
        endpoint = request_type
        if isinstance(output, Error):
            endpoint = "report"
            logger.warning(hex_to_str(output.payload))
        elif isinstance(output, Log):
            endpoint = "report"

        logger.debug(f"Sending {request_type}")
        response = requests.post(rollup_server + f"/{endpoint}",
                                 json=output.__dict__)
        logger.debug(f"Received {output.__dict__} status {response.status_code} "
                     f"body {response.content}")
    else:
        for item in output:
            send_request(item)


def executeStatement(statement, type):
    logger.info(f"Processing statement:'{statement}'")
    userdata = None
    try:
        cur = con.cursor()
    except Exception as e:
        # criticla eror if database is no longer active
        msg = f"Critical error connecting to database:{e}"
        post("exception", msg, logging.ERROR)
        sys.exit(1)

    try:
        cur.execute(statement)
        userdata = cur.fetchall()
        cur.close()
    except Exception as e:
        msg = f"Error executing statement '{statement}':{e}"
        post(REPORT_TYPE, msg, logging.ERROR)
        cur.close()

    if userdata:
        payloadJson = json.dumps(userdata)
        if type == REPORT_TYPE:
            post(REPORT_TYPE, payloadJson, logging.INFO)
        else:
            post(NOTICE_TYPE, payloadJson, logging.INFO)

    return userdata


# create UserTable and UserData table
def createTables():
    executeStatement(CREATE_USER_TABLE_STATEMENT, NOTICE_TYPE)
    executeStatement(CREATE_DATA_TABLE_STATEMENT, NOTICE_TYPE)


# helper functions
def getUser(userid):
    stat = f"SELECT * FROM USERS WHERE userId ={userid}"
    return executeStatement(stat, REPORT_TYPE)


def registerUser(data):
    id = random.randint(0, 9999999999)
    stat = f'Insert INTO USERS (userId,first_name,last_name,address,height,weight,total_rewards,timestamp) VALUES ({id},"{data["firstname"]}","{data["lastname"]}","{data["address"]}",{data["height"]},{data["weight"]},{data["total_rewards"]},"{data["timestamp"]}");'
    return executeStatement(stat, NOTICE_TYPE)


def updateUser(address, rewards):
    stat = f"UPDATE USERS SET total_rewards = {rewards} WHERE address = {address};"
    return executeStatement(stat, REPORT_TYPE)


def getUserdata(userid):
    stat = f"SELECT * FROM USERDATA WHERE userId ={userid}"
    return executeStatement(stat, REPORT_TYPE)


def saveUserdata(data, reward):
    id = random.randint(0, 9999999999)
    stat = f'Insert INTO USERDATA (Id,userId,steps,reward,timestamp) VALUES ({id},{data["userId"]},{data["steps"]},{reward},"{data["timestamp"]}");'
    return executeStatement(stat, REPORT_TYPE)

# calculate rewards


def calculateRewards(steps, height, weight):
    calories_mile = 0.57*2.2*weight
    stride_length = 0.413*(height)
    distance_mile = (steps*stride_length)/(160000)
    return round(calories_mile*distance_mile)

# issue rewards


def issueRewards(reward, total_reward, address):

    if reward > 50:
        output = Wallet.erc20_transfer(DAPP_ASSET_HOLDER.lower(), address,
                                       HCRT_ADDRESS, reward*10)
        post(NOTICE_TYPE, f'{"type":"issue_tokens","amount":{reward}}')
        send_request(output)
    if total_reward > 5000:
        wallet = Wallet.balance_get(DAPP_ASSET_HOLDER.lower())
        badges = wallet.erc721_get(erc721=HCRT_BADGE_ADDRESS)
        output1 = Wallet.erc721_transfer(
            DAPP_ASSET_HOLDER.lower(), address, badges[0])
        post(NOTICE_TYPE, '{"type":"issue_nft"}')
        send_request(output1)


# Handle Assets


def handle_assets(data):
    logger.debug(f"Received asset advance request data {data}")
    try:
        msg_sender = data["metadata"]["msg_sender"]
        payload = data["payload"]

        if msg_sender.lower() == dapp_address_relay['address'].lower():
            logger.debug("Setting DApp address")
            rollup_address = payload
            router.set_rollup_address(rollup_address)
            return Log(f"DApp address set up successfully to {rollup_address}.")

        # It is an ERC20 deposit
        if msg_sender.lower() == erc20_portal['address'].lower():
            try:
                return router.process("erc20_deposit", payload)
            except Exception as error:
                error_msg = f"Failed to process ERC20 deposit '{payload}'. {error}"
                logger.debug(error_msg, exc_info=True)
                return Error(error_msg)
        elif msg_sender.lower() == erc721_portal['address'].lower():
            try:
                return router.process("erc721_deposit", payload)
            except Exception as error:
                error_msg = f"Failed to process ERC721 deposit '{payload}'. {error}"
                logger.debug(error_msg, exc_info=True)
                return Error(error_msg)
        else:
            try:
                str_payload = hex_to_str(payload)
                payload = json.loads(str_payload)
                return router.process(payload["method"], data)
            except Exception as error:
                error_msg = f"Failed to process command '{str_payload}'. {error}"
                logger.debug(error_msg, exc_info=True)
                return Error(error_msg)

    except Exception as error:
        error_msg = f"Failed to process advance_request. {error}"
        logger.debug(error_msg, exc_info=True)
        return Error(error_msg)

# Inspect Assets


def handle_inspect_assets(data):
    logger.debug(f"Received inspect request data {data}")
    try:
        url = urlparse(hex_to_str(data["payload"]))
        return router.process(url.path, data)
    except Exception as error:
        error_msg = f"Failed to process inspect request. {error}"
        logger.debug(error_msg, exc_info=True)
        return Error(error_msg)


# Handle Requests

def handle_request(data, request_type):
    logger.info(f"Received {request_type} data {data}")
    status = "accept"
    msg_sender = data["metadata"]["msg_sender"]

    try:
        # retrieves Sql statement from input payload
        payload = hex2str(data["payload"])
        jsonpayload = json.loads(payload)
        logger.info("the payload is:", jsonpayload)
        result = None
        status = "accept"
        rewards = 0
        total_rewards = 0

 # Create Database Tables
        if jsonpayload["action"] == CREATE_TABLES_ACTION:
            createTables()
 # Register New User
        if jsonpayload["action"] == REGISTER_USER_ACTION:
            result = registerUser(jsonpayload["data"])
# Add UserData
        elif jsonpayload["action"] == ADD_DATA_ACTION:
            user = getUser(jsonpayload["data"]["userId"])
            if user[0][3] != msg_sender:
                status = "reject"
                return status
           # logger.info("the user is:", user)
            rewards = calculateRewards(
                jsonpayload["data"]["steps"], user[0][4], user[0][5])
            total_rewards = rewards+user[0][6]
            updateUser(f'"{user[0][3]}"', total_rewards)
            result = saveUserdata(jsonpayload["data"], rewards)
            issueRewards(rewards, total_rewards)
# Get User Registration Data
        elif jsonpayload["action"] == GET_USER_ACTION:
            result = getUser(jsonpayload["data"]["userId"])
# Get User Activity Data
        elif jsonpayload["action"] == GET_USER_DATA_ACTION:
            result = (jsonpayload["data"]["userId"])
# Handle Platform Assets
        elif jsonpayload["action"] == ASSETS_ACTION:
            output = None
            if request_type == "advance_state":
                output = handle_assets(data)
            elif request_type == "inspect_state":
                output = handle_inspect_assets
            if isinstance(output, Error):
                status = "reject"
            send_request(output)

        if result:
            payloadJson = json.dumps(result)
            if request_type == "advance_state":
                post(NOTICE_TYPE, payloadJson, logging.INFO)
            else:
                post(REPORT_TYPE, payloadJson, logging.INFO)

    except Exception as e:
        status = "reject"
        msg = f"Error processing data {data}\n{traceback.format_exc()}"
        post(REPORT_TYPE, msg, logging.ERROR)

    return status


finish = {"status": "accept"}
router = Router(Wallet)

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        finish["status"] = handle_request(data, rollup_request["request_type"])
