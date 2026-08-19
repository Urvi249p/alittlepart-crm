import { Search, Users } from 'lucide-react';
import { colors, fmtMoney } from '../utils/orderHelpers';
import { useMemo, useState } from 'react';

export default function ClientsTab({ orders, setSearch, setActiveTab }) {
  const [clientSearch, setClientSearch] = useState('');
  const clientSummary = useMemo(() => {
    const clients = new Map();
    orders.forEach(order => {
      const displayName = (order.customerName || '').trim();
      if (!displayName) return;
      const key = displayName.toLowerCase();
      if (!clients.has(key)) {
        clients.set(key, { customerName: displayName, contact: order.contact || '', orderCount: 0, totalSpend: 0, balanceDue: 0, latestOrderDate: order.orderDate || '' });
      }
      const client = clients.get(key);
      client.orderCount += 1;
      client.totalSpend += parseFloat(order.sellingPrice) || 0;
      if (order.status !== 'Completed') client.balanceDue += (parseFloat(order.sellingPrice) || 0) - (parseFloat(order.advancePaid) || 0);
      if ((order.orderDate || '') >= client.latestOrderDate) {
        client.contact = order.contact || '';
        client.latestOrderDate = order.orderDate || '';
      }
    });
    return [...clients.values()].sort((a, b) => b.balanceDue - a.balanceDue);
  }, [orders]);
  const visibleClients = clientSummary.filter(client => client.customerName.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold" style={{ color: colors.text }}>Clients</h2><p className="text-sm mt-1" style={{ color: colors.textLight }}>A view of everyone in your order book</p></div>
        <div className="relative w-full sm:w-72"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textLight }} /><input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." className="w-full h-10 pl-10 pr-3 rounded-lg border text-sm" style={{ borderColor: colors.coralLight, color: colors.text }} /></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_100px_140px_140px] gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: colors.headerBg, color: 'white' }}><span>Client Name</span><span>Contact</span><span>Orders</span><span className="text-right">Total Spend</span><span className="text-right">Balance Due</span></div>
        {visibleClients.length === 0 ? <p className="px-5 py-10 text-sm" style={{ color: colors.textLight }}>No clients found.</p> : visibleClients.map(client => (
          <button key={client.customerName.toLowerCase()} onClick={() => { setSearch(client.customerName); setActiveTab('orders'); }} className="w-full grid grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_100px_140px_140px] gap-3 px-5 py-4 text-left items-center border-b hover:bg-[#FCE8E3] transition" style={{ borderColor: colors.creamDark }}>
            <span className="font-semibold" style={{ color: colors.text }}>{client.customerName}</span><span className="text-sm" style={{ color: colors.textLight }}>{client.contact || '-'}</span><span className="text-sm" style={{ color: colors.text }}>{client.orderCount}</span><span className="text-right text-sm" style={{ color: colors.text }}>{fmtMoney(client.totalSpend)}</span><span className={`text-right text-sm font-semibold ${client.balanceDue > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtMoney(client.balanceDue)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
