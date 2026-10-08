import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Printer, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  RefreshCw,
  CheckCircle2,
  FileCheck2,
  Calendar,
  X
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateBusinessReport } from '../lib/api';

interface ReportsProps {
  triggerReportFlag?: number;
}

export default function Reports({ triggerReportFlag }: ReportsProps = {}) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // Auto trigger report generation from Voice Assistant
  useEffect(() => {
    if (triggerReportFlag && triggerReportFlag > 0) {
      handleGenerateReport('WEEKLY');
    }
  }, [triggerReportFlag]);

  const steps = {
    DAILY: [
      'Scanning daily counter registers and UPI receipts...',
      'Verifying stockout buffers and active fast-moving lines...',
      'Mapping immediate product refill requisitions...',
      'Invoking server-side Gemini 3.5 live operational auditor...',
      'Structuring daily checklist and audit report sheet...'
    ],
    WEEKLY: [
      'Syncing 7-day sales ledgers and growth quotients...',
      'Auditing inventory velocity profiles and supplier lead times...',
      'Identifying lapsed customer clusters for coupon targeting...',
      'Engaging server-side Gemini 3.5 performance strategist...',
      'Generating weekly summary diagnostics and action plan...'
    ],
    MONTHLY: [
      'Aggregating 30-day cumulative retail invoice books...',
      'Calculating 18% GST CGST/SGST tax liabilities...',
      'Computing Customer Lifetime Values (CLV) and churn rates...',
      'Analyzing market trend vectors on Gemini 3.5 executive brain...',
      'Drafting investor-ready monthly financial report outline...'
    ]
  };

  const handleGenerateReport = async (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setSelectedType(type);
    setLoading(true);
    setReport(null);
    setStep(0);

    const activeSteps = steps[type];
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev < activeSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 850);

    try {
      const markdown = await generateBusinessReport(type);
      clearInterval(interval);
      setReport(markdown);
    } catch (err) {
      console.error(err);
      setReport(`# ⚠️ Compilation Failure\nFailed to compile the AI report. Please verify server connectivity.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReportText = () => {
    if (!report) return;
    const link = document.createElement('a');
    const file = new Blob([report], { type: 'text/markdown' });
    link.href = URL.createObjectURL(file);
    link.download = `VyaparaMitra_AI_Report_${selectedType}_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Autonomous Business Intelligence Reports</h1>
        <p className="text-xs text-slate-400">Generate instantly compiled, diagnostic audits and tactical strategic guidelines using Gemini</p>
      </div>

      {/* Preset Selector Panel */}
      {!report && !loading && (
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Report Type to Generate</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Daily Operational Audit */}
            <div className="bg-white border border-slate-150 hover:border-blue-500 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Daily Operational Audit</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Refill checklists, critical stock counts, counter register UPI reconciliations, and immediate operational priorities.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('DAILY')}
                className="w-full bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-700 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl border border-slate-150 hover:border-amber-500 transition"
              >
                Compile Daily Audit
              </button>
            </div>

            {/* Weekly Performance Summary */}
            <div className="bg-white border border-slate-150 hover:border-blue-500 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Weekly Performance Summary</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Product sales velocity rankings, weekly growth quotients, lapsed customer SMS coupons, and replenishment plans.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('WEEKLY')}
                className="w-full bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl border border-slate-150 hover:border-blue-600 transition"
              >
                Compile Weekly Summary
              </button>
            </div>

            {/* Monthly Executive Outline */}
            <div className="bg-white border border-slate-150 hover:border-blue-500 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Monthly Executive Outline</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  EBITDA projections, GST liability schedules, Customer Lifetime Value audits, and strategic profit margin proposals.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('MONTHLY')}
                className="w-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl border border-slate-150 hover:border-indigo-600 transition"
              >
                Compile Monthly Outline
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Loading Sequence */}
      {loading && (
        <div className="bg-white border border-slate-150 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center space-y-6 min-h-[40vh]">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="space-y-2 text-center max-w-xs">
            <h4 className="font-bold text-sm text-slate-800">VyaparaMitra AI is compiling...</h4>
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{steps[selectedType][step]}</span>
            </div>
          </div>

          {/* Micro Progress Trackers */}
          <div className="w-full max-w-xs space-y-1.5 pt-4">
            {steps[selectedType].map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10px]">
                <div className={`w-2 h-2 rounded-full ${step > idx ? 'bg-emerald-500' : step === idx ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`}></div>
                <span className={step > idx ? 'text-emerald-600 line-through' : step === idx ? 'text-blue-600 font-medium' : 'text-slate-400'}>
                  {idx === 0 ? 'Data Syncing' : idx === 1 ? 'Logistical Audit' : idx === 2 ? 'Retention Indexing' : idx === 3 ? 'AI Evaluation' : 'Report Framing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered Document Sheet */}
      {report && !loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Action Ribbon */}
          <div className="flex items-center justify-between bg-white p-3 border border-slate-150 rounded-xl shadow-xs">
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
              <FileCheck2 className="w-4 h-4" />
              {selectedType} REPORT COMPILED SUCCESSFULLY
            </span>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Copy Content"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button 
                onClick={handleDownloadReportText}
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Download Source Document"
              >
                <Download className="w-3.5 h-3.5" />
                Download Source
              </button>
              <button 
                onClick={() => window.print()}
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Layout
              </button>
              <button 
                onClick={() => setReport(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          {/* Actual Report Document Canvas */}
          <div className="bg-white border border-slate-150 rounded-2xl p-8 shadow-sm space-y-6 max-h-[80vh] overflow-y-auto" id="print-area">
            <div className="markdown-body text-xs md:text-sm text-slate-700 leading-relaxed font-sans prose max-w-none">
              <Markdown>{report}</Markdown>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
