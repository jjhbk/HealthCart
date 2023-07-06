import {BigNumber, ethers} from 'ethers';
import React, {useEffect, useState} from 'react';
import {useVouchersQuery, useVoucherQuery} from './generated/graphql';

import {useRollups} from './useRollups';
import {View, Text, TouchableOpacity} from 'react-native';

type Voucher = {
  id: string;
  index: number;
  destination: string;
  input: any;
  payload: string;
  proof: any;
  executed: any;
};

export const Vouchers: React.FC = props => {
  const [result, reexecuteQuery] = useVouchersQuery();
  const [voucherToFetch, setVoucherToFetch] = useState([0, 0]);
  const [voucherResult, reexecuteVoucherQuery] = useVoucherQuery({
    variables: {voucherIndex: voucherToFetch[0], inputIndex: voucherToFetch[1]},
  });
  const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
  const {data, fetching, error} = result;
  const rollups = useRollups();
  const getProof = async (voucher: Voucher) => {
    setVoucherToFetch([voucher.index, voucher.input.index]);
    reexecuteVoucherQuery({requestPolicy: 'network-only'});
  };

  const executeVoucher = async (voucher: any) => {
    if (rollups && !!voucher.proof) {
      const newVoucherToExecute = {...voucher};
      try {
        const tx = await rollups.dappContract.executeVoucher(
          voucher.destination,
          voucher.payload,
          voucher.proof,
        );
        const receipt = await tx.wait();
        newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
        if (receipt.events) {
          newVoucherToExecute.msg = `${
            newVoucherToExecute.msg
          }-resulting events: ${JSON.stringify(receipt.events)}`;
          newVoucherToExecute.executed =
            await rollups.dappContract.wasVoucherExecuted(
              BigNumber.from(voucher.input.index),
              BigNumber.from(voucher.index),
            );
        }
      } catch (e) {
        newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(
          e,
        )}`;
        console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
      }
      setVoucherToExecute(newVoucherToExecute);
    }
  };
  useEffect(() => {
    const setVoucher = async (voucher: any) => {
      if (rollups) {
        voucher.executed = await rollups.dappContract.wasVoucherExecuted(
          BigNumber.from(voucher.input.index),
          BigNumber.from(voucher.index),
        );
      }
      setVoucherToExecute(voucher);
    };
    if (!voucherResult.fetching && voucherResult.data) {
      setVoucher(voucherResult.data.voucher);
    }
  }, [voucherResult, rollups]);

  if (fetching) return <Text>Loading....</Text>;
  if (error) return <Text>Oh No!... error connecting to the Server</Text>;
  if (!data || !data.vouchers) return <Text>No Vouchers</Text>;
  const vouchers: Voucher[] = data.vouchers.edges
    .map((node: any) => {
      const n = node.node;
      let payload = n?.payload;
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
      if (payload) {
        const decoder = new ethers.utils.AbiCoder();
        const selector = decoder.decode(['bytes4'], payload)[0];
        payload = ethers.utils.hexDataSlice(payload, 4);

        try {
          switch (selector) {
            case '0xa9059cbb': {
              // erc20 transfer;
              const decode = decoder.decode(['address', 'uint256'], payload);
              payload = `Erc20 Transfer - Amount: ${ethers.utils.formatEther(
                decode[1],
              )} - Address: ${decode[0]}`;
              break;
            }
            case '0x42842e0e': {
              //erc721 safe transfer;
              const decode = decoder.decode(
                ['address', 'address', 'uint256'],
                payload,
              );
              payload = `Erc721 Transfer - Id: ${decode[2]} - Address: ${decode[1]}`;
              break;
            }
            case '0x522f6815': {
              //ether transfer;
              const decode2 = decoder.decode(['address', 'uint256'], payload);
              payload = `Ether Transfer - Amount: ${ethers.utils.formatEther(
                decode2[1],
              )} (Native eth) - Address: ${decode2[0]}`;
              break;
            }
            case '0xd0def521': {
              //erc721 mint;
              const decode = decoder.decode(['address', 'string'], payload);
              payload = `Mint Erc721 - String: ${decode[1]} - Address: ${decode[0]}`;
              break;
            }
            case '0x755edd17': {
              //erc721 mintTo;
              const decode = decoder.decode(['address'], payload);
              payload = `Mint Erc721 - Address: ${decode[0]}`;
              break;
            }
            case '0x6a627842': {
              //erc721 mint;
              const decode = decoder.decode(['address'], payload);
              payload = `Mint Erc721 - Address: ${decode[0]}`;
              break;
            }
            default: {
              break;
            }
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        payload = '(empty)';
      }
      return {
        id: `${n?.id}`,
        index: parseInt(n?.index),
        destination: `${n?.destination ?? ''}`,
        payload: `${payload}`,
        input: n ? {index: n.input.index, payload: inputPayload} : {},
        proof: null,
        executed: null,
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
      <Text>Voucher to execute</Text>
      {voucherToExecute ? (
        <View style={{flexDirection: 'column'}}>
          <View style={{flexDirection: 'row'}}>
            <Text>Input Index</Text>
            <Text>Voucher Index</Text>
            <Text>Destination</Text>
            <Text>Action</Text>
            <Text>Input Payload</Text>
            <Text>Msg</Text>
          </View>
          <View style={{flexDirection: 'row'}}>
            <Text>{voucherToExecute.input.index}</Text>
            <Text>{voucherToExecute.index}</Text>
            <Text>{voucherToExecute.destination}</Text>1
            {(!voucherToExecute.proof || voucherToExecute.executed) && (
              <TouchableOpacity
                onPress={() => executeVoucher(voucherToExecute)}>
                <Text>
                  {voucherToExecute.proof
                    ? voucherToExecute.executed
                      ? 'Voucher executed'
                      : 'Execute Voucher'
                    : 'No proof yet'}
                </Text>
              </TouchableOpacity>
            )}
            <Text>{voucherToExecute.input.payload}</Text>
            <Text>{voucherToExecute.msg}</Text>
          </View>
        </View>
      ) : (
        <Text>Nothing yet</Text>
      )}
      <TouchableOpacity
        onPress={() => reexecuteQuery({requestPolicy: 'network-only'})}>
        <Text>Reload</Text>
      </TouchableOpacity>
      <View style={{flexDirection: 'column'}}>
        <View style={{flexDirection: 'row'}}>
          <Text>Input Index</Text>
          <Text>Voucher Index</Text>
          <Text>Destination</Text>
          <Text>Action</Text>
          <Text>Input Payload</Text>
          <Text>Msg</Text>
        </View>
        {vouchers.map((n: any) => {
          return (
            <View
              style={{flexDirection: 'row'}}
              key={`${n.input.index}-${n.index}`}>
              <Text>{n.input.index}</Text>
              <Text>{n.index}</Text>
              <Text>{n.destination}</Text>
              <TouchableOpacity onPress={() => getProof(n)}>
                <Text>Get Proof</Text>
              </TouchableOpacity>
              <Text>{n.payload}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
