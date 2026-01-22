'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { useVault } from '@/context/VaultContext';
import styles from './page.module.css';

export default function VaultPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const {
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
    deposit,
    withdraw,
  } = useVault();


  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, router]);

  const handleFetchBalance = async () => {
    if (!address || !tokenAddress) {
      alert('Please enter token address');
      return;
    }
    await fetchBalance(address, tokenAddress);
  };

  const handleFetchTotal = async () => {
    if (!tokenAddress) {
      alert('Please enter token address');
      return;
    }
    await fetchTotalDeposits(tokenAddress);
  };

  const handleEstimateGas = async () => {
    if (!tokenAddress || !amount) {
      alert('Please enter token address and amount');
      return;
    }

    try {
      let result;
      if (operation === 'deposit') {
        result = await estimateDeposit(tokenAddress, amount);
      } else {
        result = await estimateWithdraw(tokenAddress, amount);
      }

      if (result && result.gasEstimate) {
        alert(`Estimated gas: ${result.gasEstimate}`);
      } else {
        // Show error message if estimation failed
        // The error message is already set by estimateDeposit/estimateWithdraw functions
        const errorMsg = error || (operation === 'deposit' 
          ? 'Failed to estimate gas for deposit. Please ensure token is approved and you have sufficient balance.'
          : 'Failed to estimate gas for withdraw. This might be because you don\'t have sufficient balance in the vault.');
        alert(errorMsg);
      }
    } catch (error: any) {
      alert(`Failed to estimate gas: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExecuteTransaction = async () => {
    if (!tokenAddress || !amount) {
      alert('Please enter token address and amount');
      return;
    }

    try {
      let result;
      if (operation === 'deposit') {
        result = await deposit(tokenAddress, amount);
        if (result?.success) {
          alert(`Deposit successful! Transaction hash: ${result.txHash}`);
          setAmount(''); // Clear amount after successful transaction
          // Refresh balance after a short delay to allow blockchain to update
          setTimeout(async () => {
            if (address) {
              await fetchBalance(address, tokenAddress);
            }
          }, 3000);
        }
      } else {
        result = await withdraw(tokenAddress, amount);
        if (result?.success) {
          alert(`Withdraw successful! Transaction hash: ${result.txHash}`);
          setAmount(''); // Clear amount after successful transaction
          // Refresh balance after a short delay to allow blockchain to update
          setTimeout(async () => {
            if (address) {
              await fetchBalance(address, tokenAddress);
            }
          }, 3000);
        }
      }
    } catch (error: any) {
      // Error is already handled in VaultContext
      console.error('Transaction failed:', error);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Vault Operations</h1>

        <div className={styles.infoSection}>
          <p className={styles.label}>Connected Address:</p>
          <p className={styles.value}>{address}</p>
        </div>

        {status && (
          <div className={styles.infoSection}>
            <p className={styles.label}>Contract Status:</p>
            <p className={`${styles.value} ${status.paused ? styles.error : ''}`}>
              {status.paused ? 'Paused' : 'Active'}
            </p>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Token Configuration</h2>
          <input
            className={styles.input}
            type="text"
            placeholder="Token Address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              onClick={handleFetchBalance}
              disabled={loading}
            >
              Get Balance
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleFetchTotal}
              disabled={loading}
            >
              Get Total
            </button>
          </div>
        </div>

        {balance && (
          <div className={styles.infoSection}>
            <p className={styles.label}>Your Balance:</p>
            <p className={styles.value}>
              {balance.balanceFormatted || (balance.balance ? ethers.formatEther(balance.balance) : '0') || '0'}
            </p>
          </div>
        )}

        {totalDeposits && (
          <div className={styles.infoSection}>
            <p className={styles.label}>Total Deposits:</p>
            <p className={styles.value}>
              {totalDeposits.totalFormatted || totalDeposits.total || '0'}
            </p>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Vault Operations</h2>
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${operation === 'deposit' ? styles.tabActive : ''}`}
              onClick={() => setOperation('deposit')}
            >
              Deposit
            </button>
            <button
              className={`${styles.tab} ${operation === 'withdraw' ? styles.tabActive : ''}`}
              onClick={() => setOperation('withdraw')}
            >
              Withdraw
            </button>
          </div>

          <input
            className={styles.input}
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className={styles.buttonRow}>
            <button
              className={styles.primaryButton}
              onClick={handleEstimateGas}
              disabled={loading}
            >
              Estimate Gas
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleExecuteTransaction}
              disabled={loading}
            >
              {operation === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Error: {error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
