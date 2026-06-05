import React, { useState, useEffect } from 'react';
import { globalStore, isValidTransition } from '../store';
import { Product, Order, OrderStatus, SupportTicket, AppNotification, UserRole } from '../types';
import { 
  ShoppingBag, Search, ShoppingCart, User, Inbox, AlertTriangle, 
  MessageSquare, Plus, Check, Clock, TrendingUp, DollarSign, 
  Settings, CheckCircle, RefreshCw, ChevronRight, Send, ArrowLeft, 
  FileText, ShieldCheck, Filter, X, Eye, Package, Trash2, Heart
} from 'lucide-react';

export default function PhoneSimulator() {
  // Helper to convert USD prices to Indian Rupees (₹) with proper format (1 USD = 83 INR)
  const toINR = (price: number): string => {
    const converted = Math.round(price * 83);
    return `₹${converted.toLocaleString('en-IN')}`;
  };

  // Global synchronization state
  const [session, setSession] = useState(globalStore.getCurrentUser());
  const [products, setProducts] = useState<Product[]>(globalStore.getProducts());
  const [orders, setOrders] = useState<Order[]>(globalStore.getOrders());
  const [tickets, setTickets] = useState<SupportTicket[]>(globalStore.getTickets());
  const [notifications, setNotifications] = useState<AppNotification[]>(globalStore.getNotifications());

  // Initialize Store subscription
  useEffect(() => {
    const unsub = globalStore.subscribe(() => {
      setSession(globalStore.getCurrentUser());
      setProducts([...globalStore.getProducts()]);
      setOrders([...globalStore.getOrders()]);
      setTickets([...globalStore.getTickets()]);
      setNotifications([...globalStore.getNotifications()]);
    });
    return unsub;
  }, []);

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'catalog' | 'cart' | 'orders' | 'support' | 'notifications' | 'admin-dash' | 'admin-products' | 'admin-orders' | 'admin-tickets'>('catalog');
  
  // Interaction states
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout inputs
  const [shippingAddress, setShippingAddress] = useState('128 Main Street Suite, Metro Plaza');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // New Support Ticket Input
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('General Inquiry');
  const [ticketContent, setTicketContent] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // Admin New Product inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Footwear');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Admin Order update inputs
  const [adminNote, setAdminNote] = useState('');

  // Real database authentication state flow
  const [authFormTab, setAuthFormTab] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'form' | 'otp-verify'>('form');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authRole, setAuthRole] = useState<'customer' | 'admin'>('customer');
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authMsg, setAuthMsg] = useState<{ text: string; type: 'success' | 'error' | 'otp-simulated'; simulationCode?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Authenticate / Registration Action Flow
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    if (!authEmail || !authPassword || !authFullName) {
      setAuthMsg({ text: 'Please fill in all registration fields.', type: 'error' });
      return;
    }
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          fullName: authFullName,
          role: authRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthMsg({ text: data.error || 'Failed to submit registration request.', type: 'error' });
      } else {
        setAuthStep('otp-verify');
        if (data.mode === 'simulated') {
          setAuthMsg({ 
            text: '🔑 OTP Code generated! Since no real SMTP server is configured in .env, use this secure simulation code below.', 
            type: 'otp-simulated', 
            simulationCode: data.otp 
          });
        } else {
          setAuthMsg({ text: `📨 An OTP verification code has been dispatched via SMTP to ${authEmail}.`, type: 'success' });
        }
      }
    } catch (err) {
      setAuthMsg({ text: 'Unable to connect to portal authentication service.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    if (!authOtpCode) {
      setAuthMsg({ text: 'Please enter the 6-digit confirmation code.', type: 'error' });
      return;
    }
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          otp: authOtpCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthMsg({ text: data.error || 'Incorrect or expired OTP verification code.', type: 'error' });
      } else {
        globalStore.loginWithDetails(data.user.id, data.user.email, data.user.role, data.user.fullName);
        setAuthStep('form');
        setAuthFormTab('login');
        setAuthMsg({ text: '🎉 Account verified successfully! You are now logged in.', type: 'success' });
        setCurrentScreen(data.user.role === 'admin' ? 'admin-dash' : 'catalog');
      }
    } catch (err) {
      setAuthMsg({ text: 'OTP verification failed. Server offline or unreachable.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    if (!authEmail || !authPassword) {
      setAuthMsg({ text: 'Please enter both email and password.', type: 'error' });
      return;
    }
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          role: authRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthMsg({ text: data.error || 'Login verification failed. Check email & password keys.', type: 'error' });
      } else {
        globalStore.loginWithDetails(data.user.id, data.user.email, data.user.role, data.user.fullName);
        setAuthMsg(null);
        setCurrentScreen(data.user.role === 'admin' ? 'admin-dash' : 'catalog');
      }
    } catch (err) {
      setAuthMsg({ text: 'Portal login service is currently offline.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  // Sync initial state if user switches role
  const handleRoleToggle = (targetRole: UserRole) => {
    if (targetRole === 'admin') {
      globalStore.login('admin@example.com', 'admin', 'System Administrator');
      setCurrentScreen('admin-dash');
    } else {
      globalStore.login('alex@example.com', 'customer', 'Alex Mercer');
      setCurrentScreen('catalog');
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    // Check stock levels
    const existing = cart.find(i => i.product.id === product.id);
    const existingQty = existing ? existing.quantity : 0;

    if (existingQty >= product.stock_quantity) {
      alert(`Out of Stock bounds! Only ${product.stock_quantity} available.`);
      return;
    }

    setCart(prev => {
      const match = prev.find(item => item.product.id === product.id);
      if (match) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const next = item.quantity + delta;
          if (next <= 0) return null;
          // Check stock bounds
          if (next > item.product.stock_quantity) return item;
          return { ...item, quantity: next };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.discount_price ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  // Checkout submit
  const handleCheckout = () => {
    if (cart.length === 0) return;
    const list = cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.discount_price ?? item.product.price,
      quantity: item.quantity,
      image_url: item.product.image_url
    }));
    
    const newOrder = globalStore.createOrder(list, cartTotal, shippingAddress, paymentMethod);
    setCart([]);
    setSelectedOrder(newOrder);
    setCurrentScreen('orders');
  };

  // Support ticket actions
  const handleOpenTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketContent) return;
    globalStore.createTicket(ticketTitle, ticketCategory, ticketContent);
    setTicketTitle('');
    setTicketContent('');
    alert('Support Ticket opened successfully!');
  };

  const postTicketReply = () => {
    if (!supportMessage || !selectedTicket) return;
    globalStore.addTicketMessage(selectedTicket.id, supportMessage);
    setSupportMessage('');
  };

  // Product addition admin
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    globalStore.addProduct({
      name: newProdName,
      description: newProdDesc || 'No description supplied.',
      price: parseFloat(newProdPrice),
      discount_price: null,
      category: newProdCategory,
      stock_quantity: parseInt(newProdStock) || 0,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
      status: 'active'
    });
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    alert('Product added to live inventory!');
  };

  // Order transition rules
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const res = globalStore.updateOrderStatus(orderId, nextStatus, adminNote);
    if (!res.success) {
      alert(`Status Transition Error: ${res.error}`);
    } else {
      setAdminNote('');
      if (selectedOrder?.id === orderId) {
        // refresh active order viewer
        const fresh = globalStore.getOrders().find(o => o.id === orderId);
        if (fresh) setSelectedOrder(fresh);
      }
    }
  };

  // Categories lists
  const categories = ['All', 'Footwear', 'Electronics', 'Audio', 'Accessories', 'Home Office'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 select-none">
      
      {/* Simulation Persona Bar */}
      <div className="flex items-center space-x-3 mb-4 bg-white border border-gray-200 rounded-full px-5 py-2 z-10 shadow-xs">
        <span className="text-xs font-mono text-slate-500 font-medium">Acting Role:</span>
        <button 
          onClick={() => handleRoleToggle('customer')}
          className={`px-3 py-1 text-xs rounded-full font-semibold transition ${
            session.role === 'customer' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Customer Portal
        </button>
        <button 
          onClick={() => handleRoleToggle('admin')}
          className={`px-3 py-1 text-xs rounded-full font-semibold transition ${
            session.role === 'admin' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Admin Portal
        </button>
      </div>

      {/* iPhone 16 Pro Mock Framing */}
      <div className="relative w-[385px] h-[780px] bg-black rounded-[56px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border-[11px] border-slate-800 flex flex-col overflow-hidden text-slate-900 font-sans ring-4 ring-offset-2 ring-transparent">
        
        {/* Dynamic Island Notch */}
        <div className="absolute top-[8px] left-1/2 transform -translate-x-1/2 w-[110px] h-[28px] bg-black rounded-3xl z-40 flex items-center justify-between px-2.5">
          <div className="w-4 h-4 bg-[#0A0A0C] border border-blue-950/35 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div className="w-5 h-2.5 bg-gray-950 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="h-10 bg-black flex justify-between items-end px-7 pb-1 text-xs font-semibold font-mono z-30 select-none text-white">
          <span className="text-[11px]">9:41</span>
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span>5G</span>
            <span>100%</span>
            <div className="w-5 h-2.5 border border-white/60 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Interactive screen container */}
        <div className="flex-1 overflow-hidden bg-white text-slate-930 flex flex-col relative">
          
          {/* Main Screens Navigation Router */}

          {!session.isLoggedIn ? (
            <div className="flex-1 flex flex-col justify-start bg-[#FAFBFD] overflow-y-auto pb-10 scrollbar-none">
              
              {/* Authenticator header bar */}
              <div className="bg-white border-b border-gray-150 py-3.5 px-5 flex items-center justify-between shadow-3xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-xs tracking-tight text-slate-800 uppercase font-mono">MOBI_AUTHENTICATOR</span>
                </div>
                <div className="text-[9px] bg-slate-100 border border-gray-250 text-slate-605 px-2 py-0.5 rounded-full font-black font-mono">
                  SMTP SECURITY
                </div>
              </div>

              {/* Form panel body */}
              <div className="p-6 space-y-5">
                
                {/* Visual Title and sub-text heading */}
                <div className="text-center pt-2">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {authFormTab === 'login' ? 'Authentication Desk' : 'Register Secure Profile'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 leading-normal max-w-[240px] mx-auto">
                    {authFormTab === 'login' 
                      ? 'Secure, role-separated administrative & customer store panels' 
                      : 'Join MobiShop with secure multi-tenant SMTP email verification'
                    }
                  </p>
                </div>

                {/* Tab selector pill */}
                {authStep === 'form' && (
                  <div className="grid grid-cols-2 p-1 bg-gray-250/90 border border-gray-250/30 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setAuthFormTab('login'); setAuthMsg(null); }}
                      className={`py-1.5 text-[10px] font-black rounded-lg tracking-wider transition cursor-pointer uppercase ${
                        authFormTab === 'login' 
                          ? 'bg-white text-slate-1200 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      LOGIN
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthFormTab('register'); setAuthMsg(null); }}
                      className={`py-1.5 text-[10px] font-black rounded-lg tracking-wider transition cursor-pointer uppercase ${
                        authFormTab === 'register' 
                          ? 'bg-white text-slate-1200 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      SIGN UP
                    </button>
                  </div>
                )}

                {/* Portal messages notifications box */}
                {authMsg && (
                  <div className={`p-3.5 rounded-xl border text-xs font-sans shadow-3xs leading-relaxed ${
                    authMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                    authMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                    'bg-indigo-50 text-indigo-700 border-indigo-250'
                  }`}>
                    <div className="flex space-x-2 items-start">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">{authMsg.text}</p>
                        {authMsg.type === 'otp-simulated' && authMsg.simulationCode && (
                          <div className="mt-2.5 text-center p-2 bg-slate-900 border border-slate-950 rounded-xl space-y-1 shadow-inner">
                            <span className="text-[8px] text-slate-400 font-mono font-bold tracking-widest block uppercase">OTP PASSKEY</span>
                            <span className="text-xl font-black font-mono tracking-widest text-emerald-400">{authMsg.simulationCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form inputs fields */}
                {authStep === 'form' ? (
                  <form onSubmit={authFormTab === 'login' ? handleLoginSubmit : handleRequestOtp} className="space-y-3.5">
                    
                    {/* Role selector field */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 font-mono tracking-wider uppercase block mb-1">Access Level (Role)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAuthRole('customer')}
                          className={`py-2 px-3 text-[10px] border rounded-xl font-black font-mono flex items-center justify-center space-x-1 transition cursor-pointer uppercase ${
                            authRole === 'customer'
                              ? 'bg-blue-50 border-blue-250 text-blue-700 shadow-3xs'
                              : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-55 font-bold'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>Customer Portal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthRole('admin')}
                          className={`py-2 px-3 text-[10px] border rounded-xl font-black font-mono flex items-center justify-center space-x-1 transition cursor-pointer uppercase ${
                            authRole === 'admin'
                              ? 'bg-amber-50 border-amber-250 text-amber-700 shadow-3xs'
                              : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-55 font-bold'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Admin Portal</span>
                        </button>
                      </div>
                    </div>

                    {/* Full Name input (Only for Signup) */}
                    {authFormTab === 'register' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 font-mono tracking-wider uppercase block mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-white border border-gray-300 text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    )}

                    {/* Email address field */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 font-mono tracking-wider uppercase block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="e.g. buyer@example.com"
                        className="w-full bg-white border border-gray-300 text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 font-mono tracking-wider uppercase block mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Enter secure account password"
                          className="w-full bg-white border border-gray-300 text-xs rounded-xl p-3 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Submit action button */}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className={`w-full py-3 rounded-xl font-bold font-sans text-xs tracking-wider uppercase text-white shadow-md transition cursor-pointer ${
                        authLoading ? 'bg-gray-400 cursor-not-allowed' :
                        authRole === 'admin' 
                          ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' 
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                      }`}
                    >
                      {authLoading ? 'Signing Action...' : (
                        authFormTab === 'login' ? 'Confirm Sign In' : 'Register Profile (SMTP OTP)'
                      )}
                    </button>

                    {/* Admin seeding guide */}
                    {authFormTab === 'login' && authRole === 'admin' && (
                      <div className="p-3 bg-amber-50/40 border border-amber-200/40 rounded-xl leading-normal text-center">
                        <span className="text-[9px] text-amber-700 tracking-tight font-black uppercase font-mono block mb-1">⚡ SYSTEM SEED CREDENTIALS</span>
                        <p className="text-[10px] text-slate-500 font-semibold font-sans">
                          Email: <b className="font-mono text-slate-705">admin@example.com</b><br />
                          Password: <b className="font-mono text-slate-705">admin123</b>
                        </p>
                      </div>
                    )}
                  </form>
                ) : (
                  
                  /* SUB-VIEW: OTP verifier */
                  <form onSubmit={handleConfirmOtp} className="space-y-4">
                    <div className="text-center bg-white border border-gray-200 px-4 py-5 rounded-2xl shadow-3xs space-y-2">
                      <p className="text-xs text-slate-505 leading-normal font-sans font-semibold">
                        Enter the Secure 6-Digit One-Time Verification Passcode dispatched to: <br /><b className="text-slate-800 font-mono">{authEmail}</b>
                      </p>
                      
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={authOtpCode}
                        onChange={(e) => setAuthOtpCode(e.target.value)}
                        className="text-center font-mono text-2xl font-black w-2/3 border-b-2 border-slate-350 focus:border-blue-500 focus:outline-none py-2 tracking-widest text-[#1e293b]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold font-sans text-xs tracking-wider uppercase shadow-md transition cursor-pointer"
                    >
                      {authLoading ? 'Verifying...' : 'Verify OTP & Log In'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthStep('form'); setAuthMsg(null); }}
                      className="w-full py-1 text-slate-505 hover:text-slate-800 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer"
                    >
                      Change Signup Details
                    </button>
                  </form>
                )}

              </div>
            </div>
          ) : (
            <>
              {/* CUSTOMER PORTAL SCREENS */}
              {session.role === 'customer' && (() => {
                switch (currentScreen) {
                  case 'catalog':
                    return (
                      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white text-slate-900">
                        {/* Header bar */}
                        <div className="p-4 pb-2 flex items-center justify-between border-b border-gray-100 bg-[#FAFAFA]">
                          <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-1.5">
                              <ShoppingBag className="w-5 h-5 text-blue-600" />
                              <span>MOBI_SHOP</span>
                            </h1>
                            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">SUPABASE SANDBOX</p>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button 
                              onClick={() => setCurrentScreen('notifications')}
                              className="relative p-2 bg-gray-100 hover:bg-gray-205 rounded-full border border-gray-250 transition cursor-pointer"
                            >
                              <Inbox className="w-4 h-4 text-slate-600" />
                              {notifications.some(n => !n.read_status) && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-650 rounded-full animate-bounce" />
                              )}
                            </button>
                            <button 
                              onClick={() => globalStore.logout()}
                              className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded-full border border-gray-255 transition cursor-pointer text-slate-600"
                              title="Sign Out"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                    {/* Search and Filters */}
                    <div className="px-4 py-3 bg-white space-y-3 border-b border-gray-100">
                      <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs">
                        <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                        <input 
                          type="text" 
                          placeholder="Search shoes, watches, cups..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-transparent border-0 outline-0 p-0 text-slate-800 w-full text-xs placeholder-slate-400"
                        />
                      </div>

                      {/* Category Pills Slider */}
                      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono whitespace-nowrap transition ${
                              selectedCategory === cat 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-gray-100 text-slate-550 border border-gray-200 hover:text-slate-900 hover:bg-gray-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product Lists Grid */}
                    <div className="flex-1 overflow-y-auto px-4 pt-3 pb-20 space-y-3 bg-[#F9FAFB]">
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                          No matching items found.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {filteredProducts.map((p) => {
                            const isLowStock = p.stock_quantity <= 4 && p.stock_quantity > 0;
                            const isOut = p.stock_quantity === 0;

                            return (
                              <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col justify-between shadow-2xs">
                                <div className="relative aspect-square w-full bg-gray-50 border-b border-gray-100">
                                  <img 
                                    src={p.image_url} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Wishlist toggle button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      globalStore.toggleWishlist(p);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-xs hover:bg-white rounded-full border border-gray-100 shadow-3xs transition cursor-pointer z-10"
                                    title={globalStore.isInWishlist(p.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                  >
                                    <Heart 
                                      className={`w-3.5 h-3.5 transition-colors ${
                                        globalStore.isInWishlist(p.id) 
                                          ? 'fill-red-500 text-red-500' 
                                          : 'text-slate-400 hover:text-slate-600'
                                      }`} 
                                    />
                                  </button>
                                  {p.discount_price && (
                                    <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                                      SALE
                                    </span>
                                  )}
                                  {isOut && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                      <span className="text-[10px] font-black text-red-600 uppercase font-mono tracking-wider bg-red-50 border border-red-155 px-2 py-1 rounded">
                                        Out of stock
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="p-2.5 space-y-1.5">
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                      {p.category}
                                    </span>
                                    <h3 className="text-xs font-bold text-slate-800 truncate leading-tight">
                                      {p.name}
                                    </h3>
                                  </div>

                                  <div className="flex items-baseline space-x-1.5">
                                    <span className="text-sm font-black text-blue-600 font-mono">
                                      {toINR(p.discount_price ?? p.price)}
                                    </span>
                                    {p.discount_price && (
                                      <span className="text-[10px] text-slate-400 line-through">
                                        {toINR(p.price)}
                                      </span>
                                    )}
                                  </div>

                                  {isLowStock && (
                                    <p className="text-[9px] font-mono text-amber-600 flex items-center space-x-0.5 font-bold">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                      <span>Only {p.stock_quantity} left</span>
                                    </p>
                                  )}

                                  <div className="pt-1">
                                    <button
                                      onClick={() => addToCart(p)}
                                      disabled={isOut}
                                      className={`w-full py-1.5 rounded-lg text-[10px] font-bold tracking-wider font-mono uppercase transition flex items-center justify-center space-x-1.5 ${
                                        isOut 
                                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                                      }`}
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                      <span>Add to Cart</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'cart':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-800">
                    <h2 className="text-lg font-bold mb-4 flex items-center space-x-2 text-slate-900 border-b border-gray-200 pb-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <span>Shopping Cart</span>
                    </h2>

                    {cart.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                        <ShoppingBag className="w-10 h-10 text-slate-350" />
                        <p className="text-xs text-slate-500 font-medium">Your basket is currently empty.</p>
                        <button 
                          onClick={() => setCurrentScreen('catalog')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold font-mono rounded-full shadow-xs"
                        >
                          Show Catalog
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        {/* Items Log List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
                          {cart.map((item) => (
                            <div key={item.product.id} className="bg-white rounded-xl p-2.5 border border-gray-200 flex space-x-3 items-center shadow-3xs">
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.name} 
                                className="w-12 h-12 object-cover rounded-md bg-gray-50 border border-gray-100 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 overflow-hidden">
                                <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                                <span className="text-[11px] font-mono text-blue-600 font-bold block mt-0.5">
                                  {toINR(item.product.discount_price ?? item.product.price)} each
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => updateCartQuantity(item.product.id, -1)}
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-gray-250 text-slate-700 rounded flex items-center justify-center font-black text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-mono font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.product.id, 1)}
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-gray-250 text-slate-700 rounded flex items-center justify-center font-black text-xs"
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-500 hover:text-red-650 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Order Address Box */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 my-3 space-y-2.5 text-xs shadow-3xs">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Shipping Address</label>
                            <input 
                              type="text" 
                              value={shippingAddress} 
                              onChange={(e) => setShippingAddress(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-250 p-2 rounded mt-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                              <select 
                                value={paymentMethod} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-250 p-2 rounded mt-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              >
                                <option value="Credit Card">Credit Card</option>
                                <option value="Apple Pay">Apple Pay</option>
                                <option value="Google Pay">Google Pay</option>
                                <option value="PayPal">PayPal</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Sum Totals */}
                        <div className="bg-white p-4 rounded-xl border border-gray-250 space-y-3.5 mb-14 shadow-2xs">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-500 font-bold font-mono tracking-wider uppercase text-[10px]">Auto Sum Total:</span>
                            <span className="text-lg font-black text-slate-900 font-mono">{toINR(cartTotal)}</span>
                          </div>
                          <button 
                            onClick={handleCheckout}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider rounded-lg uppercase transition font-mono shadow-xs"
                          >
                            Lock & Confirm Checkout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case 'orders':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 text-xs font-mono bg-[#F9FAFB] text-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center space-x-2 mb-4 border-b border-gray-200 pb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span>Order Tracker</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-20">
                      {selectedOrder ? (
                        <div className="space-y-4">
                          {/* Back Arrow */}
                          <button 
                            onClick={() => setSelectedOrder(null)}
                            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 font-bold mb-2 cursor-pointer font-sans"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Go back list</span>
                          </button>

                          {/* Specific Receipt Case */}
                          <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-3xs">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                              <span>ID: #{selectedOrder.id}</span>
                              <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-sans font-bold text-sm text-slate-800">Live Lifecycle State</h3>
                              <div className="flex items-center space-x-2 py-1">
                                <span className={`uppercase font-sans font-black text-xs px-2.5 py-1 rounded ${
                                  selectedOrder.status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                                  selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                  'bg-blue-50 text-blue-750 border border-blue-200'
                                }`}>
                                  {selectedOrder.status}
                                </span>
                              </div>
                            </div>

                            {/* Status Bar Track */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Timeline</label>
                              <div className="space-y-2 mt-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                                {selectedOrder.status_history.map((log, i) => (
                                  <div key={i} className="flex space-x-2 text-[10px]">
                                    <div className="flex flex-col items-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                                      {i < selectedOrder.status_history.length - 1 && <div className="w-0.5 h-6 bg-gray-250" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between font-bold text-slate-650">
                                        <span className="uppercase text-blue-650 font-black">{log.status}</span>
                                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      {log.note && <p className="text-slate-500 text-[9px] mt-0.5 font-medium">{log.note}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Items breakdown list */}
                            <div className="border-t border-gray-200 pt-3">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt Items</label>
                              <div className="space-y-2 mt-1">
                                {selectedOrder.items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-xs font-sans text-slate-700 font-medium">
                                    <span>{it.product_name} (x{it.quantity})</span>
                                    <span className="font-mono font-bold text-blue-600">{toINR(it.price * it.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3 leading-relaxed text-slate-500 text-[11px] font-sans font-medium space-y-1">
                              <p><b className="text-slate-700">Address:</b> {selectedOrder.shipping_address}</p>
                              <p><b className="text-slate-700">Payment:</b> {selectedOrder.payment_method}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.filter(o => o.user_id === session.id).length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs font-sans font-medium">
                              No orders made yet. Use the catalog checkout flow to place a live mobile test order!
                            </div>
                          ) : (
                            orders.filter(o => o.user_id === session.id).map((ord) => (
                              <div 
                                key={ord.id}
                                onClick={() => setSelectedOrder(ord)}
                                className="bg-white rounded-xl p-3.5 border border-gray-200 hover:border-gray-300 cursor-pointer flex justify-between items-center transition shadow-3xs text-slate-800"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900 font-sans text-sm">Order #{ord.id}</span>
                                    <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${
                                      ord.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                      ord.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {ord.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-sans font-medium">
                                    {ord.items.length} item(s) • <span className="font-mono font-bold">{toINR(ord.total_amount)}</span>
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </div>
                            ))
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'support':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-850">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2 border-b border-gray-200 pb-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span>Support Desk</span>
                    </h2>

                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      {selectedTicket ? (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          {/* Ticket Header & Back */}
                          <div className="border-b border-gray-200 pb-3 mb-3">
                            <button 
                              onClick={() => setSelectedTicket(null)}
                              className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 font-mono text-xs mb-2 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to Ticket Queue</span>
                            </button>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{selectedTicket.title}</h4>
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Category: {selectedTicket.category}</span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                selectedTicket.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' :
                                selectedTicket.status === 'Closed' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {selectedTicket.status}
                              </span>
                            </div>
                          </div>

                          {/* Chat Thread Messages list */}
                          <div className="flex-1 overflow-y-auto space-y-3 px-1 pr-1.5 scrollbar-thin">
                            {selectedTicket.messages.map((m) => (
                              <div 
                                key={m.id} 
                                className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed shadow-3xs ${
                                  m.sender_role === 'customer' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                  <p className="font-medium">{m.message}</p>
                                  <span className={`text-[9px] block text-right mt-1 font-mono font-bold ${
                                    m.sender_role === 'customer' ? 'text-white/70' : 'text-slate-400'
                                  }`}>
                                    {m.sender_role === 'customer' ? 'You' : 'Agent reply'} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Message sender panel */}
                          <div className="border-t border-gray-200 pt-3 mt-3 flex space-x-2 items-center mb-14">
                            <input 
                              type="text" 
                              placeholder="Type support reply message..."
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              className="flex-1 bg-white border border-gray-300 p-2.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onKeyDown={(e) => { if(e.key === 'Enter') postTicketReply(); }}
                            />
                            <button 
                              onClick={postTicketReply}
                              className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition shadow-2xs"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          {/* Tickets view list */}
                          <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Opened Support Tickets</span>
                            {tickets.filter(t => t.user_id === session.id).length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-6 font-medium">No tickets opened. Open one below!</p>
                            ) : (
                              tickets.filter(t => t.user_id === session.id).map((tkt) => (
                                <div 
                                  key={tkt.id}
                                  onClick={() => setSelectedTicket(tkt)}
                                  className="bg-white rounded-xl p-3 border border-gray-200 hover:border-gray-300 cursor-pointer flex justify-between items-center transition shadow-3xs"
                                >
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800">{tkt.title}</h4>
                                    <span className="text-[10px] font-mono font-bold text-slate-400">Category: {tkt.category}</span>
                                  </div>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                    tkt.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                    tkt.status === 'Closed' ? 'bg-gray-150 text-gray-500 border border-gray-200' :
                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {tkt.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Ticket open form */}
                          <form onSubmit={handleOpenTicket} className="border-t border-gray-200 pt-3 mt-3 space-y-2 mb-14">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Open a New Support Ticket</span>
                            <input 
                              type="text" 
                              placeholder="Ticket Title (e.g., Shipping delays)"
                              value={ticketTitle}
                              onChange={(e) => setTicketTitle(e.target.value)}
                              className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select 
                                value={ticketCategory} 
                                onChange={(e) => setTicketCategory(e.target.value)}
                                className="bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Hardware Defects">Hardware Defects</option>
                                <option value="Billing Details">Billing Details</option>
                                <option value="Customizations">Customizations</option>
                              </select>
                              <button 
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded flex items-center justify-center space-x-1.5 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Ticket</span>
                              </button>
                            </div>
                            <textarea 
                              placeholder="Support case description detail notes..."
                              value={ticketContent}
                              onChange={(e) => setTicketContent(e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'profile':
                const wishlistItems = globalStore.getWishlist();
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFD] text-slate-850">
                    {/* Header bar */}
                    <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-150 bg-white">
                      <div>
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center space-x-1.5">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span>My Profile</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">User Workspace</p>
                      </div>
                      <button 
                        onClick={() => globalStore.logout()}
                        className="text-[10px] font-mono font-bold text-red-650 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-none">
                      {/* User details card */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-black text-lg shadow-inner font-mono border border-indigo-100">
                          {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{session.fullName || 'No Name Set'}</h3>
                          <p className="text-xs text-slate-400 font-medium font-sans">{session.email}</p>
                          <span className="inline-block mt-1 text-[9px] font-black tracking-wide uppercase font-mono px-2 py-0.5 bg-emerald-55 text-emerald-850 border border-emerald-200 rounded-full">
                            {session.role === 'customer' ? 'Mobi Customer' : 'Administrator'}
                          </span>
                        </div>
                      </div>

                      {/* Wishlist segment container */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase font-mono">My Wishlist</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black font-mono">
                            {wishlistItems.length}
                          </span>
                        </div>

                        {wishlistItems.length === 0 ? (
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-3xs space-y-3">
                            <div className="w-12 h-12 bg-red-50/50 rounded-full flex items-center justify-center mx-auto border border-red-105 text-red-500">
                              <Heart className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-slate-800">Your wishlist is empty</h4>
                              <p className="text-[11px] text-slate-400 font-semibold max-w-[200px] mx-auto leading-relaxed">
                                Save high quality items to your secure wishlist while browsing the catalog.
                              </p>
                            </div>
                            <button
                              onClick={() => setCurrentScreen('catalog')}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans tracking-wide transition uppercase cursor-pointer"
                            >
                              Explore Catalog
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 pb-8">
                            {wishlistItems.map((p) => {
                              const isOut = p.stock_quantity === 0;
                              return (
                                <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col justify-between shadow-2xs relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      globalStore.toggleWishlist(p);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-white/95 text-red-500 rounded-full border border-gray-150 shadow-3xs hover:bg-white cursor-pointer z-10"
                                    title="Remove from wishlist"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="relative aspect-square w-full bg-gray-50 border-b border-gray-100">
                                    <img 
                                      src={p.image_url} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    {isOut && (
                                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <span className="text-[9px] font-black text-red-650 uppercase font-mono bg-red-55 px-1 py-0.5 rounded border border-red-200">
                                          Sold Out
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between border-t border-gray-100">
                                    <div>
                                      <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                                        {p.category}
                                      </span>
                                      <h4 className="text-[11px] font-bold text-slate-800 truncate leading-tight mt-0.5" title={p.name}>
                                        {p.name}
                                      </h4>
                                      <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                                        <span className="text-xs font-bold text-blue-600">
                                          {toINR(p.discount_price ?? p.price)}
                                        </span>
                                        {p.discount_price && (
                                          <span className="text-[9px] text-slate-400 line-through">
                                            {toINR(p.price)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      disabled={isOut}
                                      onClick={() => addToCart(p)}
                                      className={`w-full py-1 mt-1.5 rounded text-[9px] font-bold tracking-wider font-mono uppercase transition flex items-center justify-center space-x-1 ${
                                        isOut 
                                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs cursor-pointer'
                                      }`}
                                    >
                                      <ShoppingCart className="w-2.5 h-2.5" />
                                      <span>Add +</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

              case 'notifications':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-850">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                        <Inbox className="w-5 h-5 text-blue-600" />
                        <span>Notifications</span>
                      </h2>
                      <button 
                        onClick={() => { globalStore.markAllNotificationsRead(); }}
                        className="text-[10px] font-mono font-bold text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded hover:bg-blue-100 transition shadow-3xs cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pb-20 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-center py-10 text-slate-400 font-sans font-medium">No notifications received.</p>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-3 rounded-xl border transition shadow-3xs ${
                              n.read_status 
                                ? 'bg-white border-gray-200 text-slate-500' 
                                : 'bg-blue-50/50 border-blue-200 text-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold font-sans text-slate-900">{n.title}</h4>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-[11px] font-sans mt-1 leading-relaxed ${
                              n.read_status ? 'text-slate-400' : 'text-slate-600 font-medium'
                            }`}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })()}

          {/* ADMIN PORTAL SCREENS */}
          {session.role === 'admin' && (() => {
            switch (currentScreen) {
              case 'admin-dash':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2 border-b border-gray-200 pb-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <span>Admin Portal</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-20 text-xs font-mono">
                      {/* Metric Widgets Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between shadow-3xs">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Sales</label>
                          <span className="text-lg font-black text-slate-900 font-mono mt-2">{toINR(2143.12)}</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between shadow-3xs">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</label>
                          <span className="text-lg font-black text-slate-900 font-mono mt-2">{orders.length}</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between shadow-3xs">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Users</label>
                          <span className="text-lg font-black text-slate-900 font-mono mt-2">25</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between shadow-3xs">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</label>
                          <span className="text-lg font-black text-amber-600 font-mono mt-2">
                            {tickets.filter(t => t.status !== 'Closed').length}
                          </span>
                        </div>
                      </div>

                      {/* Out of Stock Warning */}
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center space-x-1.5 text-red-700 font-bold">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Stock Level Alerts</span>
                        </div>
                        <div className="space-y-1.5 text-slate-650">
                          {products.filter(p => p.stock_quantity <= 4).map((p) => (
                            <div key={p.id} className="flex justify-between text-[11px] font-sans font-medium">
                              <span>{p.name}</span>
                              <span className="font-mono font-bold text-red-600 uppercase">
                                {p.stock_quantity === 0 ? 'SOLD OUT' : `${p.stock_quantity} left`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Task Selection Router */}
                      <div className="bg-white border border-gray-200 p-3 rounded-xl space-y-2 shadow-3xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Administrative Functions</span>
                        
                        <button 
                          onClick={() => setCurrentScreen('admin-orders')} 
                          className="w-full flex justify-between items-center py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-[11px] font-sans text-slate-700 font-bold transition cursor-pointer"
                        >
                          <span>Manage Orders Database</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button 
                          onClick={() => setCurrentScreen('admin-products')} 
                          className="w-full flex justify-between items-center py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-[11px] font-sans text-slate-700 font-bold transition cursor-pointer"
                        >
                          <span>Manage Product Catalog</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button 
                          onClick={() => setCurrentScreen('admin-tickets')} 
                          className="w-full flex justify-between items-center py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-[11px] font-sans text-slate-700 font-bold transition cursor-pointer"
                        >
                          <span>Support Agent Helpline</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                    </div>
                  </div>
                );

              case 'admin-products':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-850">
                    <div className="flex items-center space-x-2 mb-4 border-b border-gray-200 pb-2">
                      <button onClick={() => setCurrentScreen('admin-dash')} className="text-amber-600 hover:text-amber-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold text-slate-900">Products Catalog Manager</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-20 text-xs font-mono scrollbar-thin">
                      {/* Product registration form */}
                      <form onSubmit={handleAddProduct} className="bg-white border border-gray-200 p-3.5 rounded-xl space-y-2.5 shadow-3xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deploy a new Product</span>
                        <input 
                          type="text" 
                          placeholder="Product Name"
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="number" 
                            placeholder="Price"
                            value={newProdPrice}
                            onChange={(e) => setNewProdPrice(e.target.value)}
                            className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                          <input 
                            type="number" 
                            placeholder="Stock Level"
                            value={newProdStock}
                            onChange={(e) => setNewProdStock(e.target.value)}
                            className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            value={newProdCategory}
                            onChange={(e) => setNewProdCategory(e.target.value)}
                            className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          >
                            <option value="Footwear">Footwear</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Audio">Audio</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Home Office">Home Office</option>
                          </select>
                          <button 
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded flex items-center justify-center space-x-1.5 transition shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Item</span>
                          </button>
                        </div>
                      </form>

                      {/* Product Inventory Items Grid list */}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interactive Stock Editor</span>
                      <div className="space-y-2">
                        {products.map((p) => (
                          <div key={p.id} className="bg-white rounded-xl p-3 border border-gray-210 flex justify-between items-center shadow-3xs text-slate-800">
                            <div>
                              <h4 className="font-sans font-bold text-slate-800">{p.name}</h4>
                              <p className="text-[10px] text-slate-400 font-sans font-medium mt-0.5">{p.category} • {toINR(p.price)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="number" 
                                value={p.stock_quantity}
                                onChange={(e) => globalStore.updateProduct(p.id, { stock_quantity: parseInt(e.target.value) || 0 })}
                                className="w-12 bg-gray-50 border border-gray-300 text-center font-mono py-1 rounded text-xs text-amber-700 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <button 
                                onClick={() => globalStore.updateProduct(p.id, { status: p.status === 'active' ? 'inactive' : 'active' })}
                                className={`px-2 py-1 rounded border text-[9px] font-black tracking-wider transition ${
                                  p.status === 'active' 
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                    : 'bg-red-50 border-red-200 text-red-650 hover:bg-red-100'
                                }`}
                              >
                                {p.status === 'active' ? 'ACTIVE' : 'MUTED'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );

              case 'admin-orders':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-850">
                    <div className="flex items-center space-x-2 mb-4 border-b border-gray-200 pb-2 font-sans">
                      <button onClick={() => setCurrentScreen('admin-dash')} className="text-amber-600 hover:text-amber-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold text-slate-900">Orders Control Tower</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-20 text-xs font-mono scrollbar-thin">
                      {selectedOrder ? (
                        <div className="space-y-4">
                          <button onClick={() => setSelectedOrder(null)} className="flex items-center space-x-1.5 text-amber-600 hover:text-amber-700 font-bold mb-2 cursor-pointer font-sans">
                            <ArrowLeft className="w-4 h-4" />
                            <span>List View</span>
                          </button>

                          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-3xs">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                              <span>Order #{selectedOrder.id}</span>
                              <span className="uppercase text-amber-600 font-black">{selectedOrder.status}</span>
                            </div>

                            {/* Dispatch notes option */}
                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Actions & Timeline note</span>
                              <input 
                                type="text"
                                placeholder="Optional transit message (e.g. tracking #)"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="w-full bg-white border border-gray-300 p-2 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                              />

                              {/* Allowed Lifecycle buttons */}
                              <div className="pt-2 border-t border-gray-200">
                                <label className="text-[10px] tracking-wider text-slate-400 uppercase block mb-1.5 font-bold">Allowed Status Triggers</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'] as OrderStatus[]).map((st) => {
                                    const allowed = isValidTransition(selectedOrder.status, st);
                                    return (
                                      <button
                                        key={st}
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                                        disabled={!allowed}
                                        className={`px-2 py-1.5 rounded uppercase text-[9px] font-bold transition ${
                                          allowed
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-3xs'
                                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                        }`}
                                      >
                                        Set {st}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Status Timeline log list */}
                            <div className="mt-3">
                              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Status History Log</label>
                              <div className="bg-[#FAFAFA] border border-gray-150 p-2.5 rounded space-y-1.5">
                                {selectedOrder.status_history.map((log, index) => (
                                  <div key={index} className="text-[10px] border-b border-gray-100 pb-1 flex flex-col">
                                    <div className="flex justify-between uppercase font-black">
                                      <span className="text-amber-600">{log.status}</span>
                                      <span className="text-slate-400 text-[8px] font-bold">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {log.updated_by}
                                      </span>
                                    </div>
                                    {log.note && <p className="text-slate-500 font-sans mt-0.5 font-medium">{log.note}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Contact Buyer Details */}
                            <div className="pt-3 border-t border-gray-200 text-[10px] text-slate-500 font-sans font-medium space-y-1">
                              <p><b className="text-slate-700">Buyer:</b> {selectedOrder.customer_name} ({selectedOrder.customer_email})</p>
                              <p><b className="text-slate-700">Items count:</b> {selectedOrder.items.length}</p>
                              <p><b className="text-slate-700">Totals:</b> {toINR(selectedOrder.total_amount)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Customer Orders queue</span>
                          {orders.map((ord) => (
                            <div 
                              key={ord.id}
                              onClick={() => setSelectedOrder(ord)}
                              className="bg-white rounded-xl p-3 border border-gray-200 hover:border-amber-500/20 cursor-pointer flex justify-between items-center transition shadow-3xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5 animate-none">
                                  <h4 className="font-sans font-bold text-slate-800">Order #{ord.id}</h4>
                                  <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-bold`}>
                                    {ord.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-sans font-medium">{ord.customer_name} • <span className="font-mono font-bold">{toINR(ord.total_amount)}</span></p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'admin-tickets':
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-[#F9FAFB] text-slate-850">
                    <div className="flex items-center space-x-2 mb-4 border-b border-gray-200 pb-2">
                      <button onClick={() => setCurrentScreen('admin-dash')} className="text-amber-600 hover:text-amber-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold text-slate-900">Support Helplines</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-20 text-xs font-mono scrollbar-thin">
                      {selectedTicket ? (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          {/* Ticket Header Agent */}
                          <div className="bg-white border border-gray-200 p-3 rounded-xl mb-3 space-y-2 shadow-3xs">
                            <button onClick={() => setSelectedTicket(null)} className="flex items-center space-x-1.5 text-amber-600 hover:text-amber-700 font-bold cursor-pointer">
                              <ArrowLeft className="w-4 h-4" />
                              <span>Go back</span>
                            </button>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-slate-855 text-xs leading-snug">{selectedTicket.title}</h3>
                                <p className="text-[10px] text-slate-400 font-sans mt-0.5 font-bold uppercase tracking-wider">User: {selectedTicket.customer_name} ({selectedTicket.customer_email})</p>
                              </div>
                              <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-black ${
                                selectedTicket.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                selectedTicket.status === 'Closed' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {selectedTicket.status}
                              </span>
                            </div>

                            {/* Ticket resolution state managers */}
                            <div className="pt-2 border-t border-gray-150 flex space-x-1.5 justify-end">
                              <span className="text-[10px] text-slate-400 mr-2 self-center font-sans font-bold">Assigned Action:</span>
                              <button 
                                onClick={() => globalStore.updateTicketStatus(selectedTicket.id, 'Resolved')}
                                className="px-2 py-1 bg-green-50 border border-green-250 hover:bg-green-100 rounded text-green-700 font-bold text-[9px] transition shadow-3xs cursor-pointer"
                              >
                                Resolve
                              </button>
                              <button 
                                onClick={() => globalStore.updateTicketStatus(selectedTicket.id, 'Closed')}
                                className="px-2 py-1 bg-gray-100 border border-gray-250 hover:bg-gray-200 rounded text-gray-500 font-bold text-[9px] transition shadow-3xs cursor-pointer"
                              >
                                Close Ticket
                              </button>
                            </div>
                          </div>

                          {/* Message dialogue feeds */}
                          <div className="flex-1 overflow-y-auto space-y-3 px-1 pr-1.5 scrollbar-thin">
                            {selectedTicket.messages.map((m) => (
                              <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl p-3 leading-relaxed shadow-3xs ${
                                  m.sender_role === 'admin' 
                                    ? 'bg-amber-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                  <p className="font-medium text-xs">{m.message}</p>
                                  <span className={`text-[9px] block text-right mt-1 font-mono font-bold ${
                                    m.sender_role === 'admin' ? 'text-white/70' : 'text-slate-400'
                                  }`}>
                                    {m.sender_role === 'admin' ? 'Representative' : selectedTicket.customer_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Reply interface */}
                          <div className="border-t border-gray-200 pt-3 mt-3 flex space-x-2 items-center mb-14">
                            <input 
                              type="text" 
                              placeholder="Type agent helpline reply..."
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              className="flex-1 bg-white border border-gray-300 p-2.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              onKeyDown={(e) => { if(e.key === 'Enter') postTicketReply(); }}
                            />
                            <button 
                              onClick={postTicketReply}
                              className="p-2.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-white transition shadow-2xs"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inbox Help Queues</span>
                          {tickets.map((tkt) => (
                            <div 
                              key={tkt.id}
                              onClick={() => setSelectedTicket(tkt)}
                              className="bg-white rounded-xl p-3 border border-gray-200 hover:border-amber-500/20 cursor-pointer flex justify-between items-center transition shadow-3xs"
                            >
                              <div>
                                <h4 className="font-sans font-bold text-slate-800">{tkt.title}</h4>
                                <p className="text-[10px] text-slate-400 font-sans font-semibold mt-0.5">Buyer: {tkt.customer_name} • Category: {tkt.category}</p>
                              </div>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase ${
                                tkt.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                tkt.status === 'Closed' ? 'bg-gray-150 text-gray-500 border-gray-250' : 
                                'bg-amber-50 text-amber-700 border-amber-250'
                              }`}>
                                {tkt.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })()}

          {/* BOTTOM MAIN TABS NAVIGATION (Only shown in Customer Mode, Admin has standard screens routing) */}
          {session.role === 'customer' && (
            <div className="absolute bottom-0 inset-x-0 h-[64px] bg-white/95 backdrop-blur-md border-t border-gray-200 px-5 flex items-center justify-between z-30 select-none pb-2 shadow-2xs">
              <button 
                onClick={() => { setCurrentScreen('catalog'); setSelectedProduct(null); }}
                className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                  currentScreen === 'catalog' ? 'text-blue-600 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-[9px] font-sans tracking-tight">Catalog</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('cart')}
                className={`flex flex-col items-center space-y-1 relative transition cursor-pointer ${
                  currentScreen === 'cart' ? 'text-blue-600 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-[9px] font-sans tracking-tight">Basket</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 right-1.5 bg-blue-600 text-white font-mono font-bold text-[8px] leading-none px-1.5 py-0.75 rounded-full shadow-3xs animate-none">
                    {cart.reduce((s,i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>

              <button 
                onClick={() => { setCurrentScreen('orders'); setSelectedOrder(null); }}
                className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                  currentScreen === 'orders' ? 'text-blue-600 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <Package className="w-4 h-4" />
                <span className="text-[9px] font-sans tracking-tight">Orders</span>
              </button>

              <button 
                onClick={() => { setCurrentScreen('support'); setSelectedTicket(null); }}
                className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                  currentScreen === 'support' ? 'text-blue-600 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[9px] font-sans tracking-tight">Support</span>
              </button>

              <button 
                onClick={() => { setCurrentScreen('profile'); }}
                className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                  currentScreen === 'profile' ? 'text-blue-600 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[9px] font-sans tracking-tight">Profile</span>
              </button>
            </div>
          )}

        </>
      )}

          {/* Home indicator bar (iPhone UI detail) */}
          <div className="absolute bottom-[4px] left-1/2 transform -translate-x-1/2 w-[118px] h-[4px] bg-slate-300 rounded-full z-40" />

        </div>
      </div>
    </div>
  );
}
