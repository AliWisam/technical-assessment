'use client';

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { MetaMaskSDK, type SDKProvider } from '@metamask/sdk';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMetaMaskInstalled: boolean;
  provider: SDKProvider | undefined;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Initialize MetaMask SDK
let MMSDK: MetaMaskSDK | null = null;

const getMMSDK = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!MMSDK) {
    MMSDK = new MetaMaskSDK({
      dappMetadata: {
        name: 'TokenVault',
        url: window.location.href,
        iconUrl: 'https://docs.metamask.io/img/metamask-logo.svg',
      },
      infuraAPIKey: process.env.NEXT_PUBLIC_INFURA_API_KEY || '',
    });
  }

  return MMSDK;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [provider, setProvider] = useState<SDKProvider | undefined>();

  // Initialize provider on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sdk = getMMSDK();
      if (sdk) {
        const sdkProvider = sdk.getProvider();
        setProvider(sdkProvider);
        setIsMetaMaskInstalled(!!sdkProvider || !!(window as any).ethereum?.isMetaMask);
      }
    }
  }, []);

  // Connect wallet - memoized with useCallback
  const connectWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const sdk = getMMSDK();
      if (!sdk) {
        const errorMsg = 'MetaMask SDK is not available. Please ensure you are in a browser environment.';
        setError(errorMsg);
        return;
      }

      const accounts = await sdk.connect();
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        const sdkProvider = sdk.getProvider();
        if (sdkProvider) {
          setProvider(sdkProvider);
        }
      } else {
        const errorMsg = 'No accounts returned. Please try again.';
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      if (error.code === 4001) {
        const errorMsg = 'Connection rejected. Please approve the connection request in MetaMask.';
        setError(errorMsg);
      } else if (error.message) {
        setError(error.message);
      } else {
        const errorMsg = 'Failed to connect wallet. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet - memoized with useCallback
  const disconnectWallet = useCallback(async () => {
    try {
      const sdk = getMMSDK();
      if (sdk) {
        await sdk.terminate();
      }
    } catch (err) {
      console.error('Error terminating SDK:', err);
    } finally {
      setAddress(null);
      setIsConnected(false);
      setError(null);
      setProvider(undefined);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    address,
    isConnected,
    isConnecting,
    error,
    isMetaMaskInstalled,
    provider,
    connectWallet,
    disconnectWallet,
    clearError,
  }), [address, isConnected, isConnecting, error, isMetaMaskInstalled, provider, connectWallet, disconnectWallet, clearError]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
