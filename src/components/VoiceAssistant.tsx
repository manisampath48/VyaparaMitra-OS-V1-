import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  MessageSquare, 
  ArrowUpRight, 
  Sparkles, 
  ChevronUp, 
  CornerDownRight, 
  Settings,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from './NotificationManager';
import { fetchStats, fetchMetadata, sendVoiceMessage } from '../lib/api';

interface VoiceAssistantProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onInvoicePreset?: (presetData: { customerName: string; customerPhone?: string }) => void;
  onTriggerReport?: () => void;
}

interface SpeechTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  intentDetected?: string;
}

export default function VoiceAssistant({ 
  currentTab, 
  onNavigate, 
  onInvoicePreset,
  onTriggerReport 
}: VoiceAssistantProps) {
  const { triggerNotification } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muteTts, setMuteTts] = useState(false);
  const [history, setHistory] = useState<SpeechTurn[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: "Hello! I am VyaparaMitra AI, your voice assistant. Let's talk business in English!",
      timestamp: new Date()
    }
  ]);

  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    fetchMetadata().then(meta => {
      setMetadata(meta);
      // Personalize initial message
      if (meta && meta.ownerName) {
        setHistory([
          {
            id: 'init',
            sender: 'assistant',
            text: `Hello ${meta.ownerName}! I am VyaparaMitra AI, your voice-activated copilot. Say "Hey VyaparaMitra" or speak directly to query status or navigate!`,
            timestamp: new Date()
          }
        ]);
      }
    }).catch(console.error);
  }, []);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, transcript]);

  // Keep handleVoiceCommand fresh using a ref to prevent stale closures in speech recognition
  const handleVoiceCommandRef = useRef<((command: string) => Promise<void>) | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let rec: any = null;

    if (SpeechRecognition) {
      rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian-English standard language locale

      rec.onstart = () => {
        setIsListening(true);
        // Instant voice interruption on mic start
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        triggerNotification('info', 'Microphone Active', "Speak now! Say 'take me to inventory' or 'what is low stock?'");
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setTranscript(interim);
        }

        if (final) {
          setTranscript('');
          handleVoiceCommandRef.current?.(final.trim());
        }
      };

      rec.onerror = (err: any) => {
        const errorType = err && err.error ? err.error : 'unknown';
        console.warn('Speech Recognition notice:', errorType);
        setIsListening(false);
        
        if (errorType === 'not-allowed') {
          triggerNotification('error', 'Microphone Access Required', 'Please allow microphone access in your browser to use voice commands.');
        } else if (errorType === 'network') {
          triggerNotification('warning', 'Network Issue', 'Speech recognition requires internet connectivity.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (rec) {
        try {
          rec.onstart = null;
          rec.onresult = null;
          rec.onerror = null;
          rec.onend = null;
          rec.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Cancel active speaking to avoid self-listening loop (Voice Interruption)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      
      try {
        setTranscript('');
        // Set continuous to false for ChatGPT-Voice like auto-silence submit behavior
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
        }
        recognitionRef.current?.start();
        setIsOpen(true);
      } catch (e) {
        console.warn('Speech recognition start issue, resetting...', e);
        // Retry safety
        try {
          recognitionRef.current?.abort();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch (err) {}
      }
    }
  };

  // TTS Engine Helper with Multilingual Voice Selection support
  const speakText = (text: string, langCode?: string) => {
    if (muteTts || !window.speechSynthesis) return;
    
    // Cancel any active speech output
    window.speechSynthesis.cancel();

    // Clean markdown structures & unwanted codes for a clean pronunciation
    const cleanText = text
      .replace(/[\*#_`\-]/g, ' ')
      .replace(/📋|📊|💡|🚀|🎯/g, ' ')
      .replace(/Suggested Next Action:.*/is, '')
      .replace(/सुझाई गई अगली कार्रवाई:.*/is, '')
      .replace(/సూచించబడిన తదుపరి చర్య:.*/is, '')
      .replace(/அடுத்த செயல்:.*/is, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0; // Perfect natural pacing

    // Map short codes (like 'hi', 'te', 'ta') to full voice region locales
    let mappedLang = langCode || 'en-IN';
    if (mappedLang === 'hi') mappedLang = 'hi-IN';
    if (mappedLang === 'te') mappedLang = 'te-IN';
    if (mappedLang === 'ta') mappedLang = 'ta-IN';
    if (mappedLang === 'kn') mappedLang = 'kn-IN';
    if (mappedLang === 'ml') mappedLang = 'ml-IN';

    utterance.lang = mappedLang;

    const voices = window.speechSynthesis.getVoices();
    // Intelligent accent/locale voice matching
    const matchedVoice = voices.find(v => 
      v.lang.toLowerCase() === mappedLang.toLowerCase() || 
      v.lang.toLowerCase().startsWith(mappedLang.split('-')[0].toLowerCase())
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    } else {
      // Direct English/Indian fallback voice
      const fallbackVoice = voices.find(v => v.lang.includes('EN-IN') || v.lang.includes('en-IN') || v.lang.includes('en-US'));
      if (fallbackVoice) {
        utterance.voice = fallbackVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Autonomous Multi-Agent Voice Processing
  const handleVoiceCommand = async (command: string) => {
    if (!command) return;

    // Interrupt any active voice rendering immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    // Add user turn to chat logs
    const userTurn: SpeechTurn = {
      id: Math.random().toString(),
      sender: 'user',
      text: command,
      timestamp: new Date()
    };
    setHistory(prev => [...prev, userTurn]);
    setIsThinking(true);

    try {
      // Map history records cleanly for token optimization & contextual memory
      const chatHistory = history.map(h => ({
        sender: h.sender,
        text: h.text
      })).slice(-10); // Keep last 10 turns for memory retention

      // Query our Master AI Orchestration Engine
      const res = await sendVoiceMessage(command, chatHistory);

      setIsThinking(false);

      // Add AI Response turn with intent tagging
      const aiTurn: SpeechTurn = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: res.responseText,
        timestamp: new Date(),
        intentDetected: res.detectedIntent !== 'none' ? res.detectedIntent : undefined
      };
      setHistory(prev => [...prev, aiTurn]);

      // Execute client-side voice commands & actions dynamically
      if (res.detectedIntent && res.detectedIntent !== 'none') {
        const intent = res.detectedIntent;
        const payload = res.intentPayload || {};

        if (intent === 'navigate_inventory') {
          triggerNotification('success', 'Voice Action executed', 'Navigating to Inventory catalog...');
          onNavigate('inventory');
        } 
        else if (intent === 'create_invoice') {
          triggerNotification('success', 'Voice Action executed', 'Opening GST Invoice desk...');
          if (payload.customerName) {
            onInvoicePreset?.({ 
              customerName: payload.customerName, 
              customerPhone: payload.customerPhone || '+91 99000 12345' 
            });
          }
          onNavigate('invoices');
        } 
        else if (intent === 'show_analytics') {
          triggerNotification('success', 'Voice Action executed', 'Loading advanced business trends...');
          onNavigate('analytics');
        } 
        else if (intent === 'search_customer') {
          triggerNotification('success', 'Voice Action executed', 'Opening customer directory list...');
          onNavigate('customers');
        } 
        else if (intent === 'open_reports') {
          triggerNotification('success', 'Voice Action executed', 'Launching smart business reports audit...');
          onNavigate('reports');
          if (onTriggerReport) {
            setTimeout(() => onTriggerReport(), 800);
          }
        } 
        else if (intent === 'create_gstr_report') {
          triggerNotification('success', 'Voice Action executed', 'Navigating to GST Filing reports...');
          onNavigate('gstr');
        } 
        else if (intent === 'open_engagement') {
          triggerNotification('success', 'Voice Action executed', 'Opening CRM Loyalty center...');
          onNavigate('engagement');
        } 
        else if (intent === 'go_dashboard') {
          triggerNotification('success', 'Voice Action executed', 'Going to main dashboard...');
          onNavigate('dashboard');
        }
      }

      // Speak response using auto-detected multilingual voice settings
      speakText(res.responseText, res.langCode);

    } catch (e) {
      console.error('Autonomous Agent voice processing issue:', e);
      setIsThinking(false);
      
      const errorMsg = "I'm experiencing a temporary connection issue with the database. Please try again in a moment!";
      setHistory(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'assistant',
        text: errorMsg,
        timestamp: new Date()
      }]);
      speakText(errorMsg, 'en-IN');
    }
  };

  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value;
      if (val.trim()) {
        handleVoiceCommand(val.trim());
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  // Helper to parse the 5 standard sections beautifully (Summary, Analysis, Insight, Recommendation, Action)
  const renderSectionedText = (text: string) => {
    if (!text.includes('###') && !text.includes('**')) {
      return <p className="whitespace-pre-wrap">{text}</p>;
    }

    const sections = text.split(/###\s+/);
    
    return (
      <div className="space-y-3">
        {sections.map((sec, idx) => {
          if (!sec.trim()) return null;
          
          const lines = sec.split('\n');
          const heading = lines[0].trim();
          const body = lines.slice(1).join('\n').trim();
          
          if (!body) {
            return <p key={idx} className="whitespace-pre-wrap text-xs">{sec}</p>;
          }

          const formattedBody = body.split('\n').map((bLine, bIdx) => {
            const trimmedLine = bLine.trim();
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
              return (
                <li key={bIdx} className="ml-4 list-disc list-outside text-[11px] text-slate-600 mt-1">
                  {trimmedLine.replace(/^[-*]\s*/, '')}
                </li>
              );
            }
            return <p key={bIdx} className="text-[11px] text-slate-600 mt-1">{trimmedLine}</p>;
          });

          // Custom visual headers styling
          let headerClass = "bg-slate-100 text-slate-700";
          if (heading.match(/Summary|सारांश|సారాంశం|சுருக்கம்/i)) headerClass = "bg-blue-50 text-blue-700 border border-blue-100";
          if (heading.match(/Analysis|विश्लेषण|విశ్లేషణ|பகுப்பாய்வு/i)) headerClass = "bg-purple-50 text-purple-700 border border-purple-100";
          if (heading.match(/Insight|अंतर्दृष्टि|అంతర్దృష్టి|நுண்ணறிவு/i)) headerClass = "bg-amber-50 text-amber-700 border border-amber-100";
          if (heading.match(/Recommendation|अनुशंसा|సిఫార్సు|பரிந்துரை/i)) headerClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
          if (heading.match(/Action|कार्रवाई|చర్య|செயல்/i)) headerClass = "bg-rose-50 text-rose-700 border border-rose-100";

          return (
            <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-1 shadow-sm transition-all hover:bg-slate-50">
              <div className="flex items-center">
                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${headerClass}`}>
                  {heading}
                </span>
              </div>
              <div className="text-xs leading-relaxed font-medium text-slate-700">
                {formattedBody}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Draggable/Fixed Floating Microphone Button */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3">
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={`relative p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all ${
            isListening 
              ? 'bg-red-600 text-white ring-4 ring-red-500/30 shadow-red-500/25' 
              : isThinking
              ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30'
              : isSpeaking 
              ? 'bg-blue-500 text-white ring-4 ring-blue-500/30 shadow-blue-500/25'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
          }`}
          id="floating-voice-mic"
          title="Hey VyaparaMitra - Click to talk"
        >
          {/* Waveform Pulses while active */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
              <span className="absolute -inset-2 rounded-full border-2 border-red-500/20 animate-pulse" />
            </>
          )}
          {isSpeaking && (
            <>
              <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
            </>
          )}
          {isThinking && (
            <>
              <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-spin border-2 border-dashed border-indigo-400" />
            </>
          )}

          {isListening ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </motion.button>

        {/* Quick Activation Toast / Subtitle */}
        <AnimatePresence>
          {(isListening || isThinking || isSpeaking) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setIsOpen(true)}
              className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2.5 cursor-pointer max-w-xs"
            >
              <div className="flex gap-0.5 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="truncate">
                {isListening ? (transcript || 'Listening...') : isThinking ? 'Thinking...' : 'Speaking...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Toggle Button for Chat History Logs Panel */}
      <div className="fixed bottom-6 right-22 z-40">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          className={`p-3.5 rounded-full shadow-lg border cursor-pointer flex items-center justify-center transition-all ${
            isOpen 
              ? 'bg-slate-800 border-slate-700 text-white' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Voice Log Console"
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Slide-out Voice Console Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-24 left-6 right-6 md:left-auto md:right-6 md:w-96 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col max-h-[520px] overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-tight">VyaparaMitra voice agent</h3>
                  <span className="text-[9px] text-slate-400 font-medium">Hey VyaparaMitra Business Voice Terminal</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMuteTts(!muteTts)}
                  className={`p-1.5 rounded-lg transition ${muteTts ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:bg-slate-100'}`}
                  title={muteTts ? "Unmute Voice" : "Mute Voice"}
                >
                  {muteTts ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Voice Waveform Center */}
            {(isListening || isThinking || isSpeaking) && (
              <div className="px-5 py-4 bg-slate-900 text-white flex flex-col items-center justify-center gap-2 border-b border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-indigo-950/20 to-emerald-950/10 opacity-60 animate-pulse" />
                
                <div className="flex items-center justify-center gap-1 h-12 z-10">
                  {isListening && (
                    Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-emerald-400 to-teal-400 rounded-full"
                        animate={{ height: [12, Math.random() * 35 + 10, 12] }}
                        transition={{
                          duration: 0.35 + (i * 0.04),
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ))
                  )}
                  {isThinking && (
                    <div className="relative flex items-center justify-center w-10 h-10">
                      <motion.div 
                        className="absolute w-10 h-10 border-2 border-dashed border-indigo-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="absolute w-7 h-7 border-2 border-dashed border-emerald-400 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                  )}
                  {isSpeaking && (
                    Array.from({ length: 12 }).map((_, i) => {
                      const baseHeight = [12, (i % 2 === 0 ? 30 : 16) + (Math.sin(i) * 8), 12];
                      return (
                        <motion.div
                          key={i}
                          className="w-1 bg-gradient-to-t from-blue-400 to-indigo-400 rounded-full"
                          animate={{ height: baseHeight }}
                          transition={{
                            duration: 0.5 + (i * 0.04),
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      );
                    })
                  )}
                </div>
                
                <span className="text-[9px] text-slate-300 font-bold tracking-widest uppercase z-10 flex items-center gap-1.5">
                  {isListening && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Listening to your voice...
                    </>
                  )}
                  {isThinking && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-spin border border-t-transparent border-indigo-400" />
                      AI Orchestrator Analyzing...
                    </>
                  )}
                  {isSpeaking && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Speaking recommendations...
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[280px] bg-slate-50/20">
              {history.map((turn) => (
                <div 
                  key={turn.id} 
                  className={`flex flex-col ${turn.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Badge */}
                  <span className="text-[9px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    {turn.sender === 'user' ? 'You' : 'VyaparaMitra Voice OS'}
                    {turn.intentDetected && (
                      <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border border-emerald-100">
                        {turn.intentDetected}
                      </span>
                    )}
                  </span>

                  {/* Message Bubble */}
                  <div className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed font-medium ${
                    turn.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none space-y-2.5 shadow-sm'
                  }`}>
                    {turn.sender === 'user' ? (
                      <p>{turn.text}</p>
                    ) : (
                      renderSectionedText(turn.text)
                    )}
                  </div>
                </div>
              ))}

              {/* Interim voice transcript */}
              {isListening && transcript && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-400 font-bold mb-1 animate-pulse">Transcribing...</span>
                  <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl rounded-tr-none text-xs italic font-medium">
                    {transcript}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Terminal Input Box */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <input 
                type="text" 
                placeholder="Type command or speak..." 
                onKeyDown={handleKeyPress}
                className="flex-1 bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition font-medium"
              />
              <button 
                onClick={toggleListening}
                className={`p-2 rounded-xl transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Shortcuts inside Drawer */}
            <div className="px-4 pb-4 pt-1 bg-slate-50/50 flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleVoiceCommand("What are my low stock products?")}
                className="text-[9px] bg-white border border-slate-150 hover:bg-slate-50 text-slate-600 font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <CornerDownRight className="w-2.5 h-2.5 text-blue-500" />
                Check Low Stock
              </button>
              <button 
                onClick={() => handleVoiceCommand("Generate a business report")}
                className="text-[9px] bg-white border border-slate-150 hover:bg-slate-50 text-slate-600 font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <CornerDownRight className="w-2.5 h-2.5 text-emerald-500" />
                Diagnostic Report
              </button>
              <button 
                onClick={() => handleVoiceCommand("Take me to sales ledger")}
                className="text-[9px] bg-white border border-slate-150 hover:bg-slate-50 text-slate-600 font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <CornerDownRight className="w-2.5 h-2.5 text-purple-500" />
                Open Sales Log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
