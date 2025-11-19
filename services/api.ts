
import { MenuItem, Order, OrderStatus, PaymentStatus, User } from '../types';

// Get API URL from Environment, default to localhost for dev
// Use optional chaining safely
const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const apiDb = {
  init: () => {
    console.log(`Initializing API Mode connecting to: ${API_URL}`);
  },

  // --- AUTH (Handled purely client-side/Google for now, backend just stores ID) ---
  login: async (userData?: Partial<User>): Promise<User> => {
    // We accept the user data passed from Google/Form
    // In a complex app, you'd POST /api/auth/login here to get a session token
    return {
      id: userData?.id || 'guest',
      name: userData?.name || 'Guest',
      email: userData?.email || '',
      avatar: userData?.avatar || ''
    };
  },

  logout: async () => {
    // Clear local session
  },

  getCurrentUser: (): User | null => {
    // Rely on local storage persistence handled by the main app state or storage.ts wrapper
    // For this simple architecture, we just return null and let the UI handle re-login if needed
    // or relies on the storage wrapper's localStorage cache.
    return null; 
  },

  // --- DATA ---
  getMenu: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${API_URL}/api/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
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
    // Fetch all and filter since backend doesn't expose specific ID endpoint yet
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
    // Polling for API mode
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
