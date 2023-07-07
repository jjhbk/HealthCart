import {ExternalProvider, Web3Provider} from '@ethersproject/providers';
import {SDKProvider} from '@metamask/sdk';

export type Props_Interface = {
  eth: SDKProvider;
  provider: Web3Provider;
  network: string;
};
