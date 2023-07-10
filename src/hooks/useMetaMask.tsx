import {ExternalProvider, Web3Provider} from '@ethersproject/providers';
import MetaMaskSDK, {SDKProvider} from '@metamask/sdk';
import {ethers} from 'ethers';
import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
  useCallback,
} from 'react';
import {Linking} from 'react-native';
import _BackgroundTimer from 'react-native-background-timer';

interface WalletState {
  accounts: any[];
  balance: string;
  chainId: string;
}

interface MetaMaskContextData {
  wallet: WalletState;
  hasProvider: boolean | null;
  error: boolean;
  errorMessage: string;
  isConnecting: boolean;
  connectMetaMask: () => void;
  clearError: () => void;
  provider: Web3Provider;
  ethereum: SDKProvider;
}

const disconnectedState: WalletState = {accounts: [], balance: '', chainId: ''};

const MetaMaskContext = createContext<MetaMaskContextData>(
  {} as MetaMaskContextData,
);
const MMSDK = new MetaMaskSDK({
  openDeeplink: link => {
    Linking.openURL(link);
  },
  timer: _BackgroundTimer,
  dappMetadata: {
    name: 'Frontend-web-cartesi',
    url: 'https://cartesi.io',
  },
});
const ethereum = MMSDK.getProvider() as any;
let provider = new ethers.providers.Web3Provider(ethereum as ExternalProvider);
export const MetaMaskContextProvider = ({children}: PropsWithChildren) => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const clearError = () => setErrorMessage('');
  const [wallet, setWallet] = useState(disconnectedState);
  const _updateWallet = useCallback(async (providedAccounts?: any) => {
    const accounts =
      providedAccounts || (await ethereum.request({method: 'eth_accounts'}));
    if (accounts.length === 0) {
      setWallet(disconnectedState);
      return;
    }
    const balance = ethers.utils.formatEther(
      await ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      }),
    );
    const chainId = await ethereum.request({method: 'eth_chainId'});
    setWallet({accounts, balance, chainId});
  }, []);
  const updateWalletAndAccounts = useCallback(
    () => _updateWallet(),
    [_updateWallet],
  );
  const updateWallet = useCallback(
    (accounts: any) => _updateWallet(accounts),
    [_updateWallet],
  );
  useEffect(() => {
    const getProvider = async () => {
      provider = new ethers.providers.Web3Provider(
        ethereum as ExternalProvider,
      );
      setHasProvider(Boolean(provider));
      if (provider) {
        updateWalletAndAccounts();
        ethereum.on('chainChanged', (chain: any) => {
          updateWalletAndAccounts;
        });
        ethereum.on('accountsChanged', (accounts: any) => {
          updateWallet;
        });
      }
    };
    getProvider();
    return () => {
      ethereum?.removeListener('accountsChanged', updateWallet);
      ethereum?.removeListerner('chainChanged', updateWalletAndAccounts);
    };
  }, [updateWallet, updateWalletAndAccounts]);

  const connectMetaMask = async () => {
    setIsConnecting(true);
    try {
      console.log('connecting metamask');
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      clearError();
      updateWallet(accounts);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
    setIsConnecting(false);
  };

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        connectMetaMask,
        clearError,
        provider,
        ethereum,
      }}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error(
      'useMetaMask must be used within a "MetamaskContextProvider"',
    );
  }
  return context;
};
