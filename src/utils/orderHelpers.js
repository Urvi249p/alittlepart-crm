export const colors = {
  coral: '#E88B7D',
  coralDark: '#D97567',
  coralLight: '#F5C4BC',
  coralPale: '#FCE8E3',
  cream: '#FBF0E8',
  creamDark: '#F5E4D7',
  text: '#5C3D3A',
  textLight: '#8B6F6B',
  headerBg: '#2C4A6B'
};

export const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

export const getUrgency = (order) => {
  if (order.status === 'Completed') return 'done';
  const days = getDaysLeft(order.deadline);
  if (days === null) return 'normal';
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
};

export const getPostingSummary = (order) => {
  const story = order.storyStatus || 'Pending';
  const reel = order.reelStatus || 'Pending';
  const storyOpen = story === 'Pending';
  const reelOpen = reel === 'Pending';
  if (storyOpen && reelOpen) return { label: 'Both pending', tone: 'pending' };
  if (storyOpen) return { label: 'Story pending', tone: 'pending' };
  if (reelOpen) return { label: 'Reel pending', tone: 'pending' };
  return { label: 'Done', tone: 'done' };
};

export const getRowStyle = (urgency) => {
  switch (urgency) {
    case 'overdue': return { backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626' };
    case 'urgent': return { backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444' };
    case 'soon': return { backgroundColor: '#FFFBEB', borderLeft: '4px solid #F59E0B' };
    case 'done': return { backgroundColor: '#F0FDF4', borderLeft: '4px solid #22C55E', opacity: 0.75 };
    default: return { backgroundColor: 'white', borderLeft: '4px solid transparent' };
  }
};

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const fmtMoney = (n) => new Intl.NumberFormat('en-IN').format(parseFloat(n) || 0);

export const getProductDetailsText = (order) => {
  if (order.productType === 'Magazine' || order.productType === 'Photobook') {
    return `Pages: ${order.numberOfPages || '-'} • Quality: ${order.quality || '-'}`;
  }
  if (order.productType === 'Premium Photobook (Only Matte)') {
    return `Pages: ${order.numberOfPages || '-'}`;
  }
  if (order.productType === 'Fridge Magnet' || order.productType === 'Frame') {
    return `Size: ${order.size || '-'} • Qty: ${order.quantity || '-'}`;
  }
  if (order.productType === 'Wallet Card') return `Qty: ${order.quantity || '-'}`;
  return '';
};
