import {ExternalProvider, Web3Provider} from '@ethersproject/providers';
import {SDKProvider} from '@metamask/sdk';

export type Props_Interface = {
  eth: any;
  provider: Web3Provider;
  network: string;
};

export enum NetworkList {
  Localhost = '0x7a69',
  Goerli = '0x5',
  Sepolia = '0xAA36A7',
  Arbitrum = '0x66eed',
}
