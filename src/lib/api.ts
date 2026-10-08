import { Product, Customer, Sale, Invoice, DashboardStats, Expense } from '../types';

const API_BASE = ''; // Same host since Vite proxies or serves natively

// Helper wrapper to append Bearer token automatically for user scoping
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('vm_token') || sessionStorage.getItem('vm_token');
  const headers = {
    ...options.headers,
  } as Record<string, string>;
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export async function fetchStats(): Promise<{
  stats: DashboardStats;
  charts: {
    weeklyTrend: Array<{ date: string; rawDate: string; revenue: number; profit: number }>;
    categoryDistribution: Array<{ name: string; value: number }>;
  };
  lowStockProducts: Product[];
  recentSales: Sale[];
}> {
  const res = await apiFetch(`${API_BASE}/api/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function addProduct(product: Partial<Product>): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
}

export async function editProduct(id: string, product: Partial<Product>): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await apiFetch(`${API_BASE}/api/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function addCustomer(customer: Partial<Customer>): Promise<Customer> {
  const res = await apiFetch(`${API_BASE}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add customer');
  }
  return res.json();
}

export async function editCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
  const res = await apiFetch(`${API_BASE}/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update customer');
  }
  return res.json();
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/customers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete customer');
  }
}

export async function generateCustomerReminder(id: string): Promise<string> {
  const res = await apiFetch(`${API_BASE}/api/customers/${id}/reminder`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate customer reminder');
  const data = await res.json();
  return data.reminderText;
}

export async function fetchSales(): Promise<Sale[]> {
  const res = await apiFetch(`${API_BASE}/api/sales`);
  if (!res.ok) throw new Error('Failed to fetch sales history');
  return res.json();
}

export async function createSale(saleData: {
  customerName: string;
  customerPhone?: string;
  products: Array<{ productId: string; quantity: number }>;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'DUE' | 'SPLIT';
  discountCode?: string;
  splitDetails?: { cash: number; upi: number };
}): Promise<{ sale: Sale; invoice: Invoice }> {
  const res = await apiFetch(`${API_BASE}/api/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  if (!res.ok) throw new Error('Failed to submit sale');
  return res.json();
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await apiFetch(`${API_BASE}/api/invoices`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export interface MitraChatResponse {
  responseText: string;
  storeId?: string;
  storeName?: string;
}

export async function sendMitraMessage(
  message: string,
  history: Array<{ role: 'user' | 'model'; content: string }>
): Promise<MitraChatResponse> {
  const res = await apiFetch(`${API_BASE}/api/mitra/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Failed to get response from Mitra AI');
  return res.json();
}

export async function fetchMitraSummary(): Promise<{
  storeId: string;
  storeName: string;
  businessType: string;
  ownerName: string;
  totalProducts: number;
  lowStockCount: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
  activeCustomers: number;
  unpaidDues: number;
  totalExpenses: number;
}> {
  const res = await apiFetch(`${API_BASE}/api/mitra/summary`);
  if (!res.ok) throw new Error('Failed to fetch Mitra AI store summary');
  return res.json();
}

export async function sendCopilotMessage(
  message: string,
  history: Array<{ role: 'user' | 'model'; content: string }>
): Promise<string> {
  const data = await sendMitraMessage(message, history);
  return data.responseText;
}

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await apiFetch(`${API_BASE}/api/expenses`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function addExpense(expense: Partial<Expense>): Promise<Expense> {
  const res = await apiFetch(`${API_BASE}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error('Failed to record expense');
  return res.json();
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function sendWhatsAppMessage(customerId: string, message: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/api/customers/${customerId}/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to send WhatsApp message');
  }
  return res.json();
}

export async function fetchInventoryRecommendations(): Promise<any[]> {
  const res = await apiFetch(`${API_BASE}/api/inventory/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch inventory recommendations');
  const data = await res.json();
  return data.recommendations;
}

export async function generateBusinessReport(reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY'): Promise<string> {
  const res = await apiFetch(`${API_BASE}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reportType }),
  });
  if (!res.ok) throw new Error('Failed to generate business report');
  const data = await res.json();
  return data.reportMarkdown;
}

export async function resetDatabase(): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/db/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset database');
}

export interface BusinessMetadata {
  businessType: string;
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  gstNumber?: string;
  currency: string;
  language: string;
  employees: number;
  email?: string;
  logo?: string;
  setupCompleted: boolean;
  customProducts?: Array<{ name: string; category: string; price: number; unit: string; minStock: number }>;
}

export async function fetchMetadata(): Promise<BusinessMetadata> {
  const res = await apiFetch(`${API_BASE}/api/metadata`);
  if (!res.ok) throw new Error('Failed to fetch business metadata');
  return res.json();
}

export async function setupBusiness(config: Omit<BusinessMetadata, 'setupCompleted'> & { customProducts?: any[] }): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/metadata/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to execute business setup');
}

// ----------------------------------------------------
// CUSTOMER ENGAGEMENT AGENT API CALLS
// ----------------------------------------------------

export interface EngagementCampaign {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: string;
  reason: string;
  generatedMessage: string;
  status: 'PENDING' | 'SENT' | 'DISMISSED';
  createdAt: string;
  sentAt: string | null;
}

export interface EngagementDashboardData {
  metrics: {
    totalCustomers: number;
    inactiveCustomers: number;
    messagesGeneratedToday: number;
    pendingApproval: number;
    messagesSent: number;
    estimatedRevenueRecovery: number;
    highRiskCustomers: number;
  };
  insights: string[];
  queue: EngagementCampaign[];
}

export async function fetchEngagementDashboard(): Promise<EngagementDashboardData> {
  const res = await apiFetch(`${API_BASE}/api/engagement/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch engagement dashboard data');
  return res.json();
}

export async function runEngagementScan(): Promise<{ success: boolean; generatedCount: number; items: EngagementCampaign[] }> {
  const res = await apiFetch(`${API_BASE}/api/engagement/generate-queue`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to run customer engagement analysis scan');
  return res.json();
}

export async function approveAndSendCampaign(id: string): Promise<{ success: boolean; item: EngagementCampaign }> {
  const res = await apiFetch(`${API_BASE}/api/engagement/approve-send/${id}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve and send campaign message');
  return res.json();
}

export async function dismissCampaign(id: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`${API_BASE}/api/engagement/dismiss/${id}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to dismiss campaign message');
  return res.json();
}

export async function sendVoiceMessage(message: string, history: Array<{ sender: 'user' | 'assistant'; text: string }>): Promise<{
  responseText: string;
  langCode: string;
  voicePersonality?: string;
  detectedIntent?: string;
  intentPayload?: any;
}> {
  const res = await apiFetch(`${API_BASE}/api/voice/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });
  if (!res.ok) throw new Error('Failed to process voice command');
  return res.json();
}


