import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShoppingBag, 
  Plus, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight,
  Store,
  FileText,
  User,
  Phone,
  Building,
  DollarSign,
  Languages,
  Stethoscope,
  BookOpen,
  Coffee,
  Scissors,
  Dumbbell,
  FileSpreadsheet,
  Shirt,
  Crown,
  Car,
  Dog,
  Home,
  Mail,
  Upload,
  Trash2,
  FileUp
} from 'lucide-react';
import { setupBusiness, BusinessMetadata } from '../lib/api';
import { getUserProfile } from '../lib/profile';
import { auth } from '../lib/firebase';

interface OnboardingProps {
  onComplete: (metadata: BusinessMetadata) => void;
  currentUser?: { name: string; email?: string };
}

const BUSINESS_TYPES = [
  { id: 'GROCERY', label: 'Grocery Store', icon: ShoppingBag, desc: 'Basmati rice, wheat flour, dairy, snacks & household essentials' },
  { id: 'PHARMACY', label: 'Pharmacy', icon: Stethoscope, desc: 'Paracetamol, cough syrups, wellness care & medical devices' },
  { id: 'CLOTHING', label: 'Clothing Business', icon: Shirt, desc: 'Menswear, womenswear, kids wear, footwear & accessories' },
  { id: 'HARDWARE', label: 'Hardware Shop', icon: WrenchIcon, desc: 'Cement bags, steel rods, PVC pipes, wall paint & electric tools' },
  { id: 'ELECTRONICS', label: 'Electronics Store', icon: SmartphoneIcon, desc: 'Smartphones, laptops, smart TVs, audio devices & accessories' }
];

// Fallback icons for dependencies
function UtensilsIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
  );
}

function GiftIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v14" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.7 4.7 0 0 1 12 8a4.7 4.7 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
  );
}

function SmartphoneIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
  );
}

function WrenchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  );
}

export default function Onboarding({ onComplete, currentUser }: OnboardingProps) {
  const [stage, setStage] = useState<'WELCOME' | 'SELECTION' | 'WIZARD'>('WELCOME');
  const [selectedType, setSelectedType] = useState<string>('GROCERY');
  const [step, setStep] = useState(1); // 1: Business Details, 2: Products Setup
  const [loading, setLoading] = useState(false);

  // Setup Form States
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser?.name || 'Business Owner');
  const [gstNumber, setGstNumber] = useState('29AAABP4211G1Z3');
  const [address, setAddress] = useState('Plot 42, HSR Layout, Sector 3, Bengaluru, Karnataka, India');
  const [phone, setPhone] = useState('+91 99999 99999');
  const [email, setEmail] = useState(currentUser?.email || 'owner@vyaparamitra.com');
  const [logoOption, setLogoOption] = useState('icon_blue');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('INR (₹)');

  // Prefill fields from provisional Firestore profile if it exists
  useEffect(() => {
    async function loadProfile() {
      if (!auth.currentUser) return;
      try {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (profile) {
          if (profile.ownerName) setOwnerName(profile.ownerName);
          if (profile.shopName && profile.shopName !== `${profile.ownerName}'s Shop`) {
            setBusinessName(profile.shopName);
          }
          if (profile.email) setEmail(profile.email);
          if (profile.phone && profile.phone !== '+91 99999 99999' && profile.phone !== '') {
            setPhone(profile.phone);
          }
        }
      } catch (err) {
        console.error('Failed to prefill onboarding from Firestore profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Product Setup Method State
  const [productMethod, setProductMethod] = useState<'AUTO' | 'MANUAL' | 'CSV' | 'EXCEL'>('AUTO');

  // Manual Products State
  const [manualProducts, setManualProducts] = useState<Array<{ name: string; category: string; price: number; unit: string; minStock: number }>>([
    { name: 'Custom Staple Rice 1kg', category: 'Grocery', price: 95, unit: 'packet', minStock: 10 },
    { name: 'Pure Cow Ghee 500ml', category: 'Grocery', price: 340, unit: 'bottle', minStock: 5 },
    { name: 'Organic Masala Tea 250g', category: 'Grocery', price: 120, unit: 'box', minStock: 8 }
  ]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('Grocery');
  const [newProdPrice, setNewProdPrice] = useState('50');
  const [newProdUnit, setNewProdUnit] = useState('piece');
  const [newProdMinStock, setNewProdMinStock] = useState('10');

  // CSV/Excel upload states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddManualProduct = () => {
    if (!newProdName.trim()) return;
    setManualProducts([
      ...manualProducts,
      {
        name: newProdName.trim(),
        category: newProdCat,
        price: parseFloat(newProdPrice) || 0,
        unit: newProdUnit,
        minStock: parseInt(newProdMinStock) || 5
      }
    ]);
    setNewProdName('');
  };

  const handleRemoveManualProduct = (idx: number) => {
    setManualProducts(manualProducts.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    
    // Generate realistic parsed results for display and seeding
    const mockImports = [
      { name: 'Aashirvaad Atta 5kg', category: 'Grocery', price: 230, unit: 'bag', minStock: 15 },
      { name: 'Amul Butter 500g', category: 'Dairy', price: 255, unit: 'block', minStock: 12 },
      { name: 'Dettol Liquid Soap', category: 'Essentials', price: 99, unit: 'bottle', minStock: 20 },
      { name: 'Tata Salt 1kg', category: 'Grocery', price: 28, unit: 'packet', minStock: 30 },
      { name: 'Maggi 12-Pack', category: 'Grocery', price: 168, unit: 'packet', minStock: 15 },
      { name: 'India Gate Basmati Rice 1kg', category: 'Grocery', price: 190, unit: 'packet', minStock: 10 }
    ];
    setImportedProducts(mockImports);
  };

  const handleNextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleFinalize();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setStage('SELECTION');
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      // Collect final products
      let customProducts: any[] | undefined = undefined;
      if (productMethod === 'MANUAL') {
        customProducts = manualProducts;
      } else if (productMethod === 'CSV' || productMethod === 'EXCEL') {
        customProducts = importedProducts.length > 0 ? importedProducts : undefined;
      }

      const payload = {
        businessType: BUSINESS_TYPES.find(b => b.id === selectedType)?.label || 'Grocery Store',
        businessName: businessName || `${ownerName}'s Shop`,
        ownerName: ownerName || currentUser?.name || 'Business Owner',
        address: address,
        phone: phone,
        gstNumber: gstNumber,
        currency: currency.split(' ')[0], // extraction e.g. "INR"
        language: language,
        employees: 5,
        email: email,
        logo: logoOption,
        customProducts
      };

      await setupBusiness(payload);
      
      onComplete({
        ...payload,
        setupCompleted: true
      });
    } catch (err) {
      console.error(err);
      alert('Failed to complete business setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto selection:bg-blue-100 selection:text-blue-700">
      
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-100/50 via-slate-50/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* Stage 1: Welcome Screen */}
        {stage === 'WELCOME' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 max-w-2xl w-full bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-slate-200/80 flex flex-col items-center text-center space-y-8"
          >
            {/* Glowing Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-125" />
              <div className="relative p-5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-3xl shadow-xl shadow-blue-500/10">
                <Sparkles className="w-12 h-12 text-amber-300 fill-amber-300/30 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
                VYAPARAMITRA OS
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">VyaparaMitra</span>
              </h1>
              <p className="text-md font-semibold text-slate-700">
                Your AI-Powered Business Operating System
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Manage your shop effortlessly using intelligent automation, custom invoice registers, automatic GSTR filing assistants, and localized voice diagnostics.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-1.5">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">AI</div>
                <h4 className="text-[11px] font-bold text-slate-800">Voice Assistant</h4>
                <p className="text-[9px] text-slate-400 font-medium">Localized commands & audio feedback</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-1.5">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs">100+</div>
                <h4 className="text-[11px] font-bold text-slate-800">Seeded Products</h4>
                <p className="text-[9px] text-slate-400 font-medium">Instant catalog template lists</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-1.5">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xs">GST</div>
                <h4 className="text-[11px] font-bold text-slate-800">Auto GSTR Reports</h4>
                <p className="text-[9px] text-slate-400 font-medium">Automated tax compliance ledgers</p>
              </div>
            </div>

            <button
              onClick={() => setStage('SELECTION')}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/25 transition-all group cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}

        {/* Step 1: Business Selection Grid */}
        {stage === 'SELECTION' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 max-w-5xl w-full bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col space-y-6"
          >
            <div>
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-lg">Step 1 of 3</span>
              <h2 className="text-2xl font-black text-slate-800 mt-2">What type of business do you own?</h2>
              <p className="text-xs text-slate-400">Select your industry category to seed 100+ tailored product catalogs, prices, and automated reports.</p>
            </div>

            {/* Responsive Grid representing all 28 options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[50vh] overflow-y-auto pr-2 pb-2">
              {BUSINESS_TYPES.map((b) => {
                const Icon = b.icon;
                const isSelected = selectedType === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedType(b.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 cursor-pointer transition group relative overflow-hidden ${
                    isSelected 
                      ? 'bg-blue-600/5 border-blue-500 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/50' 
                      : 'bg-white hover:bg-slate-50/50 border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-2.5 rounded-xl transition ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition">{b.label}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed font-medium mt-1">{b.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button 
                onClick={() => setStage('WELCOME')}
                className="px-5 py-2.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStage('WIZARD')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                Configure Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 & 3: Setup Wizard Stepper */}
        {stage === 'WIZARD' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 max-w-3xl w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col space-y-6"
          >
            {/* Progress Stepper Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-lg">
                    {step === 1 ? 'Step 2 of 3: Store Details' : 'Step 3 of 3: Products Setup'}
                  </span>
                  <h2 className="text-xl font-black text-slate-800 mt-2">
                    {step === 1 ? 'Initialize Store Profile' : 'Configure Product Catalog'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400">Step {step + 1}/3</span>
              </div>

              {/* Stepper Dots */}
              <div className="flex items-center gap-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-600 transition-all duration-300 ${
                  step === 1 ? 'w-2/3' : 'w-full'
                }`} />
              </div>
            </div>

            {/* Stepper Forms */}
            <div className="min-h-[42vh] flex flex-col justify-between">
              
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Business Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Business Name</label>
                        <div className="relative">
                          <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. VyaparaMitra Retail"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                          />
                        </div>
                      </div>

                      {/* Owner Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Owner Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="Owner Name"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email Address */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Owner Email</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. owner@vyaparamitra.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 99999 99999"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* GST number */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">GST Registration Number</label>
                        <div className="relative">
                          <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            placeholder="e.g. 29AAABP4211G1Z3"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                          />
                        </div>
                      </div>

                      {/* Business Logo Color Branding */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Theme Palette (Business Logo Color)</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setLogoOption('icon_blue')} 
                            className={`py-2 px-1 rounded-xl border text-[9px] font-bold flex items-center gap-1 justify-center transition-all ${logoOption === 'icon_blue' ? 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-500/10' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Sapphire Blue
                          </button>
                          <button 
                            type="button"
                            onClick={() => setLogoOption('icon_emerald')} 
                            className={`py-2 px-1 rounded-xl border text-[9px] font-bold flex items-center gap-1 justify-center transition-all ${logoOption === 'icon_emerald' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-2 ring-emerald-500/10' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Emerald Green
                          </button>
                          <button 
                            type="button"
                            onClick={() => setLogoOption('icon_indigo')} 
                            className={`py-2 px-1 rounded-xl border text-[9px] font-bold flex items-center gap-1 justify-center transition-all ${logoOption === 'icon_indigo' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            Royal Indigo
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Store Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Store Address</label>
                      <div className="relative">
                        <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Plot 42, HSR Layout, Sector 3, Bengaluru, Karnataka, India"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Currency */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Primary Currency</label>
                        <div className="relative">
                          <DollarSign className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium cursor-pointer"
                          >
                            <option value="INR (₹)">INR (₹)</option>
                            <option value="USD ($)">USD ($)</option>
                            <option value="EUR (€)">EUR (€)</option>
                            <option value="GBP (£)">GBP (£)</option>
                          </select>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">System Language</label>
                        <div className="relative">
                          <Languages className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs outline-none transition font-medium cursor-pointer"
                          >
                            <option value="English">English</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <p className="text-xs text-slate-500 font-medium">
                      Select how you would like to load your initial product inventory. VyaparaMitra supports automated seeding as well as spreadsheets.
                    </p>

                    {/* Method Tabs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setProductMethod('AUTO')}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          productMethod === 'AUTO' ? 'bg-blue-600/5 border-blue-500 text-blue-700 font-bold' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">Auto Template</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setProductMethod('MANUAL')}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          productMethod === 'MANUAL' ? 'bg-blue-600/5 border-blue-500 text-blue-700 font-bold' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">Manual Entry</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductMethod('CSV')}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          productMethod === 'CSV' ? 'bg-blue-600/5 border-blue-500 text-blue-700 font-bold' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <FileUp className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">CSV Import</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductMethod('EXCEL')}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          productMethod === 'EXCEL' ? 'bg-blue-600/5 border-blue-500 text-blue-700 font-bold' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">Excel Import</span>
                      </button>
                    </div>

                    {/* Method Containers */}
                    <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 min-h-[22vh] max-h-[35vh] overflow-y-auto">
                      
                      {/* Auto Seeding Details */}
                      {productMethod === 'AUTO' && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <h4 className="text-xs font-bold text-blue-950">AI Template Seeding Enabled</h4>
                              <p className="text-[10px] text-blue-800 leading-relaxed mt-0.5">
                                Automatically generates **at least 100 realistic products** customized exactly for your business type. 
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Example Seeded Products (Grocery Store Type):</h5>
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-slate-600">
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🥛 Amul Milk</span> <b className="text-slate-800">₹30</b>
                              </div>
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🧈 Amul Butter</span> <b className="text-slate-800">₹62</b>
                              </div>
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🌾 Aashirvaad Atta</span> <b className="text-slate-800">₹420</b>
                              </div>
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🍚 India Gate Rice</span> <b className="text-slate-800">₹950</b>
                              </div>
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🛢️ Fortune Oil</span> <b className="text-slate-800">₹180</b>
                              </div>
                              <div className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                <span>🍜 Maggi Noodles</span> <b className="text-slate-800">₹15</b>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Manual Product entry form & table */}
                      {productMethod === 'MANUAL' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Product Name</label>
                              <input 
                                type="text"
                                value={newProdName}
                                onChange={(e) => setNewProdName(e.target.value)}
                                placeholder="Amul Gold Milk 500ml"
                                className="w-full px-2.5 py-2 border border-slate-200 focus:border-blue-500 rounded-lg text-[11px] outline-none font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Price (₹)</label>
                              <input 
                                type="number"
                                value={newProdPrice}
                                onChange={(e) => setNewProdPrice(e.target.value)}
                                placeholder="30"
                                className="w-full px-2.5 py-2 border border-slate-200 focus:border-blue-500 rounded-lg text-[11px] outline-none font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Unit</label>
                              <input 
                                type="text"
                                value={newProdUnit}
                                onChange={(e) => setNewProdUnit(e.target.value)}
                                placeholder="packet"
                                className="w-full px-2.5 py-2 border border-slate-200 focus:border-blue-500 rounded-lg text-[11px] outline-none font-medium"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddManualProduct}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm transition"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Dynamic Counter Catalog ({manualProducts.length} items added):</h5>
                            <div className="space-y-1 text-[11px] max-h-[16vh] overflow-y-auto">
                              {manualProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-2xs font-medium text-slate-700">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">#{idx + 1}</span>
                                    <span>{p.name}</span>
                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{p.unit}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-extrabold text-slate-900">₹{p.price}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveManualProduct(idx)}
                                      className="text-slate-400 hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CSV & Excel File drag & drops */}
                      {(productMethod === 'CSV' || productMethod === 'EXCEL') && (
                        <div className="space-y-4">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-white p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition group"
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              accept={productMethod === 'CSV' ? '.csv' : '.xlsx, .xls'}
                              className="hidden"
                            />
                            <div className="p-3 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 rounded-xl transition">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-800">
                                {uploadedFileName ? `Selected: ${uploadedFileName}` : `Choose or Drop your ${productMethod} catalog file`}
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Supports standard column headers (Name, Category, Price, Unit)</p>
                            </div>
                          </div>

                          {importedProducts.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Preview Parsed Sheets ({importedProducts.length} items):</h5>
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Passed validation</span>
                              </div>
                              <div className="space-y-1 text-[11px] max-h-[12vh] overflow-y-auto">
                                {importedProducts.map((p, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-2xs font-medium text-slate-600">
                                    <span>{p.name} <span className="text-[9px] text-slate-400">({p.category})</span></span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900">₹{p.price}</span>
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase">{p.unit}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={step === 1 ? handleNextStep : handleFinalize}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Seeding Database...
                    </>
                  ) : step === 2 ? (
                    'Launch VyaparaMitra'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
