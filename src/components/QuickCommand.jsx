import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { callGeminiJSON } from '../utils/geminiClient';
import { colors } from '../utils/orderHelpers';

const FILTER_STATUSES = ['all', 'urgent', 'Pending', 'In Progress', 'Ready', 'Couriered', 'Delivered', 'Completed'];
const CHANGE_STATUSES = ['Pending', 'In Progress', 'Ready', 'Couriered', 'Delivered', 'Completed'];

export default function QuickCommand({ canEdit, orders, setSearch, setFilterStatus, setActiveTab, quickStatusChange }) {
  const [command, setCommand] = useState('');
  const [thinking, setThinking] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const submitCommand = async (event) => {
    event.preventDefault();
    const trimmedCommand = command.trim();
    if (!trimmedCommand || thinking) return;

    setThinking(true);
    setMessage('');
    setPendingConfirmation(null);
    const today = new Date().toISOString().split('T')[0];
    const orderSummary = orders.map(order => ({
      id: order.id,
      customerName: order.customerName || '',
      productType: order.productType || '',
      status: order.status || '',
      deliveryPlace: order.deliveryPlace || '',
      deadline: order.deadline || ''
    }));
    const prompt = `Classify the user's CRM command into exactly one allowed intent and return only strict JSON. The command may be a read-only filter/search or a status change for one specific existing order.

For a filter/search intent, return exactly:
{ "intent": "filter", "searchText": "", "filterStatus": "all" }
searchText is a plain text term to filter by, such as a place or occasion. For overdue or late orders, use filterStatus "urgent". filterStatus must be one of: all, urgent, Pending, In Progress, Ready, Couriered, Delivered, Completed.

For a status change on one specific existing order, return exactly:
{ "intent": "statusChange", "orderId": "", "newStatus": "", "confidence": "high" }
newStatus must be one of: Pending, In Progress, Ready, Couriered, Delivered, Completed. orderId MUST be copied exactly from the order list below; never invent an id. If the command cannot be confidently matched to exactly one order, return confidence "low" and leave orderId empty.

If the command does not clearly match either intent, return exactly:
{ "intent": "unclear" }
Never return intents for deleting, bulk editing, or changing fields other than status. Today's date is ${today}.

Available orders (compact, with no pricing or contact information):
${JSON.stringify(orderSummary)}

User command:
${trimmedCommand}`;

    try {
      const result = await callGeminiJSON(prompt);
      if (result?.intent === 'filter' && typeof result.searchText === 'string' && FILTER_STATUSES.includes(result.filterStatus)) {
        setSearch(result.searchText);
        setFilterStatus(result.filterStatus);
        setActiveTab('orders');
      } else if (result?.intent === 'statusChange' && result.confidence === 'high' && typeof result.orderId === 'string' && result.orderId) {
        const order = orders.find(item => String(item.id) === result.orderId);
        if (order && CHANGE_STATUSES.includes(result.newStatus)) {
          setPendingConfirmation({ order, newStatus: result.newStatus });
        } else {
          setMessage("Couldn't confidently understand that - try being more specific, e.g. 'mark Jyoti's magazine as delivered'.");
        }
      } else {
        setMessage("Couldn't confidently understand that - try being more specific, e.g. 'mark Jyoti's magazine as delivered'.");
      }
    } catch (error) {
      console.error('Gemini quick command failed:', error);
      setMessage('Something went wrong, try again');
    } finally {
      setThinking(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingConfirmation) return;
    const { order, newStatus } = pendingConfirmation;
    setPendingConfirmation(null);
    await quickStatusChange(order.id, newStatus);
    setCommand('');
  };

  return (
    <div className="mb-5">
      <form onSubmit={submitCommand} className="relative flex items-center">
        <Sparkles className="absolute left-3 h-4 w-4" style={{ color: colors.coralDark }} aria-hidden="true" />
        <input
          type="text"
          value={command}
          onChange={event => { setCommand(event.target.value); setMessage(''); }}
          disabled={thinking}
          placeholder="Try: 'show overdue Surat orders' or 'mark Jyoti's magazine as delivered'"
          className="h-10 w-full rounded-lg border pl-10 pr-14 text-sm focus:outline-none focus:ring-2 disabled:opacity-70"
          style={{ borderColor: colors.coralLight, backgroundColor: 'white', color: colors.text }}
          aria-label="Quick command"
        />
        <button type="submit" disabled={thinking || !command.trim()} className="absolute right-1.5 inline-flex h-7 min-w-10 items-center justify-center rounded-lg px-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: colors.coral }}>
          {thinking ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Go'}
        </button>
      </form>
      {message && <p className="mt-1 text-xs" style={{ color: colors.coralDark }}>{message}</p>}
      {pendingConfirmation && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 text-sm" style={{ borderColor: colors.coralLight, color: colors.text }}>
        <span>Mark {pendingConfirmation.order.customerName || 'this client'}'s {pendingConfirmation.order.productType || 'order'} as {pendingConfirmation.newStatus}?</span>
        <div className="flex gap-2">
          <button onClick={confirmStatusChange} disabled={!canEdit} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: colors.coral }}>Confirm</button>
          <button onClick={() => setPendingConfirmation(null)} className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-gray-50" style={{ borderColor: colors.coralLight, color: colors.text }}>Cancel</button>
        </div>
      </div>}
    </div>
  );
}
