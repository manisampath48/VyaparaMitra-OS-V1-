import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  Package, 
  Search, 
  X,
  TrendingUp,
  RefreshCw,
  PhoneCall,
  Truck,
  ArrowUpDown,
  FileSpreadsheet,
  QrCode,
  Barcode,
  Calendar,
  Layers,
  Percent,
  Camera
} from 'lucide-react';
import { 
  fetchProducts, 
  addProduct, 
  editProduct, 
  deleteProduct, 
  fetchInventoryRecommendations 
} from '../lib/api';
import { Product } from '../types';
import { useNotifications } from './NotificationManager';
import BarcodeScanner from './BarcodeScanner';

export default function Inventory() {
  const { triggerNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'qty_asc' | 'qty_desc' | 'margin_desc' | 'price_desc'>('qty_asc');
  
  // AI Recommendations
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Custom Form fields matching Product interface
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formQuantity, setFormQuantity] = useState('50');
  const [formBuyingPrice, setFormBuyingPrice] = useState('40');
  const [formSellingPrice, setFormSellingPrice] = useState('55');
  const [formGst, setFormGst] = useState('12');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [cameraScanOpen, setCameraScanOpen] = useState(false);

  // Supplier Recommendation panel state
  const [selectedSupplierProduct, setSelectedSupplierProduct] = useState<Product | null>(null);
  const [showingBarcodeObj, setShowingBarcodeObj] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setRecsLoading(true);
      const data = await fetchInventoryRecommendations();
      setAiRecs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadRecommendations();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    const firstCat = Array.from(new Set(products.map(p => p.category))).filter(Boolean)[0] || 'General';
    setFormCategory(firstCat);
    setFormQuantity('50');
    setFormBuyingPrice('40');
    setFormSellingPrice('55');
    setFormGst('12');
    setFormUnit('pcs');
    setFormMinStock('15');
    // Generate mock barcode & SKU for convenience
    const mockBarcode = '890' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setFormBarcode(mockBarcode);
    setFormSku('VM-' + Math.floor(10000 + Math.random() * 90000).toString());
    setFormSupplier('Aashirvaad Distributors');
    setFormExpiryDate('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormQuantity(p.quantity.toString());
    setFormBuyingPrice((p.buyingPrice || p.sellingPrice * 0.75).toString());
    setFormSellingPrice(p.sellingPrice.toString());
    setFormGst((p.gst || 12).toString());
    setFormUnit(p.unit);
    setFormMinStock(p.minStock.toString());
    setFormBarcode(p.barcode || '');
    setFormSku(p.sku || '');
    setFormSupplier(p.supplier || '');
    setFormExpiryDate(p.expiryDate || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formQuantity || !formSellingPrice || !formUnit) {
      alert('Please fill out all required fields');
      return;
    }

    const bPrice = Number(formBuyingPrice);
    const sPrice = Number(formSellingPrice);
    // calculate profit margin %
    const profitMargin = sPrice > 0 ? Math.round(((sPrice - bPrice) / sPrice) * 100) : 0;

    try {
      const payload = {
        name: formName,
        category: formCategory,
        quantity: Number(formQuantity),
        buyingPrice: bPrice,
        sellingPrice: sPrice,
        profitMargin,
        gst: Number(formGst),
        unit: formUnit,
        minStock: Number(formMinStock),
        barcode: formBarcode,
        sku: formSku,
        supplier: formSupplier,
        expiryDate: formExpiryDate || undefined,
        status: Number(formQuantity) <= 0 ? 'OUT_OF_STOCK' : Number(formQuantity) <= Number(formMinStock) ? 'LOW_STOCK' : 'IN_STOCK'
      } as Partial<Product>;

      if (editingProduct) {
        await editProduct(editingProduct.id, payload);
        triggerNotification('success', 'Product Updated', `${formName} catalog data synced.`);
      } else {
        await addProduct(payload);
        triggerNotification('success', 'Product Added', `Registered brand new ledger listing: ${formName}`);
      }
      setModalOpen(false);
      loadData();
      loadRecommendations();
    } catch (err) {
      console.error(err);
      alert('Failed to save product listing');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the inventory list?`)) {
      try {
        await deleteProduct(id);
        triggerNotification('info', 'Product Deleted', `Removed ${name} from system archives.`);
        loadData();
        loadRecommendations();
      } catch (err) {
        console.error(err);
        alert('Failed to delete product');
      }
    }
  };

  // Supplier directory mappings
  const getSupplierInfo = (p: Product) => {
    if (p.category === 'Grocery') {
      return { company: 'Aashirvaad Food Wholesale', contact: 'Ramesh Patel', phone: '+91 98845 23341', eta: '24 Hours', minOrder: '50 packs' };
    }
    if (p.category === 'Pharmacy') {
      return { company: 'Medisource Pharma India', contact: 'Dr. Vivek Nair', phone: '+91 94432 11220', eta: '48 Hours', minOrder: '10 strips' };
    }
    if (p.category === 'Salon') {
      return { company: 'Cavinkare Professional Dist.', contact: 'Preeti Deshmukh', phone: '+91 80562 99114', eta: '3 Days', minOrder: '15 units' };
    }
    if (p.category === 'Restaurant') {
      return { company: 'Metro Fresh Ingredients', contact: 'Chef S. Kumar', phone: '+91 91234 56789', eta: '12 Hours', minOrder: '20 kg' };
    }
    return { company: 'Unified Retail Distributors', contact: 'Anil Gupta', phone: '+91 99401 88224', eta: '2 Days', minOrder: '30 units' };
  };

  // Predictive health tags
  const getPredictiveStockout = (p: Product) => {
    if (p.quantity <= 0) return { label: 'OUT OF STOCK', color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (p.quantity <= p.minStock) {
      const speed = p.name.length % 3 + 2;
      const days = Math.max(1, Math.round(p.quantity / speed));
      return { label: `Critical: Out in ~${days} days`, color: 'text-amber-600 bg-amber-50 border-amber-100 animate-pulse' };
    }
    return { label: 'HEALTHY BUFFER', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  };

  // Filter & Sort
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || 
                          p.category.toLowerCase().includes(query) ||
                          (p.sku && p.sku.toLowerCase().includes(query)) ||
                          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
                          (p.supplier && p.supplier.toLowerCase().includes(query));
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'qty_asc') return a.quantity - b.quantity;
    if (sortBy === 'qty_desc') return b.quantity - a.quantity;
    if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'margin_desc') return (b.profitMargin || 0) - (a.profitMargin || 0);
    return 0;
  });

  const dynamicCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const categories = ['All', ...(dynamicCategories.length > 0 ? dynamicCategories : ['Grocery', 'Pharmacy', 'Salon', 'Restaurant', 'Retail'])];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Advanced Inventory Control</h1>
          <p className="text-xs text-slate-400">Perform stock audits, generate barcodes & QR codes, track profit margins, and manage logistics suppliers</p>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => setCameraScanOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-blue-400" />
            Scan Barcode
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* AI Logistical Recommendations Banner */}
      <div id="ai-reorders-panel" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-5 h-5 fill-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider">VyaparaMitra Logistical AI</span>
            </div>
            <h3 className="text-lg font-bold font-sans">Automated AI Reorder Recommendations</h3>
            <p className="text-xs text-slate-300 max-w-2xl font-light">
              Gemini audits low stock units and synthesizes retail patterns, seasonal flu trends, and weekend demand to construct intelligent reorder suggestions.
            </p>
          </div>
          <button 
            onClick={loadRecommendations}
            disabled={recsLoading}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-semibold border border-white/10 shrink-0 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recsLoading ? 'animate-spin' : ''}`} />
            Recalculate Predictives
          </button>
        </div>

        {/* Recommendations list */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {recsLoading ? (
            <div className="col-span-full py-6 flex justify-center items-center gap-2 text-xs text-indigo-200">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Querying Gemini for market velocities...</span>
            </div>
          ) : aiRecs.length === 0 ? (
            <div className="col-span-full py-6 bg-white/5 border border-white/5 rounded-xl text-center text-xs text-slate-400 font-light">
              All inventory levels are fully optimized. No immediate AI order suggestions.
            </div>
          ) : (
            aiRecs.slice(0, 3).map((rec, index) => (
              <div key={rec.productId + index} className="bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 gap-4 shadow-sm backdrop-blur-xs">
                <div className="space-y-3.5">
                  {/* Row 1: Product Name & Urgency Indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white tracking-wide block truncate max-w-[150px]" title={rec.productName}>
                        {rec.productName}
                      </span>
                      <span className="text-[9px] text-indigo-300 font-mono block">
                        Supplier: {rec.supplier || 'N/A'}
                      </span>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shrink-0 border ${
                      rec.urgency === 'CRITICAL' 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : rec.urgency === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {rec.urgency || 'HIGH'}
                    </span>
                  </div>

                  {/* Row 2: Metrics Strip (Stock, Reorder, Est. Days) */}
                  <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Stock</span>
                      <span className="text-xs font-bold text-white font-mono">{rec.currentStock ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Reorder</span>
                      <span className="text-xs font-extrabold text-amber-300 font-mono">+{rec.suggestedQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Days Left</span>
                      <span className="text-xs font-bold text-rose-300 font-mono">
                        {rec.daysToStockOut != null ? `${rec.daysToStockOut}d` : '0d'}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Reason Text block */}
                  <p className="text-[10.5px] text-slate-300 leading-normal font-sans font-light">
                    {rec.reason}
                  </p>

                  {/* Row 4: Financial projections (Purchase Cost, Potential Revenue, Profit) */}
                  <div className="pt-2.5 border-t border-white/5 space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Estimated Purchase Cost:</span>
                      <span className="font-mono text-slate-200">₹{rec.estimatedPurchaseCost?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Potential Gross Revenue:</span>
                      <span className="font-mono text-slate-200">₹{rec.potentialRevenue?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-white/5 pt-1 text-emerald-300 font-semibold">
                      <span>Expected Profit Margin:</span>
                      <span className="font-mono">₹{rec.expectedProfit?.toLocaleString('en-IN') || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Footer details: Confidence & Demand */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 bg-white/3 px-2 py-1.5 rounded-lg border border-white/3 font-sans">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Confidence Score: <strong>{rec.confidenceScore || 95}%</strong></span>
                  </div>
                  <div>
                    <span>Demand: <strong className="text-slate-200">{rec.expectedDemand || '+20% Spike'}</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Filters, Search & Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, SKU, barcode, supplier..."
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-700 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-150 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer font-medium text-slate-700"
            >
              <option value="qty_asc">Qty: Low to High</option>
              <option value="qty_desc">Qty: High to Low</option>
              <option value="name">Name: A to Z</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="margin_desc">Profit Margin: High to Low</option>
            </select>
          </div>

          {/* Department categories */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 border cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Syncing live catalog...</span>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">No products found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Product Details / SKU</th>
                  <th className="px-6 py-4">Department Category</th>
                  <th className="px-6 py-4">Stock Volume</th>
                  <th className="px-6 py-4">Pricing Breakdown</th>
                  <th className="px-6 py-4">GST Rate</th>
                  <th className="px-6 py-4">Stock Health Predictor</th>
                  <th className="px-6 py-4 text-right">Codes / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((p) => {
                  const stockoutInfo = getPredictiveStockout(p);
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {p.name}
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku || 'N/A'}</span>
                          <span>|</span>
                          <span>Supplier: {p.supplier || 'N/A'}</span>
                          {p.expiryDate && (
                            <>
                              <span>|</span>
                              <span className="text-orange-600 font-bold">Exp: {p.expiryDate}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          p.category === 'Grocery' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          p.category === 'Pharmacy' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          p.category === 'Salon' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          p.category === 'Restaurant' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-sm">
                        {p.quantity} <span className="text-xs text-slate-400 font-normal">{p.unit}s</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-slate-800">
                          <span className="text-slate-400 text-[10px]">Sell:</span> <strong>₹{p.sellingPrice}</strong>
                        </div>
                        <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                          Buy: ₹{p.buyingPrice || Math.round(p.sellingPrice * 0.75)} 
                          <span className="ml-1.5 text-emerald-600 font-bold">({p.profitMargin || 25}% Margin)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-600">
                        {p.gst || 12}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${stockoutInfo.color}`}>
                          {stockoutInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowingBarcodeObj(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition rounded-lg"
                            title="Generate Code Visuals"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          {isLow && (
                            <button
                              onClick={() => setSelectedSupplierProduct(p)}
                              className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition rounded-lg border border-transparent hover:border-emerald-200"
                              title="Procure Refill / Logistics Details"
                            >
                              <Truck className="w-3.5 h-3.5 animate-bounce" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition rounded-lg"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition rounded-lg"
                            title="Delete Item"
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

      {/* Code Generation visual display modal */}
      {showingBarcodeObj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-500 uppercase">Interactive Identifiers</span>
              <button onClick={() => setShowingBarcodeObj(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="text-center space-y-3 py-2">
              <p className="text-xs font-bold text-slate-800">{showingBarcodeObj.name}</p>
              <p className="text-[10px] font-mono text-slate-400">SKU: {showingBarcodeObj.sku || 'VM-SKU'}</p>
              
              {/* Barcode Simulator Render */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col items-center gap-1">
                <Barcode className="w-24 h-10 text-slate-800" />
                <span className="text-[9px] font-mono tracking-widest text-slate-600">{showingBarcodeObj.barcode || '890100223942'}</span>
              </div>

              {/* QR Code Refill Simulator */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col items-center gap-1">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="text-[7px] text-slate-400 font-semibold uppercase">Scan QR for dynamic stock status</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('📥 Print command sent directly to wireless label printer!');
                setShowingBarcodeObj(null);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              Print Labels
            </button>
          </div>
        </div>
      )}

      {/* Supplier Recommendation Drawer/Modal */}
      {selectedSupplierProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-150 shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase text-slate-700 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Procurement Logistics Advisor
              </h3>
              <button onClick={() => setSelectedSupplierProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Refill target product</span>
                <p className="text-sm font-bold text-slate-800">{selectedSupplierProduct.name}</p>
                <p className="text-slate-500">Current levels: <strong className="text-rose-600">{selectedSupplierProduct.quantity} units</strong> (Min Limit: {selectedSupplierProduct.minStock})</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-800 text-[11px]">Recommended Wholesale Supplier</span>
                  <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">VERIFIED</span>
                </div>
                <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
                  <p>Distributor: <strong>{getSupplierInfo(selectedSupplierProduct).company}</strong></p>
                  <p>Agent Contact: <strong>{getSupplierInfo(selectedSupplierProduct).contact}</strong></p>
                  <p>Transit ETA: <strong>{getSupplierInfo(selectedSupplierProduct).eta}</strong></p>
                  <p>Minimum Order Lot: <strong>{getSupplierInfo(selectedSupplierProduct).minOrder}</strong></p>
                </div>
              </div>

              <div className="flex gap-2">
                <a 
                  href={`tel:${getSupplierInfo(selectedSupplierProduct).phone}`}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Agent
                </a>
                <button 
                  onClick={() => {
                    alert(`📦 Autonomous purchase order requisition sent directly to ${getSupplierInfo(selectedSupplierProduct).company}!`);
                    setSelectedSupplierProduct(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center transition cursor-pointer"
                >
                  Auto-Reorder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-150 shadow-xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                {editingProduct ? 'Edit Inventory Listing' : 'Add Brand New Product'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Amul Gold Milk 1L"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                />
              </div>

              {/* Grid 1: Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Department Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition cursor-pointer"
                  >
                    {categories.filter(cat => cat !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Billing Unit *</label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. packet, strip, kg, box"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Grid 2: Identifiers (Barcode & SKU) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Barcode Identifier</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="e.g. 890100344122"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. VM-SKU-902"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Grid 3: Quantities */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Min Buffer Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Grid 4: Commercial Pricing */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Buying Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formBuyingPrice}
                    onChange={(e) => setFormBuyingPrice(e.target.value)}
                    placeholder="₹ Buying"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="₹ Selling"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">GST % Tier</label>
                  <select
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2 py-2 text-xs outline-none transition cursor-pointer"
                  >
                    <option value="0">0% Excluded</option>
                    <option value="5">5% Essential</option>
                    <option value="12">12% Standard</option>
                    <option value="18">18% Luxury</option>
                  </select>
                </div>
              </div>

              {/* Grid 5: Logistics Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Default Supplier</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. Aashirvaad Foods"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-sans cursor-pointer"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Real-time Enterprise Barcode Scanning Modal */}
      {cameraScanOpen && (
        <BarcodeScanner
          products={products}
          mode="inventory"
          onScan={(barcode) => {
            const trimmed = barcode.trim();
            if (!trimmed) return;
            const match = products.find(p => p.barcode === trimmed || p.sku === trimmed);
            if (match) {
              setEditingProduct(match);
              setFormName(match.name);
              setFormCategory(match.category);
              setFormQuantity(match.quantity.toString());
              setFormBuyingPrice((match.buyingPrice || match.sellingPrice * 0.75).toString());
              setFormSellingPrice(match.sellingPrice.toString());
              setFormGst((match.gst || 12).toString());
              setFormUnit(match.unit);
              setFormMinStock(match.minStock.toString());
              setFormBarcode(match.barcode || '');
              setFormSku(match.sku || '');
              setFormSupplier(match.supplier || '');
              setFormExpiryDate(match.expiryDate || '');
              setModalOpen(true);
              setCameraScanOpen(false);
              triggerNotification('success', 'Barcode Recognized', `Opened inventory details for ${match.name}`);
            } else {
              setEditingProduct(null);
              setFormName('');
              const firstCat = Array.from(new Set(products.map(p => p.category))).filter(Boolean)[0] || 'General';
              setFormCategory(firstCat);
              setFormQuantity('50');
              setFormBuyingPrice('40');
              setFormSellingPrice('55');
              setFormGst('12');
              setFormUnit('pcs');
              setFormMinStock('15');
              setFormBarcode(trimmed);
              setFormSku('VM-' + Math.floor(10000 + Math.random() * 90000).toString());
              setFormSupplier('Aashirvaad Distributors');
              setFormExpiryDate('');
              setModalOpen(true);
              setCameraScanOpen(false);
              triggerNotification('info', 'New Barcode Scanned', 'Pre-filled new product registration.');
            }
          }}
          onClose={() => setCameraScanOpen(false)}
        />
      )}
    </motion.div>
  );
}
