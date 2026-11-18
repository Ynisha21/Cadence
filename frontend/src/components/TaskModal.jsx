import { useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES, fromInputDate, toInputDate } from '../utils.js';
import { Modal } from './ui.jsx';

export default function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Pending',
    priority: task?.priority || 'Medium',
    category: task?.category || 'Work',
    dueDate: toInputDate(task?.dueDate),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { ...form, dueDate: fromInputDate(form.dueDate) };
    try {
      if (task) await api.tasks.update(task._id, body); else await api.tasks.create(body);
      onSaved(task ? 'Task updated' : 'Task created');
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field full"><span>Title</span>
            <input className="input" value={form.title} onChange={set('title')} required maxLength={200} autoFocus placeholder="What needs to get done?" /></label>
          <label className="field full"><span>Description</span>
            <textarea className="textarea" value={form.description} onChange={set('description')} maxLength={2000} placeholder="Optional details" /></label>
          <label className="field"><span>Status</span>
            <select className="select" value={form.status} onChange={set('status')}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
          <label className="field"><span>Priority</span>
            <select className="select" value={form.priority} onChange={set('priority')}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label className="field"><span>Category</span>
            <input className="input" list="cats" value={form.category} onChange={set('category')} required maxLength={50} />
            <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
          <label className="field"><span>Due date</span>
            <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} /></label>
        </div>
        {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}
