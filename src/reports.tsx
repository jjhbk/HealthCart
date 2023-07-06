import {ethers} from 'ethers';

import React from 'react';

import {useReportsQuery} from './generated/graphql';
import {View, TouchableOpacity, Text} from 'react-native';
type Report = {
  id: string;
  index: number;
  input: any;
  payload: string;
};

export const Reports: React.FC = () => {
  const [result, reexecuteQuery] = useReportsQuery();
  const {data, fetching, error} = result;
  if (fetching) {
    return <Text>Loading</Text>;
  }
  if (error) return <Text>Oh No...Network connection error</Text>;
  if (!data || !data.reports) return <Text>No reports</Text>;

  const Reports: Report[] = data.reports.edges
    .map((node: any) => {
      const n = node.node;
      let inputPayload = n?.input.payload;
      if (inputPayload) {
        try {
          inputPayload = ethers.utils.toUtf8String(inputPayload);
        } catch (e) {
          inputPayload = inputPayload + '(hex)';
        }
      } else {
        inputPayload = '(empty)';
      }
      let payload = n?.payload;
      if (payload) {
        try {
          payload = ethers.utils.toUtf8String(payload);
        } catch (e) {
          payload = payload + '(hex)';
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

  return (
    <View>
      <TouchableOpacity
        onPress={() => {
          reexecuteQuery({requestPolicy: 'network-only'});
        }}>
        <Text>Reload</Text>
      </TouchableOpacity>
      <View style={{flexDirection: 'column'}}>
        <View style={{flexDirection: 'row'}}>
          <Text>Input Index</Text>
          <Text>report Index</Text>
          <Text>Payload</Text>
        </View>
        {Reports.map((n: any) => {
          return (
            <View
              style={{flexDirection: 'row'}}
              key={`${n.input.index}-${n.index}`}>
              <Text>{n.input.index}</Text>
              <Text>{n.index}</Text>
              <Text>{n.payload}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
