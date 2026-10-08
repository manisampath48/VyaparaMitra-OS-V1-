import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Sparkles, 
  Phone, 
  Send, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Mail,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  fetchEngagementDashboard, 
  runEngagementScan, 
  approveAndSendCampaign, 
  dismissCampaign,
  EngagementCampaign,
  EngagementDashboardData 
} from '../lib/api';
import { useNotifications } from './NotificationManager';

export default function EngagementDashboard() {
  const [data, setData] = useState<EngagementDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { triggerNotification } = useNotifications();

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const dashboardData = await fetchEngagementDashboard();
      setData(dashboardData);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Sync Failure', 'Unable to retrieve engagement records.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const result = await runEngagementScan();
      if (result.success) {
        triggerNotification(
          'success', 
          'Scan Complete', 
          `Identified and generated personalized re-engagement campaigns for ${result.generatedCount} customers.`
        );
        await loadData(true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Scan Failed', 'Could not execute customer retention analysis.');
    } finally {
      setScanning(false);
    }
  };

  const handleApproveAndSend = async (campaign: EngagementCampaign) => {
    const rawPhone = campaign.customerPhone;
    if (!rawPhone) {
      triggerNotification('error', 'Transmission Failed', 'Customer WhatsApp number not found.');
      return;
    }

    // Clean phone number: remove spaces, (), +, -, other unwanted characters
    const cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');

    // Validate the number
    if (!cleaned || cleaned.length < 10) {
      triggerNotification('error', 'Transmission Failed', 'Customer does not have a valid WhatsApp number.');
      return;
    }

    // Convert into international format if necessary (e.g. if exactly 10 digits, prefix with 91 for India)
    const formattedPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;

    try {
      setActionLoading(campaign.id);
      
      // Mark as approved and sent on server first
      const result = await approveAndSendCampaign(campaign.id);
      if (result.success) {
        // Open the WhatsApp deep link in a new tab
        const encodedText = encodeURIComponent(campaign.generatedMessage);
        const waLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;
        
        window.open(waLink, '_blank', 'noopener,noreferrer');
        
        triggerNotification(
          'success', 
          'Transmission Succeeded', 
          'WhatsApp opened successfully.'
        );
        
        // Refresh dashboard statistics
        await loadData(true);
      }
    } catch (err) {
      console.error(err);
      // Fallback: Still open WhatsApp link even if backend recording fails
      const encodedText = encodeURIComponent(campaign.generatedMessage);
      const waLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;
      window.open(waLink, '_blank', 'noopener,noreferrer');
      
      triggerNotification(
        'success', 
        'Transmission Succeeded', 
        'WhatsApp opened successfully.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      setActionLoading(id);
      const result = await dismissCampaign(id);
      if (result.success) {
        triggerNotification('success', 'Campaign Dismissed', 'Campaign was removed from the review queue.');
        await loadData(true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Action Failed', 'Could not dismiss campaign.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-sans text-sm animate-pulse">Running Autonomous Engagement Diagnostics...</p>
      </div>
    );
  }

  const pendingCampaigns = data?.queue.filter(c => c.status === 'PENDING') || [];
  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Customer Engagement Agent
          </h1>
          <p className="text-gray-500 font-sans text-xs mt-1">
            Autonomous retention analyzer powered by Gemini. Segments active/inactive clusters & prepares conversational workflows.
          </p>
        </div>
        
        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-sans text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Analyzing Customers...' : 'Run Daily Engagement Scan'}
        </button>
      </div>

      {/* METRIC CARD GRID */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL ANALYZED */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-gray-400 font-sans text-xs font-medium uppercase tracking-wider">Total Customers Analyzed</span>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {metrics.totalCustomers}
              </div>
              <div className="text-emerald-600 font-sans text-[11px] font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Database fully indexed
              </div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* INACTIVE */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-gray-400 font-sans text-xs font-medium uppercase tracking-wider">Inactive Customers</span>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {metrics.inactiveCustomers}
              </div>
              <div className="text-amber-600 font-sans text-[11px] font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                No purchases in 30+ days
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* REVENUE RECOVERY */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-gray-400 font-sans text-xs font-medium uppercase tracking-wider">Estimated Recovery</span>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                ₹{metrics.estimatedRevenueRecovery.toLocaleString('en-IN')}
              </div>
              <div className="text-emerald-600 font-sans text-[11px] font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Lapsed basket opportunity
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* PENDING APPROVAL */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-gray-400 font-sans text-xs font-medium uppercase tracking-wider">Pending Approval</span>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {metrics.pendingApproval}
              </div>
              <div className="text-indigo-600 font-sans text-[11px] font-medium flex items-center gap-1">
                <ArrowRight className="w-3 h-3 animate-pulse" />
                Ready to review & dispatch
              </div>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* DUAL WORKSPACE: INSIGHTS & REMINDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INSIGHTS PANEL (Left 1/3) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-xs relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Sparkles className="w-48 h-48" />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide font-sans text-indigo-100 uppercase">Smart AI Insights</h2>
            </div>

            <p className="text-xs text-indigo-200/90 leading-relaxed font-sans mb-6">
              VyaparaMitra Engagement Agent tracks purchase metrics, customer order habits, and churn trajectories dynamically. Below are today's diagnostic observations.
            </p>

            <div className="space-y-4">
              {data?.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <span className="text-xs text-indigo-100 font-sans font-medium leading-relaxed">
                    {insight}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-500/20 flex items-center justify-between">
              <div className="text-[10px] text-indigo-300 font-mono flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Agent Online
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">
                Model: Gemini 3.5 Flash
              </span>
            </div>
          </div>

          {/* RECOVERY INSIGHT CARD */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-semibold text-gray-700 font-sans uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Campaign Policy Guidelines
            </h3>
            <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
              These campaigns are system-generated re-engagement outlines. To ensure compliance, review the draft messages carefully before initiating delivery. The WhatsApp redirect uses deep-links from your default web/app environment safely.
            </p>
          </div>
        </div>

        {/* CAMPAIGN QUEUE (Right 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Attention Banner if pending exist */}
          {pendingCampaigns.length > 0 && (
            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 font-sans">Campaign Dispatch Action Needed</h4>
                <p className="text-[11px] text-amber-700 font-sans mt-0.5">
                  You have <span className="font-bold">{pendingCampaigns.length} engagement draft messages</span> pending review. Selectively dispatch via WhatsApp to re-engage these segments.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 font-sans">Campaign Review Queue</h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Drafted messages tailored to specific retention segments.</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-full">
                {pendingCampaigns.length} pending
              </span>
            </div>

            <div className="p-6">
              <AnimatePresence mode="popLayout">
                {pendingCampaigns.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 font-sans">Engagement Queue is Clear!</h3>
                    <p className="text-xs text-gray-500 font-sans max-w-sm mt-1">
                      No customer engagement tasks are pending. All recommendations are cleared or processed! Run a new scan above to fetch fresh candidates.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {pendingCampaigns.map((campaign, idx) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                        className="p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-xs transition-all relative overflow-hidden group bg-slate-50/50"
                      >
                        {/* Segment Badge Decor */}
                        <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                          <Sparkles className="w-24 h-24 text-indigo-900" />
                        </div>

                        {/* Customer Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-400 font-mono tracking-wider block">CUSTOMER DETAILS</span>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900 font-sans">{campaign.customerName}</h3>
                              <span className="text-xs text-gray-500 font-mono">{campaign.customerPhone}</span>
                            </div>
                          </div>
                          
                          {/* Dynamic Color Badge per type */}
                          <div>
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wider rounded-full ${
                              campaign.customerType === 'Churn Risk' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : campaign.customerType === 'VIP Customer'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : campaign.customerType === 'Festival Candidate'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {campaign.customerType}
                            </span>
                          </div>
                        </div>

                        {/* Analysis Box */}
                        <div className="p-3 bg-white rounded-lg border border-gray-100 mb-4 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 font-sans uppercase tracking-wider block">AGENT OBSERVATION</span>
                            <p className="text-xs text-gray-600 font-sans leading-relaxed mt-0.5">{campaign.reason}</p>
                          </div>
                        </div>

                        {/* Message Preview Bubble */}
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl mb-5 text-gray-800 font-sans text-xs leading-relaxed whitespace-pre-wrap relative">
                          <div className="absolute top-0 left-0 -translate-x-1.5 translate-y-3 w-3 h-3 bg-indigo-50 border-l border-b border-indigo-100/50 rotate-45" />
                          {campaign.generatedMessage}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100/60">
                          <button
                            onClick={() => handleDismiss(campaign.id)}
                            disabled={actionLoading !== null}
                            className="px-3.5 py-1.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg font-sans text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                          
                          <button
                            onClick={() => handleApproveAndSend(campaign)}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-sans text-[11px] font-semibold hover:bg-emerald-700 shadow-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                          >
                            <Phone className="w-3.5 h-3.5 fill-current" />
                            🟢 Send via WhatsApp
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* HISTORICAL COMPLETED SECTION */}
          {data && data.queue.filter(c => c.status === 'SENT').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5">
              <h3 className="text-xs font-bold text-gray-800 font-sans uppercase tracking-wider mb-3">Recently Dispatched campaigns</h3>
              <div className="divide-y divide-gray-50 max-h-[180px] overflow-y-auto pr-2 space-y-2">
                {data.queue.filter(c => c.status === 'SENT').slice(0, 5).map(campaign => (
                  <div key={campaign.id} className="py-2.5 flex items-center justify-between text-xs font-sans">
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900">{campaign.customerName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">Sent to {campaign.customerPhone}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold font-mono text-[9px] rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Dispatched
                      </span>
                      {campaign.sentAt && (
                        <p className="text-[9px] text-gray-400 font-mono">
                          {new Date(campaign.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
