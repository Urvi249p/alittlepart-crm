import { AlertCircle, CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react';
import { colors, fmtDate, fmtMoney, getDaysLeft, getUrgency, getRowStyle, getProductDetailsText } from '../utils/orderHelpers';

export default function GroupedView({ groupedOrders, openEditForm, setConfirmDelete, quickStatusChange, getSourceLabel }) {
  return (
    <div className="space-y-4">
      {groupedOrders.map(group => {
        const urgency = group.orders.every(order => order.status === 'Completed') ? 'done' : getUrgency({ deadline: group.deadline, status: 'Pending' });
        const groupStyle = getRowStyle(urgency);
        const days = getDaysLeft(group.deadline);
        return (
          <div key={`${group.customerName}|${group.contact}|${group.deadline}`} className="rounded-xl border shadow-sm overflow-hidden" style={groupStyle}>
            <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: colors.coralLight }}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold" style={{ color: colors.text }}>{group.customerName || 'Unnamed client'}</div>
                  <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{getSourceLabel(group.orders[0])}</span>
                </div>
                <div className="text-xs" style={{ color: colors.textLight }}>{group.contact || '-'}</div>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.text }}>
                <span>{fmtDate(group.deadline)}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: urgency === 'done' ? '#DCFCE7' : urgency === 'soon' ? '#FEF3C7' : urgency === 'urgent' || urgency === 'overdue' ? '#FEE2E2' : colors.coralPale, color: urgency === 'done' ? '#166534' : urgency === 'soon' ? '#92400E' : urgency === 'urgent' || urgency === 'overdue' ? '#991B1B' : colors.coralDark }}>
                  {urgency === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : urgency === 'urgent' || urgency === 'overdue' ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {urgency === 'done' ? 'Completed' : urgency === 'overdue' ? 'Overdue' : urgency === 'urgent' ? 'Urgent' : urgency === 'soon' ? 'Soon' : 'Normal'}
                </span>
                {days !== null && urgency !== 'done' && <span className="text-xs font-medium">{days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}</span>}
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: colors.coralLight }}>
              {group.orders.map(order => (
                <div key={order.id} className="px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="px-2 py-0.5 rounded-lg text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{order.productType}</span>
                  {getProductDetailsText(order) && <span className="text-xs" style={{ color: colors.textLight }}>{getProductDetailsText(order)}</span>}
                  <span className="font-medium ml-auto" style={{ color: colors.text }}>₹{fmtMoney(order.sellingPrice)}</span>
                  <select value={order.status} onChange={e => quickStatusChange(order.id, e.target.value)} className="text-xs px-2 py-1 rounded border bg-white cursor-pointer" style={{ borderColor: colors.coralLight, color: colors.text }}>
                    <option>Pending</option><option>In Progress</option><option>Ready</option><option>Couriered</option><option>Delivered</option><option>Completed</option>
                  </select>
                  <div className="flex gap-1">
                    <button onClick={() => openEditForm(order)} className="p-1.5 rounded hover:bg-white" style={{ color: colors.coralDark }} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmDelete(order.id)} className="p-1.5 rounded hover:bg-white text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 text-xs font-semibold flex flex-wrap gap-x-4 gap-y-2" style={{ backgroundColor: colors.coralPale, color: colors.text }}>
              <span>Selling: ₹{fmtMoney(group.totals.sellingPrice)}</span><span>Cost: ₹{fmtMoney(group.totals.cost)}</span><span>Share: ₹{fmtMoney(group.totals.share)}</span><span>Advance: ₹{fmtMoney(group.totals.advancePaid)}</span>
              <span className={group.orders.every(order => order.status === 'Completed') ? 'text-green-700' : group.totals.balance > 0 ? 'text-red-600' : 'text-gray-500'}>Balance: ₹{fmtMoney(group.totals.balance)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
