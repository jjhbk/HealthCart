import React, {ReactNode, useState} from 'react';
import {ethers} from 'ethers';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import tunnelConfig from './tunnel_config.json';
export const Inspect: React.FC = () => {
  const LOCAL_INSPECT_API_URL = tunnelConfig.inspect;
  const [inspectData, setInspectData] = useState<string>('');
  const [reports, setReports] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<any>({});
  const inspectCall = async (str: string) => {
    const payload = str;
    const url = `${LOCAL_INSPECT_API_URL}/inspect/${payload}`;
    console.log(url, payload);
    await fetch(url, {
      method: 'GET',
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setReports(data.reports);
        setMetadata({
          metadata: data.metadata,
          status: data.status,
          exception_payload: data.exception_payload,
        });
      });
  };
  const displyReportasTable = () => {
    return (
      <View>
        {reports.map((n: any) => (
          <View key={n.payload} style={{flexDirection: 'row'}}>
            <Text>{n.payload}</Text>
            <Text>{ethers.utils.toUtf8String(n.payload)}</Text>
          </View>
        ))}
        <Text></Text>
      </View>
    );
  };
  return (
    <View>
      <View>
        <Text>Inspect</Text>
        <TextInput
          value={inspectData}
          placeholder="enter input here"
          onChangeText={e => setInspectData(e)}
        />
        <TouchableOpacity
          onPress={() => {
            inspectCall(inspectData);
          }}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
      <View style={{flexDirection: 'column'}}>
        <View style={{flexDirection: 'row'}}>
          <Text>Active Epoch Index</Text>
          <Text>Curr Input Index</Text>
          <Text>Status</Text>
          <Text>Exception Payload</Text>
        </View>

        <View style={{flexDirection: 'row'}}>
          <Text>
            {String(
              metadata.metadata ? metadata.metadat.active_epoch_index : '',
            )}
          </Text>
          <Text>
            {String(
              metadata.metadata ? metadata.metadat.current_epoch_index : '',
            )}
          </Text>
          <Text>{metadata.status}</Text>
          <Text>
            {metadata.exception_payload
              ? ethers.utils.toUtf8String(metadata.exception_payload)
              : ''}
          </Text>
        </View>
      </View>
      <View>{displyReportasTable()}</View>
    </View>
  );
};
