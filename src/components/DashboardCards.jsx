import { colors, fmtMoney } from '../utils/orderHelpers';

export default function DashboardCards({ stats }) {
  return (
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
