import React from 'react';
import { OrderStatus, PaymentStatus } from '../types';

interface BadgeProps {
  status: OrderStatus | PaymentStatus;
  type?: 'order' | 'payment';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'order' }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  if (type === 'order') {
    switch (status) {
      case OrderStatus.NEW:
        colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
        break;
      case OrderStatus.COOKING:
        colorClass = 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse';
        break;
      case OrderStatus.READY:
        colorClass = 'bg-green-100 text-green-800 border-green-200';
        break;
      case OrderStatus.DELIVERED:
        colorClass = 'bg-gray-100 text-gray-600 border-gray-200 line-through';
        break;
      case OrderStatus.CANCELLED:
        colorClass = 'bg-red-100 text-red-800 border-red-200';
        break;
    }
  } else {
    switch (status) {
      case PaymentStatus.PAID:
        colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        break;
      case PaymentStatus.PENDING:
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        break;
    }
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}>
      {status}
    </span>
  );
};