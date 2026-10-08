import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Sparkles, 
  Phone, 
  Mail, 
  Clock, 
  Smile, 
  X, 
  Send, 
  RefreshCw,
  Copy,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  MapPin,
  Calendar,
  Award
} from 'lucide-react';
import { fetchCustomers, generateCustomerReminder, fetchSales, deleteCustomer, sendWhatsAppMessage } from '../lib/api';
import { Customer, Sale } from '../types';
import CustomerFormModal from './CustomerFormModal';
import { useNotifications } from './NotificationManager';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState<'All' | 'Regular' | 'VIP' | 'Wholesale' | 'ACTIVE' | 'INACTIVE'>('All');

  // Customer form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Unified Profile & Engagement Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [reminderText, setReminderText] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const { triggerNotification } = useNotifications();

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, salesData] = await Promise.all([
        fetchCustomers(),
        fetchSales()
      ]);
      setCustomers(customersData);
      setSales(salesData);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Sync Failed', 'Failed to reload customer profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProfile = (c: Customer) => {
    setSelectedCustomer(c);
    // Filter sales history for this customer
    const filteredSales = sales.filter(s => s.customerId === c.id || s.customerName.toLowerCase() === c.name.toLowerCase());
    setCustomerSales(filteredSales);
    setReminderText('');
    setSent(false);
    setCopied(false);
    setProfileModalOpen(true);
  };

  const handleTriggerReminder = async () => {
    if (!selectedCustomer) return;
    setReminderLoading(true);
    setSent(false);
    setCopied(false);

    try {
      const text = await generateCustomerReminder(selectedCustomer.id);
      setReminderText(text);
    } catch (err) {
      console.error(err);
      setReminderText('Failed to generate automatic message. Please check server connections.');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedCustomer || !reminderText) return;

    const rawPhone = selectedCustomer.whatsapp || selectedCustomer.phone;
    if (!rawPhone) {
      triggerNotification('error', 'Transmission Failed', 'Customer WhatsApp number not found.');
      return;
    }

    // Clean phone number: remove spaces, (), +, -, other unwanted characters
    const cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');

    // Validate the number
    if (!cleaned || cleaned.length < 10) {
      triggerNotification('error', 'Transmission Failed', 'Customer does not have a valid WhatsApp number.');
      return;
    }

    // Convert into international format if necessary (e.g. if exactly 10 digits, prefix with 91 for India)
    const formattedPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;

    setSent(true);

    try {
      // Record in communication history
      const res = await sendWhatsAppMessage(selectedCustomer.id, reminderText);
      
      // Update selectedCustomer in local state
      setSelectedCustomer(prev => {
        if (!prev) return null;
        const currentHistory = prev.communicationHistory || [];
        return {
          ...prev,
          communicationHistory: [res.historyItem, ...currentHistory]
        };
      });

      // Update customers list in local state
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomer.id) {
          const currentHistory = c.communicationHistory || [];
          return {
            ...c,
            communicationHistory: [res.historyItem, ...currentHistory]
          };
        }
        return c;
      }));

      // Open WhatsApp Link (Frontend deep link)
      const encoded = encodeURIComponent(reminderText);
      const waLink = `https://wa.me/${formattedPhone}?text=${encoded}`;
      window.open(waLink, '_blank', 'noopener,noreferrer');

      triggerNotification('success', 'Transmission Succeeded', 'WhatsApp opened successfully.');
    } catch (err: any) {
      console.error(err);
      // Fallback: Still open WhatsApp link even if recording history fails
      const encoded = encodeURIComponent(reminderText);
      const waLink = `https://wa.me/${formattedPhone}?text=${encoded}`;
      window.open(waLink, '_blank', 'noopener,noreferrer');
      
      triggerNotification('success', 'Transmission Succeeded', 'WhatsApp opened successfully.');
    } finally {
      setSent(false);
    }
  };

  // Predefined marketing campaigns helpers
  const handleLoadTemplate = (type: 'BFCM' | 'FESTIVE' | 'LOYALTY') => {
    if (!selectedCustomer) return;
    let template = '';
    if (type === 'BFCM') {
      template = `Hi ${selectedCustomer.name}!\n\nOur exclusive Clearance Flash Sale is LIVE! Enjoy a flat 20% discount on all household groceries and staples. Use code FLASH20 at counter billing.\n\nOnly valid for 48 hours!\n\nBest, VyaparaMitra Team`;
    } else if (type === 'FESTIVE') {
      template = `Namaste ${selectedCustomer.name}!\n\nCelebrate the upcoming festive season with your family. We've compiled a special Festive Biryani grocery combo with a flat ₹150 discount code: SHUBH150.\n\nShow this at checkout to claim.`;
    } else {
      template = `Hi ${selectedCustomer.name}!\n\nThank you for being a Gold Patron with us. We've credited 500 loyalty points directly to your phone. Claim code: LOYAL500 on your next visit.\n\nWarm regards,\nVyaparaMitra Team`;
    }
    setReminderText(template);
  };

  // Add & Edit Customer Actions
  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setCustomerToEdit(c);
    setIsFormOpen(true);
  };

  const handleSaveCustomer = () => {
    loadData();
    triggerNotification(
      'success',
      customerToEdit ? 'Profile Updated' : 'Customer Registered',
      `Customer details saved successfully in CRM records.`
    );
  };

  const handleDeleteClick = async (c: Customer) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to delete "${c.name}"?\n\nThis will permanently remove this customer from the database. This action is irreversible.`);
    if (!confirmDelete) return;

    try {
      await deleteCustomer(c.id);
      triggerNotification('success', 'Customer Deleted', `${c.name} was successfully removed.`);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete customer');
    }
  };

  const handleGenerateInvoice = (c: Customer) => {
    localStorage.setItem('vm_billing_preset', JSON.stringify({ name: c.name, phone: c.phone }));
    window.location.hash = 'invoices';
    triggerNotification('info', 'Billing Selected', `Redirecting to invoice billing for ${c.name}...`);
  };

  // KPIs
  const totalCount = customers.length;
  const activeCount = customers.filter(c => c.status === 'ACTIVE').length;
  const inactiveCount = customers.filter(c => c.status === 'INACTIVE').length;

  // CLV and Tiers helper
  const getCustomerTier = (purchases: number) => {
    if (purchases >= 15000) return { label: 'Prestige VIP', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (purchases >= 5000) return { label: 'Gold Patron', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Regular Shopper', color: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  // Attrition Risk Alert calculation
  const lapsingHighValueCustomers = customers.filter(c => c.status === 'INACTIVE' && c.totalPurchases >= 5000);

  // Filter & Search Implementation
  const filteredCustomers = customers.filter(c => {
    // Search by Customer Name, Customer ID, Phone, Email
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.id.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    let matchesCrm = true;
    if (crmFilter === 'Regular') {
      matchesCrm = c.customerType === 'Regular' || !c.customerType;
    } else if (crmFilter === 'VIP') {
      matchesCrm = c.customerType === 'VIP';
    } else if (crmFilter === 'Wholesale') {
      matchesCrm = c.customerType === 'Wholesale';
    } else if (crmFilter === 'ACTIVE') {
      matchesCrm = c.status === 'ACTIVE';
    } else if (crmFilter === 'INACTIVE') {
      matchesCrm = c.status === 'INACTIVE';
    }

    return matchesSearch && matchesCrm;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Advanced Customer Relationship Management</h1>
          <p className="text-xs text-slate-400">Track Customer Lifetime Value (CLV), inspect order histories, auto-detect inactive clients, and dispatch AI re-engagement campaigns</p>
        </div>
        <button
          onClick={handleOpenAddCustomer}
          id="btn-add-customer"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          ➕ Add Customer
        </button>
      </div>

      {/* Lapsing Warning Alert Banner */}
      {lapsingHighValueCustomers.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-900">High-Value Retention Risk Identified</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              We identified <strong>{lapsingHighValueCustomers.length} high-value customers</strong> (CLV &gt; ₹5,000) currently in the <strong>Inactive</strong> window. It is highly recommended to click on them to generate a personalized re-engagement discount code immediately.
            </p>
          </div>
        </div>
      )}

      {/* Roster KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Client Roster</span>
            <h3 className="text-xl font-bold text-slate-800 font-sans">{totalCount} customers</h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Shoppers</span>
            <h3 className="text-xl font-bold text-slate-800 font-sans">{activeCount} clients</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Smile className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Inactive (Lapsed &gt;45 Days)</span>
            <h3 className="text-xl font-bold text-slate-800 font-sans">{inactiveCount} clients</h3>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID (e.g. CUS0001), phone, email..."
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-700 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-150 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Dynamic Category/Status CRM Filters */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {([
            { id: 'All', label: 'All' },
            { id: 'Regular', label: 'Regular' },
            { id: 'VIP', label: 'VIP' },
            { id: 'Wholesale', label: 'Wholesale' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'INACTIVE', label: 'Inactive' }
          ] as const).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCrmFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                crmFilter === filter.id 
                  ? 'bg-blue-600 text-white shadow-xs border-blue-600' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Registry List */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Syncing registered ledger...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">No customers found in directory.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-4">Customer ID</th>
                  <th className="px-5 py-4">Customer Name</th>
                  <th className="px-5 py-4">Phone Number</th>
                  <th className="px-5 py-4">Customer Type</th>
                  <th className="px-5 py-4">Last Purchase</th>
                  <th className="px-5 py-4">Total Purchases</th>
                  <th className="px-5 py-4">Loyalty Points</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const points = c.loyaltyPoints ?? Math.round(c.totalPurchases / 10);
                  const isGoldOrVip = c.customerType === 'VIP' || c.customerType === 'Wholesale';
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => handleOpenProfile(c)}
                      className="hover:bg-slate-50/50 transition cursor-pointer group"
                    >
                      {/* Customer ID */}
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">
                        {c.id}
                      </td>

                      {/* Customer Name */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1">
                          <span>{c.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition -translate-x-1 group-hover:translate-x-0" />
                        </div>
                        {c.registrationDate ? (
                          <div className="text-[9px] text-slate-400">Registered: {new Date(c.registrationDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</div>
                        ) : (
                          <div className="text-[9px] text-slate-400">Joined: {new Date(c.lastVisit).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</div>
                        )}
                      </td>

                      {/* Phone Number */}
                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{c.phone}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{c.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer Type */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          c.customerType === 'VIP'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : c.customerType === 'Wholesale'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {c.customerType || 'Regular'}
                        </span>
                      </td>

                      {/* Last Purchase */}
                      <td className="px-5 py-4 text-slate-500">
                        {c.visitCount > 0 ? (
                          <>
                            <div>{new Date(c.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{new Date(c.lastVisit).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No sales yet</span>
                        )}
                      </td>

                      {/* Total Purchases */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        ₹{c.totalPurchases.toLocaleString('en-IN')}
                        {c.visitCount > 0 && (
                          <div className="text-[9px] text-slate-400 font-sans font-normal">{c.visitCount} orders</div>
                        )}
                      </td>

                      {/* Loyalty Points */}
                      <td className="px-5 py-4 font-mono font-extrabold text-indigo-600">
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{points} pts</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {c.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Profile History */}
                          <button 
                            onClick={() => handleOpenProfile(c)}
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 transition"
                            title="View Profile & Purchase History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Customer */}
                          <button 
                            onClick={() => handleOpenEditCustomer(c)}
                            className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-lg border border-slate-200 hover:border-amber-200 transition"
                            title="Edit Profile details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Generate Invoice */}
                          <button 
                            onClick={() => handleGenerateInvoice(c)}
                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-200 transition"
                            title="Generate Invoice (New Sale)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Customer */}
                          <button 
                            onClick={() => handleDeleteClick(c)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition"
                            title="Delete Customer Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rich Customer Registration/Edit Modal Form */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />

      {/* Unified Profile, Purchase History & AI Campaign Dialog */}
      <AnimatePresence>
        {profileModalOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-150 shadow-xl flex flex-col md:flex-row h-[85vh] max-h-[700px]"
            >
              {/* Left Column: Loyalty & Purchase timeline (60%) */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 border-r border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm">Customer Profile Overview</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getCustomerTier(selectedCustomer.totalPurchases).color}`}>
                    {getCustomerTier(selectedCustomer.totalPurchases).label}
                  </span>
                </div>

                {/* Profile Stats Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-150 text-center space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Customer Lifetime Value</p>
                    <p className="text-base font-extrabold text-slate-800 font-mono font-semibold">₹{selectedCustomer.totalPurchases.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-150 text-center space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Visits</p>
                    <p className="text-base font-extrabold text-slate-800 font-mono font-semibold">{selectedCustomer.visitCount} visits</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-150 text-center space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Average Order Value</p>
                    <p className="text-base font-extrabold text-slate-800 font-mono font-semibold">₹{Math.round(selectedCustomer.totalPurchases / (selectedCustomer.visitCount || 1))}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Contact & System Ledger Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-600">
                    <p>Name: <strong className="text-slate-800">{selectedCustomer.name}</strong></p>
                    <p>Customer ID: <strong className="text-slate-800 font-mono">{selectedCustomer.id}</strong></p>
                    <p>Phone: <strong className="text-slate-800 font-mono">{selectedCustomer.phone}</strong></p>
                    {selectedCustomer.whatsapp && <p>WhatsApp: <strong className="text-slate-800 font-mono">{selectedCustomer.whatsapp}</strong></p>}
                    <p>Email: <strong className="text-slate-800 font-mono">{selectedCustomer.email || 'None'}</strong></p>
                    <p>Customer Type: <strong className="text-slate-800">{selectedCustomer.customerType || 'Regular'}</strong></p>
                    {selectedCustomer.gstNumber && <p>GST Number: <strong className="text-slate-800 font-mono uppercase">{selectedCustomer.gstNumber}</strong></p>}
                    <p>Preferred Language: <strong className="text-slate-800">{selectedCustomer.preferredLanguage || 'English'}</strong></p>
                    <p>Preferred Payment: <strong className="text-slate-800">{selectedCustomer.preferredPaymentMethod || 'CASH'}</strong></p>
                    <p>Gender / DOB: <strong className="text-slate-800">{selectedCustomer.gender || 'Other'} {selectedCustomer.dob ? `(${selectedCustomer.dob})` : ''}</strong></p>
                  </div>

                  {/* Address sub-block if present */}
                  {(selectedCustomer.doorNumber || selectedCustomer.street || selectedCustomer.city) && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <p className="font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Postal Address:
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans leading-normal pl-4">
                        {[
                          selectedCustomer.doorNumber,
                          selectedCustomer.street,
                          selectedCustomer.area,
                          selectedCustomer.city,
                          selectedCustomer.district,
                          selectedCustomer.state,
                          selectedCustomer.pincode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedCustomer.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="font-semibold text-slate-700">Remarks / CRM Notes:</p>
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-1 italic leading-normal">
                        "{selectedCustomer.notes}"
                      </p>
                    </div>
                  )}

                  {/* Communication History */}
                  <div className="pt-2.5 border-t border-slate-150 space-y-2">
                    <p className="font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Communication History ({selectedCustomer.communicationHistory?.length || 0})
                    </p>
                    
                    {!selectedCustomer.communicationHistory || selectedCustomer.communicationHistory.length === 0 ? (
                      <p className="text-[11px] text-slate-400 bg-slate-50/50 p-2.5 border border-dashed border-slate-200 rounded-lg text-center italic">
                        No messages sent yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedCustomer.communicationHistory.map((comm: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                            <div className="flex justify-between items-center text-[9px] text-slate-400">
                              <span>{comm.date} • {comm.time}</span>
                              <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-sm uppercase tracking-wider text-[8px] border border-emerald-150">
                                {comm.status || 'SENT'}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-normal font-sans whitespace-pre-wrap">{comm.message}</p>
                            <p className="text-[8px] text-slate-400 font-mono flex justify-between">
                              <span>Phone: {comm.phone}</span>
                              {comm.providerResponse && <span>{comm.providerResponse}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chronological Sales Timeline */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    Chronological Purchase History ({customerSales.length} items)
                  </h4>
                  
                  {customerSales.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 bg-white">
                      No transactional sales found for this customer.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[25vh] overflow-y-auto pr-1">
                      {customerSales.map((sale) => (
                        <div key={sale.id} className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 font-mono">{sale.invoiceNumber}</span>
                            <span className="text-slate-400 text-[10px]">{new Date(sale.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          
                          {/* Products line breakdown */}
                          <div className="divide-y divide-slate-50">
                            {sale.products.map((p, pIdx) => (
                              <div key={pIdx} className="flex justify-between py-1 text-[11px] text-slate-600">
                                <span>{p.name} (x{p.quantity})</span>
                                <span className="font-mono text-slate-700">₹{p.total}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-800">
                            <span>Grand Total:</span>
                            <span className="font-mono text-blue-600">₹{sale.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Re-engagement & SMS Draft (40%) */}
              <div className="w-full md:w-[360px] p-6 flex flex-col justify-between space-y-4 bg-slate-50 border-t md:border-t-0 border-slate-200 font-sans">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <h4 className="text-xs font-bold text-slate-800">AI Re-Engagement Panel</h4>
                    </div>
                    <button 
                      onClick={() => setProfileModalOpen(false)}
                      className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Generate highly persuasive marketing drafts tuned to their purchase patterns. Drag pre-defined templates or invoke Gemini live:
                  </p>

                  {/* Predefined Coupon templates */}
                  <div className="flex flex-wrap gap-1.5">
                    <button 
                      onClick={() => handleLoadTemplate('BFCM')}
                      className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-150 text-[10px] font-semibold text-slate-600 hover:text-blue-600 rounded-lg transition"
                    >
                      Clearance 20%
                    </button>
                    <button 
                      onClick={() => handleLoadTemplate('FESTIVE')}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-150 text-[10px] font-semibold text-slate-600 hover:text-emerald-600 rounded-lg transition"
                    >
                      Festive Combo
                    </button>
                    <button 
                      onClick={() => handleLoadTemplate('LOYALTY')}
                      className="px-2 py-1 bg-white hover:bg-purple-50 border border-slate-150 text-[10px] font-semibold text-slate-600 hover:text-purple-600 rounded-lg transition"
                    >
                      Patron Bonus
                    </button>
                  </div>

                  {/* Gemini Trigger button */}
                  <button
                    onClick={handleTriggerReminder}
                    disabled={reminderLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider"
                  >
                    {reminderLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Prompting Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        Invoke Personalized Copilot
                      </>
                    )}
                  </button>

                  {/* SMS Mock screen */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Interactive Smartphone Mock</span>
                    <div className="bg-slate-900 rounded-2xl p-3 border-4 border-slate-700 shadow-md h-52 flex flex-col justify-between">
                      <div className="w-12 h-3 bg-slate-700 rounded-full mx-auto shrink-0"></div>
                      
                      <div className="flex-1 overflow-y-auto mt-2 text-[9px] leading-relaxed text-white space-y-2">
                        {reminderLoading ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-1 text-slate-400">
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            <span>Crafting tailored draft...</span>
                          </div>
                        ) : reminderText ? (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tl-none whitespace-pre-wrap font-sans"
                          >
                            {reminderText}
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-center font-light px-4">
                            Click 'Invoke Copilot' or select a template to build a draft SMS.
                          </div>
                        )}
                      </div>

                      {reminderText && !reminderLoading && (
                        <div className="flex gap-1 justify-end shrink-0 mt-1">
                          <button 
                            onClick={handleCopy}
                            className="p-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                            title="Copy SMS text"
                          >
                            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={handleSendWhatsApp}
                            disabled={sent}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-bold transition flex items-center gap-1 text-[8px]"
                          >
                            {sent ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-2.5 h-2.5" />
                                Send
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer close button */}
                <button 
                  onClick={() => setProfileModalOpen(false)}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Close Profile Center
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
