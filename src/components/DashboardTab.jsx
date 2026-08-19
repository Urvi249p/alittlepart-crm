import { ArrowRight, Clock } from 'lucide-react';
import DashboardCards from './DashboardCards';
import { colors, fmtDate, getDaysLeft, getProductDetailsText, getUrgency } from '../utils/orderHelpers';

export default function DashboardTab({ stats, orders, setActiveTab }) {
  const attentionOrders = orders
    .filter(order => order.status !== 'Completed')
    .sort((a, b) => {
      const urgencyOrder = { overdue: 0, urgent: 1, soon: 2, normal: 3 };
      const urgencyDifference = urgencyOrder[getUrgency(a)] - urgencyOrder[getUrgency(b)];
      if (urgencyDifference !== 0) return urgencyDifference;
      const aDays = getDaysLeft(a.deadline);
      const bDays = getDaysLeft(b.deadline);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    })
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <DashboardCards stats={stats} />
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.creamDark }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Needs Attention</h2>
            <p className="text-xs mt-1" style={{ color: colors.textLight }}>Orders that need a next step</p>
          </div>
          <Clock className="w-5 h-5" style={{ color: colors.coralDark }} aria-hidden="true" />
        </div>
        {attentionOrders.length === 0 ? (
          <p className="px-5 py-8 text-sm" style={{ color: colors.textLight }}>No active orders need attention.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.creamDark }}>
            {attentionOrders.map(order => {
              const days = getDaysLeft(order.deadline);
              const urgency = getUrgency(order);
              return (
                <div key={order.id} className="px-5 py-3 flex justify-between items-center gap-3 text-left">
                  <div className="min-w-[150px] flex-1 text-left">
                    <div className="font-semibold text-sm" style={{ color: colors.text }}>{order.customerName || 'Unnamed client'}</div>
                    <div className="text-xs mt-1" style={{ color: colors.textLight }}>{order.productType}{getProductDetailsText(order) ? ` · ${getProductDetailsText(order)}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: colors.textLight }}>{fmtDate(order.deadline)}</div>
                    <div className={`text-xs font-semibold ${urgency === 'overdue' || urgency === 'urgent' ? 'text-red-600' : urgency === 'soon' ? 'text-amber-600' : 'text-gray-500'}`}>
                      {days === null ? 'No deadline' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="px-5 py-3 border-t" style={{ borderColor: colors.creamDark }}>
          <button onClick={() => setActiveTab('orders')} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.coralDark }}>
            View all orders <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
