import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  LayoutDashboard, 
  Bot, 
  Package, 
  Users, 
  Receipt, 
  History, 
  BarChart3, 
  FileText, 
  Menu, 
  X, 
  Sparkles,
  Clock,
  User,
  Settings,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Sun,
  Moon,
  ShoppingBag,
  FileSpreadsheet
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Copilot from './components/Copilot';
import Products from './components/Products';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Sales from './components/Sales';
import Invoices from './components/Invoices';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import GstrReports from './components/GstrReports';
import EngagementDashboard from './components/EngagementDashboard';
import Onboarding from './components/Onboarding';
import VoiceAssistant from './components/VoiceAssistant';
import Auth from './components/Auth';
import { NotificationProvider, useNotifications } from './components/NotificationManager';
import { fetchMetadata, BusinessMetadata, setupBusiness } from './lib/api';
import { getUserProfile, createUserProfile, updateUserProfile } from './lib/profile';

// Main App Wrapper to inject NotificationProvider cleanly
export default function App() {
  return (
    <NotificationProvider>
      <VyaparaMitraApp />
    </NotificationProvider>
  );
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

function VyaparaMitraApp() {
  const { triggerNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App-wide state
  const [metadata, setMetadata] = useState<BusinessMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  
  // Voice integration states
  const [invoicePreset, setInvoicePreset] = useState<{ customerName: string; customerPhone?: string } | null>(null);
  const [triggerReportFlag, setTriggerReportFlag] = useState<number>(0);

  // Revert any dark mode setting from html element
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  // 1. Validate auth token on load with Firebase session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      const savedToken = localStorage.getItem('vm_token') || sessionStorage.getItem('vm_token');
      const savedUser = localStorage.getItem('vm_user') || sessionStorage.getItem('vm_user');

      if (fbUser) {
        if (savedToken && savedUser) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              setToken(savedToken);
              setUser(data.user);
            } else {
              // Token expired, re-sync with backend on-the-fly
              const syncRes = await fetch('/api/auth/firebase-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: fbUser.uid,
                  email: fbUser.email,
                  name: fbUser.displayName,
                }),
              });
              if (syncRes.ok) {
                const syncData = await syncRes.json();
                localStorage.setItem('vm_token', syncData.token);
                localStorage.setItem('vm_user', JSON.stringify(syncData.user));
                setToken(syncData.token);
                setUser(syncData.user);
              }
            }
          } catch (err) {
            console.warn('Auth check connection failed, using local offline cache:', err);
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          }
        } else {
          // No local session but logged in to Firebase (e.g. fresh tab)
          try {
            const syncRes = await fetch('/api/auth/firebase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              localStorage.setItem('vm_token', syncData.token);
              localStorage.setItem('vm_user', JSON.stringify(syncData.user));
              setToken(syncData.token);
              setUser(syncData.user);
            }
          } catch (err) {
            console.error('Failed to sync onAuthStateChanged session:', err);
          }
        }
      } else {
        localStorage.removeItem('vm_token');
        sessionStorage.removeItem('vm_token');
        localStorage.removeItem('vm_user');
        sessionStorage.removeItem('vm_user');
        setToken(null);
        setUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch store metadata on load once authenticated
  useEffect(() => {
    if (!token || !user) return;
    
    async function loadMeta() {
      try {
        setMetaLoading(true);
        
        // 1. Fetch server-side metadata first (which is always local/highly reliable)
        let data = null;
        try {
          data = await fetchMetadata();
        } catch (err) {
          console.error('Failed to fetch server-side metadata:', err);
        }
        
        // 2. Fetch user profile details from Firestore with offline safety
        let profile = null;
        let isFirestoreOffline = false;
        try {
          profile = await getUserProfile(user.id);
        } catch (err) {
          console.warn('Firestore client is offline or failed to connect. Falling back to local store storage:', err);
          isFirestoreOffline = true;
        }
        
        // 3. Fallback or create profile as needed
        if (isFirestoreOffline) {
          // If Firestore is offline, construct an offline-capable profile using server-side metadata or defaults
          const cleanName = data?.ownerName || user.name.replace(/\s*\(Owner\)/gi, '').trim();
          profile = {
            ownerName: cleanName,
            shopName: data?.businessName || `${cleanName}'s Shop`,
            shopType: data?.businessType || 'Grocery Store / Supermarket',
            email: data?.email || user.email,
            phone: data?.phone || '+91 99999 99999',
            createdAt: new Date().toISOString(),
            setupCompleted: !!(data && data.setupCompleted)
          };
        } else if (!profile) {
          // If user logs in for the first time: create Firestore document users/{uid}
          const cleanName = user.name.replace(/\s*\(Owner\)/gi, '').trim();
          try {
            profile = await createUserProfile(user.id, {
              ownerName: cleanName,
              shopName: `${cleanName}'s Shop`,
              shopType: 'Grocery Store / Supermarket',
              email: user.email,
              phone: '+91 99999 99999',
              setupCompleted: false
            });
          } catch (err) {
            console.error('Failed to create Firestore profile, falling back to local:', err);
            profile = {
              ownerName: cleanName,
              shopName: `${cleanName}'s Shop`,
              shopType: 'Grocery Store / Supermarket',
              email: user.email,
              phone: '+91 99999 99999',
              createdAt: new Date().toISOString(),
              setupCompleted: false
            };
          }
        }
        
        // 4. Check profile completeness and synchronize
        if (profile.setupCompleted && (!data || !data.setupCompleted)) {
          // Profile is completed in Firestore, but server-side metadata hasn't been set up/seeded
          triggerNotification('info', 'Synchronizing Profile...', `Connecting to your database for ${profile.shopType}...`);
          
          await setupBusiness({
            businessType: profile.shopType,
            businessName: profile.shopName,
            ownerName: profile.ownerName,
            address: 'Plot 42, HSR Layout, Sector 3, Bengaluru, Karnataka, India',
            phone: profile.phone,
            email: profile.email,
            gstNumber: '29AAABP4211G1Z3',
            currency: 'INR',
            language: 'English',
            employees: 5,
            logo: 'icon_blue',
            customProducts: undefined
          });
          
          const freshData = await fetchMetadata();
          setMetadata(freshData);
          triggerNotification('milestone', `Welcome back, ${profile.ownerName}!`, `Connected to ${profile.shopName} ledger.`);
        } else {
          // If Firestore says completed, and server is also completed, let's set metadata
          if (profile.setupCompleted && data && data.setupCompleted) {
            setMetadata({
              ...data,
              ownerName: profile.ownerName,
              businessName: profile.shopName,
              businessType: profile.shopType,
              phone: profile.phone
            });
            triggerNotification('milestone', `Welcome to VyaparaMitra, ${profile.ownerName}!`, `Connected to ${profile.shopName} ledger.`);
          } else if (data && data.setupCompleted) {
            // Server has a completed setup but Firestore doesn't, let's sync Firestore profile with the server-side values
            const cleanName = data.ownerName || user.name.replace(/\s*\(Owner\)/gi, '').trim();
            if (!isFirestoreOffline) {
              try {
                await updateUserProfile(user.id, {
                  ownerName: cleanName,
                  shopName: data.businessName,
                  shopType: data.businessType,
                  phone: data.phone || '+91 99999 99999',
                  setupCompleted: true
                });
              } catch (err) {
                console.error('Failed to sync completed server metadata to Firestore:', err);
              }
            }
            setMetadata(data);
            triggerNotification('milestone', `Welcome to VyaparaMitra, ${cleanName}!`, `Connected to ${data.businessName} ledger.`);
          } else {
            // Both are incomplete, user will be prompted with the Onboarding screen
            setMetadata(data);
          }
        }
      } catch (err) {
        console.error('Failed to load store metadata or user profile:', err);
      } finally {
        setMetaLoading(false);
      }
    }
    loadMeta();
  }, [token, user]);

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync hash routing
  useEffect(() => {
    if (!token) return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'copilot', 'mitra', 'inventory', 'customers', 'sales', 'invoices', 'analytics', 'reports', 'engagement', 'products', 'gstr'];
      
      // Role guards
      if (hash && validTabs.includes(hash)) {
        if (user?.role === 'Employee' && ['analytics', 'reports'].includes(hash)) {
          triggerNotification('error', 'Access Denied', 'Your user account (Employee) does not have access to analytics or reports.');
          setActiveTab('dashboard');
          window.location.hash = 'dashboard';
        } else {
          setActiveTab(hash === 'mitra' ? 'copilot' : hash);
        }
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run initially
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [token, user]);

  const handleNavigate = (tab: string) => {
    if (user?.role === 'Employee' && ['analytics', 'reports'].includes(tab)) {
      triggerNotification('error', 'Access Denied', 'Operations restricted for Employee role.');
      return;
    }
    window.location.hash = tab;
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleRestartSetup = () => {
    if (user?.role === 'Employee') {
      triggerNotification('error', 'Restricted', 'Only the Business Owner can restart the setup wizard.');
      return;
    }
    const confirmRestart = window.confirm(
      "⚠️ Re-run setup wizard?\n\nThis will restart the onboarding experience and allow you to re-seed the product catalogs, simulated customers, and historical sales ledgers tailored specifically to your chosen industry type.\n\nContinue?"
    );
    if (confirmRestart && metadata) {
      setMetadata({
        ...metadata,
        setupCompleted: false
      });
      triggerNotification('info', 'Onboarding Initiated', 'Prepare to reconfigure business parameters and seed industry databases.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase sign out failed:', err);
    } finally {
      // Clear all cached tokens, session states, and business selections from local and session storage
      localStorage.removeItem('vm_token');
      sessionStorage.removeItem('vm_token');
      localStorage.removeItem('vm_user');
      sessionStorage.removeItem('vm_user');
      localStorage.removeItem('vm_billing_preset');
      sessionStorage.removeItem('vm_billing_preset');
      localStorage.removeItem('vm_business_type');
      localStorage.removeItem('vm_business_name');
      
      // Update react states immediately to trigger re-evaluation of rendering guards
      setToken(null);
      setUser(null);
      setMetadata(null);
      setActiveTab('dashboard');
      
      // Reset window location hash cleanly so back navigation behaves as expected
      window.location.hash = '';
      
      triggerNotification('info', 'Logged Out', 'You have been securely signed out of your session.');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'copilot', label: 'Mitra AI', icon: Bot, highlight: true },
    { id: 'engagement', label: 'AI Engagement', icon: Sparkles, highlight: true },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'sales', label: 'Sales History', icon: History },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    ...(user?.role !== 'Employee' ? [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'reports', label: 'AI Reports', icon: FileText },
      { id: 'gstr', label: 'GSTR Reports', icon: FileSpreadsheet }
    ] : [])
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'copilot':
      case 'mitra':
        return <Copilot onNavigate={handleNavigate} />;
      case 'engagement':
        return <EngagementDashboard />;
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'sales':
        return <Sales />;
      case 'invoices':
        return (
          <Invoices 
            preset={invoicePreset} 
            clearPreset={() => setInvoicePreset(null)} 
            userRole={user?.role}
          />
        );
      case 'analytics':
        return user?.role !== 'Employee' ? <Analytics /> : <Dashboard onNavigate={handleNavigate} />;
      case 'reports':
        return user?.role !== 'Employee' ? <Reports triggerReportFlag={triggerReportFlag} /> : <Dashboard onNavigate={handleNavigate} />;
      case 'gstr':
        return user?.role !== 'Employee' ? <GstrReports /> : <Dashboard onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const getPageTitle = () => {
    const activeItem = menuItems.find(item => item.id === activeTab);
    return activeItem ? activeItem.label : 'Dashboard';
  };

  const getInitials = (name: string) => {
    if (!name) return 'VM';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Auth checking indicator
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full scale-125" />
          <div className="relative p-4 bg-white border border-slate-200 rounded-2xl shadow-xl">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Securing Connection...
        </p>
      </div>
    );
  }

  // Render Auth Guard if not logged in
  if (!token || !user) {
    return <Auth onAuthSuccess={(t, u) => { setToken(t); setUser(u); }} />;
  }

  // Full-screen loading placeholder for metadata fetching
  if (metaLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full scale-125" />
          <div className="relative p-4 bg-white border border-slate-200 rounded-2xl shadow-xl">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Booting VyaparaMitra AI OS...
        </p>
      </div>
    );
  }

  // If Setup Wizard is not completed, display Onboarding Screen!
  if (!metadata || !metadata.setupCompleted) {
    return (
      <Onboarding 
        currentUser={user}
        onComplete={(newMeta) => {
          localStorage.setItem('vm_business_type', newMeta.businessType);
          localStorage.setItem('vm_business_name', newMeta.businessName);
          
          // Sync with Firestore profile to mark it as completed and store actual user choices
          if (user) {
            updateUserProfile(user.id, {
              ownerName: newMeta.ownerName,
              shopName: newMeta.businessName,
              shopType: newMeta.businessType,
              phone: newMeta.phone,
              setupCompleted: true
            }).catch(err => {
              console.error("Failed to update Firestore profile upon onboarding completion:", err);
            });
          }
          
          setMetadata(newMeta);
          handleNavigate('dashboard');
          triggerNotification('milestone', 'Database Seeded!', `Created standard product lines & sales charts for ${newMeta.businessType}.`);
        }} 
      />
    );
  }

  const ownerInitials = getInitials(user.name);

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800 antialiased selection:bg-blue-600/10 selection:text-blue-600">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-150 h-screen sticky top-0">
        
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
          </div>
          <div className="truncate">
            <h2 className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent uppercase truncate max-w-[140px]" title={metadata.businessName}>
              {metadata.businessName}
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[140px]" title={metadata.businessType}>
              {metadata.businessType}
            </p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-xs font-semibold tracking-wide transition relative border-r-3 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50/70  text-blue-700  border-blue-600 font-bold' 
                    : 'text-slate-600  hover:bg-slate-50/80  hover:text-slate-900  border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600 ' : item.highlight ? 'text-blue-500' : 'text-slate-400 '}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Credit & User Info */}
        <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer shrink-0">
                {ownerInitials}
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-800 capitalize leading-tight">{user.name}</h4>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-extrabold uppercase rounded border border-blue-100 inline-block mt-0.5">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Restart wizard action */}
              {user.role !== 'Employee' && (
                <button 
                  onClick={handleRestartSetup}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  title="Re-run Setup Wizard"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                title="Sign Out Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="text-[9px] text-slate-400 text-center leading-relaxed border-t border-slate-100/80 pt-2.5 font-bold tracking-wide">
            VyaparaMitra OS • Premium SaaS Edition
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950"
            />

            {/* Content box */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-64 bg-white h-full shadow-2xl flex flex-col p-5 space-y-6 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                  </div>
                  <div className="truncate">
                    <span className="font-black text-sm block tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent truncate max-w-[130px]" title={metadata.businessName}>
                      {metadata.businessName}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider truncate max-w-[130px]" title={metadata.businessType}>
                      {metadata.businessType}
                    </span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ x: -16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.025, type: 'spring', stiffness: 200, damping: 18 }}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs text-slate-700">
                    {ownerInitials}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-800 capitalize leading-tight">{user.name}</h4>
                    <span className="px-1 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded border border-blue-100 inline-block">
                      {user.role}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {user.role !== 'Employee' && (
                    <button 
                      onClick={handleRestartSetup}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-slate-150 flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>VyaparaMitra OS</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{getPageTitle()}</span>
            </div>
          </div>

          {/* Time & User Actions */}
          <div className="flex items-center gap-4 text-xs font-medium">
            {/* Real-time local clock display */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-150 text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Profile Avatar & Details */}
            <div 
              className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl transition group"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-700 capitalize font-semibold">{user.name}</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded">
                {user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Mount Layout Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {renderActiveComponent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Mitra AI Assistant Quick-Access Button */}
      {activeTab !== 'copilot' && activeTab !== 'mitra' && (
        <button
          onClick={() => handleNavigate('copilot')}
          className="fixed bottom-6 right-24 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2.5 text-xs font-bold border border-white/20 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open Mitra AI Business Assistant"
        >
          <div className="p-1 bg-white/20 rounded-full">
            <Bot className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span>Ask Mitra AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      )}

      {/* Floating AI Voice Assistant */}
      <VoiceAssistant 
        currentTab={activeTab}
        onNavigate={handleNavigate}
        onInvoicePreset={(preset) => {
          setInvoicePreset(preset);
          handleNavigate('invoices');
        }}
        onTriggerReport={() => {
          setTriggerReportFlag(prev => prev + 1);
          handleNavigate('reports');
        }}
      />

    </div>
  );
}
