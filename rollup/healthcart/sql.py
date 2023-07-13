from os import environ
import traceback
import logging
import requests
import json
import sys
import random
from healthcart.utils import logger
from healthcart.routes import Router
import healthcart.wallet as Wallet
from healthcart.outputs import Output, Log, Error, Notice, Voucher
from urllib.parse import urlparse
from healthcart.utils import hex_to_str
import sqlite3

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
network = environ["NETWORK"]

logger.info(f"HTTP rollup_server url is {rollup_server}")
logger.info(f"Network is {network}")

# setup contracts addresses
erc20_portal_file = open(f'./deployments/{network}/ERC20Portal.json')
erc20_portal = json.load(erc20_portal_file)

erc721_portal_file = open(f'./deployments/{network}/ERC721Portal.json')
erc721_portal = json.load(erc721_portal_file)

# HCRT_file = open(f'./deployments/{network}/HCRT.json')
HCRT_ADDRESS = None  # json.load(HCRT_file)

# HCRT_BADGE_file = open(f'./deployments/{network}/HCRTBADGE.json')
HCRT_BADGE_ADDRESS = None  # json.load(HCRT_BADGE_file)

dapp_address_relay_file = open(
    f'./deployments/{network}/DAppAddressRelay.json')
dapp_address_relay = json.load(dapp_address_relay_file)

DAPP_ASSET_HOLDER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"


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
        error_msg = f"{e}"
        logger.debug(error_msg, exc_info=True)
        send_request(Error(json.dumps(error_msg)))
        sys.exit(1)

    try:
        cur.execute(statement)
        userdata = cur.fetchall()
        cur.close()
    except Exception as e:
        error_msg = f"{e}"
        logger.debug(error_msg, exc_info=True)
        send_request(Error(error_msg))
        return

    if userdata:
        report = {"type": "sqldata", "data": userdata}
        if type == REPORT_TYPE:
            send_request(Log(json.dumps(report)))
        else:
            send_request(Notice(json.dumps(report)))
    return userdata


# create UserTable and UserData table
def createTables():
    executeStatement(CREATE_USER_TABLE_STATEMENT, NOTICE_TYPE)
    executeStatement(CREATE_DATA_TABLE_STATEMENT, NOTICE_TYPE)


# helper functions
def getUser(address):
    stat = f"SELECT * FROM USERS WHERE address ={address}"
    return executeStatement(stat, REPORT_TYPE)


def getUserfromId(userid):
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
        send_request(output)
    if total_reward > 5000:
        wallet = Wallet.balance_get(DAPP_ASSET_HOLDER.lower())
        badges = wallet.erc721_get(erc721=HCRT_BADGE_ADDRESS)
        output1 = Wallet.erc721_transfer(
            DAPP_ASSET_HOLDER.lower(), address, badges[0])
        send_request(output1)


def AddUserData(jsonpayload):
    user = getUserfromId(jsonpayload["data"]["userId"])
    rewards = calculateRewards(
        jsonpayload["data"]["steps"], user[0][4], user[0][5])
    total_rewards = rewards+user[0][6]
    logger.info(f"rewards are {rewards}")
    updateUser(f'"{user[0][3]}"', total_rewards)
    saveUserdata(jsonpayload["data"], rewards)
    issueRewards(rewards, total_rewards, user[0][3].lower())


def initializeAssets(jsonpayload):
    global DAPP_ASSET_HOLDER
    DAPP_ASSET_HOLDER = jsonpayload["data"]["holder_add"]
    global HCRT_ADDRESS
    HCRT_ADDRESS = jsonpayload["data"]["hcrt_add"]
    global HCRT_BADGE_ADDRESS
    HCRT_BADGE_ADDRESS = jsonpayload["data"]["hcrt_badge_add"]
    logger.info(
        f"added {DAPP_ASSET_HOLDER} {HCRT_ADDRESS} {HCRT_BADGE_ADDRESS}")
    return Log(json.dumps({f"added {DAPP_ASSET_HOLDER} {HCRT_ADDRESS} {HCRT_BADGE_ADDRESS}"}))
