export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  qrCode: string;
  sku: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  profitMargin: number; // percentage, e.g. 35
  gst: number; // percentage, e.g. 18
  supplier: string;
  expiryDate?: string;
  unit: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  minStock: number;

  // Extension fields matching merchant DB requirements
  productName?: string;
  brand?: string;
  purchasePrice?: number;
  stock?: number;
  minimumStock?: number;
  discount?: number;
  supplierContact?: string;
  image?: string;
  description?: string;
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Business Owner' | 'Manager' | 'Employee';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalPurchases: number;
  status: 'ACTIVE' | 'INACTIVE';
  visitCount: number;
  userId?: string;

  // New CRM optional and system-generated fields
  whatsapp?: string;
  gender?: string;
  dob?: string;
  doorNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  customerType?: 'Regular' | 'Wholesale' | 'VIP';
  gstNumber?: string;
  profilePhoto?: string;
  notes?: string;
  preferredLanguage?: string;
  preferredPaymentMethod?: string;
  registrationDate?: string;
  loyaltyPoints?: number;
  communicationHistory?: any[];
}

export interface SaleProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  gstRate?: number;
  gstAmount?: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  products: SaleProduct[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'DUE' | 'SPLIT';
  splitDetails?: { cash: number; card_upi: number };
  userId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  products: SaleProduct[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  userId?: string;
}

export interface Expense {
  id: string;
  category: string; // 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Restocking' | 'Packaging' | 'Marketing' | 'Maintenance' | 'Other'
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  todayOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  topProductsList?: Array<{ name: string; category: string; revenue: number; volume: number }>;
}

