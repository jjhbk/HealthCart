/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {GraphQLProvider} from './src/GraphQL';
import {Input} from './src/input';
import tunnelConfig from './src/tunnel_config.json';
import {Inspect} from './src/inspect';
import {Notices} from './src/notices';
import {Reports} from './src/reports';
import {Vouchers} from './src/vouchers';
import Pedometer from './src/pedometer.jsx';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import {MyStyles} from './src/styles';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  console.log(tunnelConfig.graphql, tunnelConfig.hardhat, tunnelConfig.inspect);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView>
        <GraphQLProvider>
          <Text style={MyStyles.HeadinStyle1}>Inspect</Text>
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
