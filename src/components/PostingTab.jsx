import { Camera, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { colors, fmtDate, fmtMoney, getPostingSummary, getProductDetailsText } from '../utils/orderHelpers';

export default function PostingTab({ orders, setPostingField }) {
  const [showAll, setShowAll] = useState(false);
  const [copyStatusLabel, setCopyStatusLabel] = useState('Copy Update');
  const completedOrders = useMemo(() => orders.filter(order => order.status === 'Completed'), [orders]);
  const pendingCount = completedOrders.filter(order => getPostingSummary(order).tone === 'pending').length;
  const visibleOrders = useMemo(() => {
    const list = showAll
      ? completedOrders.filter(order => getPostingSummary(order).tone === 'done')
      : completedOrders.filter(order => getPostingSummary(order).tone === 'pending');
    return [...list].sort((a, b) => {
      const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
      const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
      if (dateA !== dateB) return dateB - dateA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [completedOrders, showAll]);
  const copyUpdate = async () => {
    const pendingOrders = completedOrders
      .filter(order => getPostingSummary(order).tone === 'pending')
      .sort((a, b) => {
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
        if (dateA !== dateB) return dateB - dateA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    if (pendingOrders.length === 0) { alert('Nothing pending to post.'); return; }
    const summary = ['posting update', ...pendingOrders.map(order => {
      const pendingItems = [];
      if ((order.reelStatus || 'Pending') === 'Pending') pendingItems.push('reel');
      if ((order.storyStatus || 'Pending') === 'Pending') pendingItems.push('story');
      return `${order.customerName || 'Unnamed client'} = ${pendingItems.join(', ')}`;
    })].join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(summary);
      setCopyStatusLabel('Copied!'); setTimeout(() => setCopyStatusLabel('Copy Update'), 1500);
    } catch { window.prompt('Copy this posting update:', summary); }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: colors.text }}>Posting</h2>
          <p className="text-sm mt-1" style={{ color: colors.textLight }}>{pendingCount} order{pendingCount === 1 ? '' : 's'} still need posting</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyUpdate} title="Copy Update" className="h-10 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}>
            <Copy className="w-3.5 h-3.5" /> {copyStatusLabel}
          </button>
          <div className="h-10 flex items-center border rounded-full overflow-hidden whitespace-nowrap" style={{ borderColor: colors.coralLight }}>
            <button onClick={() => setShowAll(false)} className="h-full px-3 text-xs font-medium transition" style={{ backgroundColor: !showAll ? colors.coralPale : 'white', color: colors.coralDark }}>Needs Posting</button>
            <button onClick={() => setShowAll(true)} className="h-full px-3 text-xs font-medium transition" style={{ backgroundColor: showAll ? colors.coralPale : 'white', color: colors.coralDark }}>All Completed</button>
          </div>
        </div>
      </div>

      {completedOrders.length === 0 ? <div className="bg-white rounded-xl shadow-sm overflow-hidden"><EmptyState message="No completed orders yet" /></div> : visibleOrders.length === 0 ? <div className="bg-white rounded-xl shadow-sm overflow-hidden"><EmptyState message="Nothing pending — nice work!" /></div> : <PostingCards orders={visibleOrders} setPostingField={setPostingField} />}
    </section>
  );
}

function PostingCards({ orders, setPostingField }) {
  return (
    <div className="space-y-3">
      {orders.map(order => <PostingCard key={order.id} order={order} setPostingField={setPostingField} />)}
    </div>
  );
}

function PostingCard({ order, setPostingField }) {
  const details = getProductDetailsText(order);
  const summary = getPostingSummary(order);
  const secondaryDetails = [order.contact, details, order.occasion].filter(Boolean).join(' · ');
  return (
    <article className="bg-white rounded-xl shadow-sm p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-bold" style={{ color: colors.text }}>{order.customerName || 'Unnamed client'}</span>
        <PostingSummary summary={summary} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: colors.textLight }}>
        <span className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{order.productType || 'Unspecified product'}</span>
        {secondaryDetails && <span>{secondaryDetails}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: colors.textLight }}>
        <span>Delivery: {fmtDate(order.deliveryDate)}</span>
        <span>Selling price: {order.sellingPrice ? fmtMoney(order.sellingPrice) : '-'}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <PostingSelect label="Story" value={order.storyStatus} onChange={value => setPostingField(order.id, 'storyStatus', value)} />
        <PostingSelect label="Reel" value={order.reelStatus} onChange={value => setPostingField(order.id, 'reelStatus', value)} />
      </div>
    </article>
  );
}

function PostingSummary({ summary }) {
  const isDone = summary.tone === 'done';
  return <span className="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: isDone ? '#DCFCE7' : colors.coralPale, color: isDone ? '#166534' : colors.coralDark }}>{summary.label}</span>;
}

function PostingSelect({ label, value, onChange }) {
  return <label className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: colors.coralLight, color: colors.text }}><span>{label}</span><select value={value || 'Pending'} onChange={event => onChange(event.target.value)} className="min-w-0 rounded border bg-white px-2 py-1.5 text-xs" style={{ borderColor: colors.coralLight, color: colors.text }}><option>Pending</option><option>Posted</option><option>Not Allowed</option></select></label>;
}

function EmptyState({ message }) {
  return <div className="px-5 py-16 text-center"><Camera className="w-12 h-12 mx-auto mb-3" style={{ color: colors.coralLight }} /><p style={{ color: colors.textLight }}>{message}</p></div>;
}