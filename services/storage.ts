
import { MenuItem, Order, OrderStatus, PaymentStatus, User } from '../types';
import { firebaseDb } from './firebase';

// Constants
const STORAGE_KEYS = {
  ORDERS: 'cb_orders',
  MENU: 'cb_menu',
  USER: 'cb_user'
};

// Check Environment Variable to decide mode
// Safely access using optional chaining
const USE_FIREBASE = import.meta.env?.VITE_USE_FIREBASE === 'true';

// ------------------------------------------------------------------
// MOCK IMPLEMENTATION (Local Storage)
// ------------------------------------------------------------------

const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Campus Burger', description: 'Classic chicken patty with cheese & special sauce', price: 85, category: 'Burgers', isAvailable: true },
  { id: 'm2', name: 'Veggie Delight', description: 'Spicy potato patty with fresh lettuce', price: 65, category: 'Burgers', isAvailable: true },
  { id: 'm3', name: 'Masala Fries', description: 'Crispy fries tossed in peri-peri masala', price: 50, category: 'Sides', isAvailable: true },
  { id: 'm4', name: 'Cold Coffee', description: 'Thick blend with vanilla ice cream', price: 70, category: 'Beverages', isAvailable: true },
  { id: 'm5', name: 'Masala Chai', description: 'Hot spiced tea, perfect for breaks', price: 20, category: 'Beverages', isAvailable: true },
  { id: 'm6', name: 'Egg Roll', description: 'Double egg roll with spicy chutney', price: 60, category: 'Wraps', isAvailable: true },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const mockDb = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.MENU)) {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  },

  login: async (userData?: Partial<User>): Promise<User> => {
    await delay(500);
    
    let user: User;
    
    if (userData && userData.email) {
      user = {
        id: userData.id || 'u_' + Math.abs(userData.email.hashCode()),
        name: userData.name || 'Campus Student',
        email: userData.email,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`
      };
    } else {
      user = {
        id: 'u_mock_123',
        name: 'Alex Student',
        email: 'alex@campus.edu',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex'
      };
    }

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  getMenu: async (): Promise<MenuItem[]> => {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEYS.MENU);
    return data ? JSON.parse(data) : [];
  },

  getOrders: async (): Promise<Order[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const orders = await mockDb.getOrders();
    return orders.filter(o => o.customerId === userId).sort((a, b) => b.createdAt - a.createdAt);
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    const orders = await mockDb.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  createOrder: async (user: User, items: any[], total: number, paymentMethod: 'CASH' | 'UPI'): Promise<Order> => {
    await delay(800);
    const orders = await mockDb.getOrders();
    
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const token = `R-${randomNum}`;
    
    const newOrder: Order = {
      id: Date.now().toString(),
      token,
      customerId: user.id,
      customerName: user.name,
      items,
      totalAmount: total,
      status: OrderStatus.NEW,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await delay(200);
    const orders = await mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  updatePaymentStatus: async (orderId: string, status: PaymentStatus): Promise<void> => {
    await delay(200);
    const orders = await mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].paymentStatus = status;
      orders[index].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },
  
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const interval = setInterval(async () => {
      const orders = await mockDb.getOrders();
      callback(orders);
    }, 1500); 
    return () => clearInterval(interval);
  }
};

// --- EXTENSIONS ---
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; 
  }
  return hash;
};

// ------------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------------

// If VITE_USE_FIREBASE is true in .env, export the Real Firebase DB
// Otherwise, export the Mock DB
export const db = USE_FIREBASE ? firebaseDb : mockDb;

// Initialize the chosen DB
db.init();