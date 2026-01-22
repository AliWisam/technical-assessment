'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { useVault } from '@/context/VaultContext';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { 
    address, 
    isConnected, 
    isConnecting,
    error,
    isMetaMaskInstalled,
    connectWallet, 
    disconnectWallet,
    clearError 
  } = useWallet();
  const { fetchStatus } = useVault();

  useEffect(() => {
    if (isConnected) {
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleConnect = async () => {
    clearError();
    try {
      await connectWallet();
    } catch (err) {
      // Error is already handled in WalletContext
      console.error('Connection error:', err);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>TokenVault</h1>
        <p className={styles.subtitle}>Manage your tokens securely</p>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Wallet Status</h2>
          {isConnected ? (
            <div className={styles.connectedBox}>
              <p className={styles.connectedText}>✓ Connected</p>
              <p className={styles.addressText}>{address}</p>
              <button
                className={styles.button}
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              {!isMetaMaskInstalled && (
                <div className={styles.errorBox}>
                  <p>MetaMask is not installed.</p>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    Install MetaMask
                  </a>
                </div>
              )}
              {error && (
                <div className={styles.errorBox}>
                  <p>{error}</p>
                  <button
                    className={styles.buttonSecondary}
                    onClick={clearError}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <button
                className={styles.button}
                onClick={handleConnect}
                disabled={isConnecting || !isMetaMaskInstalled}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <button
            className={styles.button}
            onClick={() => router.push('/vault')}
          >
            Go to Vault Operations
          </button>
        )}

        <div className={styles.infoBox}>
          <h3 className={styles.infoTitle}>Setup Instructions:</h3>
          <ul className={styles.infoList}>
            <li>Update API URL in src/config/api.ts</li>
            <li>Configure wallet connection (MetaMask/WalletConnect)</li>
            <li>Set contract address in config</li>
            <li>Connect wallet and test!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
