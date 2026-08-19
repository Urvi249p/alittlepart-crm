import { Edit2, Trash2 } from 'lucide-react';
import { colors, fmtDate, fmtMoney, getDaysLeft, getUrgency, getRowStyle } from '../utils/orderHelpers';

export default function OrderTable({ filteredOrders, openEditForm, setConfirmDelete, quickStatusChange, getSourceLabel }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: colors.headerBg }} className="text-white">
              <Th>Deadline</Th><Th>Client</Th><Th>Contact</Th><Th>Product</Th><Th align="right">Pages</Th>
              <Th align="right">Selling ₹</Th><Th align="right">Cost ₹</Th><Th align="right">Share ₹</Th><Th align="right">Advance</Th><Th align="right">Balance</Th>
              <Th>Delivery Place</Th><Th>Occasion</Th><Th>Source</Th><Th>Packaging</Th><Th>Status</Th><Th>Notes</Th><Th>Actions</Th>
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
                  <Td><span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{order.productType}</span></Td>
                  <Td align="right">{order.numberOfPages || '-'}</Td>
                  <Td align="right"><span style={{ color: colors.text }}>{order.sellingPrice ? fmtMoney(order.sellingPrice) : '-'}</span></Td>
                  <Td align="right">{order.cost ? fmtMoney(order.cost) : '-'}</Td>
                  <Td align="right"><span className="font-semibold text-green-700">{order.share ? fmtMoney(order.share) : '-'}</span></Td>
                  <Td align="right">{order.advancePaid ? fmtMoney(order.advancePaid) : '-'}</Td>
                  <Td align="right"><span className={order.status === 'Completed' ? 'font-semibold text-green-700' : balance > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>{fmtMoney(balance)}</span></Td>
                  <Td>{order.deliveryPlace || '-'}</Td>
                  <Td>{order.occasion || '-'}</Td>
                  <Td><span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>{getSourceLabel(order)}</span></Td>
                  <Td>{order.packaging === 'Premium' ? <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>✨ Premium</span> : <span className="text-xs text-gray-600">Regular</span>}</Td>
                  <Td>
                    <select value={order.status} onChange={e => quickStatusChange(order.id, e.target.value)} className="text-xs px-2 py-1 rounded border bg-white cursor-pointer" style={{ borderColor: colors.coralLight, color: colors.text }}>
                      <option>Pending</option><option>In Progress</option><option>Ready</option><option>Couriered</option><option>Delivered</option><option>Completed</option>
                    </select>
                  </Td>
                  <Td><div className="max-w-[150px] truncate text-xs" title={order.notes || ''} style={{ color: colors.textLight }}>{order.notes && <div>{order.notes}</div>}{!order.notes && '-'}</div></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditForm(order)} className="p-1.5 rounded hover:bg-white" style={{ color: colors.coralDark }} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmDelete(order.id)} className="p-1.5 rounded hover:bg-white text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
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
  );
}

function Th({ children, align = 'left' }) {
  return <th className={`px-3 py-2.5 text-${align} text-xs font-semibold uppercase tracking-wide whitespace-nowrap`}>{children}</th>;
}

function Td({ children, align = 'left', colSpan, className = '' }) {
  return <td colSpan={colSpan} className={`px-3 py-2.5 text-${align} whitespace-nowrap ${className}`}>{children}</td>;
}
