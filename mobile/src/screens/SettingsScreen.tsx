import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LogOut, User, Settings, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <User color="#60A5FA" size={32} />
        </View>
        <Text style={styles.nameText}>{user?.fullName || 'Customer'}</Text>
        <Text style={styles.emailText}>{user?.email || 'Not signed in'}</Text>
        <View style={styles.badge}>
          <ShieldCheck color="#34D399" size={14} />
          <Text style={styles.badgeText}>Verified Customer</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Settings color="#9E9EAF" size={20} />
          <Text style={styles.menuText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  header: { padding: 16, backgroundColor: '#13131A', borderBottomWidth: 1, borderBottomColor: '#272635' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#13131A', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1924', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#272635' },
  nameText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  emailText: { color: '#9E9EAF', fontSize: 14, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#064E3B', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#34D399', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  menu: { backgroundColor: '#13131A', paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#272635' },
  menuText: { color: '#fff', fontSize: 15, marginLeft: 12 },
  logoutBtn: { borderBottomWidth: 0, marginTop: 8 },
  logoutText: { color: '#EF4444', fontSize: 15, marginLeft: 12, fontWeight: 'bold' },
});
