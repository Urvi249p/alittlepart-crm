import { CheckCircle2, Clock, IndianRupee, Package } from 'lucide-react';
import { colors, fmtMoney } from '../utils/orderHelpers';

export default function DashboardCards({ stats }) {
  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricCell label="Total Orders" value={stats.total} color={colors.text} icon={Package} />
        <MetricCell label="Pending Orders" value={stats.pending} color="#DC2626" icon={Clock} />
        <MetricCell label="Completed" value={stats.delivered} color="#059669" icon={CheckCircle2} />
        <MetricCell label="Total Selling ₹" value={fmtMoney(stats.totalSelling)} color={colors.coralDark} icon={IndianRupee} />
        <MetricCell label="Total Cost ₹" value={fmtMoney(stats.totalCost)} color="#B45309" icon={IndianRupee} />
        <MetricCell label="Total Share ₹" value={fmtMoney(stats.totalShare)} color="#059669" icon={IndianRupee} highlight />
      </div>
    </div>
  );
}

function MetricCell({ label, value, color, icon: Icon, highlight }) {
  return (
    <div className={`rounded-xl bg-white shadow-sm px-4 py-5 text-left transition-colors duration-150 hover:bg-[#FCE8E3] ${highlight ? 'border border-[#BBF7D0]' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-xs uppercase tracking-wide font-medium" style={{ color: '#8B6F6B' }}>{label}</div>
        <Icon className="w-5 h-5 shrink-0" style={{ color }} aria-hidden="true" />
      </div>
      <div className="text-lg md:text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
