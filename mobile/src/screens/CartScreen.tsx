import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { useAuthStore, API_URL } from '../store/authStore';
import { Plus, Minus, Trash } from 'lucide-react-native';
import { toINR } from '../utils/currency';

export default function CartScreen({ navigation }: any) {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Please sign in to checkout.');
      return;
    }

    try {
      const orderPayload = {
        id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: user.id,
        customer_name: user.fullName,
        customer_email: user.email,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        })),
        total_amount: getTotal(),
        status: 'Placed',
        shipping_address: '128 Main Street Suite, Metro Plaza',
        payment_method: 'Credit Card',
        status_history: JSON.stringify([{ status: 'Placed', timestamp: new Date().toISOString(), note: 'Order placed via mobile app' }])
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      setSuccessMsg('Your order was placed successfully!');
      setTimeout(() => navigation.navigate('Orders'), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your shopping basket is empty</Text>
          {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image_url }} style={styles.itemImg} />
                <View style={styles.itemDetail}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{toINR(item.price)}</Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={16} color="#9E9EAF" />
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={16} color="#9E9EAF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  <Trash size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            style={styles.list}
          />
          <View style={styles.footer}>
            {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successMsgFooter}>{successMsg}</Text> : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalVal}>{toINR(getTotal())}</Text>
            </View>
            <TouchableOpacity onPress={handleCheckout} style={styles.checkoutBtn}>
              <Text style={styles.checkoutText}>Confirm Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9E9EAF', fontSize: 14 },
  successMsg: { color: '#34D399', fontSize: 14, marginTop: 12, fontWeight: 'bold' },
  list: { flex: 1, padding: 12 },
  cartItem: { flexDirection: 'row', backgroundColor: '#13131A', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#272635', alignItems: 'center' },
  itemImg: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#1A1924' },
  itemDetail: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  price: { color: '#60A5FA', fontSize: 14, fontWeight: 'bold', marginVertical: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  qty: { color: '#fff', marginHorizontal: 12, fontSize: 14, fontWeight: 'bold' },
  removeBtn: { padding: 8, marginLeft: 8 },
  footer: { padding: 20, backgroundColor: '#13131A', borderTopWidth: 1, borderTopColor: '#272635' },
  errorMsg: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  successMsgFooter: { color: '#34D399', fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { color: '#9E9EAF', fontSize: 14 },
  totalVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
