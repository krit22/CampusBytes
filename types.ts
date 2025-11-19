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
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  token: string; // e.g., R-042
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