import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../context/WalletContext';
import { checkHealth } from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [checkingHealth, setCheckingHealth] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to connect wallet: ${error.message}`);
    }
  };

  const handleCheckBackend = async () => {
    setCheckingHealth(true);
    try {
      const result = await checkHealth();
      if (result.success) {
        Alert.alert('Success', 'Backend is reachable!');
      } else {
        Alert.alert('Error', `Backend unreachable: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to connect to backend: ${error.message}`);
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TokenVault Mobile</Text>
        <Text style={styles.subtitle}>Connect your wallet and start using the vault</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Status</Text>
          {isConnected ? (
            <View style={styles.connectedBox}>
              <Text style={styles.connectedText}>✓ Connected</Text>
              <Text style={styles.addressText}>{address}</Text>
              <TouchableOpacity
                style={[styles.button, styles.disconnectButton]}
                onPress={disconnectWallet}
              >
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={handleConnectWallet}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Configuration</Text>
          <TextInput
            style={styles.input}
            placeholder="Backend API URL"
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, styles.checkButton]}
            onPress={handleCheckBackend}
            disabled={checkingHealth}
          >
            <Text style={styles.buttonText}>
              {checkingHealth ? 'Checking...' : 'Check Backend Health'}
            </Text>
          </TouchableOpacity>
        </View>

        {isConnected && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Vault')}
          >
            <Text style={styles.buttonText}>Go to Vault Operations</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Setup Instructions:</Text>
          <Text style={styles.infoText}>1. Update API URL in src/config/api.js</Text>
          <Text style={styles.infoText}>2. Configure wallet connection (WalletConnect/MetaMask)</Text>
          <Text style={styles.infoText}>3. Set contract address in config</Text>
          <Text style={styles.infoText}>4. Connect wallet and test!</Text>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  connectedBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  connectedText: {
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 8,
  },
  addressText: {
    color: '#555',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  connectButton: {
    backgroundColor: '#6200ee',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  checkButton: {
    backgroundColor: '#2196f3',
  },
  primaryButton: {
    backgroundColor: '#6200ee',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    marginTop: 20,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#856404',
  },
  infoText: {
    color: '#856404',
    marginBottom: 4,
    fontSize: 14,
  },
});
