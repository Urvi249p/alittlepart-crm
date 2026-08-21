import { useState, useEffect, useMemo, useRef } from 'react';
import { Boxes, Camera, LayoutDashboard, Package, PanelLeftClose, PanelLeftOpen, Users } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import ClientsTab from './components/ClientsTab';
import ProductsTab from './components/ProductsTab';
import PostingTab from './components/PostingTab';
import OrderForm from './components/OrderForm';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { colors, getDaysLeft, getUrgency, fmtDate, getProductDetailsText } from './utils/orderHelpers';

export default function AlittlePartCRM() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [copyStatusLabel, setCopyStatusLabel] = useState('Copy Status');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const restoreInputRef = useRef(null);

  const emptyForm = {
    id: '', deadline: '', customerName: '', contact: '', source: '', sourceDetail: '', productType: 'Magazine',
    numberOfPages: '', quality: '', size: '', quantity: '', sellingPrice: '', cost: '', share: '', advancePaid: '',
    deliveryPlace: '', deliveryDate: '', occasion: '', packaging: 'Regular', status: 'Pending', storyStatus: 'Pending', reelStatus: 'Pending',
    orderDate: new Date().toISOString().split('T')[0], requirements: '', notes: ''
  };

  const [form, setForm] = useState(emptyForm);

  // Use localStorage instead of a backend; data is scoped to this browser only.
  useEffect(() => {
    (async () => {
      try {
        const result = localStorage.getItem('alittlepart-orders');
        if (result) setOrders(JSON.parse(result));
      } catch { return; }
      finally { setLoading(false); }
    })();
  }, []);

  const saveOrders = async (newOrders) => {
    setOrders(newOrders);
    try { localStorage.setItem('alittlepart-orders', JSON.stringify(newOrders)); }
    catch (e) { console.error('Save failed', e); }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status !== 'Completed').length;
    const delivered = orders.filter(o => o.status === 'Completed').length;
    const totalSelling = orders.reduce((s, o) => s + (parseFloat(o.sellingPrice) || 0), 0);
    const totalCost = orders.reduce((s, o) => s + (parseFloat(o.cost) || 0), 0);
    const totalShare = orders.reduce((s, o) => s + (parseFloat(o.share) || 0), 0);
    return { total, pending, delivered, totalSelling, totalCost, totalShare };
  }, [orders]);

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
    orders.map(order => (order.customerName || '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b)), [orders]);

  const groupedOrders = useMemo(() => {
    const groups = new Map();
    filteredOrders.forEach(order => {
      const key = `${(order.customerName || '').trim().toLowerCase()}|${order.contact || ''}|${order.deadline || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          customerName: order.customerName || '', contact: order.contact || '', deadline: order.deadline || '',
          deliveryPlace: order.deliveryPlace || '', deliveryDate: order.deliveryDate || '', occasion: order.occasion || '',
          orders: [], totals: { sellingPrice: 0, cost: 0, share: 0, advancePaid: 0, balance: 0 }
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
    const newOrders = editingOrder ? orders.map(o => o.id === form.id ? form : o) : [...orders, form];
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

  const setPostingField = async (id, field, value) => {
    await saveOrders(orders.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const exportCSV = () => {
    const headers = ['Deadline', 'Client Name', 'Contact', 'Source', 'Source Detail', 'Product Type', 'Pages', 'Selling Price', 'Cost', 'Share (Profit)', 'Advance', 'Balance', 'Delivery Place', 'Delivery Date', 'Occasion', 'Packaging', 'Status', 'Requirements', 'Notes', 'Order Date'];
    const rows = filteredOrders.map(o => {
      const balance = (parseFloat(o.sellingPrice) || 0) - (parseFloat(o.advancePaid) || 0);
      return [o.deadline || '', o.customerName || '', o.contact || '', o.source || '', o.sourceDetail || '', o.productType || '', o.numberOfPages || '', o.sellingPrice || '', o.cost || '', o.share || '', o.advancePaid || '', balance, o.deliveryPlace || '', o.deliveryDate || '', o.occasion || '', o.packaging || '', o.status || '', o.requirements || '', o.notes || '', o.orderDate || ''];
    });
    const csv = [headers, ...rows].map(r => r.map(cell => { const s = String(cell).replace(/"/g, '""'); return /[",\n]/.test(s) ? `"${s}"` : s; }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alittlepart-orders-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleBackup = () => {
    const json = JSON.stringify(orders, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alittlepart-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const restoredOrders = JSON.parse(loadEvent.target.result);
        if (!Array.isArray(restoredOrders)) { alert('Restore failed: the JSON file must contain an array of orders.'); return; }
        if (window.confirm('This will overwrite all current orders. Continue?')) await saveOrders(restoredOrders);
      } catch { alert('Restore failed: the selected file is not valid JSON.'); }
    };
    reader.onerror = () => alert('Restore failed: the file could not be read.');
    reader.readAsText(file);
  };

  const copyStatus = async () => {
    const buckets = [
      { status: 'Pending', heading: 'PENDING ORDERS' }, { status: 'In Progress', heading: 'IN PROGRESS ORDERS' },
      { status: 'Ready', heading: 'READY ORDERS' }, { status: 'Delivered', heading: 'DELIVERED (PAYMENT PENDING)' }
    ];
    const formatOrder = order => {
      const deadline = order.deadline ? fmtDate(order.deadline) : 'No deadline';
      const details = getProductDetailsText(order);
      return `- ${order.customerName || 'Unnamed client'} | ${order.productType || 'Unspecified product'} | ${deadline}${details ? ` | ${details}` : ''}`;
    };
    const sortByDeadline = (a, b) => {
      const aDays = getDaysLeft(a.deadline); const bDays = getDaysLeft(b.deadline);
      if (aDays === null) return 1; if (bDays === null) return -1; return aDays - bDays;
    };
    const sections = buckets.map(bucket => {
      const bucketOrders = orders.filter(order => order.status === bucket.status).sort(sortByDeadline);
      if (bucketOrders.length === 0) return '';
      return `${bucket.heading}\n${bucketOrders.map(formatOrder).join('\n')}`;
    }).filter(Boolean);
    if (sections.length === 0) { alert('No active orders to share.'); return; }
    const summary = sections.join('\n\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(summary);
      setCopyStatusLabel('Copied!'); setTimeout(() => setCopyStatusLabel('Copy Status'), 1500);
    } catch { window.prompt('Copy this order status summary:', summary); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.cream }}><div className="text-center"><div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: colors.coral, borderTopColor: 'transparent' }}></div><p className="mt-3" style={{ color: colors.text }}>Loading...</p></div></div>;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.cream, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="w-full p-4 md:p-6 lg:p-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-wide italic" style={{ color: colors.coralDark, fontFamily: 'Georgia, serif' }}>a little part</h1>
              <p className="text-xs tracking-widest mt-1 uppercase" style={{ color: colors.textLight }}>Order Dashboard</p>
            </div>
            <div className="hidden sm:block text-xs font-medium uppercase tracking-wide" style={{ color: colors.textLight }}>{activeTab}</div>
          </div>
          {activeTab === 'dashboard' && <DashboardTab stats={stats} orders={orders} setActiveTab={setActiveTab} />}
          {activeTab === 'orders' && <OrdersTab filteredOrders={filteredOrders} orders={orders} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} exportCSV={exportCSV} handleBackup={handleBackup} handleRestore={handleRestore} copyStatus={copyStatus} copyStatusLabel={copyStatusLabel} viewMode={viewMode} setViewMode={setViewMode} openNewForm={openNewForm} restoreInputRef={restoreInputRef} groupedOrders={groupedOrders} openEditForm={openEditForm} setConfirmDelete={setConfirmDelete} quickStatusChange={quickStatusChange} getSourceLabel={getSourceLabel} />}
          {activeTab === 'posting' && <PostingTab orders={orders} setPostingField={setPostingField} />}
          {activeTab === 'clients' && <ClientsTab orders={orders} setSearch={setSearch} setActiveTab={setActiveTab} />}
          {activeTab === 'products' && <ProductsTab orders={orders} />}
        </div>
        <OrderForm form={form} setForm={setForm} showForm={showForm} setShowForm={setShowForm} editingOrder={editingOrder} handleSave={handleSave} referralClients={referralClients} />
        <DeleteConfirmModal confirmDelete={confirmDelete} handleDelete={handleDelete} setConfirmDelete={setConfirmDelete} />
      </main>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'posting', label: 'Posting', icon: Camera },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'products', label: 'Products', icon: Boxes }
  ];

  return (
    <>
      <aside className={`fixed bottom-0 left-0 right-0 z-40 overflow-hidden border-t bg-white transition-[width] duration-200 md:sticky md:top-0 md:h-screen md:shrink-0 md:border-t-0 md:border-r ${sidebarOpen ? 'md:w-60' : 'hidden md:block md:w-0 md:border-r-0'}`} style={{ borderColor: colors.creamDark }}>
        <div className="hidden md:flex items-start justify-between px-5 py-6 border-b" style={{ borderColor: colors.creamDark }}>
          <div>
            <div className="text-2xl font-light italic tracking-wide" style={{ color: colors.coralDark, fontFamily: 'Georgia, serif' }}>a little part</div>
            <div className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: colors.textLight }}>Order CRM</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 transition hover:bg-[#FCE8E3]" style={{ color: colors.coralDark }} title="Collapse menu" aria-label="Collapse menu">
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="absolute right-2 top-1 rounded p-1 md:hidden" style={{ color: colors.coralDark }} title="Hide menu" aria-label="Hide menu">
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
        <nav className="flex items-center justify-around gap-1 p-2 md:flex-col md:items-stretch md:justify-start md:gap-1 md:p-3">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition md:justify-start md:text-sm ${activeTab === id ? 'font-semibold' : ''}`} style={{ backgroundColor: activeTab === id ? colors.coralPale : 'transparent', color: activeTab === id ? colors.coralDark : colors.textLight }}>
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="fixed left-3 top-3 z-50 rounded-lg bg-white p-2 shadow-sm transition hover:bg-[#FCE8E3]" style={{ color: colors.coralDark }} title="Open menu" aria-label="Open menu">
        <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
      </button>}
    </>
  );
}
