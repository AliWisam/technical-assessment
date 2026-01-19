import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { WalletProvider } from './src/context/WalletContext';
import { VaultProvider } from './src/context/VaultContext';
import { syncStatsServiceConfig } from './src/services/api';

import HomeScreen from './src/screens/HomeScreen';
import VaultScreen from './src/screens/VaultScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    syncStatsServiceConfig();
  }, []);

  return (
    <WalletProvider>
      <VaultProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200ee',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'TokenVault' }}
            />
            <Stack.Screen 
              name="Vault" 
              component={VaultScreen}
              options={{ title: 'Vault Operations' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </VaultProvider>
    </WalletProvider>
  );
}
