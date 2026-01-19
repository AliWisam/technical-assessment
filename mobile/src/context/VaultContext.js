import React, { createContext, useState, useContext } from 'react';
import { vaultService } from '../services/api';

const VaultContext = createContext();

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

export const VaultProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);
  const [totalDeposits, setTotalDeposits] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async (userAddress, tokenAddress) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.getBalance(userAddress, tokenAddress);
      if (result.success) {
        setBalance(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalDeposits = async (tokenAddress) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.getTotalDeposits(tokenAddress);
      if (result.success) {
        setTotalDeposits(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.getStatus();
      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const estimateDeposit = async (tokenAddress, amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.estimateDeposit(tokenAddress, amount);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const estimateWithdraw = async (tokenAddress, amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vaultService.estimateWithdraw(tokenAddress, amount);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
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
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
};
