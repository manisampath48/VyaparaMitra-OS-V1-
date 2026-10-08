import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Shield,
  Brain,
  Package,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Zap,
  QrCode,
  Volume2,
  FileText,
  Cloud,
  Activity,
  Check,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: string; username: string; name: string; email: string; role: string }) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

// Rotating premium insights for the AI Business Live Monitor
const COGNITIVE_INSIGHTS = [
  { text: "Today's Revenue Increased by +24.8% vs last week", type: "revenue", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { text: "Low Stock Alert: 3 key fast-moving items need restocking", type: "warning", icon: Package, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { text: "VyaparaMitra cognitive engine calculated optimal margin adjustments", type: "ai", icon: Brain, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { text: "Smart GST Ledger report generated and ready for export", type: "doc", icon: FileText, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { text: "High consumer frequency detected between 4:00 PM and 7:00 PM", type: "activity", icon: Activity, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  { text: "Automatic database backup synchronized with secure cloud nodes", type: "cloud", icon: Cloud, color: "text-teal-600 bg-teal-50 border-teal-100" }
];

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const role = 'Business Owner';
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Rotating index for the live AI Insights monitor
  const [insightIndex, setInsightIndex] = useState(0);

  // Stats Counters
  const [inventoryHealth, setInventoryHealth] = useState(91);
  const [billingBoost, setBillingBoost] = useState(25);
  const [aiScore, setAiScore] = useState(88.4);

  // Active laser scan code simulation
  const [scannedCode, setScannedCode] = useState("8901023004512");
  const [scannedName, setScannedName] = useState("Basmati Premium Rice 5kg");

  // Rotate AI Insights every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % COGNITIVE_INSIGHTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Soft stats counting up simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setInventoryHealth((prev) => (prev < 98 ? prev + 1 : 98));
      setBillingBoost((prev) => (prev < 40 ? prev + 1 : 40));
      setAiScore((prev) => (prev < 96.7 ? Math.min(96.7, Number((prev + 0.1).toFixed(1))) : 96.7));
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Barcode simulation cycling
  useEffect(() => {
    const products = [
      { code: "8901023004512", name: "Basmati Premium Rice 5kg" },
      { code: "8901058002341", name: "Fortune Mustard Oil 1L" },
      { code: "8901719114022", name: "Tata Salt Iodized 1kg" },
      { code: "8902083001556", name: "Dettol Liquid Handwash" },
      { code: "8906002341258", name: "Cadbury Dairy Milk Silk" }
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % products.length;
      setScannedCode(products[idx].code);
      setScannedName(products[idx].name);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const resetFields = () => {
    setUsername('');
    setPassword('');
    setName('');
    setEmail('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetFields();
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Sync user with local server
      const syncRes = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName,
          role: 'Business Owner',
        }),
      });

      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || 'Failed to synchronize account with server');
      }

      localStorage.setItem('vm_token', syncData.token);
      localStorage.setItem('vm_user', JSON.stringify(syncData.user));

      // Trigger gorgeous success animation
      setShowSuccessCheck(true);
      setTimeout(() => {
        onAuthSuccess(syncData.token, syncData.user);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The Google Sign-In popup was closed before completing authentication.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('A network error occurred. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred during Google Sign-In');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        // 1. Resolve email if only username is input
        let emailToUse = username;
        if (!username.includes('@')) {
          try {
            const resolveRes = await fetch(`/api/auth/resolve?username=${encodeURIComponent(username)}`);
            const resolveData = await resolveRes.json();
            if (resolveRes.ok && resolveData.email) {
              emailToUse = resolveData.email;
            } else {
              throw new Error('User not found');
            }
          } catch (resErr) {
            throw new Error('Invalid username or password');
          }
        }

        // 2. Authenticate using Firebase
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/operation-not-allowed') {
            try {
              // Try local server authenticate first (demo backward compatibility)
              const localRes = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
              });
              const localData = await localRes.json();
              if (localRes.ok && localData.user) {
                // Local is valid! Store session and proceed
                if (rememberMe) {
                  localStorage.setItem('vm_token', localData.token);
                  localStorage.setItem('vm_user', JSON.stringify(localData.user));
                } else {
                  sessionStorage.setItem('vm_token', localData.token);
                  sessionStorage.setItem('vm_user', JSON.stringify(localData.user));
                }
                
                setShowSuccessCheck(true);
                setTimeout(() => {
                  onAuthSuccess(localData.token, localData.user);
                }, 1500);
                return;
              } else {
                throw fbErr;
              }
            } catch (fallbackErr: any) {
              // Map firebase errors
              if (fallbackErr.code === 'auth/invalid-email') {
                throw new Error('Please enter a valid email address.');
              } else if (fallbackErr.code === 'auth/user-disabled') {
                throw new Error('This user account has been disabled.');
              } else if (fallbackErr.code === 'auth/user-not-found' || fallbackErr.code === 'auth/invalid-credential' || fallbackErr.code === 'auth/operation-not-allowed') {
                throw new Error('Invalid credentials. Please verify your email/username and password.');
              } else if (fallbackErr.code === 'auth/wrong-password') {
                throw new Error('Incorrect password. Please try again.');
              } else if (fallbackErr.code === 'auth/network-request-failed') {
                throw new Error('A network error occurred. Please check your internet connection and try again.');
              } else {
                throw new Error(fallbackErr.message || 'Invalid credentials. Please verify your email/username and password.');
              }
            }
          } else {
            // Map other firebase errors
            if (fbErr.code === 'auth/invalid-email') {
              throw new Error('Please enter a valid email address.');
            } else if (fbErr.code === 'auth/user-disabled') {
              throw new Error('This user account has been disabled.');
            } else if (fbErr.code === 'auth/wrong-password') {
              throw new Error('Incorrect password. Please try again.');
            } else if (fbErr.code === 'auth/network-request-failed') {
              throw new Error('A network error occurred. Please check your internet connection and try again.');
            } else {
              throw new Error(fbErr.message || 'An unexpected error occurred during sign in');
            }
          }
        }

        const fbUser = userCredential.user;

        // 3. Sync with local server to get session token and profile
        const syncRes = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email,
            username: username.includes('@') ? undefined : username,
          }),
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok) {
          throw new Error(syncData.error || 'Failed to sync with application server');
        }

        if (rememberMe) {
          localStorage.setItem('vm_token', syncData.token);
          localStorage.setItem('vm_user', JSON.stringify(syncData.user));
        } else {
          sessionStorage.setItem('vm_token', syncData.token);
          sessionStorage.setItem('vm_user', JSON.stringify(syncData.user));
        }

        setShowSuccessCheck(true);
        setTimeout(() => {
          onAuthSuccess(syncData.token, syncData.user);
        }, 1500);

      } else if (mode === 'signup') {
        // Validate fields
        if (!username || !password || !name || !email) {
          throw new Error('All fields are required.');
        }
        if (password.length < 6) {
          throw new Error('The password is too weak. It must be at least 6 characters.');
        }

        // 1. Create user in Firebase Authentication
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/operation-not-allowed') {
            console.warn('Firebase Email/Password provider is disabled. Falling back to local authentication...');
            const localRes = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, name, email, role }),
            });
            const localData = await localRes.json();
            if (!localRes.ok) throw new Error(localData.error || 'Failed to register account locally');
            
            localStorage.setItem('vm_token', localData.token);
            localStorage.setItem('vm_user', JSON.stringify(localData.user));
            
            setShowSuccessCheck(true);
            setTimeout(() => {
              onAuthSuccess(localData.token, localData.user);
            }, 1500);
            return;
          }
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('The email address is already in use by another account.');
          } else if (fbErr.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address.');
          } else if (fbErr.code === 'auth/weak-password') {
            throw new Error('The password is too weak. It must be at least 6 characters.');
          } else if (fbErr.code === 'auth/network-request-failed') {
            throw new Error('A network error occurred. Please check your internet connection and try again.');
          } else {
            throw fbErr;
          }
        }

        const fbUser = userCredential.user;

        // 2. Sync / Register user on the backend
        const syncRes = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email,
            name,
            role,
            username,
          }),
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok) {
          throw new Error(syncData.error || 'Failed to synchronize with application server');
        }

        localStorage.setItem('vm_token', syncData.token);
        localStorage.setItem('vm_user', JSON.stringify(syncData.user));
        
        setShowSuccessCheck(true);
        setTimeout(() => {
          onAuthSuccess(syncData.token, syncData.user);
        }, 1500);

      } else {
        // Forgot password - Firebase API
        if (!email) {
          throw new Error('Email is required.');
        }
        try {
          await sendPasswordResetEmail(auth, email);
          setSuccessMsg('Password reset instructions have been sent to your registered email address.');
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/operation-not-allowed') {
            const localRes = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            const localData = await localRes.json();
            if (localRes.ok) {
              setSuccessMsg(localData.message || 'Reset link sent successfully!');
              return;
            } else {
              throw fbErr;
            }
          }
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            throw new Error('No user registered with this email address.');
          } else if (fbErr.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address.');
          } else if (fbErr.code === 'auth/network-request-failed') {
            throw new Error('A network error occurred. Please check your internet connection and try again.');
          } else {
            throw fbErr;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ActiveInsightIcon = COGNITIVE_INSIGHTS[insightIndex].icon;

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-full bg-slate-50/40 flex flex-col lg:flex-row relative overflow-x-hidden lg:overflow-hidden select-none font-sans text-slate-800 antialiased">
      
      {/* ----------------------------------------------------------------- */}
      {/* PREMIUM SAAS LAYERED BACKGROUND: Blurred light gradients & grid    */}
      {/* ----------------------------------------------------------------- */}
      {/* Subtle dotted matrix grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-multiply" 
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.15) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Exquisite micro abstract blurred mesh vectors (under 10% opacity) */}
      <motion.div 
        className="absolute top-[-10%] left-[-15%] w-[65rem] h-[65rem] bg-gradient-to-tr from-indigo-300/20 via-blue-200/10 to-transparent blur-[140px] rounded-full pointer-events-none z-0"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div 
        className="absolute bottom-[-15%] right-[-10%] w-[55rem] h-[55rem] bg-gradient-to-br from-emerald-200/15 via-indigo-100/10 to-transparent blur-[140px] rounded-full pointer-events-none z-0"
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="absolute top-[35%] left-[40%] w-[40rem] h-[40rem] bg-sky-200/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Floating particles background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-indigo-500/10 rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${15 + ((i * 22) % 70)}%`,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.15, 0.5, 0.15],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* LEFT COLUMN: THE PREMIUM ENTERPRISE COGNITIVE OPERATING SYSTEM    */}
      {/* ----------------------------------------------------------------- */}
      <div className="lg:w-[46%] xl:w-[45%] w-full flex flex-col justify-between p-6 sm:p-8 lg:p-6 xl:p-8 2xl:p-10 relative z-10 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/60 bg-white/35 backdrop-blur-xl lg:h-full lg:overflow-y-auto">
        
        {/* Brand identity header */}
        <div className="space-y-4 lg:space-y-2 xl:space-y-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 4 }}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/15 border border-white/20 flex items-center justify-center shrink-0"
            >
              <Sparkles className="w-5.5 h-5.5 text-amber-300 fill-amber-300 animate-pulse" />
            </motion.div>
            <div>
              <span className="text-[10px] font-black tracking-[0.25em] text-indigo-600 uppercase block">AI Retail Copilot</span>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                VyaparaMitra
              </h1>
            </div>
          </div>

          <div className="space-y-2.5 lg:space-y-1.5 xl:space-y-3">
            <h2 className="text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              VyaparaMitra
            </h2>
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Your AI Business Copilot for Smarter Retail Management
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Empowering grocery stores, medical shops, and retail businesses with AI-powered inventory management, billing, analytics, voice assistance, and customer engagement—all in one intelligent platform.
            </p>
          </div>
        </div>

        {/* Live Cockpit Monitor Panel - The "WOW" Dynamic Ticker Element */}
        <div className="my-5 lg:my-3 xl:my-6 relative">
          <div className="absolute inset-0 bg-indigo-500/[0.02] blur-xl rounded-full pointer-events-none" />

          <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-lg relative overflow-hidden group">
            
            {/* Window title bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 ml-1.5">Live Cockpit Monitor v2.5</span>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100/50 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Live Sync Active
              </span>
            </div>

            <div className="space-y-4">
              
              {/* Dynamic Ticker box */}
              <div className="p-3.5 bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl relative overflow-hidden min-h-[56px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={insightIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3 w-full"
                  >
                    <div className={`p-2 rounded-xl shrink-0 border ${COGNITIVE_INSIGHTS[insightIndex].color}`}>
                      <ActiveInsightIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block">AI Business Insight</span>
                      <p className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">{COGNITIVE_INSIGHTS[insightIndex].text}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Horizontal Progress Loader ticker indicator */}
                <motion.div 
                  key={`ticker-loader-${insightIndex}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.5, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-indigo-600"
                />
              </div>

              {/* Graphical Trend Line representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-white shadow-xs flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 mt-2">Anand K.</span>
                  <span className="text-[8px] font-bold text-[#10B981] uppercase tracking-wider mt-0.5">Shop Owner</span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl col-span-2 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">REVENUE FLOW</span>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +24.5%</span>
                  </div>
                  
                  <div className="h-10 relative w-full mt-1.5">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(15,23,42,0.03)" strokeWidth="0.5" />
                      <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(15,23,42,0.03)" strokeWidth="0.5" />
                      
                      <path d="M0,28 L15,22 L30,25 L45,14 L60,19 L75,8 L90,11 L100,2 L100,30 L0,30 Z" fill="url(#glowGradient)" />
                      
                      <motion.path 
                        d="M0,28 L15,22 L30,25 L45,14 L60,19 L75,8 L90,11 L100,2" 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3, ease: "easeOut" }}
                      />
                      
                      <circle cx="100" cy="2" r="3" fill="#10B981" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Dynamic Camera / Voice Monitor HUDs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">CAM BARCODE SCAN</span>
                  </div>
                  <div className="h-10 bg-slate-900/5 rounded-lg border border-dashed border-slate-300 relative overflow-hidden flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-slate-800 font-extrabold">{scannedCode}</span>
                    <span className="text-[8px] font-bold text-[#64748B] mt-0.5">{scannedName}</span>
                    <motion.div 
                      className="absolute left-0 right-0 h-[1.5px] bg-rose-500 shadow-md shadow-rose-500"
                      animate={{ y: [-15, 20, -15] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">AI VOICE AUDIO</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  </div>
                  
                  <div className="flex items-end justify-center gap-1 h-5 my-1">
                    {[1.2, 2.5, 1.4, 2.8, 1.1, 2.7, 1.9, 1.5, 2.2, 1.3].map((h, i) => (
                      <motion.div 
                        key={i}
                        className="w-[2.5px] bg-sky-500 rounded-full"
                        animate={{ height: [2, h * 6, 2] }}
                        transition={{ duration: 1.0 + (i * 0.07), repeat: Infinity, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-bold text-center text-indigo-600 tracking-wide font-mono mt-0.5">
                    "Cognitive billing verified"
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Tactile Premium Feature Cards (Vertical Stack with high readability) */}
        <div className="space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 block">Premium Feature Matrix</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: '🤖 AI Business Assistant',
                desc: 'Instant answers for stock levels, margins, and automatic GSTR preparation.',
                icon: Brain,
                color: 'bg-indigo-50 border-indigo-100/50 text-indigo-600'
              },
              {
                title: '⚡ Superfast Smart Billing',
                desc: 'Natively connect retail barcode scanners or use integrated vision scanning.',
                icon: Zap,
                color: 'bg-amber-50 border-amber-100/50 text-amber-600'
              },
              {
                title: '📊 Cognitive Analytics',
                desc: 'Beautiful real-time sales reports and tax preparations in one single tap.',
                icon: FileText,
                color: 'bg-emerald-50 border-emerald-100/50 text-emerald-600'
              },
              {
                title: '🎙️ Voice-Command Billing',
                desc: 'Dictate transactions directly to the voice assistant for hands-free workflow.',
                icon: Volume2,
                color: 'bg-cyan-50 border-cyan-100/50 text-cyan-600'
              }
            ].map((f, idx) => {
              const IconComp = f.icon;
              return (
                <div
                  key={idx}
                  className="bg-white hover:bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-start gap-3 transition duration-200 shadow-2xs group cursor-default"
                >
                  <div className={`p-2 rounded-lg shrink-0 border ${f.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                      {f.title}
                    </h4>
                    <p className="text-[10px] leading-relaxed text-slate-500 font-medium">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic score dashboard stats cards bottom row */}
        <div className="grid grid-cols-3 gap-3 mt-5 lg:mt-3 xl:mt-6">
          {[
            { label: 'Inventory Health', value: `${inventoryHealth}%`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
            { label: 'Billing Speed', value: `+${billingBoost}% Boost`, icon: Zap, color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50' },
            { label: 'AI Operating Score', value: `${aiScore}%`, icon: Brain, color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50' }
          ].map((stat, sIdx) => {
            const StatIcon = stat.icon;
            return (
              <div key={sIdx} className="bg-white border border-slate-150 p-2.5 lg:p-2 xl:p-3 rounded-xl flex flex-col justify-between h-18 lg:h-16 xl:h-20 text-left shadow-2xs">
                <div className={`p-1 rounded-md w-fit border ${stat.color}`}>
                  <StatIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">{stat.value}</h4>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIGHT COLUMN: MODERN PREMIUM GLASS FORM CARD                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="lg:w-[54%] xl:w-[55%] w-full flex items-center justify-center p-4 sm:p-6 lg:p-4 xl:p-6 2xl:p-8 relative z-10 lg:h-full lg:overflow-hidden">
        
        {/* Glow halo behind authentication panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-indigo-500/[0.03] blur-[140px] rounded-full pointer-events-none z-0" />

        <div className="w-full max-w-lg relative z-10 flex flex-col justify-center max-h-full">
          
          <AnimatePresence mode="wait">
            {showSuccessCheck ? (
              /* OUTSTANDING SUCCESS COMPLETION STATE (Fades in on success) */
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white border border-slate-200 p-12 rounded-[28px] shadow-xl text-center space-y-6"
              >
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 11, delay: 0.15 }}
                  >
                    <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
                  </motion.div>
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-emerald-500/10"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Session Approved</span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Authenticating Session...</h3>
                  <p className="text-xs text-slate-500 font-medium">Entering your secure business dashboard cockpit now.</p>
                </div>

                <div className="pt-2">
                  <div className="w-16 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              /* LUXURY CLASS GLASS CARD AUTHENTICATION */
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white border border-slate-200 p-5 sm:p-7 lg:p-5 xl:p-7 rounded-2xl shadow-xl relative overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-2.5rem)] w-full"
              >
                {/* Visual Glass Edge Light accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                {/* Secure Badge Welcome info */}
                <div className="mb-3.5 lg:mb-2 xl:mb-3.5 text-left shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 lg:py-0.5 xl:py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wider mb-2 lg:mb-1 xl:mb-2 border border-indigo-100/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    ✔ SECURE BILLING PORTAL
                  </div>

                  <h2 className="text-xl lg:text-xl xl:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    Welcome Back 👋
                  </h2>
                  <h3 className="text-[11px] lg:text-[10px] xl:text-xs font-bold text-slate-400 tracking-tight uppercase mt-0.5">
                    Your AI Business Partner is Ready
                  </h3>
                  <p className="text-[11px] lg:text-[10px] xl:text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Continue growing your business with intelligent insights, smarter inventory management, and effortless operations.
                  </p>
                </div>

                {/* Error/Success alerts */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-2.5 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2.5 text-xs shrink-0"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="font-bold leading-normal">{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-2.5 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="font-bold leading-normal">{successMsg}</span>
                  </motion.div>
                )}

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  
                  {/* Scrollable Form Fields with min-height: 0 */}
                  <div className="overflow-y-auto min-h-0 flex-1 space-y-2.5 lg:space-y-2 xl:space-y-2.5 pr-1 py-0.5">
                    {mode === 'signup' && (
                      <>
                        {/* Name input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Full Name</label>
                          <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Anand Kumar"
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9.5 pr-4 py-2.5 lg:py-2 xl:py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition duration-200 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Email input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Email Address</label>
                          <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="e.g. anand@retail.com"
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9.5 pr-4 py-2.5 lg:py-2 xl:py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition duration-200 font-semibold"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {mode !== 'forgot' && (
                      <>
                        {/* Account Identifier (Username / Email) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Username or Email</label>
                          <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Enter username (e.g. owner)"
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9.5 pr-4 py-2.5 lg:py-2 xl:py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition duration-200 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Account Password */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Password</label>
                            {mode === 'signin' && (
                              <button
                                type="button"
                                onClick={() => handleModeChange('forgot')}
                                className="text-[9px] text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-widest transition cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            )}
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9.5 pr-10 py-2.5 lg:py-2 xl:py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition duration-200 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {mode === 'forgot' && (
                      /* Password Recovery Email */
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Registered Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. register@business.com"
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9.5 pr-4 py-2.5 lg:py-2 xl:py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition duration-200 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'signin' && (
                      /* Remember session checkbox */
                      <div className="flex items-center gap-2 py-0.5">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 bg-slate-50 border-slate-200 rounded accent-indigo-600 cursor-pointer focus:ring-0 focus:outline-none"
                        />
                        <label htmlFor="remember" className="text-[10px] text-slate-500 font-bold select-none cursor-pointer">
                          Remember this device (Keep session token)
                        </label>
                      </div>
                    )}
                  </div>

                  {/* SUBMIT BUTTON SECTION (Always visible, pinned at bottom of form) */}
                  <div className="shrink-0 pt-2 lg:pt-1.5 xl:pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 lg:py-2.5 xl:py-3.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 active:scale-[0.99] disabled:opacity-50 relative overflow-hidden group"
                    >
                      {/* Sweep white glow shine animation */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 translate-x-[-100%]"
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                      />

                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : mode === 'signin' ? (
                        <>
                          <LogIn className="w-4 h-4 text-white" /> Launch My Business Dashboard
                        </>
                      ) : mode === 'signup' ? (
                        <>
                          <UserPlus className="w-4.5 h-4.5 text-white" /> Activate My AI Dashboard
                        </>
                      ) : (
                        <>
                          Send Recovery Instructions <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {mode === 'signin' && (
                      <>
                        <div className="relative flex py-1 lg:py-0.5 xl:py-1 items-center">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">Or Continue With</span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* PREMIUM OUTLINED GOOGLE SINGLE SIGN-ON BUTTON */}
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full py-2.5 lg:py-2 xl:py-2.5 bg-white hover:bg-slate-50 text-xs font-black text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-50 duration-200"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Continue with Google
                        </button>
                      </>
                    )}
                  </div>
                </form>

                {/* TRUST MATRIX ROW (Below Form) */}
                <div className="mt-3 pt-2.5 lg:mt-2 lg:pt-2 xl:mt-3 xl:pt-2.5 border-t border-slate-100 shrink-0">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1.5 lg:mb-1 xl:mb-1.5 text-center">Verified Enterprise Trust Matrix</span>
                  <div className="grid grid-cols-2 gap-1.5 lg:gap-1.5 xl:gap-2 text-[10px] lg:text-[9px] xl:text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 lg:p-1.5 xl:p-2 rounded-lg border border-slate-100">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">Firebase Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 lg:p-1.5 xl:p-2 rounded-lg border border-slate-100">
                      <Brain className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Gemini AI Native</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 lg:p-1.5 xl:p-2 rounded-lg border border-slate-100">
                      <Cloud className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">Realtime Cloud Sync</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 lg:p-1.5 xl:p-2 rounded-lg border border-slate-100">
                      <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Enterprise Armor</span>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="mt-3 lg:mt-1.5 xl:mt-2.5 text-center text-xs shrink-0">
                  {mode === 'signin' ? (
                    <p className="text-slate-500 font-bold">
                      New to VyaparaMitra?{' '}
                      <button
                        onClick={() => handleModeChange('signup')}
                        className="text-indigo-600 hover:text-indigo-700 font-black decoration-2 hover:underline transition cursor-pointer"
                      >
                        Register Account
                      </button>
                    </p>
                  ) : mode === 'signup' ? (
                    <p className="text-slate-500 font-bold">
                      Already have an account?{' '}
                      <button
                        onClick={() => handleModeChange('signin')}
                        className="text-indigo-600 hover:text-indigo-700 font-black decoration-2 hover:underline transition cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <button
                      onClick={() => handleModeChange('signin')}
                      className="text-slate-500 hover:text-slate-700 font-black flex items-center gap-1.5 mx-auto hover:underline transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Back to Sign In
                    </button>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
