
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

  getOrderById: async