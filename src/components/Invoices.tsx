import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  User, 
  Phone, 
  Plus, 
  Trash2, 
  Sparkles, 
  Printer, 
  ShoppingCart, 
  Layers,
  CheckCircle,
  HelpCircle,
  Download,
  Building,
  BookmarkCheck,
  QrCode,
  Tag,
  CreditCard,
  Percent,
  Barcode,
  Split,
  AlertTriangle,
  Search
} from 'lucide-react';
import { fetchProducts, createSale, fetchInvoices, fetchMetadata, fetchCustomers } from '../lib/api';
import { Product, Invoice, Customer } from '../types';
import { useNotifications } from './NotificationManager';
import CustomerFormModal from './CustomerFormModal';
import { X, Camera } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

interface InvoicesProps {
  preset?: { customerName: string; customerPhone?: string } | null;
  clearPreset?: () => void;
  userRole?: string;
}

export default function Invoices({ preset, clearPreset, userRole }: InvoicesProps) {
  const { triggerNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Business Category Mapping
  const [metadata, setMetadata] = useState<any>(null);

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchMetadata();
        setMetadata(meta);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  // Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'DUE' | 'SPLIT'>('UPI');

  // Coupon / Discount State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Split Payment State
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);

  // Barcode Scanning / Manual search field
  const [barcodeSearchInput, setBarcodeSearchInput] = useState('');
  const [cameraScanOpen, setCameraScanOpen] = useState(false);
  const [manualSearchInput, setManualSearchInput] = useState('');

  // Active build line-items
  const [items, setItems] = useState<Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    category: string;
    gstRate: number;
    gstAmount: number;
    sku: string;
    barcode: string;
  }>>([]);

  // Preset quick barcodes for quick scan simulation
  const quickScanPresets = [
    { name: 'Amul Gold Milk', barcode: '8901262010010' },
    { name: 'Fortune Soya Oil', barcode: '8906007281412' },
    { name: 'Dolo 650mg Tablet', barcode: '8902268015521' },
    { name: 'Red Label Tea', barcode: '8901030753422' },
    { name: 'Garnier Men Face Wash', barcode: '8901526002142' }
  ];

  // Handle Preset props from voice assistant
  useEffect(() => {
    if (preset) {
      setCustName(preset.customerName);
      if (preset.customerPhone) {
        setCustPhone(preset.customerPhone);
      }
      if (clearPreset) {
        clearPreset();
      }
      triggerNotification('info', 'Voice Preset Applied', `Billing draft created for ${preset.customerName}.`);
    }
  }, [preset, clearPreset]);

  // Handle Preset from Customers ledger list navigation
  useEffect(() => {
    const localPreset = localStorage.getItem('vm_billing_preset');
    if (localPreset) {
      try {
        const parsed = JSON.parse(localPreset);
        if (parsed.name) setCustName(parsed.name);
        if (parsed.phone) setCustPhone(parsed.phone);
        localStorage.removeItem('vm_billing_preset');
        triggerNotification('info', 'Customer Loaded', `Billing profile loaded for "${parsed.name}".`);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveNewCustomerFromBilling = (newCust: Customer) => {
    loadData();
    setCustName(newCust.name);
    setCustPhone(newCust.phone);
    setIsFormOpen(false);
    triggerNotification('success', 'Customer Selected', `${newCust.name} registered & selected for bill.`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, invData, custData] = await Promise.all([
        fetchProducts(),
        fetchInvoices(),
        fetchCustomers()
      ]);
      setProducts(prodData);
      setInvoices(invData);
      setAllCustomers(custData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Barcode Look up & scan simulation
  const handleBarcodeSearch = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      triggerNotification('info', 'Input Required', 'Please type a barcode, SKU, or product name first, or click a trial preset below.');
      return;
    }

    // Find product matching barcode, SKU, or name
    let prod = products.find(p => 
      (p.barcode && p.barcode.trim() === trimmed) || 
      (p.sku && p.sku.trim() === trimmed) || 
      p.id === trimmed ||
      p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    
    // Dynamic preset mapping: If they scanned/clicked a mock preset barcode, but it's not in the DB, 
    // map it to a real product in the DB for a seamless simulation experience!
    if (!prod) {
      const presetIndex = quickScanPresets.findIndex(p => p.barcode === trimmed);
      if (presetIndex !== -1 && products.length > 0) {
        const mappedProduct = products[presetIndex % products.length];
        prod = {
          ...mappedProduct,
          barcode: trimmed, // override barcode for matching
        };
      }
    }

    if (prod) {
      if (prod.quantity <= 0) {
        triggerNotification('error', 'Out of Stock', `${prod.name} is currently out of stock!`);
        return;
      }

      const existing = items.find(item => item.productId === prod.id);
      if (existing) {
        if (prod.quantity <= existing.quantity) {
          triggerNotification('error', 'Stock Limit Reached', `Only ${prod.quantity} units of ${prod.name} are available.`);
          return;
        }
        setItems(items.map(item => 
          item.productId === prod.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1, 
                total: (item.quantity + 1) * item.price,
                gstAmount: Math.round(((item.quantity + 1) * item.price) * (item.gstRate / 100))
              }
            : item
        ));
      } else {
        setItems([...items, {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          price: prod.sellingPrice,
          total: prod.sellingPrice,
          category: prod.category,
          gstRate: prod.gst || 12,
          gstAmount: Math.round(prod.sellingPrice * ((prod.gst || 12) / 100)),
          sku: prod.sku || '',
          barcode: prod.barcode || ''
        }]);
      }
      
      triggerNotification('success', 'Product Scanned', `Added 1x ${prod.name} to billing cart.`);
    } else {
      triggerNotification('error', 'Scan Unrecognized', `No registered item matching code or SKU "${trimmed}" found.`);
    }
    setBarcodeSearchInput('');
  };

  const handleAddSelectProduct = (productId: string, qty: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.quantity < qty) {
      triggerNotification('info', 'Low Stock Warning', `Only ${prod.quantity} units of ${prod.name} remaining in inventory.`);
    }

    const existing = items.find(item => item.productId === productId);
    if (existing) {
      const newQty = existing.quantity + qty;
      setItems(items.map(item => 
        item.productId === productId 
          ? { 
              ...item, 
              quantity: newQty, 
              total: newQty * item.price,
              gstAmount: Math.round((newQty * item.price) * (item.gstRate / 100))
            }
          : item
      ));
    } else {
      setItems([...items, {
        productId: prod.id,
        name: prod.name,
        quantity: qty,
        price: prod.sellingPrice,
        total: qty * prod.sellingPrice,
        category: prod.category,
        gstRate: prod.gst || 12,
        gstAmount: Math.round((qty * prod.sellingPrice) * ((prod.gst || 12) / 100)),
        sku: prod.sku || '',
        barcode: prod.barcode || ''
      }]);
    }
    triggerNotification('success', 'Cart Updated', `Added ${prod.name} to your draft.`);
  };

  const handleRemoveItem = (prodId: string) => {
    setItems(items.filter(item => item.productId !== prodId));
    triggerNotification('info', 'Item Removed', 'Product cleared from checkout roster.');
  };

  // Coupons / Promotion check
  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.toUpperCase().trim();
    if (!code) return;

    const sub = calculateSubtotal();
    if (code === 'WELCOMEBACK15' || code === 'FESTIVE15') {
      setAppliedDiscount(Math.round(sub * 0.15));
      triggerNotification('success', 'Coupon Applied', 'Loyalty coupon WELCOMEBACK15 claims 15% off.');
    } else if (code === 'VYAPARA20') {
      setAppliedDiscount(Math.round(sub * 0.20));
      triggerNotification('success', 'Coupon Applied', 'SaaS launch promo VYAPARA20 claims 20% off.');
    } else if (code === 'WELCOME10') {
      setAppliedDiscount(Math.round(sub * 0.10));
      triggerNotification('success', 'Coupon Applied', 'Welcome discount of 10% applied.');
    } else {
      setCouponError('Invalid promo or coupon code');
    }
  };

  // Calculations
  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.total, 0);
  const calculateTaxTotal = () => items.reduce((sum, item) => sum + item.gstAmount, 0);
  const calculateGrandTotal = () => Math.max(0, calculateSubtotal() + calculateTaxTotal() - appliedDiscount);

  // Sync split details
  useEffect(() => {
    if (paymentMethod === 'SPLIT') {
      const grandTotal = calculateGrandTotal();
      setSplitCash(Math.round(grandTotal * 0.4));
      setSplitUpi(Math.round(grandTotal * 0.6));
    }
  }, [paymentMethod, items, appliedDiscount]);

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) {
      alert('Please enter a Customer Name');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to generate an invoice');
      return;
    }

    try {
      const splitDetails = paymentMethod === 'SPLIT' ? { cash: splitCash, upi: splitUpi } : undefined;
      
      const response = await createSale({
        customerName: custName,
        customerPhone: custPhone || '+91 99999 99999',
        products: items,
        paymentMethod,
        discountCode: couponCode || undefined,
        splitDetails
      });

      // Reset form on success
      setCustName('');
      setCustPhone('');
      setItems([]);
      setCouponCode('');
      setAppliedDiscount(0);
      
      triggerNotification('milestone', 'Invoice Registered!', `VM-${response.invoice.invoiceNumber || 'NEW'} has been successfully printed & saved.`);
      loadData();
      
      // Trigger thermal-style print of the receipt preview panel
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Failed to submit transaction');
    }
  };

  const getHSNCode = (category: string) => {
    switch(category) {
      case 'Grocery': return '0401';
      case 'Pharmacy': return '3004';
      case 'Salon': return '3305';
      case 'Restaurant': return '2106';
      default: return '6203';
    }
  };

  const activeBranding = {
    name: metadata?.businessName || 'VyaparaMitra Store',
    label: metadata?.businessType || 'General Retail Ledger',
    address: metadata?.address || 'Plot 42, HSR Layout, Bengaluru, KA',
    gstin: metadata?.gstNumber || '29AAABP4211G1Z3'
  };

  const handleDownloadPDFSimulated = () => {
    const link = document.createElement('a');
    const invoiceContent = `====================================\n        ${activeBranding.name.toUpperCase()}\n        GST TAX INVOICE RECEIPT\n====================================\nAddress: ${activeBranding.address}\nGSTIN: ${activeBranding.gstin}\nDate: ${new Date().toLocaleString('en-IN')}\n\nBilled To: ${custName || 'Walk-In Customer'}\nPhone: ${custPhone || '+91 99999 99999'}\n------------------------------------\nLine Items:\n` + 
      items.map(item => `${item.name.padEnd(20)} Qty: ${item.quantity.toString().padEnd(3)} Price: ₹${item.price}\n- Tax (${item.gstRate}%): ₹${item.gstAmount}`).join('\n') + 
      `\n------------------------------------\nSubtotal:           ₹${calculateSubtotal()}\nTotal Tax (GST):    ₹${calculateTaxTotal()}\nPromo Discount:    -₹${appliedDiscount}\n====================================\nGRAND TOTAL:        ₹${calculateGrandTotal()}\n====================================\nPayment Mode: ${paymentMethod}\n${paymentMethod === 'SPLIT' ? `[Breakdown: Cash ₹${splitCash} | UPI ₹${splitUpi}]` : ''}\n\nDhanyavad! Thank you for supporting us!\nPowered by VyaparaMitra Operating System\n====================================`;
    
    const file = new Blob([invoiceContent], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = `VyaparaMitra_Invoice_${custName || 'WalkIn'}.txt`;
    link.click();
    triggerNotification('success', 'Draft Saved', 'Plaintext receipt downloaded to your desktop.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            width: 80mm;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
            background: white;
            color: black;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Professional Billing Terminal</h1>
          <p className="text-xs text-slate-400">Compile GST-ready receipts, scan barcodes, and generate commercial thermal invoices</p>
        </div>

        {/* Dynamic Active Business Badge */}
        {metadata && (
          <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-100/50 px-3 py-1.5 rounded-xl">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-[10px] uppercase">
              {metadata.businessName[0] || 'V'}
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-800 leading-tight">{metadata.businessName}</h4>
              <p className="text-[9px] text-blue-600 font-semibold uppercase mt-0.5 tracking-wider">{metadata.businessType}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Interactive Invoice Builder */}
        <div id="invoice-builder-panel" className="glass-card rounded-2xl p-5 space-y-6">
          
          {/* Barcode Scanner simulator row */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-inner relative overflow-hidden">
            <div className="absolute right-3 top-3 text-blue-500 opacity-20">
              <Barcode className="w-12 h-12" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Barcode/SKU Scan Simulator</h4>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={barcodeSearchInput}
                onChange={(e) => setBarcodeSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch(barcodeSearchInput)}
                placeholder="Type barcode/SKU or click quick simulator below..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 rounded-lg px-3 py-2 outline-none transition font-mono"
              />
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBarcodeSearch(barcodeSearchInput)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                >
                  Scan
                </button>
                <button
                  type="button"
                  onClick={() => setCameraScanOpen(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Live Camera
                </button>
              </div>
            </div>

            {/* Quick Presets simulator */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mock Scan Trials:</p>
              <div className="flex flex-wrap gap-1">
                {quickScanPresets.map(preset => (
                  <button
                    key={preset.barcode}
                    type="button"
                    onClick={() => handleBarcodeSearch(preset.barcode)}
                    className="text-[9px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50 transition cursor-pointer"
                  >
                    🔍 {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitInvoice} className="space-y-5">
            {/* Customer Profile Info & Quick CRM Picker */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Billed Customer Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                >
                  ➕ Register New Customer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                {/* Customer Name Input with Autocomplete Dropdown */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => {
                        setCustName(e.target.value);
                        setShowCustDropdown(true);
                      }}
                      onFocus={() => setShowCustDropdown(true)}
                      placeholder="Type name to search or enter new..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                    />
                    {custName && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustName('');
                          setCustPhone('');
                          setShowCustDropdown(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showCustDropdown && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowCustDropdown(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {(() => {
                          const searchStr = custName.toLowerCase();
                          const matches = allCustomers.filter(
                            c =>
                              c.name.toLowerCase().includes(searchStr) ||
                              c.phone.includes(searchStr)
                          );

                          if (matches.length === 0) {
                            return (
                              <div className="p-3 text-center text-slate-400 text-[10px] italic">
                                No matching profile found. Enter details directly or click "Register New Customer" above.
                              </div>
                            );
                          }

                          return matches.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCustName(c.name);
                                setCustPhone(c.phone);
                                setShowCustDropdown(false);
                                triggerNotification(
                                  'success',
                                  'Customer Loaded',
                                  `${c.name} (${c.customerType || 'Regular'}) loaded to bill.`
                                );
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{c.name}</span>
                                <span className="text-slate-400 text-[10px] font-mono">{c.phone}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                                c.customerType === 'VIP'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                  : c.customerType === 'Wholesale'
                                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                                  : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                {c.customerType || 'Regular'}
                              </span>
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    Customer Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Manual Line Item Selector */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manual Product Selector</span>
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={manualSearchInput}
                    onChange={(e) => setManualSearchInput(e.target.value)}
                    placeholder="Search product by: Name, SKU, Barcode, Category..."
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Pick Product</label>
                    <select
                      id="manual-select"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddSelectProduct(e.target.value, 1);
                          e.target.value = ""; // Reset
                          setManualSearchInput("");
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer"
                    >
                      <option value="" disabled>-- Choose product --</option>
                      {products.filter(p => {
                        const val = manualSearchInput.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(val) ||
                          (p.sku || '').toLowerCase().includes(val) ||
                          (p.barcode || '').toLowerCase().includes(val) ||
                          (p.category || '').toLowerCase().includes(val) ||
                          (p.brand || '').toLowerCase().includes(val)
                        );
                      }).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku || 'No SKU'}) • {p.category} — ₹{p.sellingPrice} (Stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Added Items table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items Added ({items.length})</span>
              
              {items.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Bill queue is empty. Simulate a barcode scan above or manual search.
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl shadow-xs">
                      <div className="space-y-0.5 truncate max-w-[70%]">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                          <span>₹{item.price} x {item.quantity}</span>
                          <span className="bg-slate-100 px-1 py-0.25 rounded text-[8px] font-black uppercase">Tax: {item.gstRate}%</span>
                          <span className="bg-slate-100 px-1 py-0.25 rounded text-[8px] font-bold">HSN: {getHSNCode(item.category)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-800 font-mono">₹{item.total}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coupons / Promotion Input */}
            <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-slate-400" />
                Apply Coupon / Promotion Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="WELCOMEBACK15, VYAPARA20, FESTIVE15"
                  className="flex-1 bg-white border border-slate-200 focus:border-blue-500 text-xs rounded-xl px-3 py-2 outline-none transition uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Verify
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] font-bold text-red-500">{couponError}</p>
              )}
              {appliedDiscount > 0 && (
                <p className="text-[10px] font-black text-emerald-600">✓ Discount of ₹{appliedDiscount} successfully calculated.</p>
              )}
            </div>

            {/* Payment Method picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Payment Method
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['UPI', 'CASH', 'CARD', 'DUE', 'SPLIT'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-[10px] font-black tracking-wider transition border cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Payment inputs if SPLIT chosen */}
            {paymentMethod === 'SPLIT' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-blue-700">
                  <Split className="w-4 h-4" />
                  <span className="text-xs font-bold">Split Payment Allocations</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Cash Amount</label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitCash(val);
                        setSplitUpi(Math.max(0, calculateGrandTotal() - val));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">UPI/Card Amount</label>
                    <input
                      type="number"
                      value={splitUpi}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitUpi(val);
                        setSplitCash(Math.max(0, calculateGrandTotal() - val));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-blue-600 font-bold text-center">
                  Allocation Match: Cash (₹{splitCash}) + Digital (₹{splitUpi}) = Total (₹{calculateGrandTotal()})
                </p>
              </motion.div>
            )}

            {/* Bill action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPDFSimulated}
                disabled={items.length === 0}
                className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 disabled:text-slate-300 font-bold py-3.5 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Draft Layout
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 text-white disabled:text-slate-300 font-bold py-3.5 rounded-xl text-xs shadow-md disabled:shadow-none transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print & Submit
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Thermal Paper Preview Template */}
        <div id="invoice-preview-panel" className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200 shadow-inner">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">GST Tax Invoice Sheet Preview</span>

          {/* Actual Invoice Sheet (Styled like 80mm high-contrast thermal receipt) */}
          <div 
            className="bg-white text-slate-900 rounded-lg shadow-xl p-6 max-w-[80mm] mx-auto relative overflow-hidden border border-slate-200 font-mono text-[10px] leading-relaxed" 
            id="print-area"
          >
            {/* Watermark overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] pointer-events-none opacity-[0.06] select-none text-center">
              <span className={`text-4xl font-black uppercase border-4 px-3 py-1 rounded ${
                paymentMethod === 'DUE' ? 'text-rose-600 border-rose-600' : 'text-emerald-600 border-emerald-600'
              }`}>
                {paymentMethod === 'DUE' ? 'CREDIT DUE' : 'PAID'}
              </span>
            </div>

            {/* Shop Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <div className="flex items-center justify-center gap-1">
                <Building className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">{activeBranding.name}</h4>
              </div>
              <p className="text-[8px] text-slate-500 font-bold">{activeBranding.label}</p>
              <p className="text-[8px] text-slate-400">{activeBranding.address}</p>
              <p className="text-[8px] text-blue-600 font-black uppercase mt-0.5">GSTIN: {activeBranding.gstin}</p>
            </div>

            {/* Meta facts */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[8px] text-slate-500">
              <div className="flex justify-between">
                <span>INVOICE REF:</span>
                <span className="font-bold text-slate-800">VM-TAX-10{10 + invoices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date().toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span>PAY MODE:</span>
                <span className="font-bold text-slate-800">{paymentMethod}</span>
              </div>
              {paymentMethod === 'SPLIT' && (
                <div className="flex justify-between text-[7px] text-slate-400">
                  <span>SPLIT BREAK:</span>
                  <span>Cash: ₹{splitCash} | Digital: ₹{splitUpi}</span>
                </div>
              )}
            </div>

            {/* Client Profile */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[8px] text-slate-500">
              <p className="font-bold text-slate-700">CUSTOMER: {custName || 'Walk-In Patient/Retail Client'}</p>
              <p className="font-bold">PHONE: {custPhone || '+91 99999 99999'}</p>
            </div>

            {/* Items Table */}
            <div className="py-2">
              <div className="grid grid-cols-12 font-bold border-b border-slate-200 pb-1 text-[8px] text-slate-400">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-2 text-right">RATE</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>
              <div className="divide-y divide-slate-100 min-h-[60px]">
                {items.length === 0 ? (
                  <p className="text-center italic text-slate-400 text-[8px] py-4">No line rows added.</p>
                ) : (
                  items.map(item => (
                    <div key={item.productId} className="grid grid-cols-12 py-1.5 text-slate-700 text-[8px]">
                      <div className="col-span-6 font-bold truncate">
                        {item.name}
                        <span className="block font-normal text-[7px] text-slate-400">HSN: {getHSNCode(item.category)} (Tax: {item.gstRate}%)</span>
                      </div>
                      <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                      <span className="col-span-2 text-right">₹{item.price}</span>
                      <span className="col-span-2 text-right font-black">₹{item.total}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculation details */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[8px] text-slate-500">
              <div className="flex justify-between">
                <span>Net Total (Excl. GST):</span>
                <span>₹{calculateSubtotal()}</span>
              </div>
              <div className="flex justify-between">
                <span>Accrued CGST + SGST Tax:</span>
                <span>₹{calculateTaxTotal()}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount Applied:</span>
                  <span>-₹{appliedDiscount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-extrabold text-[10px]">
                <span>GRAND TOTAL (INCL. TAX):</span>
                <span>₹{calculateGrandTotal()}</span>
              </div>
            </div>

            {/* Simulated QR Code for Scan & Pay */}
            <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed border-slate-300 mt-3 space-y-1">
              <div className="p-1 bg-slate-50 border border-slate-200 rounded">
                <QrCode className="w-14 h-14 text-slate-800" />
              </div>
              <p className="text-[6px] text-slate-400 tracking-wider">SCAN TO VERIFY LEDGER AUDIT RECORD</p>
            </div>

            {/* Footer notice */}
            <div className="mt-4 text-center text-[7px] text-slate-400 space-y-0.5">
              <p className="font-bold uppercase tracking-widest text-slate-600 flex items-center justify-center gap-1">
                <BookmarkCheck className="w-3 h-3 text-emerald-500" />
                VyaparaMitra AI POS Receipt
              </p>
              <p className="italic">Dhanyavad! Thank you for your business. Visit again!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Customer profile registration modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveNewCustomerFromBilling}
      />

      {/* Real-time Enterprise Barcode Scanning Modal */}
      {cameraScanOpen && (
        <BarcodeScanner
          products={products}
          mode="billing"
          onScan={(barcode) => {
            handleBarcodeSearch(barcode);
          }}
          onClose={() => setCameraScanOpen(false)}
        />
      )}
    </motion.div>
  );
}
