import { Package } from 'lucide-react';
import Toolbar from './Toolbar';
import OrderTable from './OrderTable';
import GroupedView from './GroupedView';
import { colors } from '../utils/orderHelpers';

export default function OrdersTab({
  filteredOrders, orders, search, setSearch, filterStatus, setFilterStatus, exportCSV,
  handleBackup, handleRestore, copyStatus, copyStatusLabel, viewMode, setViewMode,
  openNewForm, restoreInputRef, groupedOrders, openEditForm, setConfirmDelete,
  quickStatusChange, getSourceLabel
}) {
  return (
    <div>
      <Toolbar search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} exportCSV={exportCSV} handleBackup={handleBackup} handleRestore={handleRestore} copyStatus={copyStatus} copyStatusLabel={copyStatusLabel} viewMode={viewMode} setViewMode={setViewMode} openNewForm={openNewForm} restoreInputRef={restoreInputRef} />
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.headerBg }}>Orders <span className="text-sm font-normal" style={{ color: colors.textLight }}>({filteredOrders.length})</span></h2>
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 rounded-lg bg-white">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: colors.coralLight }} />
          <p style={{ color: colors.textLight }}>{orders.length === 0 ? "No orders yet. Click 'New Order' to get started!" : 'No orders match your filter.'}</p>
        </div>
      ) : viewMode === 'grouped' ? (
        <GroupedView groupedOrders={groupedOrders} openEditForm={openEditForm} setConfirmDelete={setConfirmDelete} quickStatusChange={quickStatusChange} getSourceLabel={getSourceLabel} />
      ) : (
        <OrderTable filteredOrders={filteredOrders} openEditForm={openEditForm} setConfirmDelete={setConfirmDelete} quickStatusChange={quickStatusChange} getSourceLabel={getSourceLabel} />
      )}
      <p className="text-xs italic mt-3 text-center" style={{ color: colors.textLight }}>🔴 Red rows = deadline within 3 days or overdue &nbsp;•&nbsp; 🟡 Yellow = within a week &nbsp;•&nbsp; 🟢 Green = delivered</p>
    </div>
  );
}
