
import { MenuItem, Order, OrderStatus, PaymentStatus, User, SpamRecord, SystemSettings, OrderType, DeliveryDetails } from '../types';
import { apiDb } from './api';

// Constants
const STORAGE_KEYS = {
  ORDERS: 'cb_orders',
  MENU: 'cb_menu',
  USER: 'cb_user',
  SPAM: 'cb_spam',
  SETTINGS: 'cb_settings'
};

// Check Environment Variables
const USE_API = import.meta.env?.VITE_USE_API === 'true' || (import.meta.env?.VITE_USE_API === undefined && false); 

// ------------------------------------------------------------------
// MOCK IMPLEMENTATION (Local Storage)
// ------------------------------------------------------------------

const INITIAL_MENU: MenuItem[] = [
  // SNACKS
  { id: 'm1', name: 'Tea', description: 'Hot Tea', price: 10, category: 'Snacks', isAvailable: true, isBestseller: true },
  { id: 'm2', name: 'Coffee', description: 'Hot Coffee', price: 10, category: 'Snacks', isAvailable: true },
  { id: 'm3', name: 'Cold Coffee', description: 'Chilled coffee beverage', price: 50, category: 'Snacks', isAvailable: true, isBestseller: true },
  { id: 'm4', name: 'Fish Finger (4pcs)', description: 'Crispy fish fingers', price: 100, category: 'Snacks', isAvailable: true },
  { id: 'm5', name: 'Fish Cutlet', description: 'Fried fish cutlet', price: 60, category: 'Snacks', isAvailable: true },
  { id: 'm6', name: 'Potato Chips Roll (5pcs)', description: 'Crunchy potato rolls', price: 70, category: 'Snacks', isAvailable: true },
  { id: 'm7', name: 'French Fry', description: 'Classic salted fries', price: 60, category: 'Snacks', isAvailable: true },
  { id: 'm8', name: 'Chicken Nuggets (5pcs)', description: 'Crispy chicken bites', price: 100, category: 'Snacks', isAvailable: true },
  { id: 'm9', name: 'Chicken Pakora (5pcs)', description: 'Fried chicken fritters', price: 80, category: 'Snacks', isAvailable: true },
  { id: 'm10', name: 'Chicken Lolipop (4pcs)', description: 'Spicy chicken wings', price: 120, category: 'Snacks', isAvailable: true },
  { id: 'm11', name: 'Chinese Chicken', description: 'Indo-Chinese style chicken', price: 120, category: 'Snacks', isAvailable: true },
  { id: 'm12', name: 'Crispy Baby Corn', description: 'Fried baby corn', price: 100, category: 'Snacks', isAvailable: true },
  { id: 'm13', name: 'Omlet', description: 'Egg omelette', price: 30, category: 'Snacks', isAvailable: true },

  // MAGGI
  { id: 'm14', name: 'Boil Maggi', description: 'Simple boiled Maggi', price: 35, category: 'Maggi', isAvailable: true },
  { id: 'm15', name: 'Fry Maggi', description: 'Stir fried Maggi', price: 40, category: 'Maggi', isAvailable: true },
  { id: 'm16', name: 'Fry Egg Maggi', description: 'Fried Maggi with egg', price: 50, category: 'Maggi', isAvailable: true },
  { id: 'm17', name: 'Fry Chicken Maggi', description: 'Fried Maggi with chicken', price: 60, category: 'Maggi', isAvailable: true },
  { id: 'm18', name: 'Fry Egg Chicken Maggi', description: 'Fried Maggi with egg & chicken', price: 70, category: 'Maggi', isAvailable: true, isBestseller: true },

  // ROLL
  { id: 'm19', name: 'Veg. Roll', description: 'Mixed vegetable roll', price: 30, category: 'Rolls', isAvailable: true },
  { id: 'm20', name: 'Paneer Roll', description: 'Spiced paneer roll', price: 60, category: 'Rolls', isAvailable: true },
  { id: 'm21', name: 'Egg Roll', description: 'Classic egg roll', price: 35, category: 'Rolls', isAvailable: true },
  { id: 'm22', name: 'Chicken Roll', description: 'Juicy chicken roll', price: 60, category: 'Rolls', isAvailable: true, isBestseller: true },
  { id: 'm23', name: 'Egg Chicken Roll', description: 'Chicken roll with egg', price: 70, category: 'Rolls', isAvailable: true, isBestseller: true },

  // SANDWICH
  { id: 'm24', name: 'Veg. Sandwich', description: 'Vegetable filling', price: 35, category: 'Sandwich', isAvailable: true },
  { id: 'm25', name: 'Corn Sandwich', description: 'Sweet corn filling', price: 45, category: 'Sandwich', isAvailable: true },
  { id: 'm26', name: 'Paneer Sandwich', description: 'Paneer filling', price: 60, category: 'Sandwich', isAvailable: true },
  { id: 'm27', name: 'Egg Sandwich', description: 'Boiled egg filling', price: 45, category: 'Sandwich', isAvailable: true },
  { id: 'm28', name: 'Chicken Sandwich', description: 'Chicken filling', price: 50, category: 'Sandwich', isAvailable: true, isBestseller: true },
  { id: 'm29', name: 'Mix Sandwich', description: 'Mixed vegetable & meat', price: 70, category: 'Sandwich', isAvailable: true },

  // CHOWMEIN
  { id: 'm30', name: 'Veg. Chowmein', description: 'Stir fried noodles with veggies', price: 50, category: 'Chowmein', isAvailable: true },
  { id: 'm31', name: 'Egg Chowmein', description: 'Noodles with egg', price: 60, category: 'Chowmein', isAvailable: true },
  { id: 'm32', name: 'Chicken Chowmein', description: 'Noodles with chicken', price: 70, category: 'Chowmein', isAvailable: true },
  { id: 'm33', name: 'Egg Chicken Chowmein', description: 'Noodles with egg & chicken', price: 80, category: 'Chowmein', isAvailable: true },

  // MOMO
  { id: 'm34', name: 'Veg. Momo', description: 'Steamed vegetable dumplings', price: 50, category: 'Momo', isAvailable: true },
  { id: 'm35', name: 'Veg. Fry Momo', description: 'Fried vegetable dumplings', price: 60, category: 'Momo', isAvailable: true },
  { id: 'm36', name: 'Chicken Momo', description: 'Steamed chicken dumplings', price: 60, category: 'Momo', isAvailable: true, isBestseller: true },
  { id: 'm37', name: 'Chicken Fry Momo', description: 'Fried chicken dumplings', price: 70, category: 'Momo', isAvailable: true },
  { id: 'm38', name: 'Chicken Kurkure Momo', description: 'Crunchy fried momos', price: 80, category: 'Momo', isAvailable: true },

  // RICE
  { id: 'm39', name: 'Veg. Fried Rice', description: 'Rice with mixed veggies', price: 70, category: 'Rice', isAvailable: true },
  { id: 'm40', name: 'Egg Fried Rice', description: 'Rice with scrambled egg', price: 80, category: 'Rice', isAvailable: true },
  { id: 'm41', name: 'Chicken Fried Rice', description: 'Rice with chicken chunks', price: 90, category: 'Rice', isAvailable: true },
  { id: 'm42', name: 'Egg Chicken Fried Rice', description: 'Rice with egg & chicken', price: 100, category: 'Rice', isAvailable: true, isBestseller: true },

  // CHICKEN MAIN COURSE
  { id: 'm43', name: 'Chilly Chicken (8pcs)', description: 'Spicy Indo-Chinese chicken', price: 150, category: 'Chicken', isAvailable: true },
  { id: 'm44', name: 'Chicken Butter Masala (4pcs)', description: 'Rich creamy curry', price: 160, category: 'Chicken', isAvailable: true },
  { id: 'm45', name: 'Chicken Curry (4pcs)', description: 'Homestyle chicken curry', price: 120, category: 'Chicken', isAvailable: true },
  { id: 'm46', name: 'Chicken Bharta', description: 'Shredded chicken in gravy', price: 150, category: 'Chicken', isAvailable: true },

  // COMBO
  { id: 'm47', name: 'Fried Rice + Chilli Chicken', description: '4pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { id: 'm48', name: 'Lachha Paratha + Chilli Chicken', description: '4pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { id: 'm49', name: 'Fried Rice + Panner Chilli', description: '4pcs Paneer', price: 100, category: 'Combo', isAvailable: true },
  { id: 'm50', name: 'Fried Rice + Chicken Curry', description: '2pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { id: 'm51', name: 'Lachha Paratha + Chicken Kosha', description: '2pcs Chicken', price: 100, category: 'Combo', isAvailable: true }
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

// MOCK SPAM HANDLER
const handleMockSpamStrike = (customerId: string, customerName: string) => {
    const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
    let spamRecords: SpamRecord[] = spamStr ? JSON.parse(spamStr) : [];
    
    let record = spamRecords.find(r => r.customerId === customerId);
    if (!record) {
        record = { 
            customerId, 
            customerName, 
            strikes: 0, 
            banCount: 0, 
            isBanned: false, 
            banExpiresAt: 0, 
            banReason: '', 
            lastStrikeAt: Date.now() 
        };
        spamRecords.push(record);
    }

    record.strikes += 1;
    record.lastStrikeAt = Date.now();

    // 3 Strikes Rule
    if (record.strikes >= 3) {
        record.isBanned = true;
        record.banCount += 1;
        
        if (record.banCount === 1) {
            record.banExpiresAt = Date.now() + (60 * 60 * 1000); // 1 Hour
            record.banReason = "Temp Ban (1h): 3 consecutive cancellations.";
        } else if (record.banCount === 2) {
            record.banExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 Hours
            record.banReason = "Suspension (24h): Repeated spam activity.";
        } else {
            record.banExpiresAt = Date.now() + (99 * 365 * 24 * 60 * 60 * 1000); // Permanent
            record.banReason = "PERMANENT BAN: Policy violation.";
        }
    }

    localStorage.setItem(STORAGE_KEYS.SPAM, JSON.stringify(spamRecords));
};

const handleMockSuccess = (customerId: string) => {
    const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
    if (!spamStr) return;
    
    let spamRecords: SpamRecord[] = JSON.parse(spamStr);
    const idx = spamRecords.findIndex(r => r.customerId === customerId);
    
    if (idx !== -1) {
        // RESET STRIKES ON SUCCESSFUL ORDER
        spamRecords[idx].strikes = 0;
        localStorage.setItem(STORAGE_KEYS.SPAM, JSON.stringify(spamRecords));
    }
};


const mockDb = {
  init: () => {
    const storedMenuJSON = localStorage.getItem(STORAGE_KEYS.MENU);
    let finalMenu = INITIAL_MENU;

    if (storedMenuJSON) {
      const storedMenu = JSON.parse(storedMenuJSON) as MenuItem[];
      finalMenu = INITIAL_MENU.map(codeItem => {
        const storedItem = storedMenu.find(s => s.id === codeItem.id);
        if (storedItem) {
          return { 
              ...codeItem, 
              isAvailable: storedItem.isAvailable,
              isBestseller: storedItem.isBestseller 
          };
        }
        return codeItem;
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(finalMenu));

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    
    // Init Settings
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ 
            key: 'GLOBAL_SETTINGS', 
            isBanSystemActive: true, 
            isShopOpen: true,
            vendorPhoneNumber: '9876543210' 
        }));
    }
  },

  login: async (userData?: Partial<User>): Promise<User> => {
    await delay(500);
    // Check if user exists in local storage to retrieve Saved Settings (Phone, Address)
    const storedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
    let storedUser: User | null = storedUserStr ? JSON.parse(storedUserStr) : null;

    let user: User;
    if (userData && userData.email) {
      // New Login Attempt or Re-login
      user = {
        id: userData.id || 'u_' + Math.abs(userData.email.hashCode()),
        name: storedUser?.name || userData.name || 'Campus Student', // Prefer stored name if edited
        email: userData.email,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`,
        phone: storedUser?.phone,
        savedAddress: storedUser?.savedAddress
      };
    } else if (storedUser) {
        // Auto-login from storage
        user = storedUser;
    } else {
      // Guest Fallback
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
  
  updateUser: async (updates: Partial<User>): Promise<User> => {
      const storedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!storedUserStr) throw new Error("No user found");
      
      const user = JSON.parse(storedUserStr);
      const updatedUser = { ...user, ...updates };
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      return updatedUser;
  },

  vendorLogin: async (password: string): Promise<boolean> => {
    // For local testing, check env var or default to '123'
    const mockPass = import.meta.env?.VITE_VENDOR_PASSWORD || '123';
    await delay(500);
    return password === mockPass;
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
  
  // Generic Update
  updateMenuItem: async (itemId: string, updates: Partial<MenuItem>): Promise<void> => {
    await delay(200);
    const menu = await mockDb.getMenu();
    const index = menu.findIndex(m => m.id === itemId);
    if (index !== -1) {
      menu[index] = { ...menu[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
    }
  },

  addMenuItem: async (item: Partial<MenuItem>): Promise<MenuItem> => {
    await delay(300);
    const menu = await mockDb.getMenu();
    const newItem = {
      id: 'm_' + Date.now(),
      name: item.name || 'New Item',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || 'Snacks',
      isAvailable: true,
      isBestseller: false
    } as MenuItem;
    
    menu.push(newItem);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
    return newItem;
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
    await delay(200);
    const menu = await mockDb.getMenu();
    const filtered = menu.filter(m => m.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(filtered));
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

  createOrder: async (
    user: User, 
    items: any[], 
    total: number, 
    paymentMethod: 'CASH' | 'UPI', 
    orderType: OrderType = 'DINE_IN',
    deliveryDetails?: DeliveryDetails
  ): Promise<Order> => {
    await delay(800);
    
    // CHECK SETTINGS & BAN
    const settings = await mockDb.getSystemSettings();
    
    if (!settings.isShopOpen) {
        throw new Error("Shop is currently closed.");
    }

    if (settings.isBanSystemActive) {
        const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
        if (spamStr) {
            const records = JSON.parse(spamStr) as SpamRecord[];
            const record = records.find(r => r.customerId === user.id);
            if (record && record.isBanned) {
                if (Date.now() > record.banExpiresAt) {
                    record.isBanned = false;
                    record.strikes = 0; // RESET STRIKES
                    localStorage.setItem(STORAGE_KEYS.SPAM, JSON.stringify(records));
                } else {
                    const err: any = new Error("Account Suspended");
                    err.status = 403;
                    err.data = { banReason: record.banReason, banExpiresAt: record.banExpiresAt };
                    throw err;
                }
            }
        }
    }
    
    const orders = await mockDb.getOrders();
    
    // Mock Rate Limit (STRICT: 3 Orders)
    const activeCount = orders.filter(o => o.customerId === user.id && ['NEW','COOKING','READY'].includes(o.status)).length;
    if (activeCount >= 3) {
        throw new Error("Order Limit Reached. You can only have 3 active orders at a time.");
    }
    
    // Cooldown (STRICT: 30s)
    const lastOrder = orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt - a.createdAt)[0];
    if (lastOrder && (Date.now() - lastOrder.createdAt < 30000)) {
        throw new Error("Please wait 30 seconds before placing another order.");
    }

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
      orderType,
      deliveryDetails,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  createManualOrder: async (customerName: string, items: any[], total: number, paymentStatus: PaymentStatus): Promise<Order> => {
    await delay(800);
    const orders = await mockDb.getOrders();
    
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const token = `R-${randomNum}`;
    
    const newOrder: Order = {
      id: Date.now().toString(),
      token,
      customerId: 'vendor_manual',
      customerName: customerName || 'Walk-in Customer',
      items,
      totalAmount: total,
      status: OrderStatus.NEW,
      paymentStatus: paymentStatus,
      paymentMethod: 'CASH',
      orderType: 'DINE_IN',
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
      const order = orders[index];
      
      // Handle Spam Tracking
      if (status === OrderStatus.CANCELLED && order.customerId !== 'vendor_manual') {
          handleMockSpamStrike(order.customerId, order.customerName);
      } else if (status === OrderStatus.DELIVERED && order.customerId !== 'vendor_manual') {
          handleMockSuccess(order.customerId);
      }

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
  },

  // --- MOCK ADMIN ---
  getSystemSettings: async (): Promise<SystemSettings> => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : { key: 'GLOBAL_SETTINGS', isBanSystemActive: true, isShopOpen: true, vendorPhoneNumber: '9876543210' };
  },
  updateSystemSettings: async (updates: Partial<SystemSettings>): Promise<void> => {
      const settings = await mockDb.getSystemSettings();
      const newSettings = { ...settings, ...updates };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },
  toggleBanSystem: async (isActive: boolean): Promise<void> => {
    const settings = await mockDb.getSystemSettings();
    settings.isBanSystemActive = isActive;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
  toggleShopStatus: async (isOpen: boolean): Promise<void> => {
      const settings = await mockDb.getSystemSettings();
      settings.isShopOpen = isOpen;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
  getBannedUsers: async (): Promise<SpamRecord[]> => {
    const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
    if (!spamStr) return [];
    const records = JSON.parse(spamStr) as SpamRecord[];
    return records.filter(r => r.isBanned);
  },
  unbanUser: async (customerId: string): Promise<void> => {
    const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
    if (spamStr) {
        const records = JSON.parse(spamStr) as SpamRecord[];
        const idx = records.findIndex(r => r.customerId === customerId);
        if (idx !== -1) {
            records[idx].isBanned = false;
            records[idx].strikes = 0; // RESET STRIKES
            localStorage.setItem(STORAGE_KEYS.SPAM, JSON.stringify(records));
        }
    }
  },
  unbanAllUsers: async (): Promise<void> => {
    const spamStr = localStorage.getItem(STORAGE_KEYS.SPAM);
    if (spamStr) {
        const records = JSON.parse(spamStr) as SpamRecord[];
        const updated = records.map(r => ({ ...r, isBanned: false, strikes: 0 })); // RESET ALL
        localStorage.setItem(STORAGE_KEYS.SPAM, JSON.stringify(updated));
    }
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

// Priority: API > Mock
export const db = USE_API ? apiDb : mockDb;

// Initialize the chosen DB
db.init();
