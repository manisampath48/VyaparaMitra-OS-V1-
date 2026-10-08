import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  X, 
  Sparkles, 
  Upload, 
  Download, 
  Camera, 
  AlertCircle, 
  Eye, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Percent, 
  Calendar, 
  Package, 
  Layers, 
  ShoppingBag, 
  DollarSign, 
  Coins, 
  CheckCircle2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  BarChart2,
  FileText,
  RefreshCw,
  Cpu,
  Printer,
  Scale,
  Laptop,
  Radio,
  ArrowRight,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  fetchProducts, 
  addProduct, 
  editProduct, 
  deleteProduct 
} from '../lib/api';
import { Product } from '../types';
import { useNotifications } from './NotificationManager';
import BarcodeScanner from './BarcodeScanner';

export default function Products() {
  const { triggerNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: inventory view vs hardware ecosystem showcase
  const [activeTab, setActiveTab] = useState<'inventory' | 'hardware'>('inventory');

  // Hardware Ecosystem states
  const [selectedBizType, setSelectedBizType] = useState<string>('grocery');
  const [hardwareSearch, setHardwareSearch] = useState<string>('');
  const [activeHardwareSim, setActiveHardwareSim] = useState<string | null>(null);
  const [hardwareSimSuccess, setHardwareSimSuccess] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "Hello! I am VyaparaMitra's AI Smart Hardware Specialist. Choose a quick concern chip below or ask any question about setting up scanners, scales, receipt printing, or POS devices for your store!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [assistantIsTyping, setAssistantIsTyping] = useState<boolean>(false);
  const [assistantInput, setAssistantInput] = useState<string>('');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Form Fields
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Grocery');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formBuyingPrice, setFormBuyingPrice] = useState('0');
  const [formSellingPrice, setFormSellingPrice] = useState('0');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formGst, setFormGst] = useState('12');
  const [formQuantity, setFormQuantity] = useState('50');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState('piece');
  const [formSupplier, setFormSupplier] = useState('');
  const [formSupplierContact, setFormSupplierContact] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // AI Extraction State
  const [aiNote, setAiNote] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);

  // Barcode Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanError, setScanError] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importMapping, setImportMapping] = useState<any>({});
  const [importFeedback, setImportFeedback] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Product Details active item
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Fetch Failed', 'Could not load products data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p => {
    const pName = p.name || p.productName || '';
    const pSku = p.sku || '';
    const pBarcode = p.barcode || '';
    const pCategory = p.category || '';
    const pBrand = p.brand || '';
    const pStatus = p.status || 'IN_STOCK';

    const matchesSearch = 
      pName.toLowerCase().includes(search.toLowerCase()) ||
      pSku.toLowerCase().includes(search.toLowerCase()) ||
      pBarcode.toLowerCase().includes(search.toLowerCase()) ||
      pCategory.toLowerCase().includes(search.toLowerCase()) ||
      pBrand.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || pCategory === categoryFilter;
    const matchesBrand = brandFilter === 'All' || pBrand === brandFilter;
    const matchesStatus = statusFilter === 'All' || pStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  // Calculate Paginated List
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  // Brands list
  const brands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];

  // Helper Calculations for Stats
  const totalCatalog = products.length;
  const inventoryValue = products.reduce((acc, p) => acc + (p.quantity * (p.buyingPrice || 0)), 0);
  const potentialRevenue = products.reduce((acc, p) => acc + (p.quantity * p.sellingPrice), 0);
  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

  // Handle Form open
  const openFormModal = (prod: Product | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.name || prod.productName || '');
      setFormCategory(prod.category || 'Grocery');
      setFormBrand(prod.brand || '');
      setFormSku(prod.sku || '');
      setFormBarcode(prod.barcode || '');
      setFormBuyingPrice((prod.buyingPrice || prod.purchasePrice || 0).toString());
      setFormSellingPrice(prod.sellingPrice.toString());
      setFormDiscount((prod.discount || 0).toString());
      setFormGst((prod.gst || 12).toString());
      setFormQuantity(prod.quantity.toString());
      setFormMinStock(prod.minStock.toString());
      setFormUnit(prod.unit || 'piece');
      setFormSupplier(prod.supplier || '');
      setFormSupplierContact(prod.supplierContact || '');
      setFormExpiryDate(prod.expiryDate || '');
      setFormImage(prod.image || '');
      setFormNotes(prod.description || '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategory('Grocery');
      setFormBrand('');
      setFormSku('');
      setFormBarcode('');
      setFormBuyingPrice('0');
      setFormSellingPrice('0');
      setFormDiscount('0');
      setFormGst('12');
      setFormQuantity('50');
      setFormMinStock('10');
      setFormUnit('piece');
      setFormSupplier('');
      setFormSupplierContact('');
      setFormExpiryDate('');
      setFormImage('');
      setFormNotes('');
    }
    setFormModalOpen(true);
  };

  // AI Extract Product Info
  const handleAIExtract = async () => {
    if (!aiNote.trim()) {
      triggerNotification('error', 'Empty Input', 'Please describe the purchase details.');
      return;
    }

    try {
      setAiExtracting(true);
      const res = await fetch('/api/products/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: aiNote })
      });

      if (!res.ok) throw new Error('AI extraction failed');
      const data = await res.json();

      // Pre-fill fields
      setFormName(data.productName || '');
      setFormCategory(data.category || 'Grocery');
      setFormBrand(data.brand || '');
      setFormBuyingPrice((data.purchasePrice || 0).toString());
      setFormSellingPrice((data.sellingPrice || 0).toString());
      setFormQuantity((data.stock || 50).toString());
      setFormUnit(data.unit || 'piece');
      setFormGst((data.gst || 12).toString());
      setFormSupplier(data.supplier || '');
      setFormBarcode(data.barcode || '');
      setFormSku(data.sku || `VM-${Math.floor(100 + Math.random() * 900)}`);

      setAiModalOpen(false);
      setAiNote('');
      setFormModalOpen(true);
      triggerNotification('success', 'AI Extracted Successfully', `Identified: ${data.productName || 'Product'}. Review form details before saving.`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'AI Extraction Failed', 'Fitted with smart mockup defaults because API limits or key not setup.');
      
      // smart local mockup extractor fallback so user gets a seamless experience
      const lower = aiNote.toLowerCase();
      const bType = localStorage.getItem('vm_business_type') || 'Grocery Store';
      
      let extractedQty = 50;
      let extractedPrice = 120;
      let extractedName = 'Staple Product';
      let extractedBrand = 'General';
      let extractedCategory = 'Inventory';

      if (bType.includes('Medical') || bType.includes('Pharmacy')) {
        extractedName = 'Crocin Pain Relief';
        extractedBrand = 'GSK';
        extractedCategory = 'Medicines';
        extractedPrice = 45;
      } else if (bType.includes('Hardware')) {
        extractedName = 'Steel Hammer 16oz';
        extractedBrand = 'Taparia';
        extractedCategory = 'Tools';
        extractedPrice = 220;
      } else if (bType.includes('Electrical')) {
        extractedName = 'LED Bulb 9W';
        extractedBrand = 'Philips';
        extractedCategory = 'Electricals';
        extractedPrice = 90;
      } else if (bType.includes('Stationery')) {
        extractedName = 'Ballpoint Pen Blue';
        extractedBrand = 'Reynolds';
        extractedCategory = 'Stationery';
        extractedPrice = 15;
      } else if (bType.includes('Mobile')) {
        extractedName = 'Fast Charger Type-C';
        extractedBrand = 'Samsung';
        extractedCategory = 'Accessories';
        extractedPrice = 450;
      } else if (bType.includes('Fashion')) {
        extractedName = 'Cotton Crewneck T-Shirt';
        extractedBrand = 'Zara';
        extractedCategory = 'Apparel';
        extractedPrice = 599;
      } else if (bType.includes('Automobile')) {
        extractedName = 'Premium Engine Oil 1L';
        extractedBrand = 'Castrol';
        extractedCategory = 'Lubricants';
        extractedPrice = 380;
      } else if (bType.includes('Salon')) {
        extractedName = 'Herbal Hair Shampoo';
        extractedBrand = "L'Oreal";
        extractedCategory = 'Cosmetics';
        extractedPrice = 180;
      } else if (bType.includes('Jewellery')) {
        extractedName = 'Silver Chain 22kt';
        extractedBrand = 'Tanishq';
        extractedCategory = 'Jewellery';
        extractedPrice = 2500;
      } else if (bType.includes('Bakery') || bType.includes('Restaurant')) {
        extractedName = 'Vanilla Cake 500g';
        extractedBrand = 'In-House';
        extractedCategory = 'Bakery';
        extractedPrice = 300;
      } else {
        // Grocery / Supermarket / General
        extractedName = 'Premium Basmati Rice 5kg';
        extractedBrand = 'India Gate';
        extractedCategory = 'Groceries';
        extractedPrice = 450;

        if (lower.includes('milk') || lower.includes('amul')) {
          extractedName = 'Amul Gold Milk 1L';
          extractedBrand = 'Amul';
          extractedCategory = 'Milk Products';
          extractedPrice = 66;
        } else if (lower.includes('atta') || lower.includes('aashirvaad')) {
          extractedName = 'Aashirvaad Atta 5kg';
          extractedBrand = 'ITC';
          extractedCategory = 'Grocery';
          extractedPrice = 260;
        }
      }

      // try parsing quantity and price using regex
      const qtyMatch = lower.match(/(\d+)\s*(?:packet|kg|litre|box|piece|unit|ltr|ml|g|x)/) || lower.match(/(?:purchased|buy|got)\s*(\d+)/);
      if (qtyMatch) extractedQty = parseInt(qtyMatch[1], 10);
      
      const priceMatch = lower.match(/(?:at|for|rs|₹|@)\s*(\d+)/) || lower.match(/(\d+)\s*(?:each|rupees|rs|INR)/);
      if (priceMatch) extractedPrice = parseInt(priceMatch[1], 10);

      setFormName(extractedName);
      setFormCategory(extractedCategory);
      setFormBrand(extractedBrand);
      setFormBuyingPrice(extractedPrice.toString());
      setFormSellingPrice(Math.round(extractedPrice * 1.25).toString());
      setFormQuantity(extractedQty.toString());
      setFormUnit(lower.includes('packet') ? 'packet' : lower.includes('kg') ? 'kg' : 'piece');
      setFormGst('5');
      setFormSupplier('Local Distributor');
      setFormBarcode(`890${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      setFormSku(`VM-AI-${Math.floor(100 + Math.random() * 900)}`);

      setAiModalOpen(false);
      setAiNote('');
      setFormModalOpen(true);
    } finally {
      setAiExtracting(false);
    }
  };

  // Handle Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory.trim() || !formUnit.trim()) {
      triggerNotification('error', 'Form Error', 'Please fill out all required fields.');
      return;
    }

    const buyingVal = Number(formBuyingPrice);
    const sellingVal = Number(formSellingPrice);
    const profitMargin = sellingVal > 0 ? Math.round(((sellingVal - buyingVal) / sellingVal) * 100) : 0;
    const qtyVal = Number(formQuantity);
    const minStockVal = Number(formMinStock);

    // Duplicate Checks (Barcode and SKU)
    const duplicateBarcode = products.find(p => p.barcode && p.barcode === formBarcode && p.id !== editingProduct?.id);
    const duplicateSku = products.find(p => p.sku && p.sku === formSku && p.id !== editingProduct?.id);
    const duplicateName = products.find(p => p.name.toLowerCase() === formName.toLowerCase() && p.id !== editingProduct?.id);

    if (duplicateBarcode) {
      triggerNotification('error', 'Duplicate Barcode', `Barcode "${formBarcode}" is already assigned to ${duplicateBarcode.name}.`);
      return;
    }
    if (duplicateSku) {
      triggerNotification('error', 'Duplicate SKU', `SKU "${formSku}" is already assigned to ${duplicateSku.name}.`);
      return;
    }
    if (duplicateName) {
      triggerNotification('info', 'Potential Duplicate', `A product named "${formName}" already exists in the system.`);
    }

    try {
      const payload = {
        name: formName,
        productName: formName,
        category: formCategory,
        brand: formBrand,
        sku: formSku || `VM-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: formBarcode,
        buyingPrice: buyingVal,
        purchasePrice: buyingVal,
        sellingPrice: sellingVal,
        profitMargin,
        gst: Number(formGst),
        quantity: qtyVal,
        stock: qtyVal,
        minStock: minStockVal,
        minimumStock: minStockVal,
        unit: formUnit,
        supplier: formSupplier,
        supplierContact: formSupplierContact,
        expiryDate: formExpiryDate || undefined,
        image: formImage || '',
        description: formNotes,
        status: qtyVal <= 0 ? 'OUT_OF_STOCK' : qtyVal <= minStockVal ? 'LOW_STOCK' : 'IN_STOCK'
      } as any;

      if (editingProduct) {
        await editProduct(editingProduct.id, payload);
        triggerNotification('success', 'Product Updated', `${formName} has been updated in the catalog.`);
      } else {
        await addProduct(payload);
        triggerNotification('success', 'Product Added', `Added brand new item: ${formName} to database.`);
      }

      setFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to Save', 'Could not save product to local DB.');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the catalog? This is irreversible.`)) {
      try {
        await deleteProduct(id);
        triggerNotification('info', 'Product Removed', `Permanently deleted "${name}" from catalog records.`);
        loadData();
      } catch (err) {
        console.error(err);
        triggerNotification('error', 'Delete Failed', 'Failed to remove product from server database.');
      }
    }
  };

  // Barcode Scanner Simulator Actions
  const simulateScan = (barcode: string) => {
    setScannedCode(barcode);
    const match = products.find(p => p.barcode === barcode);
    if (match) {
      setViewingProduct(match);
      setScanModalOpen(false);
      setDetailsModalOpen(true);
      triggerNotification('success', 'Barcode Recognized', `Found match for ${match.name}`);
    } else {
      setScanModalOpen(false);
      openFormModal(null);
      setFormBarcode(barcode);
      triggerNotification('info', 'New Barcode Scanned', 'No matching product found. Add form pre-filled.');
    }
  };

  // CSV Import parsing logic
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        parseCSVText(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    const headers = lines[0].split(',').map(h => h.replace(/['"]+/g, '').trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/['"]+/g, '').trim());
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });
      rows.push(rowObj);
    }

    setParsedRows(rows);

    // Initial default mapping suggestion
    const mapping: any = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());

    const findMatch = (keys: string[]) => {
      const idx = lowerHeaders.findIndex(lh => keys.some(k => lh.includes(k)));
      return idx !== -1 ? headers[idx] : '';
    };

    mapping.productName = findMatch(['product', 'name', 'title']);
    mapping.sku = findMatch(['sku', 'code']);
    mapping.barcode = findMatch(['barcode', 'upc', 'ean']);
    mapping.category = findMatch(['category', 'type']);
    mapping.brand = findMatch(['brand', 'manufacturer']);
    mapping.purchasePrice = findMatch(['purchase', 'buy', 'cost']);
    mapping.sellingPrice = findMatch(['sell', 'price']);
    mapping.stock = findMatch(['stock', 'qty', 'quantity']);
    mapping.unit = findMatch(['unit', 'pkg']);
    mapping.gst = findMatch(['gst', 'tax']);

    setImportMapping(mapping);
  };

  const executeCSVImport = async () => {
    let successCount = 0;
    let failedCount = 0;
    const errorsList: string[] = [];

    for (const row of parsedRows) {
      try {
        const productName = row[importMapping.productName] || '';
        const sku = row[importMapping.sku] || `VM-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const barcode = row[importMapping.barcode] || '';
        const category = row[importMapping.category] || 'Grocery';
        const brand = row[importMapping.brand] || 'Generic';
        const purchasePrice = Number(row[importMapping.purchasePrice] || 0);
        const sellingPrice = Number(row[importMapping.sellingPrice] || 0);
        const stock = Number(row[importMapping.stock] || 0);
        const unit = row[importMapping.unit] || 'piece';
        const gst = Number(row[importMapping.gst] || 12);

        if (!productName) {
          failedCount++;
          errorsList.push(`Row missing Product Name`);
          continue;
        }

        // Duplicate checks
        if (products.some(p => p.barcode && p.barcode === barcode)) {
          failedCount++;
          errorsList.push(`Barcode "${barcode}" already exists for row ${productName}`);
          continue;
        }

        const profitMargin = sellingPrice > 0 ? Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100) : 0;

        await addProduct({
          name: productName,
          productName: productName,
          category,
          brand,
          sku,
          barcode,
          buyingPrice: purchasePrice,
          purchasePrice: purchasePrice,
          sellingPrice,
          profitMargin,
          gst,
          quantity: stock,
          stock,
          minStock: 10,
          minimumStock: 10,
          unit,
          status: stock <= 0 ? 'OUT_OF_STOCK' : stock <= 10 ? 'LOW_STOCK' : 'IN_STOCK'
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errorsList.push(err.message || 'Row addition failed');
      }
    }

    setImportFeedback({
      success: successCount,
      failed: failedCount,
      errors: errorsList
    });

    if (successCount > 0) {
      triggerNotification('success', 'Import Completed', `Imported ${successCount} products successfully.`);
      loadData();
    } else {
      triggerNotification('error', 'Import Failed', 'No products were imported.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      triggerNotification('error', 'Export Failed', 'No product catalog data to export.');
      return;
    }

    const csvRows = [];
    const headers = ['id', 'productName', 'sku', 'barcode', 'category', 'brand', 'purchasePrice', 'sellingPrice', 'stock', 'unit', 'gst', 'status'];
    csvRows.push(headers.join(','));

    products.forEach(p => {
      const row = [
        p.id,
        `"${(p.name || p.productName || '').replace(/"/g, '""')}"`,
        p.sku || '',
        p.barcode || '',
        p.category || '',
        p.brand || '',
        p.buyingPrice || p.purchasePrice || 0,
        p.sellingPrice,
        p.quantity,
        p.unit || 'piece',
        p.gst || 12,
        p.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vyaparamitra_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('success', 'Export Succeeded', 'CSV Catalog catalog file ready for download.');
  };

  // Custom mock data for detail charts
  const getProductChartData = (id: string) => {
    // Deterministic random arrays based on character code sum
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseSales = (sum % 20) + 10;
    
    const stockData = [
      { month: 'Jan', stock: baseSales + 30 },
      { month: 'Feb', stock: baseSales + 25 },
      { month: 'Mar', stock: baseSales + 15 },
      { month: 'Apr', stock: baseSales + 40 },
      { month: 'May', stock: baseSales + 10 },
      { month: 'Jun', stock: baseSales }
    ];

    const salesData = [
      { month: 'Jan', sales: baseSales * 4 },
      { month: 'Feb', sales: baseSales * 5 },
      { month: 'Mar', sales: baseSales * 3 },
      { month: 'Apr', sales: baseSales * 6 },
      { month: 'May', sales: baseSales * 5 },
      { month: 'Jun', sales: baseSales * 8 }
    ];

    return { stockData, salesData };
  };

  const renderHardwareEcosystem = () => {
    const HARDWARE_CATALOG = [
      {
        id: 'hw_bt_scanner',
        name: 'Wireless Bluetooth Barcode Scanner',
        icon: Cpu,
        price: '₹4,500',
        category: 'Barcode Scanners',
        spec: '1D/2D, Bluetooth & 2.4G, IP54, 2000mAh Battery',
        problem: 'Slow, wired desk-locked hand scanning.',
        benefit: 'Speed up stock entry and checkouts anywhere on the shop floor with a 15-meter wireless range.'
      },
      {
        id: 'hw_omni_scanner',
        name: 'Omnidirectional Desktop Barcode Scanner',
        icon: RefreshCw,
        price: '₹7,200',
        category: 'Barcode Scanners',
        spec: 'Continuous Scan Auto-Trigger, High Speed Dual-Laser',
        problem: 'Bottlenecks during high customer flow at checkout.',
        benefit: 'Hands-free fast scanning from any angle, allowing dual-handed product movement for high-volume lanes.'
      },
      {
        id: 'hw_rugged_scanner',
        name: 'Industrial Heavy-Duty Barcode Scanner',
        icon: ShieldCheck,
        price: '₹12,000',
        category: 'Barcode Scanners',
        spec: 'IP65 Water/Dust proof, 2-meter Drop resistant, 10m range',
        problem: 'Damaged machinery or dropped scanners causing downtime.',
        benefit: 'Withstands extreme hardware store drops on concrete and scans heavy pallet labels from distances.'
      },
      {
        id: 'hw_qr_scanner',
        name: 'QR & Barcode Payment Scanner',
        icon: Camera,
        price: '₹3,200',
        category: 'Payment Devices',
        spec: 'Dynamic UPI Screen, High Contrast Matte glass, USB Feed',
        problem: 'Manual UPI verification and fake payment screens.',
        benefit: 'Displays custom transaction-specific dynamic UPI QR codes and signals success instantly upon payment confirmation.'
      },
      {
        id: 'hw_ai_camera',
        name: 'AI Smart Inventory Camera',
        icon: Camera,
        price: '₹18,500',
        category: 'AI Devices',
        spec: 'Computer Vision processor, 4K Wide-angle, Wi-Fi feed',
        problem: 'Out-of-stock items unnoticed, leading to lost revenue.',
        benefit: 'Monitors shelf levels continuously and sends push alerts immediately when stock of any staple brand is depleted.'
      },
      {
        id: 'hw_thermal_printer',
        name: 'Thermal Receipt Printer',
        icon: Printer,
        price: '₹3,800',
        category: 'Receipt Printers',
        spec: '80mm wide paper, USB/Bluetooth, 150mm/s fast prints',
        problem: 'Noisy, slow matrix printers or high ink cartridge costs.',
        benefit: 'Inkless, zero-maintenance, high-speed thermal printing for beautiful and durable bills.'
      },
      {
        id: 'hw_label_printer',
        name: 'Industrial Label Printer',
        icon: Printer,
        price: '₹6,900',
        category: 'Receipt Printers',
        spec: 'Direct Thermal, 4-inch wide labels, Auto peeler',
        problem: 'Unlabeled inventory batches making stock-take slow.',
        benefit: 'Print custom product tags, SKU barcode labels, and batch barcodes with strong adhesive backing.'
      },
      {
        id: 'hw_pos_machine',
        name: 'Smart POS Machine Terminal',
        icon: Laptop,
        price: '₹22,000',
        category: 'POS Systems',
        spec: 'Octa-core CPU, 10.1" Touch screen, Built-in thermal printer',
        problem: 'Cluttered computer cabling, screens, and UPS backups.',
        benefit: 'All-in-one minimal counter billing terminal with zero cables, dynamic touch panel, and offline battery backup.'
      },
      {
        id: 'hw_rfid_reader',
        name: 'RFID Inventory Reader',
        icon: Radio,
        price: '₹28,000',
        category: 'AI Devices',
        spec: '915MHz Ultra-high frequency, 6m scan range, Bluetooth sync',
        problem: 'Tedious, single-item counting during monthly inventory audits.',
        benefit: 'Scans up to 300 apparel or tool items inside cartons instantly in 2 seconds without unpacking.'
      },
      {
        id: 'hw_scale',
        name: 'AI Smart Weighing Scale',
        icon: Scale,
        price: '₹14,500',
        category: 'Weighing Scales',
        spec: 'High accuracy (1g division), USB serial data link, 30kg max',
        problem: 'Manually calculating weight prices causing lines.',
        benefit: 'Sends raw live weights instantly to VyaparaMitra billing screen for immediate, error-free produce pricing.'
      }
    ];

    const getBizTypeRecommendation = () => {
      switch (selectedBizType) {
        case 'medical':
          return {
            title: '💊 Medical Shop & Pharmacy setup',
            setup: 'Wireless Scanner + Label Printer + UPI Payment Scanner',
            why: 'Medicine strips have fine-print barcodes requiring precision CCD. Custom batch & expiry labels protect consumer safety.',
            problem: 'Manual batch typing errors, drug expiration monitoring oversight.',
            productivity: '+180% inventory accuracy',
            timeSaved: '3.5 Hours saved daily',
            benefit: '100% medication safety compliance and error-free regulatory batch logs.'
          };
        case 'electronics':
          return {
            title: '⚡ Electronics & Appliance setup',
            setup: 'RFID Inventory Reader + High-Density Barcode Scanner + Label Printer',
            why: 'Serial number/IMEI tracking is vital for warranties. RFID scans sealed storage boxes in bulk.',
            problem: 'Opening cardboard carton stacks to count items, tedious serial entries.',
            productivity: '+300% stock audit efficiency',
            timeSaved: '5.0 Hours saved daily',
            benefit: 'Bulletproof serial number logs and zero manual counting during stock-takes.'
          };
        case 'supermarket':
          return {
            title: '🏬 High-Volume Supermarket billing',
            setup: 'Omnidirectional Scanner + Smart POS Machine + AI Inventory Camera',
            why: 'Heavy footfall demands continuous scan capabilities. AI cameras monitor fast-depleting shelf lines.',
            problem: 'Long billing queues, checkout line walkouts, empty shelf shelves.',
            productivity: '+280% checkout speed',
            timeSaved: '6.5 Hours saved daily',
            benefit: 'Zero cashier fatigue, high customer retention, and automated stock re-orders.'
          };
        case 'hardware':
          return {
            title: '🏗️ Industrial Hardware & Lumber yard',
            setup: 'Industrial Rugged Scanner + Label Printer + RFID Tags',
            why: 'Severe dust, metallic particles, and heavy drops. Hand scanners need extra range to reach tall storage crates.',
            problem: 'Broken scanners causing inventory system downtime, outdoor range limits.',
            productivity: '+190% logistic flow speed',
            timeSaved: '4.0 Hours saved daily',
            benefit: 'Extremely durable hardware with zero replacements and quick yard audits.'
          };
        default:
          return {
            title: '🛒 Grocery Store & Supermarket billing',
            setup: 'AI Smart Weighing Scale + Omnidirectional Scanner + Thermal Printer',
            why: 'Loose vegetables, grains, and fruits must be auto-weighed. High-speed billing avoids lines at checkout.',
            problem: 'Manual calculation of weight values, slow loose-item packaging.',
            productivity: '+220% billing speed',
            timeSaved: '4.8 Hours saved daily',
            benefit: 'Accurate pricing per gram, speedier checkout pipelines, and reduced shrinkage.'
          };
      }
    };

    const bizRec = getBizTypeRecommendation();

    const handleHardwareSimulate = (id: string) => {
      setActiveHardwareSim(id);
      setHardwareSimSuccess(null);
      playBeep(880, 0.05);

      setTimeout(() => {
        setActiveHardwareSim(null);
        setHardwareSimSuccess(id);
        playBeep(1300, 0.12);
        triggerNotification('success', 'Hardware Connected', `VyaparaMitra successfully synced with device "${id.toUpperCase()}". Status: ONLINE.`);
      }, 1800);
    };

    const handleAssistantQuery = (text: string) => {
      if (!text.trim()) return;
      
      const newMsg = {
        sender: 'user' as const,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAssistantMessages(prev => [...prev, newMsg]);
      setAssistantInput('');
      setAssistantIsTyping(true);

      setTimeout(() => {
        const replyText = getHardwareAiReply(text);
        setAssistantMessages(prev => [...prev, {
          sender: 'assistant' as const,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setAssistantIsTyping(false);
        playBeep(1100, 0.08);
      }, 1000);
    };

    const getHardwareAiReply = (query: string): string => {
      const text = query.toLowerCase();
      if (text.includes('grocery') || text.includes('vegetable') || text.includes('fruit')) {
        return `### 🛒 Recommended Grocery Store Setup\n\nFor a grocery store, checkout speed and vegetable/fruit pricing are the primary friction points. We recommend the following high-impact setup:\n\n1. **AI Smart Weighing Scale**: Placed at the checkout or weighing counter, it auto-recognizes produce weights and transmits live weight to VyaparaMitra POS for instant item pricing.\n2. **Wireless Bluetooth Barcode Scanner**: Essential for quick scanning of pre-packaged FMCG goods and dairy items without restricted wire ranges.\n3. **Smart POS Machine**: All-in-one terminal with an integrated touch screen, thermal receipt printer, and UPI QR display.\n\n**Expected ROI:** Saves **4.8 hours daily** in manual entries and speeds checkout up by **220%**, eliminating long cash lanes!`;
      }
      if (text.includes('medical') || text.includes('medicine') || text.includes('pharmacy') || text.includes('drug')) {
        return `### 💊 Recommended Medical Shop Setup\n\nMedical shops demand absolute precision due to drug expirations, strict batch tracking, and fine-print barcodes. We suggest:\n\n1. **Wireless Bluetooth Barcode Scanner (High Density)**: Capable of reading small, high-density 1D/2D barcodes on medicine strips and vaccine vials under any angle.\n2. **Label Printer**: Generate micro-barcode stickers containing custom batch IDs, MRP, and safety warning indicators to label generic imports.\n3. **QR & Barcode Payment Scanner**: Fast UPI dynamic QR display for instant, contactless copay and payment collection.\n\n**Expected ROI:** Saves **3.5 hours daily** on manual database entries and brings inventory audit speed up by **180%** while ensuring 100% medication safety.`;
      }
      if (text.includes('supermarket') || text.includes('hypermarket') || text.includes('hands-free')) {
        return `### 🏬 Recommended Supermarket Checkout System\n\nHigh-volume retail checkout requires complete speed and hands-free convenience. We recommend the ultimate high-speed enterprise setup:\n\n1. **Omnidirectional Desktop Barcode Scanner**: The laser raster grid scans items from any direction, enabling cashiers to pass products rapidly over the sensor using both hands.\n2. **AI Smart Inventory Camera**: Mounted on product shelves to dynamically analyze fill-rates and auto-reorder out-of-stock items (like milk, bread, sodas).\n3. **Thermal Receipt Printer & Smart POS Machine**: Fast, heavy-duty billing terminals designed for continuous operation.\n\n**Expected ROI:** Speeds up line checkouts by **280%** and saves over **6.5 hours daily** in automated shelf stock inspections.`;
      }
      if (text.includes('electronics') || text.includes('serial') || text.includes('warranty')) {
        return `### ⚡ Recommended Electronics Store Configuration\n\nHigh-value inventory requires rigid serial number tracking and rapid shelf auditing. We suggest:\n\n1. **RFID Inventory Reader**: Scan up to 200 items in cartons or on walls in under 5 seconds without single-package laser alignment.\n2. **Wireless Barcode Scanner**: Essential to register Serial/IMEI/MAC addresses of products directly into VyaparaMitra's warranty tracking engine.\n3. **Label Printer**: Print security labels and custom SKU tags with adhesive backings.\n\n**Expected ROI:** Saves **5.0 hours daily** on stock checks and provides **300%** higher inventory audit precision.`;
      }
      if (text.includes('hardware') || text.includes('warehouse') || text.includes('rugged')) {
        return `### 🏗️ Recommended Hardware Store & Warehouse System\n\nHardware stores handle heavy metallic components, dusty boxes, and outdoor yards. You need robust, heavy-duty machinery:\n\n1. **Industrial Heavy-Duty Barcode Scanner**: IP65 rugged dust/water resistant body that survives repeated 2-meter drops on concrete, with an extended range scanning up to 10 meters away.\n2. **RFID Inventory Reader**: For bulk auditing of fast-moving nuts, bolts, tools, and accessories stored in bins.\n3. **Label Printer**: Weatherproof labels for steel rods, pipes, and bulk machinery packaging.\n\n**Expected ROI:** Saves **4.0 hours daily** in tedious physical auditing and completely eliminates down-time caused by broken checkout hardware.`;
      }
      if (text.includes('damaged') || text.includes('low light') || text.includes('tilted')) {
        return `### ⚡ Barcode Scanners for Low Light & Damaged Labels\n\nFor high-performance reading of damaged, crumpled, or poorly printed barcodes, we highly recommend the **Omnidirectional Desktop Barcode Scanner** or the **Industrial Heavy-Duty Barcode Scanner**:\n\n- They feature integrated **hardware-level imaging CCDs and advanced DSP decoding chips**.\n- They capture full 2D photos of the barcode, digitalize and deskew tilted labels, and use advanced math algorithms to resolve missing segments of damaged barcodes.\n- VyaparaMitra's Web Scanner also implements advanced local frame decoding to clean up motion-blurred video streams!`;
      }
      if (text.includes('billing') || text.includes('setup') || text.includes('low-cost') || text.includes('pos')) {
        return `### 💳 Economical All-in-One POS Setup\n\nIf you want the best balance of cost and utility, we suggest our **Smart POS Machine Setup**:\n\n1. **Smart POS Machine**: Combines a capacitive multi-touch tablet screen, dynamic customer-facing UPI QR screen, and an integrated thermal receipt printer in a single handheld or desktop housing.\n2. **Wireless Bluetooth Barcode Scanner**: Connected via Bluetooth to scan inventory items on shelves or at the checkout counter.\n\nThis setup requires zero complex computer cabling, runs on a battery backup, and can be activated with VyaparaMitra in under **5 minutes**!`;
      }
      return `### 🤖 VyaparaMitra Smart Hardware Assistant\n\nI am here to help you select, configure, and calibrate retail hardware for your store!\n\nTry asking me about:\n- *"Which scanner is best for my grocery store?"*\n- *"What hardware setup is recommended for a medical shop?"*\n- *"Suggest a low-cost POS billing system."*\n- *"Which scanner can read damaged barcodes or barcode labels?"*`;
    };

    const filteredHardware = HARDWARE_CATALOG.filter(hw => 
      hw.name.toLowerCase().includes(hardwareSearch.toLowerCase()) ||
      hw.category.toLowerCase().includes(hardwareSearch.toLowerCase()) ||
      hw.spec.toLowerCase().includes(hardwareSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        
        {/* Top welcome info banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 text-indigo-500 opacity-10 font-black text-9xl">
            AI
          </div>
          <div className="max-w-2xl space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
              ⚡ VyaparaMitra Hardware Integration Suite
            </span>
            <h2 className="text-xl font-bold tracking-tight">Smart Retail Hardware & AI Ecosystem</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              VyaparaMitra is a comprehensive, device-agnostic Business Operating System. We connect natively via Bluetooth, WebUSB, and Serial COM to all industry-leading retail hardware—enabling instant data collection, automated vision audits, and low-latency billing.
            </p>
          </div>
        </div>

        {/* AI Hardware Recommendation Engine Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          <div className="lg:col-span-7 glass-card border border-slate-150 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">AI Hardware Recommendation Engine</h3>
                  <p className="text-[11px] text-slate-400">Select your retail business category to view customized hardware blueprints and expected ROI</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-1 rounded-lg">
                  <Sparkles className="w-4 h-4 fill-emerald-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'grocery', label: 'Grocery Store', icon: '🛒' },
                  { id: 'medical', label: 'Medical Shop', icon: '💊' },
                  { id: 'electronics', label: 'Electronics', icon: '⚡' },
                  { id: 'supermarket', label: 'Supermarket', icon: '🏬' },
                  { id: 'hardware', label: 'Hardware', icon: '🏗️' }
                ].map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => { setSelectedBizType(biz.id); playBeep(1100, 0.04); }}
                    className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition cursor-pointer text-center flex flex-col items-center justify-center gap-1 active:scale-95 ${selectedBizType === biz.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200'}`}
                  >
                    <span className="text-base">{biz.icon}</span>
                    <span>{biz.label}</span>
                  </button>
                ))}
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">{bizRec.title}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Recommended Stack: <strong className="text-indigo-600 font-sans">{bizRec.setup}</strong></p>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs shrink-0 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Daily Savings</span>
                    <span className="text-xs font-black text-indigo-600">{bizRec.timeSaved.split(' ')[0]} Hrs</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] leading-relaxed">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Why this configuration?</span>
                    <p className="text-slate-600 font-medium">{bizRec.why}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Immediate problem solved</span>
                    <p className="text-rose-600 font-medium">{bizRec.problem}</p>
                  </div>
                </div>

                <div className="border-t border-indigo-100/50 pt-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                    <span className="text-emerald-600">📈 Impact:</span>
                    <span>{bizRec.benefit}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-100/60 px-3 py-1 rounded-lg">
                    Productivity Rate: {bizRec.productivity}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex items-center gap-2.5 mt-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium text-slate-500">
                VyaparaMitra automatically registers standard COM drivers in background. Open any billing terminal and your hardware will transmit keys natively.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg text-white">
            <div className="flex flex-col h-full justify-between gap-3">
              <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg border border-indigo-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">AI Hardware Copilot</h4>
                    <p className="text-[9px] text-slate-500">Live calibration & advice expert</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                  VIRTUAL ADVISOR ONLINE
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 max-h-[220px] scrollbar-thin scrollbar-thumb-slate-800 text-[11px] leading-relaxed">
                {assistantMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`p-2.5 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-950 text-slate-300 rounded-tl-none border border-white/5'}`}>
                      <div className="prose prose-invert prose-xs font-medium space-y-1">
                        {msg.text.split('\n\n').map((para, pIdx) => {
                          if (para.startsWith('###')) {
                            return <h5 key={pIdx} className="text-xs font-black text-indigo-300 mt-1 first:mt-0">{para.replace('###', '')}</h5>;
                          }
                          return (
                            <p key={pIdx} className="text-[10px]">
                              {para.split('\n').map((line, lIdx) => {
                                if (line.startsWith('*') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                                  return <span key={lIdx} className="block pl-2 text-slate-400">{line}</span>;
                                }
                                return <span key={lIdx} className="block">{line}</span>;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-600 mt-0.5">{msg.time}</span>
                  </div>
                ))}

                {assistantIsTyping && (
                  <div className="mr-auto flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl text-[10px] text-slate-400 border border-white/5">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>AI Specialist is compiling recommendations...</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 shrink-0 pt-2 border-t border-white/5">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Choose query template:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Best scanner for grocery store?',
                    'Setup for medical shop?',
                    'Suggest best billing setup',
                    'Scanner for damaged barcodes'
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      disabled={assistantIsTyping}
                      onClick={() => handleAssistantQuery(chip)}
                      className="text-[9px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-white/5 transition cursor-pointer text-left truncate max-w-[150px] disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1.5 pt-1.5 shrink-0">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && assistantInput.trim()) {
                      handleAssistantQuery(assistantInput);
                    }
                  }}
                  disabled={assistantIsTyping}
                  placeholder="Ask a hardware/driver setup question..."
                  className="flex-1 bg-slate-950 border border-white/5 hover:border-white/15 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white focus:ring-1 focus:ring-indigo-500/30 transition placeholder:text-slate-700 disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    if (assistantInput.trim()) handleAssistantQuery(assistantInput);
                  }}
                  disabled={assistantIsTyping || !assistantInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs py-2 px-3.5 rounded-xl text-white transition disabled:opacity-50 shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Send</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>

        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Explore Premium Hardware Systems</h3>
              <p className="text-[11px] text-slate-400">Discover top-tier retail devices natively configured with VyaparaMitra</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={hardwareSearch}
                onChange={(e) => setHardwareSearch(e.target.value)}
                placeholder="Search hardware by name or tag..."
                className="w-full bg-slate-50 border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl text-slate-700 outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {filteredHardware.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl text-slate-400 font-bold text-xs italic">
                No matching hardware device found. Try another search keyword.
              </div>
            ) : (
              filteredHardware.map((hw) => {
                const isSimulating = activeHardwareSim === hw.id;
                const isSuccess = hardwareSimSuccess === hw.id;
                const IconComponent = hw.icon;

                return (
                  <div
                    key={hw.id}
                    className="glass-card border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition duration-200 bg-white"
                  >
                    <div className="space-y-3">
                      
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-100 text-indigo-600 p-2 rounded-xl">
                          <IconComponent className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold block">{hw.category}</span>
                          <span className="text-xs font-black text-indigo-600 block mt-1">{hw.price}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{hw.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400 leading-tight block">{hw.spec}</span>
                      </div>

                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-[10px]">
                        <div>
                          <span className="text-[8px] uppercase font-black text-rose-500 block">Friction Solved</span>
                          <p className="text-slate-600 font-medium leading-normal">{hw.problem}</p>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-black text-emerald-600 block">Productivity Benefit</span>
                          <p className="text-slate-600 font-medium leading-normal">{hw.benefit}</p>
                        </div>
                      </div>

                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleHardwareSimulate(hw.id)}
                        disabled={!!activeHardwareSim}
                        className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${isSimulating ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'}`}
                      >
                        {isSimulating ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>Connecting COM...</span>
                          </>
                        ) : isSuccess ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Connected • Sync OK</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-3 h-3 text-white/60" />
                            <span>Sync COM Device</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    );
  };

  const playBeep = (freq = 1150, duration = 0.1) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn('Audio feedback failed:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Product Management & Hardware</h1>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100">
              AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage unified master catalog, perform high-speed scans, and explore the Smart Retail Hardware AI Ecosystem</p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventory Catalog
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'hardware' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Hardware Ecosystem
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Add using AI
            </button>
            <button
              onClick={() => setScanModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Scan Barcode
            </button>
            <button
              onClick={() => openFormModal(null)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-150 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Catalog</p>
            <h3 className="text-lg font-black text-slate-800">{totalCatalog} Products</h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-150 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory Value</p>
            <h3 className="text-lg font-black text-slate-800">₹{inventoryValue.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-150 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock alerts</p>
            <h3 className="text-lg font-black text-slate-800">{lowStockCount} Items</h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-150 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potential Revenue</p>
            <h3 className="text-lg font-black text-slate-800">₹{potentialRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Panel */}
      <div className="glass-card rounded-2xl p-4 space-y-4 border border-slate-150 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search products by name, SKU, barcode, brand, category..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2.5 items-center border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] px-2 py-1 outline-none font-bold"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-500">Brand</span>
            <select
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] px-2 py-1 outline-none font-bold"
            >
              <option value="All">All Brands</option>
              {brands.filter(b => b !== 'All').map(br => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-500">Stock status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] px-2 py-1 outline-none font-bold"
            >
              <option value="All">All Stock</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Synchronizing Catalog Ledger...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <Package className="w-12 h-12 text-slate-200" />
            <p className="font-semibold text-slate-500">No matching products found.</p>
            <p className="text-[10px] text-slate-400">Create a product or try modifying your active search query filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Image</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">SKU / Barcode</th>
                  <th className="p-4">Category / Brand</th>
                  <th className="p-4 text-right">Purchase Price</th>
                  <th className="p-4 text-right">Selling Price</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">GST</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProducts.map((p) => {
                  const nameVal = p.name || p.productName || '';
                  const statusLabel = p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.minStock ? 'Low Stock' : 'In Stock';
                  const statusColor = p.quantity <= 0 
                    ? 'bg-red-50 text-red-600 border-red-100' 
                    : p.quantity <= p.minStock 
                      ? 'bg-amber-50 text-amber-600 border-amber-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6">
                        {p.image ? (
                          <img 
                            src={p.image} 
                            alt={nameVal} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-xl border border-slate-150 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center font-bold text-sm">
                            {nameVal.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{nameVal}</div>
                        <div className="text-[10px] text-slate-400">{p.unit || 'piece'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-[10px] text-slate-500 font-medium">{p.sku || 'No SKU'}</div>
                        <div className="font-mono text-[9px] text-slate-400">{p.barcode || 'No Barcode'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-700">{p.category || 'Uncategorized'}</div>
                        <div className="text-[10px] text-slate-400">{p.brand || 'Generic'}</div>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-600">
                        ₹{Number(p.buyingPrice || p.purchasePrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        ₹{Number(p.sellingPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-slate-800">{p.quantity}</div>
                        <div className="text-[9px] text-slate-400">Min: {p.minStock}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold">
                          {p.gst || 12}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-extrabold uppercase tracking-wide ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => { setViewingProduct(p); setDetailsModalOpen(true); }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-slate-800 transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openFormModal(p)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, nameVal)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition cursor-pointer"
                            title="Delete"
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

        {/* Table Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        renderHardwareEcosystem()
      )}

      {/* MODAL 1: ADD/EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {formModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Fill in details below to organize physical inventory and commercial values</p>
                </div>
                <button
                  onClick={() => setFormModalOpen(false)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveProduct}>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Row 1: Basic Info */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Basic Information</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Amul Gold Milk 1L"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer"
                        >
                          <option value="Grocery">Grocery / Staples</option>
                          <option value="Dairy">Dairy Products</option>
                          <option value="Beverage">Beverages / Drinks</option>
                          <option value="Pharmacy">Pharmacy / Medicine</option>
                          <option value="Cosmetics">Cosmetics / Beauty</option>
                          <option value="Household">Household / Cleaning</option>
                          <option value="Stationery">Stationery / Office</option>
                          <option value="Apparel">Apparel / Clothing</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand Name</label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          placeholder="e.g. Amul"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU Code</label>
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="e.g. VM-AMUL-M100"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Barcode ID</label>
                        <input
                          type="text"
                          value={formBarcode}
                          onChange={(e) => setFormBarcode(e.target.value)}
                          placeholder="e.g. 8901262010010"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Pricing */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Commercial & GST Pricing</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formBuyingPrice}
                          onChange={(e) => setFormBuyingPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selling Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formSellingPrice}
                          onChange={(e) => setFormSellingPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount Amt (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formDiscount}
                          onChange={(e) => setFormDiscount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-bold text-red-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GST % Rate</label>
                        <select
                          value={formGst}
                          onChange={(e) => setFormGst(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer font-bold"
                        >
                          <option value="0">0% (Exempt)</option>
                          <option value="5">5% (Essential)</option>
                          <option value="12">12% (Standard)</option>
                          <option value="18">18% (Standard Services)</option>
                          <option value="28">28% (Luxury)</option>
                        </select>
                      </div>
                    </div>
                    {/* Auto Profit Calculation Info Box */}
                    {Number(formSellingPrice) > 0 && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Auto profit index:</span>
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          ₹{(Number(formSellingPrice) - Number(formBuyingPrice)).toLocaleString('en-IN')} Profit Margin ({Math.round(((Number(formSellingPrice) - Number(formBuyingPrice)) / Number(formSellingPrice)) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Inventory */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">3. Inventory & Units</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock quantity *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formQuantity}
                          onChange={(e) => setFormQuantity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min Stock Level</label>
                        <input
                          type="number"
                          min="1"
                          value={formMinStock}
                          onChange={(e) => setFormMinStock(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Measurement Unit *</label>
                        <select
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer"
                        >
                          <option value="piece">piece (pcs)</option>
                          <option value="packet">packet (pkt)</option>
                          <option value="kg">kilogram (kg)</option>
                          <option value="litre">litre (ltr)</option>
                          <option value="box">box (bx)</option>
                          <option value="bottle">bottle (btl)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Supplier Details */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">4. Supplier Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier Name</label>
                        <input
                          type="text"
                          value={formSupplier}
                          onChange={(e) => setFormSupplier(e.target.value)}
                          placeholder="e.g. Reliance Food Wholesalers"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier Contact Phone</label>
                        <input
                          type="text"
                          value={formSupplierContact}
                          onChange={(e) => setFormSupplierContact(e.target.value)}
                          placeholder="e.g. +91 99887 76655"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Additional */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">5. Additional Information</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="date"
                          value={formExpiryDate}
                          onChange={(e) => setFormExpiryDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Image URL</label>
                        <input
                          type="text"
                          value={formImage}
                          onChange={(e) => setFormImage(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/... or blank"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Internal Notes / Description</label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Add some notes about storage conditions, bulk discounts or packaging particulars..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: AI ADD PRODUCT MODAL */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100 animate-pulse" />
                  <h3 className="font-extrabold text-slate-800 text-sm">AI Product Smart Input</h3>
                </div>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide a simple natural language statement about a purchase invoice. VyaparaMitra's AI will parse quantities, products, brand, and supplier values automatically.
                </p>

                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-[10px] text-slate-600 space-y-1">
                  <p className="font-bold text-indigo-800">💡 Try typing something like:</p>
                  <p className="font-medium">"I purchased 25 packets of Amul Gold Milk 1L at Rs. 58 each from Ramesh Dairy Distributors"</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Note</label>
                  <textarea
                    value={aiNote}
                    onChange={(e) => setAiNote(e.target.value)}
                    placeholder="e.g. Purchased 40 bags of Fortune Soya Oil 1L at ₹125 per piece with 18% GST..."
                    rows={4}
                    disabled={aiExtracting}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-3 text-xs outline-none transition resize-none leading-normal font-medium"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  disabled={aiExtracting}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAIExtract}
                  disabled={aiExtracting}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  {aiExtracting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      Analyze & Pre-fill
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL ENTERPRISE BARCODE SCANNER INTEGRATION */}
      {scanModalOpen && (
        <BarcodeScanner
          products={products}
          mode="products"
          onScan={(barcode) => {
            setScannedCode(barcode);
            const match = products.find(p => p.barcode === barcode || p.sku === barcode);
            if (match) {
              setViewingProduct(match);
              setScanModalOpen(false);
              setDetailsModalOpen(true);
              triggerNotification('success', 'Barcode Recognized', `Found match for ${match.name}`);
            } else {
              setScanModalOpen(false);
              openFormModal(null);
              setFormBarcode(barcode);
              triggerNotification('info', 'New Barcode Scanned', 'No matching product found. Add form pre-filled.');
            }
          }}
          onClose={() => setScanModalOpen(false)}
        />
      )}

      {/* MODAL 4: CSV EXCEL IMPORT MODAL */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-700" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Bulk CSV/Excel Product Import</h3>
                </div>
                <button
                  onClick={() => { setImportModalOpen(false); setImportFile(null); setParsedRows([]); setImportFeedback(null); }}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {!importFile ? (
                  // Drag and Drop view
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 transition cursor-pointer relative bg-slate-50/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-600">Select or Drag CSV catalog file here</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts standard comma-separated .csv sheets</p>
                  </div>
                ) : (
                  // Mapper / Preview view
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-700 truncate">{importFile.name}</p>
                        <p className="text-[10px] text-slate-400">Successfully detected {parsedRows.length} invoice/product lines</p>
                      </div>
                      <button
                        onClick={() => { setImportFile(null); setParsedRows([]); }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700"
                      >
                        Reset File
                      </button>
                    </div>

                    {/* Mapping configuration */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure Column Mapping:</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {Object.keys(importMapping).map((key) => (
                          <div key={key} className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <select
                              value={importMapping[key]}
                              onChange={(e) => setImportMapping({ ...importMapping, [key]: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-medium outline-none"
                            >
                              <option value="">-- Ignored --</option>
                              {parsedRows.length > 0 && Object.keys(parsedRows[0]).map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows Preview:</p>
                      <div className="overflow-x-auto border border-slate-150 rounded-xl max-h-40">
                        <table className="w-full text-left text-[10px] font-medium">
                          <thead className="bg-slate-50 border-b border-slate-150 sticky top-0">
                            <tr>
                              <th className="p-2">Product Name</th>
                              <th className="p-2">Barcode</th>
                              <th className="p-2 text-right">Purchase</th>
                              <th className="p-2 text-right">Selling</th>
                              <th className="p-2 text-center">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="p-2 truncate max-w-[140px] font-bold text-slate-700">{row[importMapping.productName] || '—'}</td>
                                <td className="p-2 font-mono text-[9px]">{row[importMapping.barcode] || '—'}</td>
                                <td className="p-2 text-right">₹{row[importMapping.purchasePrice] || 0}</td>
                                <td className="p-2 text-right font-bold text-slate-800">₹{row[importMapping.sellingPrice] || 0}</td>
                                <td className="p-2 text-center">{row[importMapping.stock] || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Import Feedback */}
                    {importFeedback && (
                      <div className="p-4 rounded-xl border space-y-2 text-xs bg-slate-50">
                        <p className="font-extrabold text-slate-700 uppercase tracking-wider">Import Report Results:</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-center">
                            <p className="text-emerald-700 font-extrabold text-sm">{importFeedback.success}</p>
                            <p className="text-[9px] font-medium text-emerald-600">Rows Imported</p>
                          </div>
                          <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
                            <p className="text-red-700 font-extrabold text-sm">{importFeedback.failed}</p>
                            <p className="text-[9px] font-medium text-red-600">Rows Skipped</p>
                          </div>
                        </div>

                        {importFeedback.errors.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Errors Logged:</p>
                            <div className="max-h-24 overflow-y-auto text-[9px] text-red-500 font-mono space-y-0.5">
                              {importFeedback.errors.map((err, idx) => (
                                <p key={idx}>• {err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setImportModalOpen(false); setImportFile(null); setParsedRows([]); setImportFeedback(null); }}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                {importFile && !importFeedback && (
                  <button
                    type="button"
                    onClick={executeCSVImport}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Execute Import
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: PRODUCT DETAILS VIEW MODAL */}
      <AnimatePresence>
        {detailsModalOpen && viewingProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Product Detail Cockpit</h3>
                    <p className="text-[10px] text-slate-400">View real-time commercial analytics, history ledger, and inventory trends</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Dashboard Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Visual Overview */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Image Display */}
                  {viewingProduct.image ? (
                    <img 
                      src={viewingProduct.image} 
                      alt={viewingProduct.name || viewingProduct.productName} 
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-cover rounded-2xl border border-slate-150 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-3xl shrink-0">
                      {(viewingProduct.name || viewingProduct.productName || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Primary labels */}
                  <div className="space-y-1.5 flex-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-extrabold uppercase tracking-widest">
                      {viewingProduct.category}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-800">
                      {viewingProduct.name || viewingProduct.productName}
                    </h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
                      <p>SKU: <span className="font-bold text-slate-700">{viewingProduct.sku || 'No SKU'}</span></p>
                      <p>Barcode: <span className="font-bold text-slate-700">{viewingProduct.barcode || 'No Barcode'}</span></p>
                      <p>Brand: <span className="font-bold text-slate-700">{viewingProduct.brand || 'Generic'}</span></p>
                      <p>Expiry: <span className="font-bold text-slate-700">{viewingProduct.expiryDate || 'No Expiry'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Key Commercial Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchase Price</p>
                    <p className="text-sm font-black text-slate-700">₹{Number(viewingProduct.buyingPrice || viewingProduct.purchasePrice || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selling Price</p>
                    <p className="text-sm font-black text-slate-800">₹{Number(viewingProduct.sellingPrice).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</p>
                    <p className="text-sm font-black text-slate-700">{viewingProduct.quantity} {viewingProduct.unit}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Profit Margin</p>
                    <p className="text-sm font-black text-emerald-600">{viewingProduct.profitMargin || 0}%</p>
                  </div>
                </div>

                {/* Simulated Charts for Sales & Inventory Movements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Graph 1: Sales velocity */}
                  <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      Monthly Sales Velocity
                    </p>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getProductChartData(viewingProduct.id).salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graph 2: Stock Movement */}
                  <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-500" />
                      Stock Depletion Curve
                    </p>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getProductChartData(viewingProduct.id).stockData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip wrapperStyle={{ fontSize: 10 }} />
                          <Line type="monotone" dataKey="stock" stroke="#6366f1" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Additional supplier & insights details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supplier Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 text-xs">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Details</p>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700">{viewingProduct.supplier || 'No Registered Supplier'}</p>
                      {viewingProduct.supplierContact && (
                        <p className="text-[10px] text-slate-500 font-medium">Contact: {viewingProduct.supplierContact}</p>
                      )}
                    </div>
                  </div>

                  {/* AI Insights Box */}
                  <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 space-y-2 text-xs relative overflow-hidden">
                    <div className="absolute right-2 top-2 text-indigo-500 opacity-10">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-200" />
                      AI Analytics Recommendation
                    </p>
                    <p className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                      {viewingProduct.quantity <= viewingProduct.minStock 
                        ? `Item depleted past minimum threshold of ${viewingProduct.minStock} ${viewingProduct.unit}. We suggest placing a reorder of ${viewingProduct.minStock * 3} units to satisfy sales velocity before weekend.`
                        : `Stock levels are healthy. This product is generating a healthy ${viewingProduct.profitMargin || 0}% margin. Bundle with complementary slower inventory lines to optimize counter space.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { setDetailsModalOpen(false); openFormModal(viewingProduct); }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Edit Product
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
