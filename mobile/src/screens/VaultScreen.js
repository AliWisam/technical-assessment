import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useVault } from '../context/VaultContext';

export default function VaultScreen() {
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
  } = useVault();

  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('deposit'); // 'deposit' or 'withdraw'

  useEffect(() => {
    if (isConnected && address) {
      fetchStatus();
    }
  }, [isConnected, address]);

  const handleFetchBalance = async () => {
    if (!address || !tokenAddress) {
      Alert.alert('Error', 'Please enter token address');
      return;
    }
    await fetchBalance(address, tokenAddress);
  };

  const handleFetchTotal = async () => {
    if (!tokenAddress) {
      Alert.alert('Error', 'Please enter token address');
      return;
    }
    await fetchTotalDeposits(tokenAddress);
  };

  const handleEstimateGas = async () => {
    if (!tokenAddress || !amount) {
      Alert.alert('Error', 'Please enter token address and amount');
      return;
    }

    try {
      let result;
      if (operation === 'deposit') {
        result = await estimateDeposit(tokenAddress, amount);
      } else {
        result = await estimateWithdraw(tokenAddress, amount);
      }

      if (result) {
        Alert.alert(
          'Gas Estimate',
          `Estimated gas: ${result.gasEstimate || 'N/A'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to estimate gas: ${error.message}`);
    }
  };

  const handleExecuteTransaction = () => {
    // TODO: Implement actual transaction execution
    // This would involve:
    // 1. Building the transaction
    // 2. Getting user approval via wallet
    // 3. Sending the transaction
    // 4. Tracking transaction status
    Alert.alert(
      'Transaction',
      'Transaction execution needs to be implemented using wallet SDK'
    );
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please connect your wallet first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.label}>Connected Address:</Text>
          <Text style={styles.value}>{address}</Text>
        </View>

        {status && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Contract Status:</Text>
            <Text style={[styles.value, status.paused && styles.errorText]}>
              {status.paused ? 'Paused' : 'Active'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Configuration</Text>
          <TextInput
            style={styles.input}
            placeholder="Token Address (0x...)"
            value={tokenAddress}
            onChangeText={setTokenAddress}
            autoCapitalize="none"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleFetchBalance}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Get Balance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleFetchTotal}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Get Total</Text>
            </TouchableOpacity>
          </View>
        </View>

        {balance && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Your Balance:</Text>
            <Text style={styles.value}>
              {balance.balanceFormatted || balance.balance || '0'}
            </Text>
          </View>
        )}

        {totalDeposits && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Total Deposits:</Text>
            <Text style={styles.value}>
              {totalDeposits.totalFormatted || totalDeposits.total || '0'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vault Operations</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, operation === 'deposit' && styles.tabActive]}
              onPress={() => setOperation('deposit')}
            >
              <Text
                style={[
                  styles.tabText,
                  operation === 'deposit' && styles.tabTextActive,
                ]}
              >
                Deposit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, operation === 'withdraw' && styles.tabActive]}
              onPress={() => setOperation('withdraw')}
            >
              <Text
                style={[
                  styles.tabText,
                  operation === 'withdraw' && styles.tabTextActive,
                ]}
              >
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleEstimateGas}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Estimate Gas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleExecuteTransaction}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {operation === 'deposit' ? 'Deposit' : 'Withdraw'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200ee',
  },
  secondaryButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#6200ee',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
  },
});
