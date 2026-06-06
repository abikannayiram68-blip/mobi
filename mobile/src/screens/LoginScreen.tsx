import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuthStore, API_URL } from '../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuthStore();

  const handleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter your email and password');
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch(`${API_URL}/api/auth/register-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName: fullName || 'Customer', role: 'customer' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        
        if (data.mode === 'simulated') {
          setSuccessMessage(`Simulated mode – use OTP: ${data.otp}`);
        } else {
          setSuccessMessage(data.message || 'OTP sent! Please check your email.');
        }
        setIsOtpStep(true);
      } else {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'customer' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');
        
        await login(data.user);
        navigation.replace('Main');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!otp) {
      setErrorMessage('Please enter the OTP');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      await login(data.user);
      navigation.replace('Main');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  if (isOtpStep) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.brandTitle}>Verify Email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit OTP sent to your email.</Text>
          
          {errorMessage ? <View style={styles.errorContainer}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
          {successMessage ? <View style={styles.successContainer}><Text style={styles.successText}>{successMessage}</Text></View> : null}

          <TextInput
            placeholder="000000"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
            placeholderTextColor="#888"
          />

          <TouchableOpacity onPress={handleVerifyOtp} style={styles.button} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsOtpStep(false)} style={styles.toggleTextContainer}>
            <Text style={styles.toggleText}>Back to Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brandTitle}>MOBI_SHOP</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your customer account' : 'Access your cart and orders'}
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isSignUp && (
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#888"
          />
        )}

        <TextInput
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor="#888"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />

        <TouchableOpacity onPress={handleAuth} style={styles.button} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.buttonText}>{isSignUp ? 'Send OTP' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleTextContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#13131A', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#2E2D38' },
  brandTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#9E9EAF', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  successContainer: { backgroundColor: '#dcfce7', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#86efac' },
  successText: { color: '#15803d', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  input: { backgroundColor: '#1A1924', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#272635', marginBottom: 16, fontSize: 14 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleTextContainer: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#60A5FA', fontSize: 13 }
});
