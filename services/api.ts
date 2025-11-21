
import { MenuItem, Order, OrderStatus, PaymentStatus, User } from '../types';

// Get API URL from Environment, default to Render for AI Studio/Dev
// Use optional chaining safely
const API_URL = (import.meta.env?.VITE_API_URL || 'https://campusbytes.onrender.com').replace(/\/$/, '');

const USER_STORAGE_KEY = 'cb_user';

export const apiDb = {
  init: () => {
    console.log(`Initializing API Mode connecting to: ${API_URL}`);
  },

  // --- AUTH ---
  login: async (userData?: Partial<User>): Promise<User> => {
    // 1. Create the user object (Simulating a login response)
    const user: User = {
      id: userData?.id || 'guest_' + Date.now(),
      name: userData?.name || 'Guest',
      email: userData?.email || '',
      avatar: userData?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.name || 'Guest'}`
    };

    // 2. PERSIST SESSION (Crucial for staying logged in)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    return user;
  },

  logout: async () => {
    // 3. CLEAR SESSION
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  getCurrentUser: (): User | null => {
    // 4. REHYDRATE SESSION
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // --- DATA ---
  getMenu: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${API_URL}/api/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },
  
  updateMenuItemStatus: async (itemId: string, isAvailable: boolean): Promise<void> => {
    await fetch(`${API_URL}/api/menu/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable })
    });
  },

  addMenuItem: async (item: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await fetch(`${API_URL}/api/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add menu item');
    return res.json();
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
    await fetch(`${API_URL}/api/menu/${itemId}`, {
      method: 'DELETE'
    });
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/api/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/api/orders?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user orders');
    return res.json();
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (!res.ok) return null;
      const orders: Order[] = await res.json();
      return orders.find(o => o.id === id) || null;
    } catch (e) {
      return null;
    }
  },

  createOrder: async (user: User, items: any[], total: number, paymentMethod: 'CASH' | 'UPI'): Promise<Order> => {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user.id,
        customerName: user.name,
        items,
        totalAmount: total,
        paymentMethod
      })
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },
  
  createManualOrder: async (customerName: string, items: any[], total: number, paymentStatus: PaymentStatus): Promise<Order> => {
    // Use 'vendor_manual' as ID to bypass rate limiting on server
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'vendor_manual',
        customerName: customerName || 'Walk-in Customer',
        items,
        totalAmount: total,
        paymentMethod: 'CASH' // Default to cash for walk-ins mostly
      })
    });
    
    if (!res.ok) throw new Error('Failed to create manual order');
    const newOrder = await res.json();

    // If the vendor marks it as PAID immediately
    if (paymentStatus === PaymentStatus.PAID) {
       await apiDb.updatePaymentStatus(newOrder.id, PaymentStatus.PAID);
       newOrder.paymentStatus = PaymentStatus.PAID;
    }

    return newOrder;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  updatePaymentStatus: async (orderId: string, status: PaymentStatus): Promise<void> => {
    await fetch(`${API_URL}/api/orders/${orderId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },
  
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    // Polling for API mode (fetches every 3 seconds)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        if (res.ok) {
          const orders = await res.json();
          callback(orders);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }
};
