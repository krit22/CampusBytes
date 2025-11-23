
export enum OrderStatus {
  NEW = 'NEW',
  COOKING = 'COOKING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export type OrderType = 'DINE_IN' | 'DELIVERY';

export interface DeliveryDetails {
  phoneNumber: string;
  location: string; // e.g., "Hall 1" or "Library"
  instructions: string; // e.g., "Room 202"
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isBestseller?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface SavedAddress {
  type: 'HALL' | 'OTHER';
  hallName?: string;
  roomNo?: string;
  customLocation?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  savedAddress?: SavedAddress;
}

export interface Order {
  id: string;
  token: string; // e.g., R-042
  customerId: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'CASH' | 'UPI';
  orderType: OrderType;
  deliveryDetails?: DeliveryDetails;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface VendorAuth {
  isAuthenticated: boolean;
  pin: string;
}

export interface SpamRecord {
  customerId: string;
  customerName: string;
  strikes: number;
  banCount: number; // Track how many times user has been banned to escalate severity
  isBanned: boolean;
  banExpiresAt: number; // timestamp
  banReason: string;
  lastStrikeAt: number;
}

export interface SystemSettings {
  key: string;
  isBanSystemActive: boolean;
  isShopOpen?: boolean;
  vendorPhoneNumber?: string;
}

// Google Identity Services Types
declare global {
  interface Window {
    google: any;
  }
}
