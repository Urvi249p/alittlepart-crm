import { ArrowLeft, Boxes } from 'lucide-react';
import { useMemo, useState } from 'react';
import { colors, fmtDate, fmtMoney, getDaysLeft, getProductDetailsText } from '../utils/orderHelpers';

export default function ProductsTab({ orders }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const productSummary = useMemo(() => {
    const products = new Map();
    orders.forEach(order => {
      const productType = order.productType || 'Other';
      if (!products.has(productType)) products.set(productType, { productType, orderCount: 0, totalRevenue: 0 });
      const product = products.get(productType);
      product.orderCount += 1;
      product.totalRevenue += parseFloat(order.sellingPrice) || 0;
    });
    return [...products.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders]);

  const selectedOrders = useMemo(() => orders
    .filter(order => (order.productType || 'Other') === selectedProduct)
    .sort((a, b) => {
      const aDays = getDaysLeft(a.deadline);
      const bDays = getDaysLeft(b.deadline);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    }), [orders, selectedProduct]);

  const selectedSummary = productSummary.find(product => product.productType === selectedProduct);

  const statusStyles = {
    Pending: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    'In Progress': { backgroundColor: '#FEF3C7', color: '#92400E' },
    Ready: { backgroundColor: '#FEF3C7', color: '#92400E' },
    Couriered: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
    Delivered: { backgroundColor: '#FCE8E3', color: colors.coralDark },
    Completed: { backgroundColor: '#DCFCE7', color: '#166534' }
  };

  return (
    <section className="space-y-4">
      <div><h2 className="text-2xl font-semibold" style={{ color: colors.text }}>Products</h2><p className="text-sm mt-1" style={{ color: colors.textLight }}>Revenue and order volume by product type</p></div>
      {selectedProduct === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {productSummary.map(product => (
            <button key={product.productType} onClick={() => setSelectedProduct(product.productType)} className="bg-white rounded-xl shadow-sm p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><div><div className="font-semibold" style={{ color: colors.text }}>{product.productType}</div><div className="text-xs mt-1" style={{ color: colors.textLight }}>{product.orderCount} {product.orderCount === 1 ? 'order' : 'orders'}</div></div><Boxes className="w-5 h-5" style={{ color: colors.coralDark }} /></div>
              <div className="text-xl font-bold mt-5" style={{ color: colors.coralDark }}>₹{fmtMoney(product.totalRevenue)}</div>
              <div className="text-xs mt-1" style={{ color: colors.textLight }}>Total revenue</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setSelectedProduct(null)} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.coralDark }}>
              <ArrowLeft className="w-4 h-4" /> Back to Products
            </button>
            <span className="text-sm" style={{ color: colors.textLight }}>/</span>
            <h3 className="text-xl font-semibold" style={{ color: colors.text }}>{selectedProduct}</h3>
            {selectedSummary && <span className="text-sm" style={{ color: colors.textLight }}>{selectedSummary.orderCount} orders · ₹{fmtMoney(selectedSummary.totalRevenue)}</span>}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: colors.headerBg }} className="text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Details</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Selling ₹</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrders.map(order => {
                    const balance = (parseFloat(order.sellingPrice) || 0) - (parseFloat(order.advancePaid) || 0);
                    return (
                      <tr key={order.id} className="border-b hover:bg-[#FCE8E3] transition" style={{ borderColor: colors.creamDark }}>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: colors.text }}>{order.customerName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: colors.textLight }}>{order.contact || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: colors.textLight }}>{fmtDate(order.deadline)}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: colors.textLight }}>{getProductDetailsText(order) || '-'}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: colors.text }}>{order.sellingPrice ? fmtMoney(order.sellingPrice) : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-1 rounded-lg text-xs font-semibold" style={statusStyles[order.status] || { backgroundColor: colors.coralPale, color: colors.coralDark }}>{order.status || '-'}</span></td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${order.status === 'Completed' ? 'text-green-700' : balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>{fmtMoney(balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
