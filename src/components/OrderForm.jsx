import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { colors } from '../utils/orderHelpers';
import { callGeminiJSON } from '../utils/geminiClient';

export default function OrderForm({ canEdit, form, setForm, showForm, setShowForm, editingOrder, handleSave, referralClients }) {
  const [rawMessage, setRawMessage] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const closeForm = () => {
    setRawMessage('');
    setExtractError('');
    setShowForm(false);
  };

  const saveOrder = async () => {
    await handleSave();
    if (form.customerName) {
      setRawMessage('');
      setExtractError('');
    }
  };

  const extractDetails = async () => {
    if (!rawMessage.trim()) {
      setExtractError('Paste a message first');
      return;
    }

    setExtracting(true);
    setExtractError('');
    const today = new Date().toISOString().split('T')[0];
    const prompt = `Extract order details from the client message below into this exact JSON shape. All fields are optional; use an empty string for any field not mentioned:
{
  "customerName": "",
  "contact": "",
  "productType": "",
  "numberOfPages": "",
  "quality": "",
  "size": "",
  "quantity": "",
  "deliveryPlace": "",
  "occasion": "",
  "deadline": "",
  "sellingPrice": "",
  "requirements": ""
}

productType must be one of Magazine, Photobook, Premium Photobook (Only Matte), Fridge Magnet, Frame, Wallet Card, Combo Pack, or Other. Pick the closest match, or Other if unclear. Convert any mentioned deadline to YYYY-MM-DD. Resolve relative dates such as "next Friday" or dates such as "15th aug" using today's date, ${today}. Do not invent information that is not in the message; leave fields empty rather than guessing. Respond with only valid JSON and no markdown.

Client message:
${rawMessage}`;

    try {
      const extractedFields = await callGeminiJSON(prompt);
      const allowedFields = ['customerName', 'contact', 'productType', 'numberOfPages', 'quality', 'size', 'quantity', 'deliveryPlace', 'occasion', 'deadline', 'sellingPrice', 'requirements'];
      const nonEmptyFields = Object.fromEntries(
        allowedFields
          .filter(field => typeof extractedFields?.[field] === 'string' && extractedFields[field].trim())
          .map(field => [field, extractedFields[field]])
      );
      setForm(prev => ({ ...prev, ...nonEmptyFields }));
    } catch (error) {
      console.error('Gemini order extraction failed:', error);
      setExtractError("Couldn't read that message - try filling the form manually.");
    } finally {
      setExtracting(false);
    }
  };

  if (!showForm || !canEdit) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50" onClick={closeForm}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 p-4 border-b flex justify-between items-center" style={{ backgroundColor: colors.cream, borderColor: colors.coralLight }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>{editingOrder ? 'Edit Order' : 'New Order'}</h2>
            <button onClick={closeForm}><X className="w-5 h-5" style={{ color: colors.text }} /></button>
          </div>
          <div className="p-4 space-y-3">
            {!editingOrder && <div className="rounded-lg border p-3" style={{ borderColor: colors.coralLight, backgroundColor: colors.coralPale }}>
              <Field label="Paste client message">
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                  <textarea value={rawMessage} onChange={e => { setRawMessage(e.target.value); setExtractError(''); }} className="input min-h-24 flex-1 resize-y" rows="3" placeholder="Paste the client's WhatsApp message here and click Extract to auto-fill the form below" />
                  <button type="button" onClick={extractDetails} disabled={extracting} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70" style={{ backgroundColor: colors.coral }}>
                    {extracting ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Extracting...</> : <><Sparkles className="h-4 w-4" aria-hidden="true" />Extract Details</>}
                  </button>
                </div>
              </Field>
              {extractError && <p className="mt-1 text-xs" style={{ color: colors.coralDark }}>{extractError}</p>}
            </div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Client Name *"><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="input" /></Field>
              <Field label="Contact Number"><input type="tel" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="input" /></Field>
              <Field label="Source">
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value, sourceDetail: e.target.value === 'Known' || e.target.value === 'Referral' ? form.sourceDetail : '' })} className="input">
                  <option value="">Select source</option><option>Instagram</option><option>Known</option><option>Referral</option>
                </select>
              </Field>
              {form.source === 'Known' && <Field label="Known Person"><select value={form.sourceDetail} onChange={e => setForm({ ...form, sourceDetail: e.target.value })} className="input"><option value="">Select person</option><option>Urvi</option><option>Riddhi</option><option>Divyesh</option></select></Field>}
              {form.source === 'Referral' && <Field label="Referring Client"><select value={form.sourceDetail} onChange={e => setForm({ ...form, sourceDetail: e.target.value })} className="input" disabled={referralClients.length === 0}><option value="">{referralClients.length === 0 ? 'No clients yet' : 'Select referring client'}</option>{referralClients.map(client => <option key={client}>{client}</option>)}</select></Field>}
              <Field label="Deadline"><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="input" /></Field>
              <Field label="Delivery Date"><input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="input" /></Field>
              <Field label="Product Type"><select value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })} className="input"><option>Magazine</option><option>Photobook</option><option>Premium Photobook (Only Matte)</option><option>Fridge Magnet</option><option>Frame</option><option>Wallet Card</option><option>Combo Pack</option><option>Other</option></select></Field>
              {(form.productType === 'Magazine' || form.productType === 'Photobook' || form.productType === 'Premium Photobook (Only Matte)') && <Field label="Number of Pages"><input type="number" value={form.numberOfPages} onChange={e => setForm({ ...form, numberOfPages: e.target.value })} className="input" /></Field>}
              {(form.productType === 'Magazine' || form.productType === 'Photobook') && <Field label="Quality"><input type="text" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="input" placeholder="e.g., Glossy, Matte, Premium" /></Field>}
              {(form.productType === 'Fridge Magnet' || form.productType === 'Frame') && <Field label="Size"><input type="text" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="input" placeholder="e.g., 4x4 inch" /></Field>}
              {(form.productType === 'Fridge Magnet' || form.productType === 'Frame' || form.productType === 'Wallet Card') && <Field label="Quantity"><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input" /></Field>}
              <Field label="Selling Price (₹)"><input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} className="input" /></Field>
              <Field label="Cost (₹)"><input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="input" /></Field>
              <Field label="Share / Profit (₹)"><input type="number" value={form.share} onChange={e => setForm({ ...form, share: e.target.value })} className="input" placeholder="Your profit share" /></Field>
              <Field label="Advance Paid (₹)"><input type="number" value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: e.target.value })} className="input" /></Field>
              <Field label="Delivery Place"><input type="text" value={form.deliveryPlace} onChange={e => setForm({ ...form, deliveryPlace: e.target.value })} className="input" placeholder="e.g., Surat, Ahmedabad, USA" /></Field>
              <Field label="Occasion"><input type="text" value={form.occasion} onChange={e => setForm({ ...form, occasion: e.target.value })} className="input" placeholder="e.g., birthday, memory, anniversary" /></Field>
              <Field label="Packaging"><select value={form.packaging} onChange={e => setForm({ ...form, packaging: e.target.value })} className="input"><option>Regular</option><option>Premium</option></select></Field>
              <Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option>Pending</option><option>In Progress</option><option>Ready</option><option>Couriered</option><option>Delivered</option><option>Completed</option></select></Field>
            </div>
            <Field label="Full Delivery Address"><textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} className="input" rows="2" placeholder="Full address / requirements" /></Field>
            <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows="2" /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={saveOrder} className="flex-1 py-2.5 rounded-lg text-white font-medium transition hover:opacity-90" style={{ backgroundColor: colors.coral }}>{editingOrder ? 'Update Order' : 'Save Order'}</button>
              <button onClick={closeForm} className="px-5 py-2.5 rounded-lg border font-medium transition hover:bg-gray-50" style={{ borderColor: colors.coralLight, color: colors.text }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`.input { width: 100%; padding: 0.5rem 0.7rem; border: 1px solid ${colors.coralLight}; border-radius: 0.5rem; background-color: white; color: ${colors.text}; outline: none; font-size: 0.9rem; transition: all 0.2s; } .input:focus { border-color: ${colors.coral}; box-shadow: 0 0 0 3px ${colors.coralPale}; }`}</style>
    </>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-medium mb-1" style={{ color: '#5C3D3A' }}>{label}</label>{children}</div>;
}
