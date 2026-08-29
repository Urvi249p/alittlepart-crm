import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { colors, fmtDate, fmtMoney } from '../utils/orderHelpers';
import {
  deleteExpenseFromFirestore,
  ensureExpenseCutoff,
  saveExpenseToFirestore,
  subscribeToExpenseCutoff,
  subscribeToExpenses
} from '../utils/expenseHelpers';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: '',
  paidBy: ''
};

export default function ShareExpenseTab({ canEdit, orders = [] }) {
  const [excludedOrderIds, setExcludedOrderIds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const initializeCutoff = async () => {
      try {
        await ensureExpenseCutoff(orders);
      } catch (error) {
        console.error('Failed to initialize expense cutoff:', error);
      }
    };

    initializeCutoff();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToExpenseCutoff((cutoffDoc) => {
      setExcludedOrderIds(cutoffDoc?.excludedOrderIds || []);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToExpenses((expenseList) => {
      setExpenses(Array.isArray(expenseList) ? expenseList : []);
    });

    return unsubscribe;
  }, []);

  const balance = useMemo(() => {
    const completedShareTotal = (orders || [])
      .filter(order => order?.status === 'Completed' && !excludedOrderIds.includes(order?.id))
      .reduce((sum, order) => sum + (parseFloat(order?.share) || 0), 0);

    const expenseTotal = expenses.reduce((sum, expense) => sum + (parseFloat(expense?.amount) || 0), 0);

    return completedShareTotal - expenseTotal;
  }, [orders, excludedOrderIds, expenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || '',
      amount: expense.amount ?? '',
      paidBy: expense.paidBy || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedAmount = parseFloat(form.amount);

    if (!form.date || !form.category.trim() || !form.paidBy.trim() || Number.isNaN(normalizedAmount)) {
      alert('Please fill in the date, category, amount, and paid by fields.');
      return;
    }

    const nextExpense = {
      id: editingExpense?.id || Date.now().toString(),
      date: form.date,
      category: form.category.trim(),
      amount: normalizedAmount,
      paidBy: form.paidBy.trim()
    };

    await saveExpenseToFirestore(nextExpense);
    closeModal();
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete expense for ${expense.category || 'this item'}?`);
    if (!confirmed) return;

    await deleteExpenseFromFirestore(expense.id);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl shadow-sm p-5" style={{ background: `linear-gradient(135deg, ${colors.coralPale}, #ffffff)` }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: colors.coralLight }}>
              <Wallet className="h-4 w-4" style={{ color: colors.coralDark }} />
            </div>
            <span className="text-sm font-medium" style={{ color: colors.textLight }}>Balance</span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:brightness-95"
              style={{ backgroundColor: colors.coralDark, color: 'white' }}
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          )}
        </div>

        <div className="mt-4 text-3xl font-bold" style={{ color: colors.text }}>
          {fmtMoney(balance)}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b px-5 py-4" style={{ borderColor: colors.creamDark }}>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Expense List</h3>
        </div>

        {expenses.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: colors.textLight }}>
            No expenses yet.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.creamDark }}>
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: colors.text }}>
                      {expense.category || 'Uncategorized'}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}>
                      {fmtMoney(expense.amount || 0)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: colors.textLight }}>
                    <span>{expense.date ? fmtDate(expense.date) : 'No date'}</span>
                    <span>{expense.paidBy || 'Unknown payer'}</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(expense)}
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition hover:bg-white"
                      style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
                      aria-label={`Edit expense ${expense.category || 'expense'}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense)}
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition hover:bg-white"
                      style={{ borderColor: colors.coralLight, color: colors.coralDark, backgroundColor: 'white' }}
                      aria-label={`Delete expense ${expense.category || 'expense'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" style={{ color: colors.text }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm"
                style={{ backgroundColor: colors.coralPale, color: colors.coralDark }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium">
                <span className="mb-1 block">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={event => setForm(current => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: colors.coralLight, backgroundColor: 'white' }}
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                <span className="mb-1 block">Category</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: colors.coralLight, backgroundColor: 'white' }}
                  placeholder="e.g. Design, Printing"
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                <span className="mb-1 block">Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={event => setForm(current => ({ ...current, amount: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: colors.coralLight, backgroundColor: 'white' }}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                <span className="mb-1 block">Paid By</span>
                <input
                  type="text"
                  value={form.paidBy}
                  onChange={event => setForm(current => ({ ...current, paidBy: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: colors.coralLight, backgroundColor: 'white' }}
                  placeholder="Name"
                  required
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{ borderColor: colors.coralLight, color: colors.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ backgroundColor: colors.coralDark, color: 'white' }}
                >
                  {editingExpense ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
