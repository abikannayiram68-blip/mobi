import { create } from 'zustand';

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
