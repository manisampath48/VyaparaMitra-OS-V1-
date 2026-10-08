import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Search, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Clock, 
  ArrowUpRight,
  Calculator,
  ChevronDown,
  ShoppingBag,
  Percent,
  Download
} from 'lucide-react';
import { fetchSales } from '../lib/api';
import { Sale } from '../types';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'All' | 'TODAY' | 'WEEKLY' | 'MONTHLY'>('All');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Sales based on both Search and Time Filters
  const getFilteredSales = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate week ago threshold
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Calculate month ago threshold
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return sales.filter(s => {
      const matchesSearch = s.customerName.toLowerCase().includes(search.toLowerCase()) || 
                            s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                            s.paymentMethod.toLowerCase().includes(search.toLowerCase());
      
      let matchesTime = true;
      const saleDate = new Date(s.date);

      if (timeFilter === 'TODAY') {
        matchesTime = s.date.startsWith(today);
      } else if (timeFilter === 'WEEKLY') {
        matchesTime = saleDate >= weekAgo;
      } else if (timeFilter === 'MONTHLY') {
        matchesTime = saleDate >= monthAgo;
      }

      return matchesSearch && matchesTime;
    });
  };

  const filteredSales = getFilteredSales();

  // Calculate stats for CURRENT filtered sales list
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalSubtotal = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalTax = filteredSales.reduce((sum, s) => sum + s.tax, 0);
  const averageTicket = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ["Invoice Number", "Customer Name", "Date", "Purchased Items", "Subtotal", "GST Tax (18%)", "Total Amount", "Payment Method"];
    const rows = filteredSales.map(sale => {
      const items = sale.products.map(p => `${p.name} (x${p.quantity})`).join('; ');
      
      const formatField = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        formatField(sale.invoiceNumber),
        formatField(sale.customerName),
        formatField(new Date(sale.date).toISOString()),
        formatField(items),
        formatField(sale.subtotal),
        formatField(sale.tax),
        formatField(sale.total),
        formatField(sale.paymentMethod)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <h1 className="text-xl font-bold text-slate-800">Sales Ledger History</h1>
          <p className="text-xs text-slate-400">Search and audit transactional sales tickets, check digital tax (GST) breakdowns, and examine payment distributions</p>
        </div>
        <button
          onClick={exportToCSV}
          id="btn-export-csv"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Dynamic Summary Cards for Filtered Set */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Filtered Revenue */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Filtered Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold text-slate-800 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Sum total of items and digital tax</p>
          </div>
        </div>

        {/* Filtered Subtotal */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pre-Tax Net</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold text-slate-800 font-mono">₹{totalSubtotal.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Excludes 18% standard GST rate</p>
          </div>
        </div>

        {/* Taxes Filed (GST) */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Accrued GST</span>
            <Percent className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold text-slate-800 font-mono">₹{totalTax.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Tax liability for CA filing</p>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Ticket</span>
            <Calculator className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold text-slate-800 font-mono">₹{averageTicket.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Average checkout ticket size</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice, Customer or Payment Method..."
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-700 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Time filters tab */}
        <div className="flex gap-1.5 shrink-0 overflow-x-auto">
          {(['All', 'TODAY', 'WEEKLY', 'MONTHLY'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                timeFilter === filter 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-50  hover:bg-slate-100  text-slate-600  border border-slate-100 '
              }`}
            >
              {filter === 'All' ? 'All Sales' : filter === 'TODAY' ? "Today's Sales" : filter === 'WEEKLY' ? 'Weekly Sales' : 'Monthly Sales'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabular Output */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">Loading historical ledgers...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">No sales tickets found under these filter parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4">Client Profile</th>
                  <th className="px-6 py-4">Purchased Items</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">GST (18%)</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 font-mono text-xs">{s.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{s.customerName}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {s.products.map((item, idx) => (
                          <div key={item.productId + idx} className="text-slate-500 text-[11px] truncate">
                            {item.name} <strong className="text-slate-700 font-medium">(x{item.quantity})</strong>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">₹{s.subtotal}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">₹{s.tax}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 text-sm">₹{s.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                        s.paymentMethod === 'UPI' ? 'bg-indigo-50  text-indigo-700  border-indigo-100 ' :
                        s.paymentMethod === 'CASH' ? 'bg-emerald-50  text-emerald-700  border-emerald-100 ' :
                        s.paymentMethod === 'CARD' ? 'bg-sky-50  text-sky-700  border-sky-100 ' :
                        'bg-rose-50  text-rose-700  border-rose-100  animate-pulse'
                      }`}>
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 font-medium">
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-slate-300 font-normal font-mono flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(s.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
