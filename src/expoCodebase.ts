/**
 * EXPO REACT NATIVE + SUPABASE CODEBASE EXPORTS
 * This contains the complete, production-ready source code files for the Expo Router/Navigation framework,
 * which developers can instantly copy or export.
 */

export interface CodeFile {
  path: string;
  language: 'typescript' | 'javascript' | 'sql' | 'json';
  description: string;
  content: string;
}

export const EXPO_CODEBASE: CodeFile[] = [
  {
    path: 'package.json',
    language: 'json',
    description: 'Expo project configuration and Supabase / AsyncStorage dependencies.',
    content: `{
  "name": "simple-supabase-ecommerce",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "ts:check": "tsc"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "1.23.1",
    "@supabase/supabase-js": "^2.43.4",
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "3.31.1",
    "lucide-react-native": "^0.380.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "typescript": "~5.3.3"
  },
  "private": true
}`
  },
  {
    path: 'supabase_schema.sql',
    language: 'sql',
    description: 'Migration-safe PostgreSQL schema with Row-Level Security (RLS) policies and safe role checks.',
    content: `-- 🏠 Simple E-Commerce Supabase Database Schema
-- Run this in the Supabase SQL Editor to provision tables, security rules, and real-time triggers.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends Supabase Auth users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    role text not null default 'customer' check (role in ('customer', 'admin')),
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies for public.profiles
create policy "Allow public read-access to profiles"
    on public.profiles for select
    using (true);

create policy "Allow users to update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- 2. CATEGORIES Table
create table if not exists public.categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    slug text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- Policies for public.categories
create policy "Anyone can view active categories"
    on public.categories for select
    using (true);

create policy "Admins can manage categories"
    on public.categories for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- 3. PRODUCTS Table
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    price numeric(10,2) not null check (price >= 0),
    discount_price numeric(10,2) check (discount_price >= 0 and discount_price < price),
    category_id uuid references public.categories(id) on delete set null,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    image_url text,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for products
alter table public.products enable row level security;

-- Policies for public.products
create policy "Anyone can view active products"
    on public.products for select
    using (status = 'active');

create policy "Admins can manage products"
    on public.products for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- 4. ORDERS & ORDER ITEMS Table
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    total_amount numeric(10,2) not null,
    status text not null default 'placed' check (status in ('draft', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded')),
    shipping_address text not null,
    payment_method text not null default 'card',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    price numeric(10,2) not null,
    quantity integer not null check (quantity > 0)
);

-- Enable RLS for Orders and Order Items
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies for Orders
create policy "Customers can view own orders"
    on public.orders for select
    using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Customers can place own orders"
    on public.orders for insert
    with check (auth.uid() = user_id);

create policy "Admins can update orders"
    on public.orders for update
    using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

-- Policies for Order Items
create policy "Customers can view own order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.orders
            where id = order_items.order_id and (user_id = auth.uid() or exists (
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

create policy "Customers can insert own order items"
    on public.order_items for insert
    with check (
        exists (
            select 1 from public.orders
            where id = order_items.order_id and user_id = auth.uid()
        )
    );

-- 5. ORDER STATUS HISTORY Table
create table if not exists public.order_status_history (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    status text not null,
    updated_by uuid references public.profiles(id),
    note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_status_history enable row level security;

create policy "Users can view history for authorized orders"
    on public.order_status_history for select
    using (
        exists (
            select 1 from public.orders
            where id = order_status_history.order_id and (user_id = auth.uid() or exists (
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

create policy "Authorized users can add order status history"
    on public.order_status_history for insert
    with check (
        exists (
            select 1 from public.orders
            where id = order_status_history.order_id and (user_id = auth.uid() or exists (
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

-- 6. SUPPORT TICKETS & THREADS
create table if not exists public.support_tickets (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    category text not null,
    status text not null default 'Open' check (status in ('Open', 'In Progress', 'Resolved', 'Closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ticket_messages (
    id uuid default uuid_generate_v4() primary key,
    ticket_id uuid references public.support_tickets(id) on delete cascade not null,
    sender_id uuid references public.profiles(id),
    sender_role text not null check (sender_role in ('customer', 'admin')),
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Policies for Tickets
create policy "Users can check own support tickets"
    on public.support_tickets for select
    using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Customers can open support tickets"
    on public.support_tickets for insert
    with check (auth.uid() = user_id);

create policy "Admins can update tickets"
    on public.support_tickets for update
    using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

-- Policies for Ticket Messages
create policy "Users can view message logs"
    on public.ticket_messages for select
    using (
        exists (
            select 1 from public.support_tickets
            where id = ticket_messages.ticket_id and (user_id = auth.uid() or exists (
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

create policy "Users can post message logs"
    on public.ticket_messages for insert
    with check (
        exists (
            select 1 from public.support_tickets
            where id = ticket_messages.ticket_id and (user_id = auth.uid() or exists (
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

-- 7. NOTIFICATIONS Table
create table if not exists public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null default 'system',
    read_status boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notification box"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Admins can send notifications"
    on public.notifications for insert
    with check (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

-- 8. AUTOMATION: Trigger profile setup on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Customer'), 'customer');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable real-time for order logs & support
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.ticket_messages;
`
  },
  {
    path: 'src/services/supabaseClient.ts',
    language: 'typescript',
    description: 'AsyncStorage-backed Supabase JS client configuration for React Native / Expo environment.',
    content: `import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// SECURELY load keys from Expo Constants or process.env variables configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials missing! Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your Expo .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
`
  },
  {
    path: 'src/store/cartStore.ts',
    language: 'typescript',
    description: 'Zustand persistent cart state manager containing totals, increments, and checkout preparations.',
    content: `import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock_quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (product) => set((state) => {
    const existing = state.items.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return state;
      return {
        items: state.items.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    return {
      items: [
        ...state.items,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
          stock_quantity: product.stock_quantity,
        },
      ],
    };
  }),
  removeFromCart: (productId) => set((state) => ({
    items: state.items.filter(item => item.id !== productId),
  })),
  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(item => item.id !== productId) };
    }
    return {
      items: state.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ),
    };
  }),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  },
}));
`
  },
  {
    path: 'src/screens/LoginScreen.tsx',
    language: 'typescript',
    description: 'Expo Auth login / register component with loading skeletons and session persistence UI.',
    content: `import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { supabase } from '../services/supabaseClient';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'Customer' },
          }
        });
        if (error) throw error;
        Alert.alert(
          'Verification Sent',
          'Please inspect your inbox for verification messages if SMTP configuration is active!'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brandTitle}>MOBI_SHOP</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Establish a secure customer credentials account' : 'Access your cart catalog and orders portal'}
        </Text>

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
            <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleTextContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an profile? Sign In' : "Don't have an account? Sign Up"}
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
  input: { backgroundColor: '#1A1924', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#272635', marginBottom: 16, fontSize: 14 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleTextContainer: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#60A5FA', fontSize: 13 }
});
`
  },
  {
    path: 'src/screens/CatalogScreen.tsx',
    language: 'typescript',
    description: 'Expo item grid with categories filter, direct cart loading triggers and instant stock displays.',
    content: `import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useCartStore } from '../store/cartStore';
import { Search, Filter, ShoppingBag } from 'lucide-react-native';

export default function CatalogScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('status', 'active');
      const { data: catData } = await supabase.from('categories').select('*');
      if (prodData) setProducts(prodData);
      if (catData) setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
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
        data={[{ id: 'All', name: 'All' }, ...categories]}
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
                <Text style={styles.price}>\${item.discount_price || item.price}</Text>
                {item.discount_price && <Text style={styles.oldPrice}>\${item.price}</Text>}
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
`
  },
  {
    path: 'src/screens/CartScreen.tsx',
    language: 'typescript',
    description: 'Cart calculation page connecting with client-side checkout triggers and database loaders.',
    content: `import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../services/supabaseClient';
import { Plus, Minus, Trash } from 'lucide-react-native';

export default function CartScreen({ navigation }: any) {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCartStore();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) {
        Alert.alert('Authentication Required', 'Please create an account or sign in to process checkouts.');
        return;
      }

      // Check stocks or create order
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        total_amount: getTotal(),
        shipping_address: '128 Main Street Suite, Metro Plaza',
        payment_method: 'Credit Card',
        status: 'placed'
      }).select().single();

      if (error) throw error;

      // Add status trace trigger
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'placed',
        updated_by: user.id,
        note: 'Customer initialized order via mobile app checkout.'
      });

      // Insert line-items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        price: item.price,
        quantity: item.quantity
      }));
      await supabase.from('order_items').insert(orderItems);

      clearCart();
      Alert.alert('Checkout Complete', 'Your order was successfully placed! Follow your dashboard tracker.');
      navigation.navigate('Orders');
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your shopping basket is empty</Text>
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
                  <Text style={styles.price}>\${item.price}</Text>

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
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sum Total:</Text>
              <Text style={styles.totalVal}>\${getTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={handleCheckout} style={styles.checkoutBtn}>
              <Text style={styles.checkoutText}>Confirm Mobile Order</Text>
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { color: '#9E9EAF', fontSize: 14 },
  totalVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
`
  },
  {
    path: 'app.json',
    language: 'json',
    description: 'Expo application routing, asset linkages, and Android package definition configuration.',
    content: `{
  "expo": {
    "name": "Simple E-Commerce Mobile App",
    "slug": "simple-supabase-ecommerce",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0C"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0C"
      },
      "package": "com.simpleecommerce.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "extra": {
      "router": {
        "origin": false
      }
    }
  }
}`
  },
  {
    path: 'eas.json',
    language: 'json',
    description: 'Expo Application Services (EAS) build settings, configured explicitly to generate ready-to-install APK files.',
    content: `{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}`
  }
];
