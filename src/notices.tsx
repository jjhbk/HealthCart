import {ethers} from 'ethers';
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

import {useNoticesQuery} from './generated/graphql';
import {MyStyles} from './styles';
type Notice = {
  id: string;
  index: number;
  input: any;
  payload: string;
};

export const Notices: React.FC = () => {
  const [result, reexecuteQuery] = useNoticesQuery();
  const {data, fetching, error} = result;
  if (fetching) {
    return <Text>Loading</Text>;
  }
  if (error) return <Text>Oh No...Network connection error</Text>;
  if (!data || !data.notices) return <Text>No Notices</Text>;

  const notices: Notice[] = data.notices.edges
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
        style={MyStyles.ButtonStyle}
        onPress={() => {
          reexecuteQuery({requestPolicy: 'network-only'});
        }}>
        <Text>Reload</Text>
      </TouchableOpacity>
      <View style={{flexDirection: 'column'}}>
        <View style={{flexDirection: 'row'}}>
          <Text style={MyStyles.ColumnStyle}>Input Index</Text>
          <Text style={MyStyles.ColumnStyle}>Notice Index</Text>
          <Text style={MyStyles.ColumnStyle}>Payload</Text>
        </View>
        {notices.map((n: any) => {
          return (
            <View
              style={{flexDirection: 'row'}}
              key={`${n.input.index}-${n.index}`}>
              <Text style={MyStyles.ColumnStyle}>{n.input.index}</Text>
              <Text style={MyStyles.ColumnStyle}>{n.index}</Text>
              <Text style={MyStyles.ColumnStyle}>{n.payload}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
