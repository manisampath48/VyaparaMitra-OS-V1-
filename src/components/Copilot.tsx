import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Clock, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  DollarSign,
  ShieldCheck,
  Lock,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  Store,
  ChevronRight,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import Markdown from 'react-markdown';
import { sendMitraMessage, fetchMitraSummary } from '../lib/api';
import { ChatMessage } from '../types';

interface MitraAIProps {
  onNavigate?: (tab: string) => void;
}

export default function Copilot({ onNavigate }: MitraAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `### 🤖 Namaste! I am Mitra AI.

I am your personal, autonomous AI business assistant, dedicated exclusively to **your store**. 

I have direct, real-time access to your store's:
- 📦 **Products & Live Inventory** (Stock levels, valuations, reorder alerts)
- 📈 **Sales Transactions** (Daily revenue, profit margins, top sellers)
- 🧾 **Invoices & Dues** (Customer credit, outstanding bills)
- 👥 **Customer Accounts** (Active vs inactive patrons, purchase history)
- 💸 **Store Expenses** (Operating costs, overheads, margin optimization)

*🔒 Note: For your security, my access is strictly isolated to your store data only. I never share or compare your data with other merchants.*

How can I help you grow your business today? Choose a quick question below or ask me anything!`,
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('Understanding your question...');
  const [analysisStep, setAnalysisStep] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Store summary metrics for Mitra AI banner
  const [summary, setSummary] = useState<{
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
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch Store pulse metrics
  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await fetchMitraSummary();
        setSummary(data);
      } catch (err) {
        console.warn('Failed to load Mitra AI store summary pulse:', err);
      }
    }
    loadSummary();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Voice recognition already active:', err);
      }
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Progressive real analysis states
    setAnalysisStep(1);
    setAnalysisStatus('Understanding your question...');

    const timer1 = setTimeout(() => {
      setAnalysisStep(2);
      setAnalysisStatus('Checking your store data...');
    }, 400);

    const timer2 = setTimeout(() => {
      setAnalysisStep(3);
      setAnalysisStatus('Analyzing your store...');
    }, 850);

    try {
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await sendMitraMessage(textToSend, formattedHistory);

      clearTimeout(timer1);
      clearTimeout(timer2);

      const modelMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: res.responseText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `⚠️ I encountered an issue accessing your store ledger records. Please ensure your session is active.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear current conversation session? (Store records remain securely intact)')) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: `### 🤖 Conversation reset.

Your store context (${summary?.storeName || 'Your Store'}) remains actively loaded. What business metric, inventory check, or sales strategy would you like to explore next?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Structured categorized prompts for shop owners (matching user requirements)
  const PROMPT_GROUPS = [
    {
      category: 'Store Overview & Health',
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
      prompts: [
        'How is my store doing?',
        'Give me a summary of my store.',
        'What is my overall business performance?'
      ]
    },
    {
      category: 'Sales & Monthly Trends',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
      prompts: [
        'How much did I sell this month?',
        'Compare this month with last month',
        'Which day had the highest sales?',
        'Are my sales increasing or decreasing?'
      ]
    },
    {
      category: 'Products & Inventory',
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
      prompts: [
        'What are my top-selling products?',
        'Which products should I restock?',
        'Which products are not selling well?',
        'What products are declining in sales?'
      ]
    },
    {
      category: 'Customers & Overheads',
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
      prompts: [
        'Who are my top customers?',
        'Who are my repeat customers?',
        'Where am I losing money or spending most?',
        'What should I focus on this week?'
      ]
    }
  ];

  // Helper to extract quick action triggers from assistant reply
  const getActionSuggestions = (content: string) => {
    const text = content.toLowerCase();
    const actions: Array<{ label: string; tab: string; icon: any }> = [];

    if (text.includes('reorder') || text.includes('stock') || text.includes('inventory')) {
      actions.push({ label: 'Check Inventory', tab: 'inventory', icon: Package });
    }
    if (text.includes('invoice') || text.includes('due') || text.includes('bill')) {
      actions.push({ label: 'Manage Invoices', tab: 'invoices', icon: Receipt });
    }
    if (text.includes('customer') || text.includes('inactive') || text.includes('whatsapp')) {
      actions.push({ label: 'Open Customers', tab: 'customers', icon: Users });
    }
    if (text.includes('sales') || text.includes('revenue') || text.includes('profit') || text.includes('trend')) {
      actions.push({ label: 'Sales Analytics', tab: 'analytics', icon: BarChart3 });
    }
    return actions.slice(0, 2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Top Banner: Store Security & Live Store Context */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl shadow-md text-white shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Mitra AI
                  <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Gemini 3.8
                  </span>
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Isolated Store Data
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Personal AI Business Assistant for <span className="font-semibold text-white">{summary?.storeName || 'Your Store'}</span> ({summary?.businessType || 'Retail'})
              </p>
            </div>
          </div>

          {/* Single-Store Data Isolation Assurance Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 text-xs">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-white">Single-Store Sandbox</p>
              <p className="text-indigo-200 text-[10px]">
                Store ID: <span className="font-mono text-white/90">{summary?.storeId ? summary.storeId.substring(0, 16) + '...' : 'Verified'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Store Pulse KPI Strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block uppercase font-medium">Catalog Items</span>
              <span className="text-sm font-bold text-white">{summary.totalProducts}</span>
              {summary.lowStockCount > 0 && (
                <span className="text-[10px] text-amber-300 ml-1.5 font-semibold">({summary.lowStockCount} low)</span>
              )}
            </div>

            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block uppercase font-medium">Today's Sales</span>
              <span className="text-sm font-bold text-white">₹{summary.todayRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-indigo-300 ml-1">({summary.todayOrders} bills)</span>
            </div>

            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block uppercase font-medium">Customers</span>
              <span className="text-sm font-bold text-white">{summary.totalCustomers}</span>
              <span className="text-[10px] text-emerald-300 ml-1 font-semibold">({summary.activeCustomers} active)</span>
            </div>

            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block uppercase font-medium">Unpaid Dues</span>
              <span className="text-sm font-bold text-amber-300">₹{summary.unpaidDues.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 hidden lg:block">
              <span className="text-[10px] text-indigo-200 block uppercase font-medium">Recorded Expenses</span>
              <span className="text-sm font-bold text-white">₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[72vh]">
        
        {/* Left Side: Store Query Prompts */}
        <div className="lg:col-span-1 space-y-4 flex flex-col justify-start">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wide">Quick Store Prompts</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tap any prompt to have Mitra AI inspect your actual store database in real-time.
            </p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[58vh] pr-1">
            {PROMPT_GROUPS.map((group, idx) => {
              const IconComp = group.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200/70 rounded-2xl p-3 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs pb-1 border-b border-slate-100">
                    <div className={`p-1.5 rounded-lg ${group.color}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span>{group.category}</span>
                  </div>
                  <div className="space-y-1.5">
                    {group.prompts.map((pText, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(pText)}
                        disabled={loading}
                        className="w-full text-left text-[11px] text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/70 p-2 rounded-xl transition border border-slate-100 hover:border-blue-200 flex items-start justify-between gap-1 group disabled:opacity-50 cursor-pointer"
                      >
                        <span className="line-clamp-2 leading-snug">{pText}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Chat Workstation */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-[74vh] relative overflow-hidden">
          
          {/* Workstation Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  Mitra AI Assistant
                  <span className="text-[10px] text-slate-400 font-normal">
                    • Online & Connected to {summary?.storeName || 'Store'}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={handleClearHistory}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                title="Reset Conversation Context"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Reset Context</span>
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const actions = !isUser ? getActionSuggestions(msg.content) : [];

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shadow-xs ${
                    isUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-blue-600 border border-slate-200'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-slate space-y-2.5">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Shortcuts (if applicable) */}
                    {!isUser && actions.length > 0 && onNavigate && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Quick Actions:</span>
                        {actions.map((act, aIdx) => {
                          const ActIcon = act.icon;
                          return (
                            <button
                              key={aIdx}
                              onClick={() => onNavigate(act.tab)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 rounded-lg text-[11px] font-medium transition shadow-2xs cursor-pointer"
                            >
                              <ActIcon className="w-3 h-3 text-blue-600" />
                              <span>{act.label}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Metadata & Copy action */}
                    <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-blue-600 transition flex items-center gap-0.5 cursor-pointer ml-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shrink-0 shadow-xs h-9 w-9 flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl rounded-tl-none shadow-xs space-y-2.5 min-w-[280px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span className="text-xs font-semibold text-slate-800">
                        {analysisStatus}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      Step {analysisStep} of 3
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                      animate={{
                        width: analysisStep === 1 ? '33%' : analysisStep === 2 ? '66%' : '100%'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Personal store ledger</span>
                    <span className="font-medium text-slate-600">{summary?.storeName || 'Your Store'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening indicator banner */}
          <AnimatePresence>
            {isListening && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span className="font-medium">Listening to your voice... Speak your question clearly</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="text-[11px] underline text-blue-100 hover:text-white"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isListening 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isListening ? 'Stop listening' : 'Speak to Mitra AI (Voice input)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Mitra AI (e.g. 'What is my top selling product?', 'Which items should I reorder?')..."
              className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 outline-none transition"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-xl transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
