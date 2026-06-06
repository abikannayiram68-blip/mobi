import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { API_URL } from '../store/authStore';
import { Search, ShoppingBag } from 'lucide-react-native';
import { toINR } from '../utils/currency';

export default function CatalogScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from products
  const categoryNames = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color="#888" />
          <TextInput
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={categoryNames.map(name => ({ id: name, name }))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === item.id && styles.activePill]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[styles.pillText, selectedCategory === item.id && styles.activePillText]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      />

      {loading ? <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} /> : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image source={{ uri: item.image_url }} style={styles.productImg} />
              <View style={styles.info}>
                <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
                <Text style={styles.price}>{toINR(item.discount_price || item.price)}</Text>
                {item.discount_price && <Text style={styles.oldPrice}>{toINR(item.price)}</Text>}
                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  style={[styles.cartBtn, item.stock_quantity === 0 && styles.disabledBtn]}
                  disabled={item.stock_quantity === 0}
                >
                  <ShoppingBag size={14} color="#fff" />
                  <Text style={styles.cartBtnText}>
                    {item.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C', padding: 12 },
  header: { marginBottom: 16, marginTop: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#13131A', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#272635', height: 48 },
  searchInput: { flex: 1, marginLeft: 8, color: '#fff', fontSize: 14 },
  categoryList: { maxHeight: 40, marginBottom: 12 },
  categoryPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#13131A', marginRight: 8, borderWidth: 1, borderColor: '#2E2D38', justifyContent: 'center' },
  activePill: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillText: { fontSize: 13, color: '#9E9EAF', fontWeight: '500' },
  activePillText: { color: '#fff' },
  grid: { flex: 1 },
  productCard: { flex: 0.5, backgroundColor: '#13131A', margin: 6, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#272635' },
  productImg: { width: '100%', height: 130, backgroundColor: '#1A1924' },
  info: { padding: 10 },
  title: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  price: { color: '#60A5FA', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  oldPrice: { color: '#EF4444', fontSize: 11, textDecorationLine: 'line-through' },
  cartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginTop: 8 },
  disabledBtn: { backgroundColor: '#2E2D38' },
  cartBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }
});
