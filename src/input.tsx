// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import React, {useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {ethers} from 'ethers';
import {useRollups} from './useRollups';
import {IERC20__factory} from './generated/rollups';
import {IERC721__factory} from '@cartesi/rollups';
import {isEnabled} from 'react-native/Libraries/Performance/Systrace';
import {MyStyles} from './styles';
import tunnelConfig from './tunnel_config.json';
import chainConfig from './config.json';
import {NetworkList, Props_Interface} from './props_interface';
import {useMetaMask} from './hooks/useMetaMask';
export const Input: React.FC<Props_Interface> = (props: Props_Interface) => {
  const rollups = useRollups(props);
  const {
    wallet,
    hasProvider,
    isConnecting,
    connectMetaMask,
    provider,
    ethereum,
  } = useMetaMask();
  const PRIV_KEY_LOCAL_HARDHAT =
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';

  const addInput = async (str: string) => {
    if (rollups) {
      rollups.inputContract.addInput(
        rollups.dappContract.address,
        ethers.utils.toUtf8Bytes(str),
      );
    }
  };
  const depositErc20ToPortal = async (token: string, amount: number) => {
    if (rollups && provider) {
      const data = ethers.utils.toUtf8Bytes(
        `Deposited (${amount}) of ERC20 (${token}).`,
      );
      //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
      let signer =
        props.network === NetworkList.Localhost
          ? new ethers.Wallet(PRIV_KEY_LOCAL_HARDHAT, props.provider)
          : provider.getSigner();
      const signerAddress = await signer.getAddress();

      const erc20PortalAddress = rollups.erc20PortalContract.address;
      const tokenContract = signer
        ? IERC20__factory.connect(token, signer)
        : IERC20__factory.connect(token, provider);

      // query current allowance
      const currentAllowance = await tokenContract.allowance(
        signerAddress,
        erc20PortalAddress,
      );
      if (ethers.utils.parseEther(`${amount}`) > currentAllowance) {
        // Allow portal to withdraw `amount` tokens from signer
        const tx = await tokenContract.approve(
          erc20PortalAddress,
          ethers.utils.parseEther(`${amount}`),
        );
        const receipt = await tx.wait(1);
        const event = (
          await tokenContract.queryFilter(
            tokenContract.filters.Approval(),
            receipt.blockHash,
          )
        ).pop();
        if (!event) {
          throw Error(
            `could not approve ${amount} tokens for DAppERC20Portal(${erc20PortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`,
          );
        }
      }

      rollups.erc20PortalContract.depositERC20Tokens(
        token,
        rollups.dappContract.address,
        ethers.utils.parseEther(`${amount}`),
        data,
      );
    }
  };

  const depositEtherToPortal = async (amount: number) => {
    if (rollups && provider) {
      const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) ether.`);
      const txOverrides = {value: ethers.utils.parseEther(`${amount}`)};

      // const tx = await ...
      rollups.etherPortalContract.depositEther(
        rollups.dappContract.address,
        data,
        txOverrides,
      );
    }
  };

  const transferNftToPortal = async (
    contractAddress: string,
    nftid: number,
  ) => {
    if (rollups && provider) {
      const data = ethers.utils.toUtf8Bytes(
        `Deposited (${nftid}) of ERC721 (${contractAddress}).`,
      );
      //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();

      const erc721PortalAddress = rollups.erc721PortalContract.address;

      const tokenContract = signer
        ? IERC721__factory.connect(contractAddress, signer)
        : IERC721__factory.connect(contractAddress, provider);

      // query current approval
      const currentApproval = await tokenContract.getApproved(nftid);
      if (currentApproval !== erc721PortalAddress) {
        // Allow portal to withdraw `amount` tokens from signer
        const tx = await tokenContract.approve(erc721PortalAddress, nftid);
        const receipt = await tx.wait(1);
        const event = (
          await tokenContract.queryFilter(
            tokenContract.filters.Approval(),
            receipt.blockHash,
          )
        ).pop();
        if (!event) {
          throw Error(
            `could not approve ${nftid} for DAppERC721Portal(${erc721PortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`,
          );
        }
      }

      // Transfer
      rollups.erc721PortalContract.depositERC721Token(
        contractAddress,
        rollups.dappContract.address,
        nftid,
        '0x',
        data,
      );
    }
  };
  const [input, setInput] = useState<string>('');
  const [erc20Amount, setErc20Amount] = useState<number>(0);
  const [erc20Token, setErc20Token] = useState<string>('');
  const [erc721Id, setErc721Id] = useState<number>(0);
  const [erc721, setErc721] = useState<string>('');
  const [etherAmount, setEtherAmount] = useState<number>(0);

  return (
    <View>
      <View>
        {/*rollups && (
          <TouchableOpacity onPress={() => addInput(input)}>
            <Text>Send</Text>
          </TouchableOpacity>
        )*/}
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={input}
          placeholder="enter input here"
          onChangeText={e => setInput(e)}
        />
        {rollups && (
          <TouchableOpacity
            style={MyStyles.ButtonStyle}
            onPress={() => addInput(input)}>
            <Text>Send</Text>
          </TouchableOpacity>
        )}

        <Text style={MyStyles.HeadinStyle2}> Deposit Ether </Text>
        <Text> Amount:</Text>
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={String(etherAmount)}
          placeholder="enter input here"
          onChangeText={e => setEtherAmount(Number(e))}
        />
        {rollups && (
          <TouchableOpacity
            style={MyStyles.ButtonStyle}
            onPress={() => depositEtherToPortal(etherAmount)}>
            <Text>Deposit Ether</Text>
          </TouchableOpacity>
        )}

        <Text style={MyStyles.HeadinStyle2}> Deposit ERC20 </Text>
        <Text> Address:</Text>
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={erc20Token}
          placeholder="enter input here"
          onChangeText={e => setErc20Token(e)}
        />
        <Text> Amount:</Text>
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={String(erc20Amount)}
          placeholder="enter input here"
          onChangeText={e => setErc20Amount(Number(e))}
        />
        {rollups && (
          <TouchableOpacity
            style={MyStyles.ButtonStyle}
            onPress={() => depositErc20ToPortal(erc20Token, erc20Amount)}>
            <Text>Deposit Erc20</Text>
          </TouchableOpacity>
        )}

        <Text style={MyStyles.HeadinStyle2}> Deposit ERC721 </Text>
        <Text> Address:</Text>
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={erc721}
          placeholder="enter input here"
          onChangeText={e => setErc721(e)}
        />
        <Text> number:</Text>
        <TextInput
          style={MyStyles.InputStyle}
          placeholderTextColor={'black'}
          value={String(erc721Id)}
          placeholder="enter input here"
          onChangeText={e => setErc721Id(Number(e))}
        />
        {rollups && (
          <TouchableOpacity
            style={MyStyles.ButtonStyle}
            onPress={() => transferNftToPortal(erc721, erc721Id)}>
            <Text>Transfer NFT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
