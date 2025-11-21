
export enum OrderStatus {
  NEW = 'NEW',
  COOKING = 'COOKING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
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
  isBanned: boolean;
  banExpiresAt: number; // timestamp
  banReason: string;
  lastStrikeAt: number;
}

export interface SystemSettings {
  isBanSystemActive: boolean;
}

// Google Identity Services Types
declare global {
  interface Window {
    google: any;
  }
}
