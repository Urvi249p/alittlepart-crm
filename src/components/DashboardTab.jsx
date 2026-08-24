import { useCallback, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import DashboardCards from './DashboardCards';
import { colors, fmtDate, getDaysLeft, getPostingSummary, getProductDetailsText, getUrgency } from '../utils/orderHelpers';
import { callGemini } from '../utils/geminiClient';

export default function DashboardTab({ stats, orders, setActiveTab }) {
  const [digest, setDigest] = useState('');
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digestError, setDigestError] = useState('');
  const generateDigest = useCallback(async orderList => {
    setLoadingDigest(true);
    setDigestError('');
    const today = new Date().toISOString().split('T')[0];
    const orderSummary = orderList.map(order => ({
      customerName: order.customerName || '',
      productType: order.productType || '',
      status: order.status || '',
      deliveryPlace: order.deliveryPlace || '',
      deadline: order.deadline || '',
      occasion: order.occasion || '',
      storyStatus: order.storyStatus || '',
      reelStatus: order.reelStatus || ''
    }));
    const prompt = `Write 1-2 short sentences of warm, concise framing for Today's Focus for the informal owner of a small personalized gifting and printing business. Use a friendly, personal tone that is not corporate. Do not calculate, list, or summarize urgent orders or posting counts; those details are shown separately by the app. Use only the compact order data below and do not mention pricing, contact information, or exact addresses. Today's date is ${today}.

Orders:
${JSON.stringify(orderSummary)}`;

    try {
      const result = await callGemini(prompt);
      setDigest(result.trim());
    } catch (error) {
      console.error("Gemini today's focus generation failed:", error);
      setDigestError("Could not load today's focus.");
    } finally {
      setLoadingDigest(false);
    }
  }, []);

  const urgentOrders = orders
    .filter(order => ['urgent', 'overdue'].includes(getUrgency(order)))
    .sort((a, b) => {
      const urgencyDifference = (getUrgency(a) === 'overdue' ? 0 : 1) - (getUrgency(b) === 'overdue' ? 0 : 1);
      if (urgencyDifference !== 0) return urgencyDifference;
      const aDays = getDaysLeft(a.deadline);
      const bDays = getDaysLeft(b.deadline);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    });
  const urgentStatusBuckets = ['Pending', 'In Progress', 'Ready', 'Couriered', 'Delivered']
    .map(status => ({ status, count: urgentOrders.filter(order => order.status === status).length }))
    .filter(bucket => bucket.count > 0);
  const postingPendingCount = orders.filter(order => order.status === 'Completed' && getPostingSummary(order).tone === 'pending').length;

  return (
    <div className="space-y-5">
      <DashboardCards stats={stats} />
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.creamDark }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: colors.coralDark }} aria-hidden="true" />
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Today's Focus</h2>
          </div>
          <button onClick={() => generateDigest(orders)} disabled={loadingDigest} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }} title="Refresh today's focus" aria-label="Refresh today's focus">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDigest ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="px-5 py-4">
          {digest ? <>
            <p className="text-sm leading-6" style={{ color: colors.text }}>{digest}</p>
            {digestError && <p className="mt-2 text-xs" style={{ color: colors.coralDark }}>{digestError}</p>}
          </> : loadingDigest ? <div className="flex items-center gap-2 text-sm" style={{ color: colors.textLight }}><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: colors.coral, borderTopColor: 'transparent' }} />Thinking...</div> : digestError ? <p className="text-xs" style={{ color: colors.coralDark }}>{digestError}</p> : <p className="text-sm" style={{ color: colors.textLight }}>Click refresh to generate today's focus.</p>}
          <div className="mt-4 border-t pt-4" style={{ borderColor: colors.creamDark }}>
            {urgentStatusBuckets.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {urgentStatusBuckets.map(bucket => <button key={bucket.status} onClick={() => setActiveTab('orders')} className="rounded-xl bg-white p-3 text-left shadow-sm transition hover:bg-[#FCE8E3]" style={{ border: `1px solid ${colors.coralPale}` }}>
                <div className="text-xs font-medium" style={{ color: colors.coralDark }}>{bucket.status} &amp; Urgent</div>
                <div className="mt-1 text-xl font-bold" style={{ color: colors.text }}>{bucket.count}</div>
                {bucket.status === 'Ready' && <div className="mt-1 text-[11px]" style={{ color: colors.textLight }}>Ready to deliver, running late</div>}
              </button>)}
            </div>}
            {urgentOrders.length === 0 ? <p className="text-sm" style={{ color: colors.textLight }}>No urgent orders right now 🎉</p> : <div className="mt-3 divide-y" style={{ borderColor: colors.creamDark }}>
              {urgentOrders.map(order => {
                const days = getDaysLeft(order.deadline);
                const urgency = getUrgency(order);
                return <button key={order.id} onClick={() => setActiveTab('orders')} className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-[#FCE8E3]">
                  <div className="min-w-[150px] flex-1">
                    <div className="text-sm font-semibold" style={{ color: colors.text }}>{order.customerName || 'Unnamed client'}</div>
                    <div className="mt-1 text-xs" style={{ color: colors.textLight }}>{order.productType}{getProductDetailsText(order) ? ` · ${getProductDetailsText(order)}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: colors.textLight }}>{fmtDate(order.deadline)}</div>
                    <div className={`text-xs font-semibold ${urgency === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                      {days === null ? 'No deadline' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                    </div>
                  </div>
                </button>;
              })}
            </div>}
            <div className="mt-3 border-t pt-3" style={{ borderColor: colors.creamDark }}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textLight }}>Posting</div>
              {postingPendingCount > 0 ? <button onClick={() => setActiveTab('posting')} className="text-sm font-semibold" style={{ color: colors.coralDark }}>{postingPendingCount} completed order{postingPendingCount === 1 ? '' : 's'} still need a story or reel posted</button> : <p className="text-sm" style={{ color: colors.textLight }}>All completed orders are posted 🎉</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
