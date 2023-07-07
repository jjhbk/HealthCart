/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {GraphQLProvider} from './src/GraphQL';
import {Input} from './src/input';
import tunnelConfig from './src/tunnel_config.json';
import {Inspect} from './src/inspect';
import {Notices} from './src/notices';
import {Reports} from './src/reports';
import {Vouchers} from './src/vouchers';
import {MyStyles} from './src/styles';
import {AppNetwork} from './src/network';
import {
  Button,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import MetaMaskSDK, {SDKProvider} from '@metamask/sdk';
import BackgroundTimer from 'react-native-background-timer';
import {ethers} from 'ethers';
import {ExternalProvider} from '@ethersproject/providers';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): JSX.Element {
  const [balance, setBalance] = useState('');
  const [response, setResponse] = useState('');
  const [account, setAccount] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  console.log(tunnelConfig.graphql, tunnelConfig.hardhat, tunnelConfig.inspect);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const MMSDK = new MetaMaskSDK({
    openDeeplink: link => {
      Linking.openURL(link);
    },
    timer: BackgroundTimer,
    dappMetadata: {
      name: 'Frontend-web-cartesi',
      url: 'https://cartesi.io',
    },
  });
  const ethereum = MMSDK.getProvider() as any;
  console.log('ethereum is', ethereum);
  const provider = new ethers.providers.Web3Provider(
    ethereum as ExternalProvider,
  );
  const [connection, setConnection] = useState<boolean>(true);
  useEffect(() => {
    ethereum.on('chainChanged', (chain: any) => {
      console.log(chain);
    });
    ethereum.on('accountsChanged', (accounts: any) => {
      console.log(accounts);
    });
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView>
        <GraphQLProvider>
          <AppNetwork eth={ethereum} provider={provider} network="" />
          <Inspect />
          <Text style={MyStyles.HeadinStyle1}>Input</Text>
          <Input />
          <Text style={MyStyles.HeadinStyle1}>Notices</Text>
          <Notices />
          <Text style={MyStyles.HeadinStyle1}>Reports</Text>
          <Reports />
          <Text style={MyStyles.HeadinStyle1}>Vouchers</Text>
          <Vouchers />
        </GraphQLProvider>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
