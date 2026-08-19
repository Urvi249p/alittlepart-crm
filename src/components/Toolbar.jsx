import { Plus, Search, Download, Upload, Copy } from 'lucide-react';
import { colors } from '../utils/orderHelpers';

export default function Toolbar({
  search, setSearch, filterStatus, setFilterStatus, exportCSV, handleBackup,
  handleRestore, copyStatus, copyStatusLabel, viewMode, setViewMode, openNewForm, restoreInputRef
}) {
  return (
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
          <button onClick={exportCSV} title="Export CSV" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={handleBackup} title="Backup" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}>
            <Download className="w-3.5 h-3.5" /> Backup
          </button>
          <button onClick={copyStatus} title="Copy Status" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}>
            <Copy className="w-3.5 h-3.5" /> {copyStatusLabel}
          </button>
          <button onClick={() => restoreInputRef.current?.click()} title="Restore" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border font-medium whitespace-nowrap transition hover:bg-white" style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}>
            <Upload className="w-3.5 h-3.5" /> Restore
          </button>
          <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
        </div>
        <div className="flex items-center border rounded-full overflow-hidden whitespace-nowrap" style={{ borderColor: colors.coralLight }}>
          <button onClick={() => setViewMode('table')} className="px-3 py-2 text-xs font-medium transition" style={{ backgroundColor: viewMode === 'table' ? colors.coralPale : 'white', color: colors.coralDark }}>Table View</button>
          <button onClick={() => setViewMode('grouped')} className="px-3 py-2 text-xs font-medium transition" style={{ backgroundColor: viewMode === 'grouped' ? colors.coralPale : 'white', color: colors.coralDark }}>Grouped View</button>
        </div>
        <button onClick={openNewForm} className="flex w-full md:w-auto items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium whitespace-nowrap transition hover:shadow-md" style={{ backgroundColor: colors.coral }}>
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>
    </div>
  );
}
