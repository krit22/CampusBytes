
import { MenuItem, Order, OrderStatus, PaymentStatus, User, SpamRecord, SystemSettings, OrderType, DeliveryDetails } from '../types';

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
    let user = userData;
    
    // If no user data provided (auto-login attempt), check local storage
    if (!user) {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
            user = JSON.parse(stored);
        } else {
            throw new Error("No user session found");
        }
    } else {
        // If logging in fresh, normalize ID
        if (!user.id && user.email) {
             user.id = 'u_' + Math.abs(user.email.hashCode());
        }
        // Persist
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    
    return user as User;
  },

  vendorLogin: async (password: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/api/vendor/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (!res.ok) return false;
        return true;
    } catch (e) {
        console.error("Vendor login api error", e);
        return false;
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // --- DATA ---
  getMenu: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${API_URL}/api/menu`);
    if (!res.ok) throw new Error("Failed to fetch menu");
    return res.json();
  },
  
  updateMenuItem: async (itemId: string, updates: Partial<MenuItem>): Promise<void> => {
      await fetch(`${API_URL}/api/menu/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
      });
  },

  addMenuItem: async (item: Partial<MenuItem>): Promise<MenuItem> => {
      const res = await fetch(`${API_URL}/api/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
      });
      return res.json();
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
      await fetch(`${API_URL}/api/menu/${itemId}`, { method: 'DELETE' });
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/api/orders`);
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/api/orders?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user orders");
    return res.json();
  },

  createOrder: async (
    user: User, 
    items: any[], 
    total: number, 
    paymentMethod: 'CASH' | 'UPI',
    orderType: OrderType = 'DINE_IN',
    deliveryDetails?: DeliveryDetails
  ): Promise<Order> => {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user.id,
        customerName: user.name,
        items,
        totalAmount: total,
        paymentMethod,
        orderType,
        deliveryDetails
      })
    });
    
    if (!res.ok) {
        const err = await res.json();
        const error: any = new Error(err.error || "Failed to create order");
        if (res.status === 403) {
            error.status = 403;
            error.data = err;
        }
        throw error;
    }
    return res.json();
  },

  createManualOrder: async (customerName: string, items: any[], total: number, paymentStatus: PaymentStatus): Promise<Order> => {
    // Reusing the create order endpoint, but the backend handles 'vendor_manual' customerId specifically
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'vendor_manual',
        customerName: customerName || 'Walk-in Customer',
        items,
        totalAmount: total,
        paymentMethod: 'CASH',
        orderType: 'DINE_IN'
      })
    });
    
    // Since manual orders might be PAID immediately, we might need a second call or update backend.
    // For now, we create it as PENDING (default) then update if needed, OR relies on backend default.
    // But wait, mockDb allows passing paymentStatus. API needs to support it or we update immediately.
    const order = await res.json();
    
    if (paymentStatus === PaymentStatus.PAID) {
        await apiDb.updatePaymentStatus(order.id, PaymentStatus.PAID);
        order.paymentStatus = PaymentStatus.PAID;
    }
    
    return order;
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
  
  // Polling Wrapper for API (since we don't have sockets)
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const interval = setInterval(async () => {
      try {
        const orders = await apiDb.getOrders();
        callback(orders);
      } catch (e) {
        // silent fail on poll
      }
    }, 2000); // Slower poll for API
    return () => clearInterval(interval);
  },

  // --- ADMIN ---
  getSystemSettings: async (): Promise<SystemSettings> => {
      const res = await fetch(`${API_URL}/api/admin/settings`);
      return res.json();
  },
  updateSystemSettings: async (updates: Partial<SystemSettings>): Promise<void> => {
      await fetch(`${API_URL}/api/admin/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
      });
  },
  toggleBanSystem: async (isActive: boolean): Promise<void> => {
      await fetch(`${API_URL}/api/admin/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBanSystemActive: isActive })
      });
  },
  toggleShopStatus: async (isOpen: boolean): Promise<void> => {
      await fetch(`${API_URL}/api/admin/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isShopOpen: isOpen })
      });
  },
  getBannedUsers: async (): Promise<SpamRecord[]> => {
      const res = await fetch(`${API_URL}/api/admin/banned-users`);
      return res.json();
  },
  unbanUser: async (customerId: string): Promise<void> => {
      await fetch(`${API_URL}/api/admin/unban-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId })
      });
  },
  unbanAllUsers: async (): Promise<void> => {
      await fetch(`${API_URL}/api/admin/unban-all`, { method: 'POST' });
  },

  // Passthrough for completeness (not really used in API mode locally usually)
  getOrderById: async (id: string): Promise<Order | null> => {
      // In real app, add endpoint. For now, just fetch all and find.
      const orders = await apiDb.getOrders();
      return orders.find(o => o.id === id) || null;
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