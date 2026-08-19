import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Download, Upload, Copy, AlertCircle, Package, CheckCircle2, IndianRupee, TrendingUp, Filter } from 'lucide-react';

export default function AlittlePartCRM() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [copyStatus, setCopyStatus] = useState('Copy Status');
  const restoreInputRef = useRef(null);

  const emptyForm = {
    id: '',
    deadline: '',
    customerName: '',
    contact: '',
    source: '',
    sourceDetail: '',
    productType: 'Magazine',
    numberOfPages: '',
    quality: '',
    size: '',
    quantity: '',
    sellingPrice: '',
    cost: '',
    share: '',
    advancePaid: '',
    deliveryPlace: '',
    deliveryDate: '',
    occasion: '',
    packaging: 'Regular',
    status: 'Pending',
    orderDate: new Date().toISOString().split('T')[0],
    requirements: '',
    notes: ''
  };

  const [form, setForm] = useState(emptyForm);

  const colors = {
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

  // Use localStorage instead of a backend; data is scoped to this browser only.
  useEffect(() => {
    (async () => {
      try {
        const result = localStorage.getItem('alittlepart-orders');
        if (result) setOrders(JSON.parse(result));
      } catch (e) {}
      finally { setLoading(false); }
    })();
  }, []);

  const saveOrders = async (newOrders) => {
    setOrders(newOrders);
    try { localStorage.setItem('alittlepart-orders', JSON.stringify(newOrders)); }
    catch (e) { console.error('Save failed', e); }
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(deadline); d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  const getUrgency = (order) => {
    if (order.status === 'Completed') return 'done';
    const days = getDaysLeft(order.deadline);
    if (days === null) return 'normal';
    if (days < 0) return 'overdue';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  // Summary stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status !== 'Completed').length;
    const delivered = orders.filter(o => o.status === 'Completed').length;
    const totalSelling = orders.reduce((s, o) => s + (parseFloat(o.sellingPrice) || 0), 0);
    const totalCost = orders.reduce((s, o) => s + (parseFloat(o.cost) || 0), 0);
    const totalShare = orders.reduce((s, o) => s + (parseFloat(o.share) || 0), 0);
    return { total, pending, delivered, totalSelling, totalCost, totalShare };
  }, [orders]);

  // Filtered & sorted orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o =>
        (o.customerName || '').toLowerCase().includes(s) ||
        (o.contact || '').toLowerCase().includes(s) ||
        (o.productType || '').toLowerCase().includes(s) ||
        (o.deliveryPlace || '').toLowerCase().includes(s) ||
        (o.occasion || '').toLowerCase().includes(s)
      );
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'urgent') {
        list = list.filter(o => {
          const u = getUrgency(o);
          return u === 'urgent' || u === 'overdue';
        });
      } else {
        list = list.filter(o => o.status === filterStatus);
      }
    }
    list.sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (b.status === 'Completed' && a.status !== 'Completed') return -1;
      const da = getDaysLeft(a.deadline);
      const db = getDaysLeft(b.deadline);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
    return list;
  }, [orders, search, filterStatus]);

  const referralClients = useMemo(() => [...new Set(
    orders
      .map(order => (order.customerName || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b)), [orders]);

  const groupedOrders = useMemo(() => {
    const groups = new Map();
    filteredOrders.forEach(order => {
      const key = `${(order.customerName || '').trim().toLowerCase()}|${order.contact || ''}|${order.deadline || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          customerName: order.customerName || '',
          contact: order.contact || '',
          deadline: order.deadline || '',
          deliveryPlace: order.deliveryPlace || '',
          deliveryDate: order.deliveryDate || '',
          occasion: order.occasion || '',
          orders: [],
          totals: { sellingPrice: 0, cost: 0, share: 0, advancePaid: 0, balance: 0 }
        });
      }
      const group = groups.get(key);
      group.orders.push(order);
      group.deliveryPlace = group.deliveryPlace === (order.deliveryPlace || '') ? group.deliveryPlace : '';
      group.deliveryDate = group.deliveryDate === (order.deliveryDate || '') ? group.deliveryDate : '';
      group.occasion = group.occasion === (order.occasion || '') ? group.occasion : '';
      group.totals.sellingPrice += parseFloat(order.sellingPrice) || 0;
      group.totals.cost += parseFloat(order.cost) || 0;
      group.totals.share += parseFloat(order.share) || 0;
      group.totals.advancePaid += parseFloat(order.advancePaid) || 0;
      group.totals.balance += (parseFloat(order.sellingPrice) || 0) - (parseFloat(order.advancePaid) || 0);
    });

    return [...groups.values()].sort((a, b) => {
      const aCompleted = a.orders.every(order => order.status === 'Completed');
      const bCompleted = b.orders.every(order => order.status === 'Completed');
      if (aCompleted && !bCompleted) return 1;
      if (bCompleted && !aCompleted) return -1;
      const da = getDaysLeft(a.deadline);
      const db = getDaysLeft(b.deadline);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [filteredOrders]);

  const getGroupUrgency = (group) => {
    if (group.orders.every(order => order.status === 'Completed')) return 'done';
    return getUrgency({ deadline: group.deadline, status: 'Pending' });
  };

  const getProductDetails = (order) => {
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

  const copyActiveStatus = async () => {
    const buckets = [
      { status: 'Pending', heading: 'PENDING ORDERS' },
      { status: 'In Progress', heading: 'IN PROGRESS ORDERS' },
      { status: 'Ready', heading: 'READY ORDERS' },
      { status: 'Delivered', heading: 'DELIVERED (PAYMENT PENDING)' }
    ];
    const formatOrder = order => {
      const deadline = order.deadline ? fmtDate(order.deadline) : 'No deadline';
      const details = getProductDetails(order);
      return `- ${order.customerName || 'Unnamed client'} | ${order.productType || 'Unspecified product'} | ${deadline}${details ? ` | ${details}` : ''}`;
    };
    const sortByDeadline = (a, b) => {
      const aDays = getDaysLeft(a.deadline);
      const bDays = getDaysLeft(b.deadline);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    };
    const sections = buckets.map(bucket => {
      const bucketOrders = orders.filter(order => order.status === bucket.status).sort(sortByDeadline);
      if (bucketOrders.length === 0) return '';
      return `${bucket.heading}\n${bucketOrders.map(formatOrder).join('\n')}`;
    }).filter(Boolean);

    if (sections.length === 0) {
      alert('No active orders to share.');
      return;
    }

    const summary = sections.join('\n\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Status'), 1500);
    } catch (e) {
      window.prompt('Copy this order status summary:', summary);
    }
  };

  const getSourceLabel = (order) => order.source ? `${order.source}${order.sourceDetail ? ` — ${order.sourceDetail}` : ''}` : '-';

  const openNewForm = () => {
    setEditingOrder(null);
    setForm({ ...emptyForm, id: Date.now().toString() });
    setShowForm(true);
  };

  const openEditForm = (order) => {
    setEditingOrder(order);
    setForm({ ...emptyForm, ...order });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customerName) {
      alert('Please fill Customer Name');
      return;
    }
    const newOrders = editingOrder
      ? orders.map(o => o.id === form.id ? form : o)
      : [...orders, form];
    await saveOrders(newOrders);
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleDelete = async (id) => {
    await saveOrders(orders.filter(o => o.id !== id));
    setConfirmDelete(null);
  };

  const quickStatusChange = async (id, status) => {
    await saveOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const exportCSV = () => {
    const headers = ['Deadline', 'Client Name', 'Contact', 'Source', 'Source Detail', 'Product Type', 'Pages', 'Selling Price', 'Cost', 'Share (Profit)', 'Advance', 'Balance', 'Delivery Place', 'Delivery Date', 'Occasion', 'Packaging', 'Status', 'Requirements', 'Notes', 'Order Date'];
    const rows = filteredOrders.map(o => {
      const balance = (parseFloat(o.sellingPrice) || 0) - (parseFloat(o.advancePaid) || 0);
      return [
        o.deadline || '', o.customerName || '', o.contact || '', o.source || '', o.sourceDetail || '', o.productType || '',
        o.numberOfPages || '', o.sellingPrice || '', o.cost || '', o.share || '',
        o.advancePaid || '', balance, o.deliveryPlace || '', o.deliveryDate || '',
        o.occasion || '', o.packaging || '', o.status || '',
        o.requirements || '', o.notes || '', o.orderDate || ''
      ];
    });
    const csv = [headers, ...rows].map(r =>
      r.map(cell => {
        const s = String(cell).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alittlepart-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const backupOrders = () => {
    const json = JSON.stringify(orders, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alittlepart-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreOrders = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const restoredOrders = JSON.parse(loadEvent.target.result);
        if (!Array.isArray(restoredOrders)) {
          alert('Restore failed: the JSON file must contain an array of orders.');
          return;
        }
        if (window.confirm('This will overwrite all current orders. Continue?')) {
          await saveOrders(restoredOrders);
        }
      } catch (e) {
        alert('Restore failed: the selected file is not valid JSON.');
      }
    };
    reader.onerror = () => alert('Restore failed: the file could not be read.');
    reader.readAsText(file);
  };

  const getRowStyle = (urgency) => {
    switch (urgency) {
      case 'overdue': return { backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626' };
      case 'urgent': return { backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444' };
      case 'soon': return { backgroundColor: '#FFFBEB', borderLeft: '4px solid #F59E0B' };
      case 'done': return { backgroundColor: '#F0FDF4', borderLeft: '4px solid #22C55E', opacity: 0.75 };
      default: return { backgroundColor: 'white', borderLeft: '4px solid transparent' };
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const fmtMoney = (n) => new Intl.NumberFormat('en-IN').format(parseFloat(n) || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.cream }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: colors.coral, borderTopColor: 'transparent' }}></div>
          <p className="mt-3" style={{ color: colors.text }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-5" style={{ backgroundColor: colors.cream, fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-5 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide italic" style={{ color: colors.coralDark, fontFamily: 'Georgia, serif' }}>
            a little part
          </h1>
          <p className="text-xs tracking-widest mt-1 uppercase" style={{ color: colors.textLight }}>Order Dashboard</p>
        </div>

        {/* Summary Metrics — Excel style */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-5">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-px" style={{ backgroundColor: colors.creamDark }}>
            <MetricCell label="Total Orders" value={stats.total} color={colors.text} />
            <MetricCell label="Pending Orders" value={stats.pending} color="#DC2626" />
            <MetricCell label="Completed" value={stats.delivered} color="#059669" />
            <MetricCell label="Total Selling ₹" value={fmtMoney(stats.totalSelling)} color={colors.coralDark} />
            <MetricCell label="Total Cost ₹" value={fmtMoney(stats.totalCost)} color="#B45309" />
            <MetricCell label="Total Share ₹" value={fmtMoney(stats.totalShare)} color="#059669" highlight />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-2 mb-3 md:flex-row md:flex-nowrap md:items-center">
          <div className="flex flex-col gap-2 sm:flex-row md:flex-1 md:min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textLight }} />
              <input
                type="text"
                placeholder="Search client, phone, place, occasion..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: colors.coralLight, backgroundColor: 'white', color: colors.text }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto md:w-36 px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: colors.coralLight, color: colors.text }}
            >
            <option value="all">All Orders</option>
            <option value="urgent">🔴 Urgent (≤3 days)</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Ready">Ready</option>
            <option value="Couriered">Couriered</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:shrink-0">
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
              <button
                onClick={exportCSV}
                title="Export CSV"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white"
                style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={backupOrders}
                title="Backup"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white"
                style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
              >
                <Download className="w-3.5 h-3.5" /> Backup
              </button>
              <button
                onClick={copyActiveStatus}
                title="Copy Status"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white"
                style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
              >
                <Copy className="w-3.5 h-3.5" /> {copyStatus}
              </button>
              <button
                onClick={() => restoreInputRef.current?.click()}
                title="Restore"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white"
                style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
              >
                <Upload className="w-3.5 h-3.5" /> Restore
              </button>
              <input ref={restoreInputRef} type="file" accept=".json" onChange={restoreOrders} className="hidden" />
            </div>
            <div className="flex items-center border rounded-full overflow-hidden whitespace-nowrap" style={{ borderColor: colors.coralLight }}>
            <button
              onClick={() => setViewMode('table')}
              className="px-3 py-2 text-xs font-medium transition"
              style={{ backgroundColor: viewMode === 'table' ? colors.coralPale : 'white', color: colors.coralDark }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className="px-3 py-2 text-xs font-medium transition"
              style={{ backgroundColor: viewMode === 'grouped' ? colors.coralPale : 'white', color: colors.coralDark }}
            >
              Grouped View
            </button>
            </div>
            <button
              onClick={openNewForm}
              className="flex w-full md:w-auto items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium whitespace-nowrap transition hover:shadow-md"
              style={{ backgroundColor: colors.coral }}
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>
        </div>

        {/* Orders Section Title */}
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.headerBg }}>
          Orders <span className="text-sm font-normal" style={{ color: colors.textLight }}>({filteredOrders.length})</span>
        </h2>

        {/* Spreadsheet-style Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 rounded-lg bg-white">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: colors.coralLight }} />
            <p style={{ color: colors.textLight }}>
              {orders.length === 0 ? "No orders yet. Click 'New Order' to get started!" : "No orders match your filter."}
            </p>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-3">
            {groupedOrders.map(group => {
              const urgency = getGroupUrgency(group);
              const groupStyle = getRowStyle(urgency);
              const days = getDaysLeft(group.deadline);
              return (
                <div key={`${group.customerName}|${group.contact}|${group.deadline}`} className="rounded-lg border shadow-sm overflow-hidden" style={groupStyle}>
                  <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2" style={{ borderColor: colors.coralLight }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold" style={{ color: colors.text }}>{group.customerName || 'Unnamed client'}</div>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>
                          {getSourceLabel(group.orders[0])}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: colors.textLight }}>{group.contact || '-'}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.text }}>
                      <span>{fmtDate(group.deadline)}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: urgency === 'done' ? '#DCFCE7' : urgency === 'soon' ? '#FEF3C7' : urgency === 'urgent' || urgency === 'overdue' ? '#FEE2E2' : colors.coralPale, color: urgency === 'done' ? '#166534' : urgency === 'soon' ? '#92400E' : urgency === 'urgent' || urgency === 'overdue' ? '#991B1B' : colors.coralDark }}>
                        {urgency === 'done' ? 'Completed' : urgency === 'overdue' ? 'Overdue' : urgency === 'urgent' ? 'Urgent' : urgency === 'soon' ? 'Soon' : 'Normal'}
                      </span>
                      {days !== null && urgency !== 'done' && (
                        <span className="text-xs font-medium">{days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}</span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y" style={{ borderColor: colors.coralLight }}>
                    {group.orders.map(order => (
                      <div key={order.id} className="px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{order.productType}</span>
                        {getProductDetails(order) && <span className="text-xs" style={{ color: colors.textLight }}>{getProductDetails(order)}</span>}
                        <span className="font-medium ml-auto" style={{ color: colors.text }}>₹{fmtMoney(order.sellingPrice)}</span>
                        <select value={order.status} onChange={e => quickStatusChange(order.id, e.target.value)} className="text-xs px-2 py-1 rounded border bg-white cursor-pointer" style={{ borderColor: colors.coralLight, color: colors.text }}>
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Ready</option>
                          <option>Couriered</option>
                          <option>Delivered</option>
                          <option>Completed</option>
                        </select>
                        <div className="flex gap-1">
                          <button onClick={() => openEditForm(order)} className="p-1.5 rounded hover:bg-white" style={{ color: colors.coralDark }} title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(order.id)} className="p-1.5 rounded hover:bg-white text-red-500" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 text-xs font-semibold flex flex-wrap gap-x-4 gap-y-1" style={{ backgroundColor: colors.coralPale, color: colors.text }}>
                    <span>Selling: ₹{fmtMoney(group.totals.sellingPrice)}</span>
                    <span>Cost: ₹{fmtMoney(group.totals.cost)}</span>
                    <span>Share: ₹{fmtMoney(group.totals.share)}</span>
                    <span>Advance: ₹{fmtMoney(group.totals.advancePaid)}</span>
                    <span className={group.orders.every(order => order.status === 'Completed') ? 'text-green-700' : group.totals.balance > 0 ? 'text-red-600' : 'text-gray-500'}>Balance: ₹{fmtMoney(group.totals.balance)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: colors.headerBg }} className="text-white">
                    <Th>Deadline</Th>
                    <Th>Client</Th>
                    <Th>Contact</Th>
                    <Th>Product</Th>
                    <Th align="right">Pages</Th>
                    <Th align="right">Selling ₹</Th>
                    <Th align="right">Cost ₹</Th>
                    <Th align="right">Share ₹</Th>
                    <Th align="right">Advance</Th>
                    <Th align="right">Balance</Th>
                    <Th>Delivery Place</Th>
                    <Th>Occasion</Th>
                    <Th>Source</Th>
                    <Th>Packaging</Th>
                    <Th>Status</Th>
                    <Th>Notes</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const urgency = getUrgency(order);
                    const rowStyle = getRowStyle(urgency);
                    const days = getDaysLeft(order.deadline);
                    const balance = (parseFloat(order.sellingPrice) || 0) - (parseFloat(order.advancePaid) || 0);
                    return (
                      <tr key={order.id} style={rowStyle} className="border-b hover:bg-opacity-80 transition">
                        <Td>
                          <div className="font-medium" style={{ color: colors.text }}>{fmtDate(order.deadline)}</div>
                          {days !== null && order.status !== 'Completed' && (
                            <div className={`text-xs ${days < 0 ? 'text-red-600 font-bold' : days <= 3 ? 'text-red-500 font-semibold' : days <= 7 ? 'text-amber-600' : 'text-gray-500'}`}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}
                            </div>
                          )}
                        </Td>
                        <Td><span className="font-semibold" style={{ color: colors.text }}>{order.customerName}</span></Td>
                        <Td>{order.contact || '-'}</Td>
                        <Td>
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>
                            {order.productType}
                          </span>
                        </Td>
                        <Td align="right">{order.numberOfPages || '-'}</Td>
                        <Td align="right"><span style={{ color: colors.text }}>{order.sellingPrice ? fmtMoney(order.sellingPrice) : '-'}</span></Td>
                        <Td align="right">{order.cost ? fmtMoney(order.cost) : '-'}</Td>
                        <Td align="right"><span className="font-semibold text-green-700">{order.share ? fmtMoney(order.share) : '-'}</span></Td>
                        <Td align="right">{order.advancePaid ? fmtMoney(order.advancePaid) : '-'}</Td>
                        <Td align="right"><span className={order.status === 'Completed' ? 'font-semibold text-green-700' : balance > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>{fmtMoney(balance)}</span></Td>
                        <Td>{order.deliveryPlace || '-'}</Td>
                        <Td>{order.occasion || '-'}</Td>
                        <Td>
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>
                            {getSourceLabel(order)}
                          </span>
                        </Td>
                        <Td>
                          {order.packaging === 'Premium' ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>✨ Premium</span>
                          ) : (
                            <span className="text-xs text-gray-600">Regular</span>
                          )}
                        </Td>
                        <Td>
                          <select
                            value={order.status}
                            onChange={e => quickStatusChange(order.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded border bg-white cursor-pointer"
                            style={{ borderColor: colors.coralLight, color: colors.text }}
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Ready</option>
                            <option>Couriered</option>
                            <option>Delivered</option>
                            <option>Completed</option>
                          </select>
                        </Td>
                        <Td>
                          <div className="max-w-[150px] truncate text-xs" title={order.notes || ''} style={{ color: colors.textLight }}>
                            {order.notes && <div>{order.notes}</div>}
                            {!order.notes && '-'}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditForm(order)}
                              className="p-1.5 rounded hover:bg-white"
                              style={{ color: colors.coralDark }}
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(order.id)}
                              className="p-1.5 rounded hover:bg-white text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer totals row */}
                <tfoot>
                  <tr className="font-semibold" style={{ backgroundColor: colors.coralPale, color: colors.text }}>
                    <Td colSpan={5}>TOTAL ({filteredOrders.length})</Td>
                    <Td align="right">{fmtMoney(filteredOrders.reduce((s, o) => s + (parseFloat(o.sellingPrice) || 0), 0))}</Td>
                    <Td align="right">{fmtMoney(filteredOrders.reduce((s, o) => s + (parseFloat(o.cost) || 0), 0))}</Td>
                    <Td align="right" className="text-green-700">{fmtMoney(filteredOrders.reduce((s, o) => s + (parseFloat(o.share) || 0), 0))}</Td>
                    <Td align="right">{fmtMoney(filteredOrders.reduce((s, o) => s + (parseFloat(o.advancePaid) || 0), 0))}</Td>
                    <Td align="right"><span className={filteredOrders.every(order => order.status === 'Completed') ? 'font-semibold text-green-700' : filteredOrders.reduce((s, o) => s + ((parseFloat(o.sellingPrice) || 0) - (parseFloat(o.advancePaid) || 0)), 0) > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>{fmtMoney(filteredOrders.reduce((s, o) => s + ((parseFloat(o.sellingPrice) || 0) - (parseFloat(o.advancePaid) || 0)), 0))}</span></Td>
                    <Td colSpan={7}></Td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs italic mt-3 text-center" style={{ color: colors.textLight }}>
          🔴 Red rows = deadline within 3 days or overdue &nbsp;•&nbsp; 🟡 Yellow = within a week &nbsp;•&nbsp; 🟢 Green = delivered
        </p>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 p-4 border-b flex justify-between items-center" style={{ backgroundColor: colors.cream, borderColor: colors.coralLight }}>
                <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                  {editingOrder ? 'Edit Order' : 'New Order'}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" style={{ color: colors.text }} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Client Name *">
                    <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="input" />
                  </Field>
                  <Field label="Contact Number">
                    <input type="tel" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="input" />
                  </Field>
                  <Field label="Source">
                    <select
                      value={form.source}
                      onChange={e => setForm({ ...form, source: e.target.value, sourceDetail: e.target.value === 'Known' || e.target.value === 'Referral' ? form.sourceDetail : '' })}
                      className="input"
                    >
                      <option value="">Select source</option>
                      <option>Instagram</option>
                      <option>Known</option>
                      <option>Referral</option>
                    </select>
                  </Field>
                  {form.source === 'Known' && (
                    <Field label="Known Person">
                      <select value={form.sourceDetail} onChange={e => setForm({ ...form, sourceDetail: e.target.value })} className="input">
                        <option value="">Select person</option>
                        <option>Urvi</option>
                        <option>Riddhi</option>
                        <option>Divyesh</option>
                      </select>
                    </Field>
                  )}
                  {form.source === 'Referral' && (
                    <Field label="Referring Client">
                      <select
                        value={form.sourceDetail}
                        onChange={e => setForm({ ...form, sourceDetail: e.target.value })}
                        className="input"
                        disabled={referralClients.length === 0}
                      >
                        <option value="">{referralClients.length === 0 ? 'No clients yet' : 'Select referring client'}</option>
                        {referralClients.map(client => <option key={client}>{client}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Deadline">
                    <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="input" />
                  </Field>
                  <Field label="Delivery Date">
                    <input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="input" />
                  </Field>
                  <Field label="Product Type">
                    <select value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })} className="input">
                      <option>Magazine</option>
                      <option>Photobook</option>
                      <option>Premium Photobook (Only Matte)</option>
                      <option>Fridge Magnet</option>
                      <option>Frame</option>
                      <option>Wallet Card</option>
                      <option>Combo Pack</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  {(form.productType === 'Magazine' || form.productType === 'Photobook' || form.productType === 'Premium Photobook (Only Matte)') && (
                    <Field label="Number of Pages">
                      <input type="number" value={form.numberOfPages} onChange={e => setForm({ ...form, numberOfPages: e.target.value })} className="input" />
                    </Field>
                  )}
                  {(form.productType === 'Magazine' || form.productType === 'Photobook') && (
                    <Field label="Quality">
                      <input type="text" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="input" placeholder="e.g., Glossy, Matte, Premium" />
                    </Field>
                  )}
                  {(form.productType === 'Fridge Magnet' || form.productType === 'Frame') && (
                    <Field label="Size">
                      <input type="text" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="input" placeholder="e.g., 4x4 inch" />
                    </Field>
                  )}
                  {(form.productType === 'Fridge Magnet' || form.productType === 'Frame' || form.productType === 'Wallet Card') && (
                    <Field label="Quantity">
                      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input" />
                    </Field>
                  )}
                  <Field label="Selling Price (₹)">
                    <input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} className="input" />
                  </Field>
                  <Field label="Cost (₹)">
                    <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="input" />
                  </Field>
                  <Field label="Share / Profit (₹)">
                    <input type="number" value={form.share} onChange={e => setForm({ ...form, share: e.target.value })} className="input" placeholder="Your profit share" />
                  </Field>
                  <Field label="Advance Paid (₹)">
                    <input type="number" value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: e.target.value })} className="input" />
                  </Field>
                  <Field label="Delivery Place">
                    <input type="text" value={form.deliveryPlace} onChange={e => setForm({ ...form, deliveryPlace: e.target.value })} className="input" placeholder="e.g., Surat, Ahmedabad, USA" />
                  </Field>
                  <Field label="Occasion">
                    <input type="text" value={form.occasion} onChange={e => setForm({ ...form, occasion: e.target.value })} className="input" placeholder="e.g., birthday, memory, anniversary" />
                  </Field>
                  <Field label="Packaging">
                    <select value={form.packaging} onChange={e => setForm({ ...form, packaging: e.target.value })} className="input">
                      <option>Regular</option>
                      <option>Premium</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Ready</option>
                      <option>Couriered</option>
                      <option>Delivered</option>
                      <option>Completed</option>
                    </select>
                  </Field>
                </div>

                <Field label="Full Delivery Address">
                  <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} className="input" rows="2" placeholder="Full address / requirements" />
                </Field>

                <Field label="Notes">
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows="2" />
                </Field>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-lg text-white font-medium transition hover:opacity-90"
                    style={{ backgroundColor: colors.coral }}
                  >
                    {editingOrder ? 'Update Order' : 'Save Order'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-lg border font-medium transition hover:bg-gray-50"
                    style={{ borderColor: colors.coralLight, color: colors.text }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Delete this order?</h3>
              <p className="text-sm mb-4" style={{ color: colors.textLight }}>This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">Delete</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border font-medium" style={{ borderColor: colors.coralLight, color: colors.text }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.7rem;
          border: 1px solid ${colors.coralLight};
          border-radius: 0.5rem;
          background-color: white;
          color: ${colors.text};
          outline: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .input:focus {
          border-color: ${colors.coral};
          box-shadow: 0 0 0 3px ${colors.coralPale};
        }
      `}</style>
    </div>
  );
}

function MetricCell({ label, value, color, highlight }) {
  return (
    <div className={`px-3 py-4 text-center transition-colors duration-150 hover:bg-[#FCE8E3] ${highlight ? 'bg-[#F0FDF4]' : 'bg-white'}`}>
      <div className="text-xs uppercase tracking-wide mb-1 font-medium" style={{ color: '#8B6F6B' }}>{label}</div>
      <div className="text-lg md:text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th className={`px-3 py-2.5 text-${align} text-xs font-semibold uppercase tracking-wide whitespace-nowrap`}>
      {children}
    </th>
  );
}

function Td({ children, align = 'left', colSpan, className = '' }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2.5 text-${align} whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#5C3D3A' }}>{label}</label>
      {children}
    </div>
  );
}
