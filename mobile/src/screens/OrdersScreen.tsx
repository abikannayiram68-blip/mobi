import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Package, Clock, CheckCircle } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { toINR } from '../utils/currency';
import { useAuthStore, API_URL } from '../store/authStore';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isFocused && user) {
      fetchOrders();
    }
  }, [isFocused]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders?user_id=${user!.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#34D399';
      case 'shipped': return '#60A5FA';
      case 'cancelled': return '#EF4444';
      default: return '#FBBF24';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle size={16} color="#34D399" />;
      case 'shipped': return <Package size={16} color="#60A5FA" />;
      default: return <Clock size={16} color="#FBBF24" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Package size={48} color="#272635" />
          <Text style={styles.emptyText}>You have no orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id.split('-')[0].toUpperCase()}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.orderBody}>
                <View style={styles.amountWrap}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.amountValue}>{toINR(Number(item.total_amount))}</Text>
                </View>
                
                <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                  {getStatusIcon(item.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  header: { padding: 16, backgroundColor: '#13131A', borderBottomWidth: 1, borderBottomColor: '#272635' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9E9EAF', fontSize: 14, marginTop: 12 },
  list: { padding: 12 },
  orderCard: { backgroundColor: '#13131A', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#272635' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#272635', paddingBottom: 12, marginBottom: 12 },
  orderId: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  date: { color: '#9E9EAF', fontSize: 12 },
  orderBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountWrap: { flex: 1 },
  amountLabel: { color: '#9E9EAF', fontSize: 12, marginBottom: 4 },
  amountValue: { color: '#60A5FA', fontSize: 18, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: '#1A1924' },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
});
