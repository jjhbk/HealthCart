import {useEffect, useState} from 'react';
import {ethers} from 'ethers';

import {
  CartesiDApp,
  CartesiDApp__factory,
  InputBox,
  InputBox__factory,
  EtherPortal,
  EtherPortal__factory,
  ERC20Portal,
  ERC20Portal__factory,
  ERC721Portal,
  ERC721Portal__factory,
  DAppAddressRelay,
  DAppAddressRelay__factory,
} from './generated/rollups';

import configFile from './config.json';
import {JsonRpcSigner} from '@ethersproject/providers';
import tunnelConfig from './tunnel_config.json';
const config: any = configFile;
const PRIV_KEY_LOCAL_HARDHAT =
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';
export interface RollupsContracts {
  dappContract: CartesiDApp;
  relayContract: DAppAddressRelay;
  inputContract: InputBox;
  etherPortalContract: EtherPortal;
  erc20PortalContract: ERC20Portal;
  erc721PortalContract: ERC721Portal;
}
export const useRollups = (): RollupsContracts | undefined => {
  const [contracts, setContracts] = useState<RollupsContracts | undefined>();
  let address = '0x0000000000000000000000000000000000000000'; //zero addr as placeholder
  address = config['0x7a69'].rollupAddress;
  const provider = new ethers.providers.JsonRpcProvider(tunnelConfig.hardhat);
  console.log(provider);
  let signer = new ethers.Wallet(PRIV_KEY_LOCAL_HARDHAT, provider);
  let dappRelayAddress = config['0x7a69'].DAppRelayAddress;
  let inputBoxAddress = config['0x7a69'].InputBoxAddress;
  let etherPortalAddress = config['0x7a69'].EtherPortalAddress;
  let erc20PortalAddress = config['0x7a69'].Erc20PortalAddress;
  let erc721PortalAddress = config['0x7a69'].Erc721PortalAddress;
  let dappAddress = '0x142105FC8dA71191b3a13C738Ba0cF4BC33325e2';
  console.log(
    dappRelayAddress,
    inputBoxAddress,
    etherPortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
  );
  // dapp contract
  const dappContract = CartesiDApp__factory.connect(dappAddress, signer);

  // relay contract
  const relayContract = DAppAddressRelay__factory.connect(
    dappRelayAddress,
    signer,
  );

  // input contract
  const inputContract = InputBox__factory.connect(inputBoxAddress, signer);

  // portals contracts
  const etherPortalContract = EtherPortal__factory.connect(
    etherPortalAddress,
    signer,
  );

  const erc20PortalContract = ERC20Portal__factory.connect(
    erc20PortalAddress,
    signer,
  );

  const erc721PortalContract = ERC721Portal__factory.connect(
    erc721PortalAddress,
    signer,
  );

  return {
    dappContract,
    relayContract,
    inputContract,
    etherPortalContract,
    erc20PortalContract,
    erc721PortalContract,
  };
};
