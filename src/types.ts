/**
 * Types & Interfaces for Simple E-Commerce Mobile App (Expo + Supabase)
 */

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatar_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  category: string;
  stock_quantity: number;
  image_url: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  updated_by: UserRole;
  note?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  status_history: OrderStatusHistory[];
  shipping_address: string;
  payment_method: string;
  created_at: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface TicketMessage {
  id: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  customer_name: string;
  title: string;
  category: string;
  status: TicketStatus;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'ticket' | 'system';
  user_id: string;
  read_status: boolean;
  created_at: string;
}

// Pre-seeded high-quality demo catalog
export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'VoltX Pro Athletics Sneakers',
    description: 'Ultra-lightweight marathon running shoes with responsive nitrogen-infused foam soles and multi-layer aero knit protection.',
    price: 189.99,
    discount_price: 159.99,
    category: 'Footwear',
    stock_quantity: 12,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Horizon Active Smartwatch',
    description: 'Premium healthcare wrist companion featuring continuous heart monitoring, dynamic GPS tracking, water-resistance, and up to 14 days of power.',
    price: 249.99,
    discount_price: null,
    category: 'Electronics',
    stock_quantity: 4,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-01T11:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'AcousticWave Wireless ANC Headphones',
    description: 'Over-ear headphones equipped with military-grade hybrid digital noise-canceling technology, immersive spatial sound, and soft memory-foam cups.',
    price: 299.99,
    discount_price: 249.99,
    category: 'Audio',
    stock_quantity: 25,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-01T12:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Minimalist Leather Carryall Bag',
    description: 'Handcrafted full-grain Italian leather laptop pack featuring magnetic quick-snap buckles and an organized shockproof sleeve.',
    price: 145.00,
    discount_price: 120.00,
    category: 'Accessories',
    stock_quantity: 8,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-02T10:30:00Z',
  },
  {
    id: 'prod-5',
    name: 'Lumina Portable Workspace Lamp',
    description: 'Anodized aluminum dual-light desk lamp with adjustable arm temperature configurations and seamless Qi wireless charger block on its pedestal.',
    price: 89.00,
    discount_price: null,
    category: 'Home Office',
    stock_quantity: 0, // Out of stock to test low-stock alerts
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-02T11:45:00Z',
  },
  {
    id: 'prod-6',
    name: 'ThermoFlask Elite Water Jug',
    description: 'Double-walled vacuum insulated surgical steel hydration companion. Keeps beverages icy cold for 36 hours or piping hot for 18 hours.',
    price: 45.00,
    discount_price: 39.99,
    category: 'Accessories',
    stock_quantity: 34,
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600',
    status: 'active',
    created_at: '2026-06-03T09:00:00Z',
  }
];
