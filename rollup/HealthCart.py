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

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
logger.info(f"HTTP rollup_server url is {rollup_server}")
CREATE_USER_TABLE_STATEMENT = 'CREATE TABLE USERS(userId INTEGER PRIMARY KEY UNIQUE NOT NULL,	first_name TEXT ,	last_name TEXT,address TEXT NOT NULL UNIQUE	,height INTEGER , weight INTEGER,total_rewards INTEGER,timestamp TEXT NOT NULL );'
CREATE_DATA_TABLE_STATEMENT = 'CREATE TABLE USERDATA(Id INTEGER PRIMARY KEY UNIQUE NOT NULL, userId INTEGER ,steps INTEGER NOT NULL,reward INTEGER,timestamp TEXT NOT NULL);'
ADD_DATA_ACTION = "activity"
REGISTER_USER_ACTION = "user"
GET_USER_ACTION = "get-user"
GET_USER_DATA_ACTION = "get-userdata"
CREATE_TABLES = "create_tables"
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


def issueRewards(reward, total_reward):
    if reward > 50:
        post(NOTICE_TYPE, f'{"type":"issue_tokens","amount":{reward}}')
    if total_reward > 5000:
        post(NOTICE_TYPE, '{"type":"issue_nft"}')


def handle_request(data, request_type):
    logger.info(f"Received {request_type} data {data}")
    status = "accept"
    try:
        # retrieves Sql statement from input payload
        payload = hex2str(data["payload"])
        jsonpayload = json.loads(payload)
        logger.info("the payload is:", jsonpayload)
        result = None
        status = "accept"
        rewards = 0
        total_rewards = 0
        if jsonpayload["action"] == CREATE_TABLES:
            createTables()
        if jsonpayload["action"] == REGISTER_USER_ACTION:
            result = registerUser(jsonpayload["data"])
        elif jsonpayload["action"] == ADD_DATA_ACTION:
            user = getUser(jsonpayload["data"]["userId"])
           # logger.info("the user is:", user)
            rewards = calculateRewards(
                jsonpayload["data"]["steps"], user[0][4], user[0][5])
            total_rewards = rewards+user[0][6]
            updateUser(f'"{user[0][3]}"', total_rewards)
            result = saveUserdata(jsonpayload["data"], rewards)
            issueRewards(rewards, total_rewards)
        elif jsonpayload["action"] == GET_USER_ACTION:
            getUser(jsonpayload["data"]["userId"])
        elif jsonpayload["action"] == GET_USER_DATA_ACTION:
            getUserdata(jsonpayload["data"]["userId"])

        if result:
            payloadJson = json.dumps(result)
            if request_type == "advance_state":
                post(NOTICE_TYPE, payloadJson, logging.INFO)
            else:
                post(REPORT_TYPE, payloadJson, logging.INFO)

    except Exception as e:
        status: "reject"
        msg = f"Error processing data {data}\n{traceback.format_exc()}"
        post(REPORT_TYPE, msg, logging.ERROR)

    return status


def handle_advance(data):
    """
    An advance request may be processed as follows:

    1. A notice may be generated, if appropriate:

    response = requests.post(rollup_server + "/notice", json={"payload": data["payload"]})
    logger.info(f"Received notice status {response.status_code} body {response.content}")

    2. During processing, any exception must be handled accordingly:

    try:
        # Execute sensible operation
        op.execute(params)

    except Exception as e:
        # status must be "reject"
        status = "reject"
        msg = "Error executing operation"
        logger.error(msg)
        response = requests.post(rollup_server + "/report", json={"payload": str2hex(msg)})

    finally:
        # Close any resource, if necessary
        res.close()

    3. Finish processing

    return status
    """

    """
    The sample code from the Echo DApp simply generates a notice with the payload of the
    request and print some log messages.
    """

    logger.info(f"Received advance request data {data}")

    status = "accept"
    try:
        logger.info("Adding notice")
        response = requests.post(
            rollup_server + "/notice", json={"payload": data["payload"]})
        logger.info(
            f"Received notice status {response.status_code} body {response.content}")

    except Exception as e:
        status = "reject"
        msg = f"Error processing data {data}\n{traceback.format_exc()}"
        logger.error(msg)
        response = requests.post(
            rollup_server + "/report", json={"payload": str2hex(msg)})
        logger.info(
            f"Received report status {response.status_code} body {response.content}")

    return status


def handle_inspect(data):
    logger.info(f"Received inspect request data {data}")
    logger.info("Adding report")
    response = requests.post(rollup_server + "/report",
                             json={"payload": data["payload"]})
    logger.info(f"Received report status {response.status_code}")
    return "accept"


handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

finish = {"status": "accept"}

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
