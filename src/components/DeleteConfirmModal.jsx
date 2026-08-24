import { colors } from '../utils/orderHelpers';

export default function DeleteConfirmModal({ canEdit, confirmDelete, handleDelete, setConfirmDelete }) {
  if (!confirmDelete || !canEdit) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Delete this order?</h3>
        <p className="text-sm mb-4" style={{ color: colors.textLight }}>This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">Delete</button>
          <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border font-medium" style={{ borderColor: colors.coralLight, color: colors.text }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
