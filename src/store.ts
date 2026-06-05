import { Product, Order, OrderStatus, OrderStatusHistory, SupportTicket, AppNotification, UserRole, SEED_PRODUCTS } from './types';
import { supabase } from './supabase';

// Let's implement robust local storage persistence to keep the app highly responsive and survive browser reloads!
const IS_SERVER = typeof window === 'undefined';

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (IS_SERVER) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (IS_SERVER) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error);
  }
}

// Initial mock orders to make the admin dashboard look active and amazing on first boot!
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    user_id: 'cust-123',
    customer_name: 'Alex Mercer',
    customer_email: 'alex@example.com',
    items: [
      {
        product_id: 'prod-1',
        product_name: 'VoltX Pro Athletics Sneakers',
        price: 159.99,
        quantity: 1,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'
      }
    ],
    total_amount: 159.99,
    status: 'delivered',
    status_history: [
      { status: 'placed', timestamp: '2026-06-01T14:22:00Z', updated_by: 'customer', note: 'Order placed by customer via Mobile checkout.' },
      { status: 'confirmed', timestamp: '2026-06-01T15:10:00Z', updated_by: 'admin', note: 'Payment verified and order confirmed.' },
      { status: 'processing', timestamp: '2026-06-02T08:30:00Z', updated_by: 'admin', note: 'Package prepared, padded, and packed.' },
      { status: 'shipped', timestamp: '2026-06-02T13:45:00Z', updated_by: 'admin', note: 'Carrier picked up. Tracking #TRK-88223910.' },
      { status: 'delivered', timestamp: '2026-06-04T11:05:00Z', updated_by: 'admin', note: 'Successfully delivered to customer residence.' }
    ],
    shipping_address: '742 Evergreen Terrace, Springfield, OR',
    payment_method: 'Card Payment',
    created_at: '2026-06-01T14:22:00Z'
  },
  {
    id: 'ord-1002',
    user_id: 'cust-456',
    customer_name: 'Samantha Smith',
    customer_email: 'samantha@example.com',
    items: [
      {
        product_id: 'prod-3',
        product_name: 'AcousticWave Wireless ANC Headphones',
        price: 249.99,
        quantity: 2,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'
      },
      {
        product_id: 'prod-6',
        product_name: 'ThermoFlask Elite Water Jug',
        price: 39.99,
        quantity: 1,
        image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600'
      }
    ],
    total_amount: 539.97,
    status: 'processing',
    status_history: [
      { status: 'placed', timestamp: '2026-06-04T18:10:00Z', updated_by: 'customer', note: 'Placed with overnight express option.' },
      { status: 'confirmed', timestamp: '2026-06-04T19:00:00Z', updated_by: 'admin', note: 'Stock allocated.' },
      { status: 'processing', timestamp: '2026-06-05T07:15:00Z', updated_by: 'admin', note: 'Moved to priority processing shelf.' }
    ],
    shipping_address: '42 Wallaby Way, Sydney NSW 2000, Australia',
    payment_method: 'Apple Pay',
    created_at: '2026-06-04T18:10:00Z'
  }
];

// Initial mock support tickets
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-201',
    user_id: 'cust-123',
    customer_name: 'Alex Mercer',
    title: 'Defective charger port on smart watch',
    category: 'Hardware Defects',
    status: 'In Progress',
    messages: [
      { id: 'msg-1', sender_role: 'customer', message: 'Hi support team, I received the Horizon Active Smartwatch yesterday but it does not seem to fit the charging dock properly. The charging light flickers. Is there a replacement dock I can get?', created_at: '2026-06-04T09:00:00Z' },
      { id: 'msg-2', sender_role: 'admin', message: 'Hello Alex! We are sorry to hear that. I will look in our parts warehouse for a replacement charging pin. I have escalated this ticket to hardware support.', created_at: '2026-06-04T10:15:00Z' }
    ],
    created_at: '2026-06-04T09:00:00Z',
    updated_at: '2026-06-04T10:15:00Z'
  },
  {
    id: 'tkt-202',
    user_id: 'cust-456',
    customer_name: 'Samantha Smith',
    title: 'Can I change my shipping address?',
    category: 'Shipping Address Change',
    status: 'Resolved',
    messages: [
      { id: 'msg-3', sender_role: 'customer', message: 'Hi! I placed order #1002, but realized I put my office address instead of home. Can we correct it before it ships?', created_at: '2026-06-04T19:30:00Z' },
      { id: 'msg-4', sender_role: 'admin', message: 'Sure thing, Samantha! I have updated the database shipping records for order #1002. It now points to your Sydney home. Have a wonderful rest of your day!', created_at: '2026-06-04T20:00:00Z' },
      { id: 'msg-5', sender_role: 'customer', message: 'Amazing support, thank you!', created_at: '2026-06-04T20:12:00Z' }
    ],
    created_at: '2026-06-04T19:30:00Z',
    updated_at: '2026-06-04T20:12:00Z'
  }
];

// Initial mock notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'cust-123',
    title: '📦 Order Delivered!',
    message: 'Your order #ord-1001 was delivered successfully to Springfield, OR.',
    type: 'order',
    read_status: false,
    created_at: '2026-06-04T11:06:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'cust-123',
    title: '💬 Ticket Update',
    message: 'Agent posted a reply on: Defective charger port on smart watch.',
    type: 'ticket',
    read_status: false,
    created_at: '2026-06-04T10:15:00Z'
  },
  {
    id: 'notif-3',
    user_id: 'cust-456',
    title: '🎉 Welcome to MOBI_SHOP!',
    message: 'Your account is pending verification. Feel free to browse products while waiting!',
    type: 'system',
    read_status: true,
    created_at: '2026-06-04T18:11:00Z'
  }
];

/**
 * Validates transitions between e-commerce order statuses.
 * Flow: draft -> placed -> confirmed -> processing -> shipped -> delivered
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;

  // Global cancel states: Placed, Confirmed, and Processing orders can always be Cancelled
  if (to === 'cancelled') {
    return ['draft', 'placed', 'confirmed', 'processing'].includes(from);
  }

  // Refunded rule: can only refund cancelled or returned orders
  if (to === 'refunded') {
    return ['cancelled', 'returned'].includes(from);
  }

  switch (from) {
    case 'draft':
      return to === 'placed';
    case 'placed':
      return to === 'confirmed';
    case 'confirmed':
      return to === 'processing';
    case 'processing':
      return to === 'shipped';
    case 'shipped':
      return to === 'delivered' || to === 'returned';
    case 'delivered':
      return to === 'returned';
    case 'returned':
    case 'cancelled':
    case 'refunded':
      return false; // Terminal states unless moving to Refunded
    default:
      return false;
  }
}

/**
 * Global application store with simulated, Supabase-compatible state managers.
 */
export class AppStoreManager {
  private products: Product[];
  private orders: Order[];
  private tickets: SupportTicket[];
  private notifications: AppNotification[];
  private wishlist: Product[];
  private currentUserId: string;
  private currentUserEmail: string;
  private currentUserRole: UserRole;
  private currentUserFullName: string;
  private currentUserIsLoggedIn: boolean;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.products = getStorageItem<Product[]>('db_products', SEED_PRODUCTS);
    this.orders = getStorageItem<Order[]>('db_orders', INITIAL_ORDERS);
    this.tickets = getStorageItem<SupportTicket[]>('db_tickets', INITIAL_TICKETS);
    this.notifications = getStorageItem<AppNotification[]>('db_notifications', INITIAL_NOTIFICATIONS);
    this.wishlist = getStorageItem<Product[]>('session_wishlist', []);

    // Initial session loading from store storage
    this.currentUserIsLoggedIn = getStorageItem<boolean>('session_is_logged_in', false);
    if (this.currentUserIsLoggedIn) {
      this.currentUserId = getStorageItem<string>('session_user_id', 'cust-123');
      this.currentUserEmail = getStorageItem<string>('session_email', 'alex@example.com');
      this.currentUserRole = getStorageItem<UserRole>('session_role', 'customer');
      this.currentUserFullName = getStorageItem<string>('session_full_name', 'Alex Mercer');
    } else {
      this.currentUserId = '';
      this.currentUserEmail = '';
      this.currentUserRole = 'customer';
      this.currentUserFullName = '';
    }

    // Synchronize asynchronously on start
    this.initializeSupabaseSync();
  }

  async initializeSupabaseSync() {
    try {
      console.log('Fetching live state from Supabase...');
      const [prodRes, ordRes, tktRes, notifRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('updated_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);

      if (prodRes.data && prodRes.data.length > 0) {
        this.products = prodRes.data.map((p: any) => ({
          ...p,
          price: parseFloat(p.price),
          discount_price: p.discount_price ? parseFloat(p.discount_price) : null
        }));
      }
      if (ordRes.data) {
        this.orders = ordRes.data.map((o: any) => ({
          ...o,
          total_amount: parseFloat(o.total_amount),
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          status_history: typeof o.status_history === 'string' ? JSON.parse(o.status_history) : o.status_history,
        }));
      }
      if (tktRes.data) {
        this.tickets = tktRes.data.map((t: any) => ({
          ...t,
          messages: typeof t.messages === 'string' ? JSON.parse(t.messages) : t.messages,
        }));
      }
      if (notifRes.data) {
        this.notifications = notifRes.data;
      }

      console.log('🎉 Supabase synchronization loaded successfully!');
      this.notify();

      // Fetch wishlist after other entities are loaded
      if (this.currentUserIsLoggedIn) {
        this.fetchWishlist();
      }
    } catch (err: any) {
      console.error('Error fetching from Supabase:', err);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
    setStorageItem('db_products', this.products);
    setStorageItem('db_orders', this.orders);
    setStorageItem('db_tickets', this.tickets);
    setStorageItem('db_notifications', this.notifications);
    setStorageItem('session_wishlist', this.wishlist);
    setStorageItem('session_is_logged_in', this.currentUserIsLoggedIn);
    setStorageItem('session_user_id', this.currentUserId);
    setStorageItem('session_email', this.currentUserEmail);
    setStorageItem('session_role', this.currentUserRole);
    setStorageItem('session_full_name', this.currentUserFullName);
  }

  // --- Session Managers ---
  getCurrentUser() {
    return {
      id: this.currentUserId,
      email: this.currentUserEmail,
      role: this.currentUserRole,
      fullName: this.currentUserFullName,
      isLoggedIn: this.currentUserIsLoggedIn
    };
  }

  loginWithDetails(id: string, email: string, role: UserRole, fullName: string) {
    this.currentUserId = id;
    this.currentUserEmail = email;
    this.currentUserRole = role;
    this.currentUserFullName = fullName;
    this.currentUserIsLoggedIn = true;
    this.notify();
    this.fetchWishlist();
  }

  login(email: string, role: UserRole, fullName: string) {
    const id = role === 'admin' ? 'admin-001' : 'cust-' + Math.random().toString(36).substr(2, 5);
    this.loginWithDetails(id, email, role, fullName);
  }

  logout() {
    this.currentUserIsLoggedIn = false;
    this.currentUserId = '';
    this.currentUserEmail = '';
    this.currentUserRole = 'customer';
    this.currentUserFullName = '';
    this.wishlist = [];
    this.notify();
  }

  // --- Wishlist Managers ---
  getWishlist() {
    return this.wishlist;
  }

  async fetchWishlist() {
    if (!this.currentUserIsLoggedIn || !this.currentUserId) {
      this.wishlist = [];
      this.notify();
      return;
    }
    try {
      const res = await fetch(`/api/wishlist?user_id=${this.currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        this.wishlist = data;
        this.notify();
      }
    } catch (err) {
      console.error('Error fetching wishlist from API:', err);
    }
  }

  async toggleWishlist(product: Product) {
    if (!this.currentUserIsLoggedIn || !this.currentUserId) return;
    
    const exists = this.wishlist.some(p => p.id === product.id);
    if (exists) {
      // Optimistic local update
      this.wishlist = this.wishlist.filter(p => p.id !== product.id);
      this.notify();
      
      try {
        await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: this.currentUserId, product_id: product.id })
        });
      } catch (err) {
        console.error('Error deleting from wishlist:', err);
      }
    } else {
      // Optimistic local update
      this.wishlist = [...this.wishlist, product];
      this.notify();
      
      try {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: this.currentUserId, product_id: product.id })
        });
      } catch (err) {
        console.error('Error adding to wishlist:', err);
      }
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist.some(p => p.id === productId);
  }

  // --- Product Managers ---
  getProducts() {
    return this.products;
  }

  addProduct(prod: Omit<Product, 'id' | 'created_at'>) {
    const newProd: Product = {
      ...prod,
      id: 'prod-' + (this.products.length + 1) + '-' + Math.random().toString(36).substr(2, 3),
      created_at: new Date().toISOString(),
    };
    this.products.unshift(newProd);
    this.notify();

    // Persist to Supabase
    supabase.from('products').insert([newProd]).then(({ error }) => {
      if (error) console.error('Error inserting product to Supabase:', error);
    });

    return newProd;
  }

  updateProduct(id: string, updates: Partial<Product>) {
    this.products = this.products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.notify();

    // Persist to Supabase
    supabase.from('products').update(updates).eq('id', id).then(({ error }) => {
      if (error) console.error('Error updating product on Supabase:', error);
    });
  }

  deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.notify();

    // Persist to Supabase
    supabase.from('products').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Error deleting product from Supabase:', error);
    });
  }

  // --- Order Managers ---
  getOrders() {
    return this.orders;
  }

  createOrder(items: any[], total: number, shipping_address: string, payment_method: string) {
    const orderItems = items.map((i) => ({
      product_id: i.id,
      product_name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image_url,
    }));

    // Deduct stock levels in local inventory
    items.forEach((item) => {
      const match = this.products.find((p) => p.id === item.id);
      if (match) {
        const newStock = Math.max(0, match.stock_quantity - item.quantity);
        this.updateProduct(match.id, { stock_quantity: newStock });
      }
    });

    const newOrder: Order = {
      id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
      user_id: this.currentUserId,
      customer_name: this.currentUserFullName,
      customer_email: this.currentUserEmail,
      items: orderItems,
      total_amount: total,
      status: 'placed',
      status_history: [
        {
          status: 'placed',
          timestamp: new Date().toISOString(),
          updated_by: 'customer',
          note: 'Order successfully locked and submitted by customer client app.',
        },
      ],
      shipping_address,
      payment_method,
      created_at: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);

    // Dynamic self notification
    this.addNotification(
      this.currentUserId,
      '🛒 Order Placed!',
      `Order #${newOrder.id} totaling $${total.toFixed(2)} was successfully submitted.`,
      'order'
    );

    this.notify();

    // Persist to Supabase
    supabase.from('orders').insert([newOrder]).then(({ error }) => {
      if (error) console.error('Error inserting order to Supabase:', error);
    });

    return newOrder;
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, note: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    if (!isValidTransition(order.status, newStatus)) {
      return { success: false, error: `Invalid transition from ${order.status} to ${newStatus}` };
    }

    const historyEntry: OrderStatusHistory = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      updated_by: this.currentUserRole,
      note: note || `Order transitioned to ${newStatus} status state.`,
    };

    let updatedOrderRecord: Order | null = null;
    this.orders = this.orders.map((o) => {
      if (o.id === orderId) {
        updatedOrderRecord = {
          ...o,
          status: newStatus,
          status_history: [...o.status_history, historyEntry],
        };
        return updatedOrderRecord;
      }
      return o;
    });

    // Send order notifications based on target state
    let emoji = '📦';
    if (newStatus === 'confirmed') emoji = '✅';
    if (newStatus === 'shipped') emoji = '🚚';
    if (newStatus === 'delivered') emoji = '🎉';
    if (newStatus === 'cancelled') emoji = '❌';

    this.addNotification(
      order.user_id,
      `${emoji} Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}!`,
      `Your order #${order.id} status is now: ${newStatus.toUpperCase()}`,
      'order'
    );

    this.notify();

    // Persist to Supabase
    if (updatedOrderRecord) {
      supabase.from('orders').update({
        status: newStatus,
        status_history: (updatedOrderRecord as Order).status_history
      }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error updating order status in Supabase:', error);
      });
    }

    return { success: true };
  }

  // --- Ticket Managers ---
  getTickets() {
    return this.tickets;
  }

  createTicket(title: string, category: string, message: string) {
    const newTkt: SupportTicket = {
      id: 'tkt-' + Math.floor(300 + Math.random() * 700),
      user_id: this.currentUserId,
      customer_name: this.currentUserFullName,
      title,
      category,
      status: 'Open',
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender_role: 'customer',
          message,
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tickets.unshift(newTkt);
    this.notify();

    // Persist to Supabase
    supabase.from('tickets').insert([newTkt]).then(({ error }) => {
      if (error) console.error('Error inserting ticket to Supabase:', error);
    });

    return newTkt;
  }

  addTicketMessage(ticketId: string, message: string) {
    let updatedTkt: SupportTicket | null = null;
    this.tickets = this.tickets.map((t) => {
      if (t.id === ticketId) {
        const nextMsgs = [
          ...t.messages,
          {
            id: 'msg-' + Date.now(),
            sender_role: this.currentUserRole,
            message,
            created_at: new Date().toISOString(),
          },
        ];

        // Notify client if admin replis
        if (this.currentUserRole === 'admin') {
          this.addNotification(
            t.user_id,
            '💬 Support Reply',
            `A support representative commented on your ticket: "${t.title}"`,
            'ticket'
          );
        }

        updatedTkt = {
          ...t,
          messages: nextMsgs,
          updated_at: new Date().toISOString(),
          status: this.currentUserRole === 'admin' ? ('In Progress' as const) : t.status,
        };
        return updatedTkt;
      }
      return t;
    });
    this.notify();

    // Persist to Supabase
    if (updatedTkt) {
      supabase.from('tickets').update({
        messages: (updatedTkt as SupportTicket).messages,
        status: (updatedTkt as SupportTicket).status,
        updated_at: (updatedTkt as SupportTicket).updated_at
      }).eq('id', ticketId).then(({ error }) => {
        if (error) console.error('Error adding ticket message in Supabase:', error);
      });
    }
  }

  updateTicketStatus(ticketId: string, nextStatus: SupportTicket['status']) {
    let updatedTkt: SupportTicket | null = null;
    this.tickets = this.tickets.map((t) => {
      if (t.id === ticketId) {
        updatedTkt = {
          ...t,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };
        return updatedTkt;
      }
      return t;
    });
    this.notify();

    // Persist to Supabase
    if (updatedTkt) {
      supabase.from('tickets').update({
        status: nextStatus,
        updated_at: (updatedTkt as SupportTicket).updated_at
      }).eq('id', ticketId).then(({ error }) => {
        if (error) console.error('Error updating ticket status in Supabase:', error);
      });
    }
  }

  // --- Notifications ---
  getNotifications() {
    return this.notifications.filter((n) => n.user_id === this.currentUserId);
  }

  addNotification(userId: string, title: string, message: string, type: AppNotification['type']) {
    const notif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 3),
      user_id: userId,
      title,
      message,
      type,
      read_status: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.notify();

    // Persist to Supabase
    supabase.from('notifications').insert([notif]).then(({ error }) => {
      if (error) console.error('Error inserting notification to Supabase:', error);
    });
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map((n) =>
      n.user_id === this.currentUserId ? { ...n, read_status: true } : n
    );
    this.notify();

    // Persist to Supabase
    supabase.from('notifications').update({ read_status: true }).eq('user_id', this.currentUserId).then(({ error }) => {
      if (error) console.error('Error marking notifications read on Supabase:', error);
    });
  }
}

// Global Singleton
export const globalStore = new AppStoreManager();
