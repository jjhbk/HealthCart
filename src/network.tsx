import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, Text, Alert} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {MyStyles} from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MetaMaskSDK, {SDKProvider} from '@metamask/sdk';
import {Linking} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import ethers from 'ethers';
import {ExternalProvider, Provider} from '@ethersproject/providers';
import chainConfig from './config.json';
import {Props_Interface} from './props_interface';
import tunnelConfig from './tunnel_config.json';

export const AppNetwork: React.FC<Props_Interface> = (
  props: Props_Interface,
) => {
  const config: any = chainConfig;
  const ethereum = props.eth;
  const provider = props.provider;
  const [balance, setBalance] = useState('');
  const [response, setResponse] = useState('');
  const [account, setAccount] = useState('');
  const [connection, setConnection] = useState<boolean>(true);
  useEffect(() => {
    ethereum.on('chainChanged', chain => {
      console.log(chain);
    });
    ethereum.on('accountsChanged', accounts => {
      console.log(accounts);
    });
  }, []);

  const getBalance = async () => {
    setConnection(false);
    console.log(ethereum.selectedAddress);
    if (!ethereum.selectedAddress) {
      return;
    }
    const bal = await provider.getBalance(ethereum.selectedAddress);
    setBalance(ethers.utils.formatEther(bal));
  };

  const connect = async () => {
    try {
      const accounts: string[] = (await ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      console.log('RESULT', accounts?.[0]);
      setAccount(accounts?.[0]);
      await getBalance();
      console.log(accounts);
      console.log('balance is:', balance);
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  enum NetworkList {
    Localhost = '0x7a69',
    Goerli = '0x5',
    Sepolia = '0xAA36A7',
    Arbitrum = '0x66eed',
  }
  type Dat = {
    item: string;
    value: string;
  };
  const NetworkData: Dat[] = [
    {item: 'Localhost', value: NetworkList.Localhost},
    {item: 'Goerli', value: NetworkList.Goerli},
    {item: 'Sepolia', value: NetworkList.Sepolia},
    {item: 'Arbitrum', value: NetworkList.Arbitrum},
  ];
  const [network, setNetwork] = useState<Dat>({
    item: 'Localhost',
    value: NetworkList.Localhost,
  });

  const exampleRequest = async () => {
    try {
      console.log('sendin example request');
      const result = await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x89',
            chainName: 'Polygon',
            blockExplorerUrls: ['https://polygonscan.com'],
            nativeCurrency: {symbol: 'MATIC', decimals: 18},
            rpcUrls: ['https://polygon-rpc.com/'],
          },
        ],
      });
      console.log('RESULT', result);
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  const AddChain = async () => {
    try {
      let params = [
        {
          chainId: String(network.value),
          chainName: config[network.value].label,
          blockExplorerUrls: ['https://polygonscan.com'],
          nativeCurrency: {symbol: config[network.value].token, decimals: 18},
          rpcUrls: [
            network.value === NetworkList.Localhost
              ? tunnelConfig.hardhat
              : config[network.value].rpcUrl,
          ],
        },
      ];
      console.log('sending add chain request', params);
      const result = await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: params,
      });
      console.log('RESULT', result);
    } catch (e) {
      console.log('ERROR', e);
    }
  };
  const SwithChain = async () => {
    // if (typeof ethereum !== 'undefined' && ethereum.isMetaMask) return;
    let params = [
      {
        chainId: String(network.value),
        chainName: config[network.value].label,
        blockExplorerUrls: ['https://polygonscan.com'],
        nativeCurrency: {symbol: config[network.value].token, decimals: 18},
        rpcUrls: [config[network.value].rpcUrl],
      },
    ];
    console.log('sending add chain request', params);
    try {
      console.log('sending switch request');
      const result = await ethereum.request({
        method: 'wallet_switchEthereumChain',

        params: params,
      });
      console.log(result);
    } catch (e) {
      // You can make a request to add the chain to wallet here
      console.log(
        `${network.item} Chain hasn't been added to the wallet! trying to Add chain`,
      );
      await AddChain();
    }
  };
  const SaveCredentials = async () => {
    console.log('switching networks', network);
    await SwithChain();
    try {
      await AsyncStorage.setItem('Network', JSON.stringify(network));
      await AsyncStorage.setItem('NetworkValue', network.value);
      await AsyncStorage.setItem(
        'PRIV_KEY_LOCAL_HARDHAT',
        '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      );
    } catch (e) {
      console.log('error saving state', e);
    }
  };
  const [value, setValue] = useState<string>('');
  const [isFocus, setIsFocus] = useState(false);

  const renderLabel = () => {
    if (value || isFocus) {
      return <Text style={[isFocus && {color: 'blue'}]}>Dropdown label</Text>;
    }
    return null;
  };

  return (
    <View>
      {connection && (
        <TouchableOpacity
          style={MyStyles.ButtonStyle}
          onPress={connection ? connect : () => {}}>
          <Text>{connection ? 'Connect Wallet' : 'Disconnect'}</Text>
        </TouchableOpacity>
      )}
      {!connection && (
        <View>
          <Text>
            {' '}
            {account && `Connected account: ${account}\n\n`}
            {account && balance && `Balance: ${balance} ETH`}
          </Text>

          <View style={{flexDirection: 'row', flex: 1}}>
            <View style={{flex: 3}}>
              {renderLabel()}
              <Dropdown
                style={{backgroundColor: 'grey'}}
                data={NetworkData}
                itemTextStyle={{color: 'black'}}
                labelField={'item'}
                valueField={'value'}
                onChange={item => {
                  setNetwork(item);
                  setValue(item.value);
                  setIsFocus(false);
                }}
                placeholder={!isFocus ? 'Select item' : '...'}
                selectedTextStyle={{color: 'black'}}
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
              />
            </View>
            <TouchableOpacity
              style={MyStyles.ButtonStyle}
              onPress={SaveCredentials}>
              <Text> Save Network</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
