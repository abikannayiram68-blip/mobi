import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ShoppingBag, Store, Package, User } from 'lucide-react-native';
import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#13131A' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#13131A', borderTopColor: '#272635' },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#9E9EAF',
      }}
    >
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0C' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
