
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, doc, 
  onSnapshot, query, where, orderBy, getDocs 
} from 'firebase/firestore';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { MenuItem, Order, OrderStatus, PaymentStatus, User } from '../types';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Safely access environment variables
// We use optional chaining (import.meta.env?.) to prevent crashes if env is undefined
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app, firestore: any, auth: any, provider: any;

try {
    // Only initialize if API key is present
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();
    } else {
        // Use a subtle log instead of a warning to avoid noise in Demo Mode
        console.log("Firebase config not found. App will run in Mock Mode.");
    }
} catch (e) {
    console.error("Firebase Init Failed:", e);
}

// ------------------------------------------------------------------
// MENU DATA (V1 Hardcoded)
// ------------------------------------------------------------------
const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Campus Burger', description: 'Classic chicken patty with cheese & special sauce', price: 85, category: 'Burgers', isAvailable: true },
  { id: 'm2', name: 'Veggie Delight', description: 'Spicy potato patty with fresh lettuce', price: 65, category: 'Burgers', isAvailable: true },
  { id: 'm3', name: 'Masala Fries', description: 'Crispy fries tossed in peri-peri masala', price: 50, category: 'Sides', isAvailable: true },
  { id: 'm4', name: 'Cold Coffee', description: 'Thick blend with vanilla ice cream', price: 70, category: 'Beverages', isAvailable: true },
  { id: 'm5', name: 'Masala Chai', description: 'Hot spiced tea, perfect for breaks', price: 20, category: 'Beverages', isAvailable: true },
  { id: 'm6', name: 'Egg Roll', description: 'Double egg roll with spicy chutney', price: 60, category: 'Wraps', isAvailable: true },
];

// ------------------------------------------------------------------
// DATABASE ADAPTER
// ------------------------------------------------------------------
export const firebaseDb = {
  init: () => {
    if (!app) console.log("Firebase not active.");
  },

  // --- AUTH ---
  login: async (userData?: Partial<User>): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    
    return {
      id: fbUser.uid,
      name: fbUser.displayName || 'Student',
      email: fbUser.email || '',
      avatar: fbUser.photoURL || ''
    };
  },

  logout: async () => {
    if (auth) await signOut(auth);
  },

  getCurrentUser: (): User | null => {
    if (!auth) return null;
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return {
      id: fbUser.uid,
      name: fbUser.displayName || 'Student',
      email: fbUser.email || '',
      avatar: fbUser.photoURL || ''
    };
  },

  // --- DATA ---
  getMenu: async (): Promise<MenuItem[]> => {
    return INITIAL_MENU;
  },

  getOrders: async (): Promise<Order[]> => {
    if (!firestore) return [];
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    if (!firestore) return [];
    const q = query(
      collection(firestore, 'orders'), 
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  },
  
  getOrderById: async (id: string): Promise<Order | null> => {
    return null; 
  },

  createOrder: async (user: User, items: any[], total: number, paymentMethod: 'CASH' | 'UPI'): Promise<Order> => {
    if (!firestore) throw new Error("Firestore not initialized");

    const token = `R-${Math.floor(Math.random() * 900) + 100}`;
    
    const newOrderData = {
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

    const docRef = await addDoc(collection(firestore, 'orders'), newOrderData);
    return { id: docRef.id, ...newOrderData } as Order;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, { 
      status, 
      updatedAt: Date.now() 
    });
  },

  updatePaymentStatus: async (orderId: string, status: PaymentStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, { 
      paymentStatus: status,
      updatedAt: Date.now() 
    });
  },

  // --- REALTIME SUBSCRIPTION ---
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    if (!firestore) return () => {};

    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      callback(orders);
    });

    return unsubscribe;
  }
};
