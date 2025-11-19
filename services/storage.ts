import { MenuItem, Order, OrderStatus, PaymentStatus } from '../types';

// Constants
const STORAGE_KEYS = {
  ORDERS: 'cb_orders',
  MENU: 'cb_menu',
};

// Initial Mock Menu Data
const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Campus Burger', description: 'Classic chicken patty with cheese & special sauce', price: 85, category: 'Burgers', isAvailable: true },
  { id: 'm2', name: 'Veggie Delight', description: 'Spicy potato patty with fresh lettuce', price: 65, category: 'Burgers', isAvailable: true },
  { id: 'm3', name: 'Masala Fries', description: 'Crispy fries tossed in peri-peri masala', price: 50, category: 'Sides', isAvailable: true },
  { id: 'm4', name: 'Cold Coffee', description: 'Thick blend with vanilla ice cream', price: 70, category: 'Beverages', isAvailable: true },
  { id: 'm5', name: 'Masala Chai', description: 'Hot spiced tea, perfect for breaks', price: 20, category: 'Beverages', isAvailable: true },
  { id: 'm6', name: 'Egg Roll', description: 'Double egg roll with spicy chutney', price: 60, category: 'Wraps', isAvailable: true },
];

// Helper to delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  // Initialize
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.MENU)) {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  },

  // Menu Operations
  getMenu: async (): Promise<MenuItem[]> => {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEYS.MENU);
    return data ? JSON.parse(data) : [];
  },

  // Order Operations
  getOrders: async (): Promise<Order[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    const orders = await db.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  createOrder: async (items: any[], total: number, paymentMethod: 'CASH' | 'UPI'): Promise<Order> => {
    await delay(600);
    const orders = await db.getOrders();
    
    // Generate simplified Token (R-XXX)
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const token = `R-${randomNum}`;
    
    const newOrder: Order = {
      id: Date.now().toString(),
      token,
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
    const orders = await db.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  updatePaymentStatus: async (orderId: string, status: PaymentStatus): Promise<void> => {
    await delay(200);
    const orders = await db.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].paymentStatus = status;
      orders[index].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },
  
  // For polling mechanism
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const interval = setInterval(async () => {
      const orders = await db.getOrders();
      callback(orders);
    }, 1500); // Poll every 1.5s to simulate realtime
    return () => clearInterval(interval);
  }
};

db.init();