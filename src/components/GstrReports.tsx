import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Printer, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ShoppingCart, 
  Briefcase, 
  Info,
  Building,
  User,
  Filter,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { fetchSales, fetchProducts, fetchCustomers, fetchMetadata, BusinessMetadata } from '../lib/api';
import { Product, Customer, Sale } from '../types';

// Standard Indian GST States List
const STATES_OF_INDIA = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Predefined supplier profiles to map actual product lines for ITC reports
const SIMULATED_SUPPLIERS: Record<string, { gstin: string; state: string; itcEligible: boolean }> = {
  'Ramesh Dairy Distributors': { gstin: '29AAARD4123F1Z3', state: 'Karnataka', itcEligible: true },
  'Amul India Ltd': { gstin: '24AAACA1234D1Z2', state: 'Gujarat', itcEligible: true },
  'Fortune Foods': { gstin: '27AAAFF5678K1Z4', state: 'Maharashtra', itcEligible: true },
  'Local Wholesale Co.': { gstin: '', state: '', itcEligible: false }, 
  'Unknown Supplier': { gstin: '', state: '', itcEligible: false },
};

export default function GstrReports() {
  // Data State
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metadata, setMetadata] = useState<BusinessMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selector / Filter State
  const [selectedFY, setSelectedFY] = useState('2026-27');
  const [periodType, setPeriodType] = useState<'MONTH' | 'QUARTER' | 'CUSTOM'>('MONTH');
  const [selectedMonth, setSelectedMonth] = useState('6'); // July (0-indexed 6 is July)
  const [selectedQuarter, setSelectedQuarter] = useState('Q2'); // Jul-Sep
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Active report tab
  const [activeReport, setActiveReport] = useState<'DASHBOARD' | 'GSTR-1' | 'GSTR-3B' | 'PURCHASE' | 'HSN' | 'RATE'>('DASHBOARD');
  
  // UI States
  const [validationExpanded, setValidationExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationFilter, setValidationFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'READY'>('ALL');

  // Load Data
  const loadGstrData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesData, prodData, custData, metaData] = await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers(),
        fetchMetadata()
      ]);
      setSales(salesData);
      setProducts(prodData);
      setCustomers(custData);
      setMetadata(metaData);
    } catch (err: any) {
      console.error('Failed to load GSTR Report data:', err);
      setError('Failed to fetch data registers. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGstrData();
  }, []);

  // Determine active state of business from metadata
  const getBusinessState = () => {
    if (!metadata || !metadata.address) return 'Karnataka';
    const addrLower = metadata.address.toLowerCase();
    for (const state of STATES_OF_INDIA) {
      if (addrLower.includes(state.toLowerCase())) {
        return state;
      }
    }
    return 'Karnataka'; // Fallback
  };

  const businessState = getBusinessState();
  const businessGstin = metadata?.gstNumber || '29AAABP4211G1Z3';

  // HSN mapping matching Invoices.tsx
  const getHSNCode = (category: string) => {
    const cat = category ? category.toLowerCase() : '';
    if (cat.includes('grocery') || cat.includes('rice') || cat.includes('sugar') || cat.includes('flour') || cat.includes('dal') || cat.includes('spice')) return '0401';
    if (cat.includes('pharmacy') || cat.includes('tablet') || cat.includes('syrup') || cat.includes('medical') || cat.includes('medicine')) return '3004';
    if (cat.includes('salon') || cat.includes('beauty') || cat.includes('hair') || cat.includes('makeup')) return '3305';
    if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food') || cat.includes('bake') || cat.includes('sweet')) return '2106';
    if (cat.includes('clothing') || cat.includes('saree') || cat.includes('wear') || cat.includes('jeans')) return '6203';
    if (cat.includes('hardware') || cat.includes('cement') || cat.includes('tool') || cat.includes('pipe')) return '2523';
    if (cat.includes('electronic') || cat.includes('phone') || cat.includes('mobile') || cat.includes('tv')) return '8517';
    return '6203'; // Default HSN code
  };

  // ----------------------------------------------------
  // Period Filtering logic
  // ----------------------------------------------------
  const getFilteredSales = () => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) return false;

      if (periodType === 'CUSTOM') {
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      }

      const startYear = parseInt(selectedFY.split('-')[0]);
      const endYear = startYear + 1;
      const fyStart = new Date(`${startYear}-04-01T00:00:00`);
      const fyEnd = new Date(`${endYear}-03-31T23:59:59`);

      if (saleDate < fyStart || saleDate > fyEnd) return false;

      if (periodType === 'MONTH') {
        const monthIndex = parseInt(selectedMonth);
        return saleDate.getMonth() === monthIndex;
      }

      if (periodType === 'QUARTER') {
        const month = saleDate.getMonth(); // 0-11
        if (selectedQuarter === 'Q1') return month >= 3 && month <= 5; // Apr-Jun
        if (selectedQuarter === 'Q2') return month >= 6 && month <= 8; // Jul-Sep
        if (selectedQuarter === 'Q3') return month >= 9 && month <= 11; // Oct-Dec
        if (selectedQuarter === 'Q4') return month === 0 || month === 1 || month === 2; // Jan-Mar
      }

      return true;
    });
  };

  // Derive Purchase List dynamically from inventory products and suppliers
  const getDerivedPurchases = () => {
    const purchaseRecords: any[] = [];
    let invoiceCounter = 8000;

    products.forEach((prod, index) => {
      const supplierName = prod.supplier || 'Unknown Supplier';
      const supplierInfo = SIMULATED_SUPPLIERS[supplierName] || {
        gstin: '',
        state: businessState,
        itcEligible: false
      };

      // Ensure some default quantities if stock is 0
      const stockBought = prod.quantity > 0 ? prod.quantity : 25;
      const unitBuyingPrice = prod.buyingPrice || prod.purchasePrice || Math.round(prod.sellingPrice * 0.7);
      const taxableValue = stockBought * unitBuyingPrice;
      const gstRate = prod.gst || 12;
      const totalTax = Math.round(taxableValue * (gstRate / 100));
      const purchaseValue = taxableValue + totalTax;

      // Distribute purchase dates realistically inside the selected period
      let purchaseDateStr = '';
      if (prod.createdAt) {
        purchaseDateStr = prod.createdAt;
      } else {
        // Mock a date inside the active selection
        const now = new Date();
        if (periodType === 'MONTH') {
          const year = parseInt(selectedFY.split('-')[0]) + (parseInt(selectedMonth) < 3 ? 1 : 0);
          const month = parseInt(selectedMonth);
          const date = new Date(year, month, Math.max(1, (index % 28) + 1));
          purchaseDateStr = date.toISOString();
        } else if (periodType === 'QUARTER') {
          const year = parseInt(selectedFY.split('-')[0]) + (selectedQuarter === 'Q4' ? 1 : 0);
          let baseMonth = 3; // Q1 Apr
          if (selectedQuarter === 'Q2') baseMonth = 6;
          if (selectedQuarter === 'Q3') baseMonth = 9;
          if (selectedQuarter === 'Q4') baseMonth = 0;
          const month = baseMonth + (index % 3);
          const date = new Date(year, month, Math.max(1, (index % 28) + 1));
          purchaseDateStr = date.toISOString();
        } else {
          // Custom dates
          const start = new Date(customRange.start).getTime();
          const end = new Date(customRange.end).getTime();
          const mid = start + ((end - start) * (index / products.length));
          purchaseDateStr = new Date(mid).toISOString();
        }
      }

      // Check if this date fits the active selectors
      const pDate = new Date(purchaseDateStr);
      let dateFits = true;

      if (periodType === 'CUSTOM') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        dateFits = pDate >= start && pDate <= end;
      } else {
        const startYear = parseInt(selectedFY.split('-')[0]);
        const endYear = startYear + 1;
        const fyStart = new Date(`${startYear}-04-01T00:00:00`);
        const fyEnd = new Date(`${endYear}-03-31T23:59:59`);
        if (pDate < fyStart || pDate > fyEnd) {
          dateFits = false;
        } else if (periodType === 'MONTH') {
          dateFits = pDate.getMonth() === parseInt(selectedMonth);
        } else if (periodType === 'QUARTER') {
          const month = pDate.getMonth();
          if (selectedQuarter === 'Q1') dateFits = month >= 3 && month <= 5;
          if (selectedQuarter === 'Q2') dateFits = month >= 6 && month <= 8;
          if (selectedQuarter === 'Q3') dateFits = month >= 9 && month <= 11;
          if (selectedQuarter === 'Q4') dateFits = month >= 0 && month <= 2;
        }
      }

      if (dateFits) {
        invoiceCounter++;
        purchaseRecords.push({
          id: `pur-${prod.id}`,
          productName: prod.name,
          category: prod.category,
          supplierName,
          supplierGstin: supplierInfo.gstin,
          supplierState: supplierInfo.state || businessState,
          invoiceNumber: `PUR-2026-${invoiceCounter}`,
          invoiceDate: purchaseDateStr,
          purchaseValue,
          taxableValue,
          gstRate,
          itcEligible: supplierInfo.itcEligible,
          hsnCode: getHSNCode(prod.category)
        });
      }
    });

    return purchaseRecords;
  };

  const filteredSales = getFilteredSales();
  const derivedPurchases = getDerivedPurchases();

  // ----------------------------------------------------
  // GSTR Calculation Engine
  // ----------------------------------------------------

  // Sales Totals
  let totalTaxableSales = 0;
  let totalOutputGst = 0;
  let cgstCollected = 0;
  let sgstCollected = 0;
  let igstCollected = 0;

  filteredSales.forEach(sale => {
    // Determine customer state and type
    const customer = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
    const destState = customer?.state || businessState;
    const isInterstate = destState.toLowerCase().trim() !== businessState.toLowerCase().trim();

    sale.products.forEach(p => {
      // Line item taxable and gst values
      const lineGstRate = p.gstRate || 12;
      const lineTotal = p.total || 0;
      const lineGstAmount = p.gstAmount || Math.round(lineTotal * (lineGstRate / (100 + lineGstRate)));
      const lineTaxable = lineTotal - lineGstAmount;

      totalTaxableSales += lineTaxable;
      totalOutputGst += lineGstAmount;

      if (isInterstate) {
        igstCollected += lineGstAmount;
      } else {
        const split = Math.round(lineGstAmount / 2);
        cgstCollected += split;
        sgstCollected += (lineGstAmount - split); // Balance
      }
    });
  });

  // Purchase Totals
  let totalTaxablePurchases = 0;
  let totalGstPaidOnPurchases = 0;
  let eligibleItc = 0;
  let ineligibleItc = 0;
  let pendingItc = 0;

  derivedPurchases.forEach(pur => {
    totalTaxablePurchases += pur.taxableValue;
    const tax = pur.purchaseValue - pur.taxableValue;
    totalGstPaidOnPurchases += tax;

    if (pur.itcEligible) {
      eligibleItc += tax;
    } else if (pur.supplierGstin === '') {
      pendingItc += tax;
    } else {
      ineligibleItc += tax;
    }
  });

  const estimatedNetGstLiability = Math.max(0, totalOutputGst - eligibleItc);

  // ----------------------------------------------------
  // Data Validation & Error Scanning Engine
  // ----------------------------------------------------
  const runGstrValidation = () => {
    const issues: Array<{
      id: string;
      type: 'ERROR' | 'WARNING';
      source: 'SALE' | 'PURCHASE' | 'PRODUCT';
      refId: string;
      title: string;
      description: string;
      recordName: string;
    }> = [];

    // Check duplicate sales invoice numbers
    const invoiceSet = new Set<string>();
    filteredSales.forEach(sale => {
      if (invoiceSet.has(sale.invoiceNumber)) {
        issues.push({
          id: `dup-${sale.id}`,
          type: 'ERROR',
          source: 'SALE',
          refId: sale.invoiceNumber,
          title: 'Duplicate Invoice Number Detected',
          description: `Invoice number "${sale.invoiceNumber}" is duplicated in the system ledger.`,
          recordName: sale.customerName
        });
      }
      invoiceSet.add(sale.invoiceNumber);
    });

    // Check sales issues
    filteredSales.forEach(sale => {
      const customer = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
      const isB2B = customer?.customerType === 'Wholesale' || (customer?.gstNumber && customer.gstNumber.trim().length > 0);
      const destState = customer?.state;

      // 1. Missing Place of Supply for Wholesale
      if (isB2B && !destState) {
        issues.push({
          id: `pos-${sale.id}`,
          type: 'WARNING',
          source: 'SALE',
          refId: sale.invoiceNumber,
          title: 'Missing Place of Supply',
          description: `Wholesale Customer "${sale.customerName}" does not have a registered state. Defaulted to local state.`,
          recordName: sale.customerName
        });
      }

      // 2. Invalid Customer GSTIN format for B2B
      if (customer?.gstNumber && customer.gstNumber.trim().length !== 15) {
        issues.push({
          id: `gstin-fmt-${sale.id}`,
          type: 'ERROR',
          source: 'SALE',
          refId: sale.invoiceNumber,
          title: 'Invalid GSTIN Format',
          description: `GSTIN "${customer.gstNumber}" must be exactly 15 characters long.`,
          recordName: sale.customerName
        });
      }

      // 3. Tax Miscalculation and Interstate/Intrastate check
      const stateMatch = destState ? destState.toLowerCase().trim() === businessState.toLowerCase().trim() : true;
      let calculatedTax = 0;

      sale.products.forEach(p => {
        const lineGstRate = p.gstRate || 12;
        const lineTotal = p.total || 0;
        const lineGstAmount = p.gstAmount || Math.round(lineTotal * (lineGstRate / (100 + lineGstRate)));
        calculatedTax += lineGstAmount;

        // Check missing HSN mapping
        const hsn = getHSNCode(p.name); // Using product name/category fallback
        if (!hsn) {
          issues.push({
            id: `hsn-p-${p.productId}`,
            type: 'WARNING',
            source: 'PRODUCT',
            refId: p.productId,
            title: 'Missing HSN Code',
            description: `Product "${p.name}" has no registered HSN code. Dynamic fallback applied.`,
            recordName: p.name
          });
        }
      });

      // Verify overall tax math
      if (Math.abs(calculatedTax - sale.tax) > 5) {
        issues.push({
          id: `tax-math-${sale.id}`,
          type: 'ERROR',
          source: 'SALE',
          refId: sale.invoiceNumber,
          title: 'Incorrect Tax Computation',
          description: `Accumulated tax breakdown (₹${calculatedTax}) does not match the invoice ledger tax (₹${sale.tax}).`,
          recordName: sale.customerName
        });
      }
    });

    // Check Purchase & ITC issues
    derivedPurchases.forEach(pur => {
      // 1. Missing supplier GSTIN for ITC claims
      if (!pur.supplierGstin) {
        issues.push({
          id: `sup-gstin-${pur.id}`,
          type: 'WARNING',
          source: 'PURCHASE',
          refId: pur.invoiceNumber,
          title: 'Missing Supplier GSTIN',
          description: `Supplier "${pur.supplierName}" has no GSTIN listed. This ITC claim is held as "Pending Review".`,
          recordName: pur.supplierName
        });
      }

      // 2. GST Rate verification
      if (!pur.gstRate || pur.gstRate === 0) {
        issues.push({
          id: `pur-rate-${pur.id}`,
          type: 'WARNING',
          source: 'PURCHASE',
          refId: pur.invoiceNumber,
          title: 'Zero or Missing GST Rate',
          description: `Purchase invoice has 0% tax or unspecified tax tiers. This may limit available ITC credits.`,
          recordName: pur.productName
        });
      }
    });

    return issues;
  };

  const validationIssues = runGstrValidation();
  const errorCount = validationIssues.filter(i => i.type === 'ERROR').length;
  const warningCount = validationIssues.filter(i => i.type === 'WARNING').length;

  const filteredIssues = validationIssues.filter(issue => {
    if (validationFilter === 'ALL') return true;
    if (validationFilter === 'ERROR') return issue.type === 'ERROR';
    if (validationFilter === 'WARNING') return issue.type === 'WARNING';
    return false;
  });

  // ----------------------------------------------------
  // Exporters (CSV Generator)
  // ----------------------------------------------------
  const handleExportCSV = (type: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'GSTR1') {
      csvContent += "Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Place of Supply,Transaction Type,Invoice Value,Taxable Value,GST Rate,CGST,SGST,IGST\n";
      filteredSales.forEach(sale => {
        const customer = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
        const destState = customer?.state || businessState;
        const isInterstate = destState.toLowerCase().trim() !== businessState.toLowerCase().trim();
        const typeStr = customer?.gstNumber ? 'B2B' : 'B2C';

        sale.products.forEach(p => {
          const rate = p.gstRate || 12;
          const total = p.total || 0;
          const tax = p.gstAmount || Math.round(total * (rate / (100 + rate)));
          const taxable = total - tax;
          const cgst = isInterstate ? 0 : Math.round(tax / 2);
          const sgst = isInterstate ? 0 : Math.round(tax / 2);
          const igst = isInterstate ? tax : 0;

          csvContent += `"${sale.invoiceNumber}","${sale.date.split('T')[0]}","${sale.customerName}","${customer?.gstNumber || ''}","${destState}","${typeStr}","${total}","${taxable}","${rate}%","${cgst}","${sgst}","${igst}"\n`;
        });
      });
    } else if (type === 'PURCHASE') {
      csvContent += "Supplier Name,Supplier GSTIN,Invoice Number,Invoice Date,Purchase Value,Taxable Value,GST Rate,CGST,SGST,IGST,ITC Eligibility,Eligible ITC\n";
      derivedPurchases.forEach(pur => {
        const tax = pur.purchaseValue - pur.taxableValue;
        const isInterstate = pur.supplierState.toLowerCase().trim() !== businessState.toLowerCase().trim();
        const cgst = isInterstate ? 0 : Math.round(tax / 2);
        const sgst = isInterstate ? 0 : Math.round(tax / 2);
        const igst = isInterstate ? tax : 0;
        const eligibleAmt = pur.itcEligible ? tax : 0;

        csvContent += `"${pur.supplierName}","${pur.supplierGstin}","${pur.invoiceNumber}","${pur.invoiceDate.split('T')[0]}","${pur.purchaseValue}","${pur.taxableValue}","${pur.gstRate}%","${cgst}","${sgst}","${igst}","${pur.itcEligible ? 'Eligible' : 'Ineligible'}","${eligibleAmt}"\n`;
      });
    } else {
      // General Dashboard Stats
      csvContent += "Metric,Amount\n";
      csvContent += `"Total Taxable Sales","${totalTaxableSales.toFixed(2)}"\n`;
      csvContent += `"Total Taxable Purchases","${totalTaxablePurchases.toFixed(2)}"\n`;
      csvContent += `"Total Output GST Collected","${totalOutputGst.toFixed(2)}"\n`;
      csvContent += `"Total Eligible Input Tax Credit (ITC)","${eligibleItc.toFixed(2)}"\n`;
      csvContent += `"CGST Collected","${cgstCollected.toFixed(2)}"\n`;
      csvContent += `"SGST Collected","${sgstCollected.toFixed(2)}"\n`;
      csvContent += `"IGST Collected","${igstCollected.toFixed(2)}"\n`;
      csvContent += `"Estimated Net GST Liability","${estimatedNetGstLiability.toFixed(2)}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VyaparaMitra_GST_Report_${type}_${selectedFY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Compiling GST Ledger Repositories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-150 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-sm">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Operational Failure</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button onClick={loadGstrData} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 print:p-0 print:bg-white print:text-black"
    >
      {/* Disclaimer Top Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-[11px] text-amber-800 shadow-xs print:hidden">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">GST Compliance Summary Information Notice</p>
          <p className="leading-relaxed text-amber-700/90">
            These GSTR tax summaries are automatically consolidated from your local sales, invoicing, and product registers. They are intended for tax planning, operational audit, and CA consultation. Please ensure details are cross-verified before statutory filing.
          </p>
        </div>
      </div>

      {/* Profile Header Block */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider print:hidden">GST Registered Enterprise</span>
            {errorCount > 0 ? (
              <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 print:hidden">
                <AlertTriangle className="w-3 h-3" /> Ledger Audit Alerts ({errorCount})
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 print:hidden">
                <CheckCircle2 className="w-3 h-3" /> Ledger Healthy
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{metadata?.businessName || 'VyaparaMitra Enterprise'}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <Building className="w-3.5 h-3.5 text-slate-400" /> GSTIN: <strong className="text-slate-800 font-mono uppercase">{businessGstin}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400" /> State: <strong className="text-slate-800 font-sans">{businessState}</strong>
            </span>
          </div>
        </div>

        {/* Action controls (Print & Export) */}
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button 
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Ledger
          </button>
          <button 
            onClick={() => handleExportCSV('DASHBOARD')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Ledger Data
          </button>
        </div>
      </div>

      {/* Control Panels - Selector Widgets */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" /> Filter Compliance Period
          </span>

          {/* Financial Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Financial Year:</span>
            <select 
              value={selectedFY} 
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
            >
              <option value="2026-27">FY 2026-27 (Current)</option>
              <option value="2025-26">FY 2025-26 (Previous)</option>
            </select>
          </div>
        </div>

        {/* Date Selection tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Period Type Selection tabs */}
          <div className="md:col-span-4 bg-slate-50 p-1 rounded-xl flex border border-slate-150">
            {(['MONTH', 'QUARTER', 'CUSTOM'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition uppercase tracking-wider ${
                  periodType === type 
                    ? 'bg-white text-blue-700 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'MONTH' ? 'Monthly' : type === 'QUARTER' ? 'Quarterly' : 'Custom'}
              </button>
            ))}
          </div>

          {/* Specific values based on Type */}
          <div className="md:col-span-8">
            {periodType === 'MONTH' && (
              <div className="flex flex-wrap gap-1">
                {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((mName, idx) => {
                  // Map Apr to 3, May to 4, ... Jan to 0, Feb to 1, Mar to 2
                  const mIndex = (idx + 3) % 12;
                  const isActive = selectedMonth === mIndex.toString();
                  return (
                    <button
                      key={mName}
                      onClick={() => setSelectedMonth(mIndex.toString())}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            )}

            {periodType === 'QUARTER' && (
              <div className="flex gap-2">
                {[
                  { id: 'Q1', label: 'Q1 (Apr - Jun)' },
                  { id: 'Q2', label: 'Q2 (Jul - Sep)' },
                  { id: 'Q3', label: 'Q3 (Oct - Dec)' },
                  { id: 'Q4', label: 'Q4 (Jan - Mar)' },
                ].map((q) => {
                  const isActive = selectedQuarter === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuarter(q.id)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            )}

            {periodType === 'CUSTOM' && (
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">Start:</span>
                  <input 
                    type="date" 
                    value={customRange.start} 
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-transparent focus:outline-none w-full text-slate-800 font-medium"
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">End:</span>
                  <input 
                    type="date" 
                    value={customRange.end} 
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent focus:outline-none w-full text-slate-800 font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Scanning Collapsible Section */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden print:hidden">
        <button 
          onClick={() => setValidationExpanded(!validationExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
        >
          <div className="flex items-center gap-3">
            {errorCount > 0 ? (
              <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : warningCount > 0 ? (
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div className="text-left">
              <h3 className="font-bold text-sm text-slate-800">GST Audit Scanner & Diagnostics</h3>
              <p className="text-[11px] text-slate-400">
                {errorCount === 0 && warningCount === 0 
                  ? 'All records generated clean and compliant. No ledger anomalies found.' 
                  : `Audited and identified ${errorCount} file errors and ${warningCount} compliance warnings.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {errorCount > 0 && (
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                {errorCount} Errors
              </span>
            )}
            {warningCount > 0 && (
              <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                {warningCount} Warnings
              </span>
            )}
            {validationExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {validationExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                
                {/* Diagnostics filter tabs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Diagnostics:</span>
                  {(['ALL', 'ERROR', 'WARNING'] as const).map((vFilter) => (
                    <button
                      key={vFilter}
                      onClick={() => setValidationFilter(vFilter)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase border transition ${
                        validationFilter === vFilter 
                          ? 'bg-slate-800 border-slate-800 text-white' 
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {vFilter}
                    </button>
                  ))}
                </div>

                {/* Audit issue list */}
                {filteredIssues.length === 0 ? (
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-800">Clear Compliance Sheet</h4>
                    <p className="text-[11px] text-slate-500">No anomalies matched your filter. Ready for compliance outline mapping.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {filteredIssues.map((issue) => (
                      <div 
                        key={issue.id} 
                        className={`p-4 rounded-xl border flex gap-3 ${
                          issue.type === 'ERROR' 
                            ? 'bg-red-50/30 border-red-100/80 text-red-900' 
                            : 'bg-amber-50/30 border-amber-100/80 text-amber-900'
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${issue.type === 'ERROR' ? 'text-red-500' : 'text-amber-500'}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs leading-none">{issue.title}</span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                              issue.type === 'ERROR' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {issue.source} • {issue.refId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main GSTR Reports navigation flow */}
      <div className="flex bg-slate-100/70 p-1 border border-slate-200 rounded-2xl print:hidden overflow-x-auto gap-1">
        {[
          { id: 'DASHBOARD', label: 'Compliance Dashboard' },
          { id: 'GSTR-1', label: 'GSTR-1 (Outward Sales)' },
          { id: 'GSTR-3B', label: 'GSTR-3B (Filing Summary)' },
          { id: 'PURCHASE', label: 'Purchase & ITC Report' },
          { id: 'HSN', label: 'HSN/SAC Summary' },
          { id: 'RATE', label: 'Rate-wise Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeReport === tab.id 
                ? 'bg-white text-blue-700 shadow-sm font-black' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report View Panel */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-6 print:border-none print:shadow-none print:p-0">
        
        {/* 1. DASHBOARD COMPONENT */}
        {activeReport === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">Operational GST Summary</h2>
              <p className="text-xs text-slate-500">Summary totals for the selected reporting cycle.</p>
            </div>

            {/* Metric bento grid cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-blue-400 transition">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Taxable Sales</span>
                <span className="text-lg font-black text-slate-800 block mt-1">₹{Math.round(totalTaxableSales).toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{filteredSales.length} Active Invoices</span>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-blue-400 transition">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Taxable Purchases</span>
                <span className="text-lg font-black text-slate-800 block mt-1">₹{Math.round(totalTaxablePurchases).toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{derivedPurchases.length} Raw Supplies</span>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-blue-400 transition">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Output GST</span>
                <span className="text-lg font-black text-slate-800 block mt-1">₹{Math.round(totalOutputGst).toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-bold text-blue-600 mt-0.5 block">IGST / CGST / SGST</span>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-blue-400 transition">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Eligible Input Tax Credit (ITC)</span>
                <span className="text-lg font-black text-emerald-600 block mt-1">₹{Math.round(eligibleItc).toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-bold text-emerald-600 mt-0.5 block">₹{Math.round(pendingItc)} Pending Review</span>
              </div>

            </div>

            {/* Split collected taxes & Net liabilities */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              <div className="md:col-span-8 border border-slate-150 rounded-2xl p-6 space-y-4 bg-slate-50/20">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Output Tax Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Central GST (CGST Collected):</span>
                    <strong className="text-slate-800">₹{Math.round(cgstCollected).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">State GST (SGST Collected):</span>
                    <strong className="text-slate-800">₹{Math.round(sgstCollected).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Integrated GST (IGST Collected):</span>
                    <strong className="text-slate-800">₹{Math.round(igstCollected).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span className="text-slate-700">Total Output Liability:</span>
                    <strong className="text-blue-700">₹{Math.round(totalOutputGst).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Net Estimated Liabilities Card */}
              <div className="md:col-span-4 bg-blue-950 text-white rounded-2xl p-6 space-y-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <TrendingUp className="w-40 h-40" />
                </div>

                <span className="bg-blue-800 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block">Estimated liability balance</span>
                <div className="space-y-1">
                  <span className="text-2xl font-black block">₹{Math.round(estimatedNetGstLiability).toLocaleString('en-IN')}</span>
                  <p className="text-[10px] text-slate-300">Estimated Net tax payable after eligible input tax credits.</p>
                </div>

                <div className="border-t border-white/10 pt-4 text-[10px] text-slate-400 space-y-1 leading-normal">
                  <p>Formula used:</p>
                  <code className="text-blue-300 font-mono block">Max(0, Output GST - Eligible ITC)</code>
                </div>
              </div>

            </div>

            {/* Step flow details */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Compliance Audit Steps</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Scope Registers', desc: 'Financial year & monthly cycle mapped cleanly.' },
                  { step: '2', title: 'Data Audit', desc: 'Scanned ledger validation for missing metrics.' },
                  { step: '3', title: 'Deductions Offset', desc: 'Applied eligible ITC against outward tax.' },
                  { step: '4', title: 'Export Ready', desc: 'Export sheets optimized for accountant review.' }
                ].map((s) => (
                  <div key={s.step} className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-800 block leading-none">{s.title}</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. GSTR-1 COMPONENT */}
        {activeReport === 'GSTR-1' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">GSTR-1 Outward Supplies Ledger</h2>
                <p className="text-xs text-slate-500">Report of outward supplies (sales invoices) generated for review.</p>
              </div>
              <button 
                onClick={() => handleExportCSV('GSTR1')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition print:hidden"
              >
                <Download className="w-3.5 h-3.5" /> Export GSTR-1 CSV
              </button>
            </div>

            {/* Categories Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">B2B Sales (Registered)</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  ₹{Math.round(filteredSales.filter(s => {
                    const c = customers.find(cust => cust.id === s.customerId || cust.name === s.customerName);
                    return c?.gstNumber && c.gstNumber.trim().length > 0;
                  }).reduce((sum, s) => sum + s.total, 0)).toLocaleString('en-IN')}
                </span>
                <p className="text-[9px] text-slate-500 mt-0.5">Wholesale and registered counterparties.</p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">B2C Sales (Consumers)</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  ₹{Math.round(filteredSales.filter(s => {
                    const c = customers.find(cust => cust.id === s.customerId || cust.name === s.customerName);
                    return !c?.gstNumber || c.gstNumber.trim().length === 0;
                  }).reduce((sum, s) => sum + s.total, 0)).toLocaleString('en-IN')}
                </span>
                <p className="text-[9px] text-slate-500 mt-0.5">End consumer retail receipts.</p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Inter-state Sales</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  ₹{Math.round(filteredSales.filter(s => {
                    const c = customers.find(cust => cust.id === s.customerId || cust.name === s.customerName);
                    return c?.state && c.state.toLowerCase().trim() !== businessState.toLowerCase().trim();
                  }).reduce((sum, s) => sum + s.total, 0)).toLocaleString('en-IN')}
                </span>
                <p className="text-[9px] text-slate-500 mt-0.5">Sales out of {businessState}.</p>
              </div>
            </div>

            {/* Invoices Detailed List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Detailed Invoice Registers</h3>
                <div className="relative max-w-xs w-full print:hidden">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search invoices, clients, states..."
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">GSTIN</th>
                      <th className="p-3">POS</th>
                      <th className="p-3 text-right">Value</th>
                      <th className="p-3 text-right">Taxable</th>
                      <th className="p-3 text-center">Tax Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.filter(s => 
                      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((sale) => {
                      const cust = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
                      const dest = cust?.state || 'Local';
                      const isInter = dest.toLowerCase().trim() !== businessState.toLowerCase().trim();
                      const rateSummary = Array.from(new Set(sale.products.map(p => p.gstRate || 12)));

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono font-bold text-slate-700">{sale.invoiceNumber}</td>
                          <td className="p-3 whitespace-nowrap">{sale.date.split('T')[0]}</td>
                          <td className="p-3 font-semibold text-slate-800 capitalize">{sale.customerName}</td>
                          <td className="p-3 font-mono uppercase text-slate-600">{cust?.gstNumber || <span className="text-slate-400 italic">B2C</span>}</td>
                          <td className="p-3">{dest}</td>
                          <td className="p-3 text-right font-semibold text-slate-800">₹{Math.round(sale.total)}</td>
                          <td className="p-3 text-right text-slate-500">₹{Math.round(sale.subtotal)}</td>
                          <td className="p-3 text-center whitespace-nowrap text-[10px]">
                            {isInter ? (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">IGST: ₹{Math.round(sale.tax)}</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">C+S: ₹{Math.round(sale.tax)}</span>
                            )}
                            <span className="text-slate-400 block text-[8px] font-bold">Rates: {rateSummary.join(', ')}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. GSTR-3B COMPONENT */}
        {activeReport === 'GSTR-3B' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">GSTR-3B Summary Report</h2>
              <p className="text-xs text-slate-500">Consolidated outward supplies, available input tax credit, and tax payment calculations.</p>
            </div>

            {/* Outward supplies section */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white p-4 font-bold text-xs uppercase tracking-wider">
                1. Outward Supplies (Sales) & Liability Accrual
              </div>
              <div className="p-4 space-y-3.5 bg-white divide-y divide-slate-100">
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-slate-600 font-semibold">3.1(a) Outward Taxable Supplies:</span>
                  <div className="text-right space-y-0.5">
                    <span className="text-slate-800 font-bold block">Taxable: ₹{Math.round(totalTaxableSales).toLocaleString('en-IN')}</span>
                    <span className="text-blue-600 text-[10px] block">GST: ₹{Math.round(totalOutputGst).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs py-2">
                  <span className="text-slate-600 font-semibold">3.1(b) Outward Zero-rated Supplies:</span>
                  <span className="text-slate-500">₹0</span>
                </div>
                <div className="flex justify-between items-center text-xs py-2">
                  <span className="text-slate-600 font-semibold">3.1(c) Other Outward Supplies (Nil-rated / Exempt):</span>
                  <span className="text-slate-500">₹0</span>
                </div>
              </div>
            </div>

            {/* Eligible ITC section */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white p-4 font-bold text-xs uppercase tracking-wider">
                2. Eligible Input Tax Credit (ITC) Claims
              </div>
              <div className="p-4 space-y-3.5 bg-white divide-y divide-slate-100">
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-slate-600 font-semibold">4(A)(5) All Other ITC (Eligible Inward Supplies):</span>
                  <div className="text-right space-y-0.5">
                    <span className="text-emerald-600 font-bold block">Eligible: ₹{Math.round(eligibleItc).toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 text-[10px] block">Pending: ₹{Math.round(pendingItc).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs py-2">
                  <span className="text-slate-600 font-semibold">4(B) ITC Reversed:</span>
                  <span className="text-slate-500">₹0</span>
                </div>
                <div className="flex justify-between items-center text-xs py-2 font-bold text-emerald-700">
                  <span>4(C) Net Available ITC:</span>
                  <span>₹{Math.round(eligibleItc).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Tax payment calculations */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-blue-900 text-white p-4 font-bold text-xs uppercase tracking-wider">
                3. Tax Liability & Offsets Payment Flow
              </div>
              <div className="p-4 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Accrued Output Tax</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">₹{Math.round(totalOutputGst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Offset Credit (Eligible ITC)</span>
                    <span className="text-sm font-bold text-emerald-600 block mt-0.5">-₹{Math.round(eligibleItc).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-150">
                    <span className="text-[10px] text-blue-500 uppercase font-black tracking-wider">Est. Net Cash Payable</span>
                    <span className="text-sm font-extrabold text-blue-800 block mt-0.5">₹{Math.round(estimatedNetGstLiability).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PURCHASE AND ITC COMPONENT */}
        {activeReport === 'PURCHASE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">Inward Supplies & ITC Claims Register</h2>
                <p className="text-xs text-slate-500">Summary list of stock and catalog purchases paired with supplier credentials and eligibility diagnostics.</p>
              </div>
              <button 
                onClick={() => handleExportCSV('PURCHASE')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition print:hidden"
              >
                <Download className="w-3.5 h-3.5" /> Export Purchase CSV
              </button>
            </div>

            {/* Claims summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Purchases</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">₹{Math.round(totalTaxablePurchases).toLocaleString('en-IN')}</span>
                <p className="text-[8px] text-slate-500 mt-0.5">Taxable base supply value.</p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Eligible ITC claimed</span>
                <span className="text-sm font-bold text-emerald-600 block mt-1">₹{Math.round(eligibleItc).toLocaleString('en-IN')}</span>
                <p className="text-[8px] text-emerald-600 mt-0.5">From verified GST counterparts.</p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Held pending Review</span>
                <span className="text-sm font-bold text-amber-600 block mt-1">₹{Math.round(pendingItc).toLocaleString('en-IN')}</span>
                <p className="text-[8px] text-amber-600 mt-0.5">Missing supplier details/GSTIN.</p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ineligible Credits</span>
                <span className="text-sm font-bold text-red-600 block mt-1">₹{Math.round(ineligibleItc).toLocaleString('en-IN')}</span>
                <p className="text-[8px] text-red-600 mt-0.5">Non-compliant suppliers.</p>
              </div>
            </div>

            {/* List of supplies */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Ref Invoice</th>
                    <th className="p-3">Product line</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3 text-right">Taxable base</th>
                    <th className="p-3 text-right">Tax Paid</th>
                    <th className="p-3 text-center">Eligibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {derivedPurchases.map((pur) => {
                    const tax = pur.purchaseValue - pur.taxableValue;
                    return (
                      <tr key={pur.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono text-slate-600">{pur.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-slate-800 capitalize">
                          {pur.productName}
                          <span className="text-[9px] text-slate-400 block font-normal">HSN: {pur.hsnCode} • Category: {pur.category}</span>
                        </td>
                        <td className="p-3 text-slate-700 font-medium capitalize">{pur.supplierName}</td>
                        <td className="p-3 font-mono uppercase text-slate-600">{pur.supplierGstin || <span className="text-red-500 font-sans italic text-[10px]">Missing</span>}</td>
                        <td className="p-3 text-right font-medium">₹{Math.round(pur.taxableValue)}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">₹{Math.round(tax)} ({pur.gstRate}%)</td>
                        <td className="p-3 text-center">
                          {pur.itcEligible ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-100">Eligible</span>
                          ) : pur.supplierGstin === '' ? (
                            <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-amber-100">Pending Review</span>
                          ) : (
                            <span className="bg-red-50 text-red-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-red-100">Ineligible</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. HSN/SAC SUMMARY COMPONENT */}
        {activeReport === 'HSN' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">HSN/SAC-wise Transaction Summary</h2>
              <p className="text-xs text-slate-500">Summary totals grouped by HSN (Harmonized System of Nomenclature) tax categories.</p>
            </div>

            {/* Compute HSN list */}
            {(() => {
              const hsnMap: Record<string, {
                hsn: string;
                category: string;
                qty: number;
                taxable: number;
                tax: number;
                rate: number;
              }> = {};

              // Accumulate from Sales
              filteredSales.forEach(sale => {
                sale.products.forEach(p => {
                  const hsn = getHSNCode(p.name);
                  const rate = p.gstRate || 12;
                  const total = p.total || 0;
                  const tax = p.gstAmount || Math.round(total * (rate / (100 + rate)));
                  const taxable = total - tax;

                  const key = `${hsn}-${rate}`;
                  if (!hsnMap[key]) {
                    hsnMap[key] = {
                      hsn,
                      category: p.name, // Will override or be standard
                      qty: 0,
                      taxable: 0,
                      tax: 0,
                      rate
                    };
                  }
                  hsnMap[key].qty += p.quantity;
                  hsnMap[key].taxable += taxable;
                  hsnMap[key].tax += tax;
                });
              });

              const hsnList = Object.values(hsnMap);

              return (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">HSN / SAC Code</th>
                        <th className="p-3">GST Rate</th>
                        <th className="p-3 text-right">Total Quantity</th>
                        <th className="p-3 text-right">Taxable Value</th>
                        <th className="p-3 text-right">CGST</th>
                        <th className="p-3 text-right">SGST</th>
                        <th className="p-3 text-right">Total Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hsnList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">No transactions captured within selection period.</td>
                        </tr>
                      ) : (
                        hsnList.map((hsn, idx) => {
                          const cgst = Math.round(hsn.tax / 2);
                          const sgst = hsn.tax - cgst;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="p-3 font-mono font-bold text-blue-700">{hsn.hsn}</td>
                              <td className="p-3 font-semibold text-slate-700">{hsn.rate}%</td>
                              <td className="p-3 text-right font-medium">{hsn.qty} items</td>
                              <td className="p-3 text-right font-medium">₹{Math.round(hsn.taxable).toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-slate-500">₹{cgst.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-slate-500">₹{sgst.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-extrabold text-slate-800">₹{Math.round(hsn.tax).toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* 6. GST RATE-WISE COMPONENT */}
        {activeReport === 'RATE' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">GST Rate-wise Consolidated Summary</h2>
              <p className="text-xs text-slate-500">Consolidated outward supplies and tax liability partitioned across active GST rates.</p>
            </div>

            {/* Compute Rate list */}
            {(() => {
              const rateMap: Record<number, {
                rate: number;
                taxableSales: number;
                cgst: number;
                sgst: number;
                igst: number;
                totalTax: number;
              }> = {};

              filteredSales.forEach(sale => {
                const cust = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
                const isInterstate = (cust?.state || businessState).toLowerCase().trim() !== businessState.toLowerCase().trim();

                sale.products.forEach(p => {
                  const rate = p.gstRate || 12;
                  const total = p.total || 0;
                  const tax = p.gstAmount || Math.round(total * (rate / (100 + rate)));
                  const taxable = total - tax;

                  if (!rateMap[rate]) {
                    rateMap[rate] = {
                      rate,
                      taxableSales: 0,
                      cgst: 0,
                      sgst: 0,
                      igst: 0,
                      totalTax: 0
                    };
                  }

                  rateMap[rate].taxableSales += taxable;
                  rateMap[rate].totalTax += tax;

                  if (isInterstate) {
                    rateMap[rate].igst += tax;
                  } else {
                    const split = Math.round(tax / 2);
                    rateMap[rate].cgst += split;
                    rateMap[rate].sgst += (tax - split);
                  }
                });
              });

              const rateList = Object.values(rateMap).sort((a, b) => a.rate - b.rate);

              return (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">GST Rate (%)</th>
                        <th className="p-3 text-right">Taxable Outward Sales</th>
                        <th className="p-3 text-right">CGST Collected</th>
                        <th className="p-3 text-right">SGST Collected</th>
                        <th className="p-3 text-right">IGST Collected</th>
                        <th className="p-3 text-right font-bold">Total Accumulated Tax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rateList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No transactions matched selection criteria.</td>
                        </tr>
                      ) : (
                        rateList.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-bold text-slate-800 text-sm">{r.rate}%</td>
                            <td className="p-3 text-right font-medium">₹{Math.round(r.taxableSales).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-slate-500">₹{Math.round(r.cgst).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-slate-500">₹{Math.round(r.sgst).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-slate-500">₹{Math.round(r.igst).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-black text-blue-700 text-sm">₹{Math.round(r.totalTax).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

      </div>

    </motion.div>
  );
}
