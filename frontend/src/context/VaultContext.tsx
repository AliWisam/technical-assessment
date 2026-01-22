'use client';

import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { vaultService } from '@/services/api';
import { CONTRACT_ADDRESS } from '@/config/api';
import { useWallet } from './WalletContext';

interface VaultContextType {
  balance: any;
  totalDeposits: any;
  status: any;
  loading: boolean;
  error: string | null;
  fetchBalance: (userAddress: string, tokenAddress: string) => Promise<void>;
  fetchTotalDeposits: (tokenAddress: string) => Promise<void>;
  fetchStatus: () => Promise<void>;
  estimateDeposit: (tokenAddress: string, amount: string) => Promise<any>;
  estimateWithdraw: (tokenAddress: string, amount: string) => Promise<any>;
  checkTokenApproval: (tokenAddress: string, amount: string) => Promise<{ approved: boolean; allowance: string; required: string }>;
  deposit: (tokenAddress: string, amount: string) => Promise<any>;
  withdraw: (tokenAddress: string, amount: string) => Promise<any>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

// Contract ABI - minimal interface for deposit and withdraw
const CONTRACT_ABI = [
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function getBalance(address user, address token) external view returns (uint256)',
  'function getTotalDeposits(address token) external view returns (uint256)',
  'function paused() external view returns (bool)',
];

// ERC20 Token ABI - for approval and allowance checks
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)',
];

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const { provider, address } = useWallet();
  const [balance, setBalance] = useState<any>(null);
  const [totalDeposits, setTotalDeposits] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (userAddress: string, tokenAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      // console.log('Fetching balance for:', { userAddress, tokenAddress });
      const result = await vaultService.getBalance(userAddress, tokenAddress);
      // console.log('Balance result:', result);
      if (result.success) {
        setBalance(result.data);
        // console.log('Balance set to:', result.data);
      } else {
        console.error('Balance fetch failed:', result.error);
        setError(result.error);
      }
    } catch (err: any) {
      console.error('Balance fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTotalDeposits = useCallback(async (tokenAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.getTotalDeposits(tokenAddress);
      if (result.success) {
        setTotalDeposits(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.getStatus();
      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get token decimals - helper function
  const getTokenDecimals = useCallback(async (
    walletProvider: any,
    tokenAddress: string
  ): Promise<number> => {
    try {
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      const decimals = await tokenContract.decimals();
      return Number(decimals);
    } catch (err) {
      console.warn('Failed to get token decimals, defaulting to 18:', err);
      return 18; // Default to 18 decimals
    }
  }, []);

  const estimateDeposit = useCallback(async (tokenAddress: string, amount: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!provider || !address) {
        setError('Wallet not connected');
        return null;
      }
      
      let walletProvider = provider;
      if (!walletProvider && typeof window !== 'undefined') {
        const ethereum = (window as any).ethereum;
        if (ethereum) {
          walletProvider = ethereum.isMetaMask ? ethereum : ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum;
        }
      }
      
      if (!walletProvider) {
        setError('Wallet provider not available');
        return null;
      }
      
      // Get token decimals
      const decimals = await getTokenDecimals(walletProvider, tokenAddress);
      const amountWei = ethers.parseUnits(amount, decimals);
      
      // Check token allowance before estimating
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      const currentAllowance = await tokenContract.allowance(address, CONTRACT_ADDRESS);
      
      if (currentAllowance < amountWei) {
        setError(`Token approval required. Current allowance: ${ethers.formatUnits(currentAllowance, decimals)}, Required: ${amount}. Please approve the token first.`);
        return null;
      }
      
      // Now estimate gas for deposit
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      try {
        const gasEstimate = await contract.deposit.estimateGas(tokenAddress, amountWei);
        return {
          gasEstimate: gasEstimate.toString(),
          tokenAddress,
          amount,
        };
      } catch (estimateErr: any) {
        
        // Provide helpful error messages
        if (estimateErr.reason?.includes('insufficient balance') || estimateErr.message?.includes('insufficient balance')) {
          setError('Insufficient token balance in your wallet');
        } else if (estimateErr.code === 'CALL_EXCEPTION' || estimateErr.message?.includes('revert')) {
          setError('Transaction would fail. Please ensure token is approved and you have sufficient balance.');
        } else {
          setError(estimateErr.reason || estimateErr.message || 'Failed to estimate gas');
        }
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, address, getTokenDecimals]);

  const estimateWithdraw = useCallback(async (tokenAddress: string, amount: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!provider || !address) {
        setError('Wallet not connected');
        return null;
      }
      
      let walletProvider = provider;
      if (!walletProvider && typeof window !== 'undefined') {
        const ethereum = (window as any).ethereum;
        if (ethereum) {
          walletProvider = ethereum.isMetaMask ? ethereum : ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum;
        }
      }
      
      if (!walletProvider) {
        setError('Wallet provider not available');
        return null;
      }
      
      // Get token decimals
      const decimals = await getTokenDecimals(walletProvider, tokenAddress);
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      try {
        const gasEstimate = await contract.withdraw.estimateGas(tokenAddress, amountWei);
        return {
          gasEstimate: gasEstimate.toString(),
          tokenAddress,
          amount,
        };
      } catch (estimateErr: any) {
        // If it's insufficient balance, that's expected for estimation when user doesn't have enough in vault
        if (estimateErr.reason?.includes('insufficient balance') || estimateErr.message?.includes('insufficient balance')) {
          setError('Insufficient balance in vault for this amount');
        } else {
          setError(estimateErr.reason || estimateErr.message || 'Failed to estimate gas');
        }
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, address, getTokenDecimals]);

  // Check and handle token approval
  const checkAndApproveToken = useCallback(async (
    walletProvider: any,
    tokenAddress: string,
    amountWei: bigint,
    userAddress: string
  ): Promise<void> => {
    const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
    const signer = await ethersProvider.getSigner();
    
    // Create ERC20 token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Check current allowance
    const currentAllowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
    console.log('Current allowance:', currentAllowance.toString());
    console.log('Required amount:', amountWei.toString());
    
    // If allowance is insufficient, request approval
    if (currentAllowance < amountWei) {
      console.log('Allowance insufficient, requesting approval...');
      
      // Request approval for the amount needed (or max if you want to approve more for future)
      // You can approve max: ethers.MaxUint256, or just the amount needed
      const approveAmount = amountWei; // Or use ethers.MaxUint256 for unlimited approval
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, approveAmount);
      console.log('Approval transaction sent:', approveTx.hash);
      
      // Wait for approval confirmation
      const approveReceipt = await approveTx.wait();
      console.log('Approval confirmed:', approveReceipt);
      
      // Verify the new allowance
      const newAllowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
      console.log('New allowance:', newAllowance.toString());
      
      if (newAllowance < amountWei) {
        throw new Error('Token approval failed or insufficient allowance granted');
      }
    } else {
      console.log('Sufficient allowance already exists');
    }
  }, []);

  // Check token approval status
  const checkTokenApproval = useCallback(async (tokenAddress: string, amount: string) => {
    if (!provider || !address || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected or contract address not configured');
    }

    let walletProvider = provider;
    if (!walletProvider && typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        walletProvider = ethereum.isMetaMask ? ethereum : ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum;
      }
    }

    if (!walletProvider || !address) {
      throw new Error('Wallet provider or address not available');
    }

    try {
      const decimals = await getTokenDecimals(walletProvider, tokenAddress);
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      
      const allowance = await tokenContract.allowance(address, CONTRACT_ADDRESS);
      const approved = allowance >= amountWei;
      
      return {
        approved,
        allowance: allowance.toString(),
        required: amountWei.toString(),
      };
    } catch (err: any) {
      console.error('Error checking token approval:', err);
      throw new Error(`Failed to check token approval: ${err.message}`);
    }
  }, [provider, address, getTokenDecimals]);

  // Deposit tokens to vault
  const deposit = useCallback(async (tokenAddress: string, amount: string) => {
    console.log('Deposit called with:', { provider: !!provider, address, CONTRACT_ADDRESS, tokenAddress, amount });
    
    // Check if provider is available - if not, try to get it from window.ethereum
    let walletProvider = provider;
    if (!walletProvider && typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        walletProvider = ethereum.isMetaMask ? ethereum : ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum;
        console.log('Using window.ethereum as provider');
      }
    }
    
    if (!walletProvider) {
      const errorMsg = 'Wallet provider not available. Please connect your wallet first.';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!address) {
      const errorMsg = 'Wallet address not available. Please connect your wallet first.';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.trim() === '') {
      const errorMsg = 'Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file (or .env.local).';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      // Get token decimals
      const decimals = await getTokenDecimals(walletProvider, tokenAddress);
      console.log('Token decimals:', decimals);
      
      // Convert amount to token units (Wei)
      const amountWei = ethers.parseUnits(amount, decimals);
      console.log('Amount in Wei:', amountWei.toString());
      
      // Check and approve token if needed
      await checkAndApproveToken(walletProvider, tokenAddress, amountWei, address);
      
      // Create ethers provider and signer from MetaMask provider
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      
      // Create vault contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Send deposit transaction
      console.log('Sending deposit transaction...', {
        contract: CONTRACT_ADDRESS,
        token: tokenAddress,
        amount: amountWei.toString(),
      });
      
      const tx = await contract.deposit(tokenAddress, amountWei);
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      console.log('Transaction block number:', receipt.blockNumber);
      
      // Wait a bit for the blockchain state to update (some RPCs need time to index)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh balance after successful deposit - try multiple times if needed
      if (address && tokenAddress) {
        console.log('Refreshing balance after deposit...');
        let retries = 3;
        while (retries > 0) {
          try {
            await fetchBalance(address, tokenAddress);
            console.log('Balance refreshed successfully');
            break;
          } catch (balanceErr) {
            console.warn(`Failed to refresh balance (${retries} retries left):`, balanceErr);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (err: any) {
      console.error('Deposit error:', err);
      let errorMsg = err.reason || err.message || 'Failed to deposit tokens';
      
      // Provide more helpful error messages
      if (err.message?.includes('user rejected') || err.code === 4001) {
        errorMsg = 'Transaction rejected. Please approve the transaction in MetaMask.';
      } else if (err.message?.includes('allowance')) {
        errorMsg = 'Token approval failed. Please try again.';
      } else if (err.message?.includes('insufficient')) {
        errorMsg = 'Insufficient token balance or allowance.';
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [provider, address, fetchBalance, checkAndApproveToken, getTokenDecimals]);

  // Withdraw tokens from vault
  const withdraw = useCallback(async (tokenAddress: string, amount: string) => {
    console.log('Withdraw called with:', { provider: !!provider, address, CONTRACT_ADDRESS });
    
    // Check if provider is available - if not, try to get it from window.ethereum
    let walletProvider = provider;
    if (!walletProvider && typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        walletProvider = ethereum.isMetaMask ? ethereum : ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum;
        console.log('Using window.ethereum as provider');
      }
    }
    
    if (!walletProvider) {
      const errorMsg = 'Wallet provider not available. Please connect your wallet first.';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!address) {
      const errorMsg = 'Wallet address not available. Please connect your wallet first.';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.trim() === '') {
      const errorMsg = 'Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file (or .env.local).';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      // Get token decimals
      const decimals = await getTokenDecimals(walletProvider, tokenAddress);
      console.log('Token decimals:', decimals);
      
      // Convert amount to token units (Wei)
      const amountWei = ethers.parseUnits(amount, decimals);
      console.log('Amount in Wei:', amountWei.toString());
      
      // Create ethers provider and signer from MetaMask provider
      const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Send transaction
      console.log('Sending withdraw transaction...', {
        contract: CONTRACT_ADDRESS,
        token: tokenAddress,
        amount: amountWei.toString(),
      });
      
      const tx = await contract.withdraw(tokenAddress, amountWei);
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      console.log('Transaction block number:', receipt.blockNumber);
      
      // Wait a bit for the blockchain state to update (some RPCs need time to index)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh balance after successful withdraw - try multiple times if needed
      if (address && tokenAddress) {
        console.log('Refreshing balance after withdraw...');
        let retries = 3;
        while (retries > 0) {
          try {
            await fetchBalance(address, tokenAddress);
            console.log('Balance refreshed successfully');
            break;
          } catch (balanceErr) {
            console.warn(`Failed to refresh balance (${retries} retries left):`, balanceErr);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (err: any) {
      console.error('Withdraw error:', err);
      let errorMsg = err.reason || err.message || 'Failed to withdraw tokens';
      
      // Provide more helpful error messages
      if (err.message?.includes('user rejected') || err.code === 4001) {
        errorMsg = 'Transaction rejected. Please approve the transaction in MetaMask.';
      } else if (err.message?.includes('insufficient balance')) {
        errorMsg = 'Insufficient balance in vault.';
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [provider, address, fetchBalance, getTokenDecimals]);

  const value = useMemo(() => ({
    balance,
    totalDeposits,
    status,
    loading,
    error,
    fetchBalance,
    fetchTotalDeposits,
    fetchStatus,
    estimateDeposit,
    estimateWithdraw,
    checkTokenApproval,
    deposit,
    withdraw,
  }), [balance, totalDeposits, status, loading, error, fetchBalance, fetchTotalDeposits, fetchStatus, estimateDeposit, estimateWithdraw, checkTokenApproval, deposit, withdraw]);

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
};
