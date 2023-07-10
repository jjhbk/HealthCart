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
import chainConfig from './src/config.json';

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
import {NetworkList} from './src/props_interface';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dropdown} from 'react-native-element-dropdown';
import {MetaMaskContextProvider, useMetaMask} from './src/hooks/useMetaMask';
type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): JSX.Element {
  return (
    <View>
      <MetaMaskContextProvider>
        <AppNetwork />
      </MetaMaskContextProvider>
    </View>
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
