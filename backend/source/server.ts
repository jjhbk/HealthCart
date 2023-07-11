import bodyParser from 'body-parser';
import express, {query} from 'express';
import router from './routers/app-routes';
import {ethers} from 'ethers';
import React from 'react';
import tunnelconfig from '../../src/tunnel_config.json';
import {createClient} from 'urql';
type Notice = {
  id: string;
  index: number;
  input: any; //{index: number; epoch: {index: number; }
  payload: string;
};
import hrctadd from '../deployments/localhost/HCRT.json';
import hcrtbadgeadd from '../deployments/localhost/HCRTBADGE.json';
const HRCT_ADDRESS = hrctadd.address;
const HCRT_BADGE_ADDRESS = hcrtbadgeadd.address;
const client = createClient({
  url: `${tunnelconfig.graphql}/graphql`,
});
let Notices: Notice[] = [];
const allnoticesQuery = `{ notices {
  edges {
    node {
      index
      input {
        index
        payload
      }
      payload
    }
  }
}}`;
const noticeQuery = `{}`;
const GetAllNotices = async () => {
  const notices = await client.query(allnoticesQuery).toPromise();
  //console.log(notices.data);
  const allnotices: Notice[] = notices.data.notices.edges
    .map((node: any) => {
      const n = node.node;
      let inputPayload = n?.input.payload;
      if (inputPayload) {
        try {
          inputPayload = ethers.utils.toUtf8String(inputPayload);
        } catch (e) {
          inputPayload = inputPayload + ' (hex)';
        }
      } else {
        inputPayload = '(empty)';
      }
      let payload = n?.payload;
      if (payload) {
        try {
          payload = ethers.utils.toUtf8String(payload);
        } catch (e) {
          payload = payload + ' (hex)';
        }
      } else {
        payload = '(empty)';
      }
      return {
        id: `${n?.id}`,
        index: parseInt(n?.index),
        payload: `${payload}`,
        input: n ? {index: n.input.index, payload: inputPayload} : {},
      };
    })
    .sort((b: any, a: any) => {
      if (a.input.index === b.input.index) {
        return b.index - a.index;
      } else {
        return b.input.index - a.input.index;
      }
    });
  console.log(allnotices);
  console.log('Fetching New Notices');
};
const TransferRewardTokens = (address: string, amount: string) => {};
const MintMembershipBadge = (address: string, amount: string) => {};
const MintRewardBadge = (address: string) => {};
const TransferEther = (address: string) => {};
const app = express();
app.use(bodyParser.json());
app.use(router);
app.listen(7586, () => console.log('Example app listening on port 7586!'));
setInterval(GetAllNotices, 5000);
