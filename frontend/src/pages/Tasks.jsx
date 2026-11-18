import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useUI } from '../context/UIContext.jsx';
import { CATEGORIES, dueInfo, useAsync, useDebounced } from '../utils.js';
import { Badge, Empty, ErrorState, Modal, PriorityBadge, Segmented, Skeleton, StatusBadge } from '../components/ui.jsx';
import TaskModal from '../components/TaskModal.jsx';

const STATUS = [{ value: '', label: 'All' }, { value: 'Pending', label: 'Pending' }, { value: 'In Progress', label: 'In progress' }, { value: 'Completed', label: 'Completed' }];
const SORTS = [
  { v: 'createdAt:desc', l: 'Newest first' }, { v: 'createdAt:asc', l: 'Oldest first' },
  { v: 'dueDate:asc', l: 'Due soonest' }, { v: 'dueDate:desc', l: 'Due latest' },
  { v: 'priority:desc', l: 'Highest priority' }, { v: 'priority:asc', l: 'Lowest priority' },
];

export default function Tasks() {
  const { toast } = useUI();
  const [f, setF] = useState({ search: '', status: '', priority: '', category: '', overdue: false, sort: 'createdAt:desc', page: 1 });
  const [modal, setModal] = useState(null); // null | 'new' | task
  const [confirm, setConfirm] = useState(null);
  const search = useDebounced(f.search);
  const set = (patch) => setF((x) => ({ ...x, page: 1, ...patch }));

  const { data, loading, error, reload } = useAsync(() => {
    const [sortBy, order] = f.sort.split(':');
    return api.tasks.list({ search, status: f.status, priority: f.priority, category: f.category, overdue: f.overdue ? 'true' : '', sortBy, order, page: f.page, limit: 10 });
  }, [search, f.status, f.priority, f.category, f.overdue, f.sort, f.page]);

  const cats = useAsync(() => api.analytics.categories({}), []);
  const catOptions = [...new Set([...CATEGORIES, ...(cats.data?.data || []).map((c) => c.category)])];

  async function toggle(t) {
    try { await api.tasks.update(t._id, { status: t.status === 'Completed' ? 'Pending' : 'Completed' }); toast(t.status === 'Completed' ? 'Task reopened' : 'Task completed'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  }
  async function remove() {
    try { await api.tasks.remove(confirm._id); toast('Task deleted'); setConfirm(null); reload(); }
    catch (e) { toast(e.message, 'error'); }
  }

  const tasks = data?.data || [];
  const pg = data?.pagination;
  const filtered = search || f.status || f.priority || f.category || f.overdue;

  return (
    <div>
      <div className="page-head">
        <div><h1>Tasks</h1><p>{pg ? `${pg.total} task${pg.total === 1 ? '' : 's'}${filtered ? ' match your filters' : ''}` : 'Your to-do list'}</p></div>
        <button className="btn" onClick={() => setModal('new')}><Plus size={18} />New task</button>
      </div>

      <div className="toolbar">
        <div className="search grow"><Search size={18} /><input className="input input-sm" placeholder="Search by title" aria-label="Search tasks" value={f.search} onChange={(e) => set({ search: e.target.value })} /></div>
        <Segmented label="Status" value={f.status} onChange={(v) => set({ status: v })} options={STATUS} />
      </div>
      <div className="toolbar">
        <select className="select select-sm" style={{ width: 'auto' }} aria-label="Priority" value={f.priority} onChange={(e) => set({ priority: e.target.value })}>
          <option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
        <select className="select select-sm" style={{ width: 'auto' }} aria-label="Category" value={f.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>{catOptions.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="select select-sm" style={{ width: 'auto' }} aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
        <label className="check"><input type="checkbox" checked={f.overdue} onChange={(e) => set({ overdue: e.target.checked })} />Overdue only</label>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : !data ? (
        <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={76} />)}</div>
      ) : tasks.length === 0 ? (
        <div className="card"><Empty icon={ClipboardList} title={filtered ? 'No tasks match these filters' : 'No tasks yet'}
          text={filtered ? 'Try clearing a filter or searching for something else.' : 'Create your first task to start building your dashboard.'}
          action={!filtered && <button className="btn" onClick={() => setModal('new')}><Plus size={18} />Create a task</button>} /></div>
      ) : (
        <div className="stack" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
          {tasks.map((t) => {
            const d = dueInfo(t); const done = t.status === 'Completed';
            return (
              <article key={t._id} className={`task-card p-${t.priority} ${done ? 'is-done' : ''}`}>
                <button className={`tick ${done ? 'done' : ''}`} onClick={() => toggle(t)} aria-label={done ? `Reopen "${t.title}"` : `Complete "${t.title}"`}><Check size={15} /></button>
                <div className="row-main">
                  <div className="row-title">{t.title}</div>
                  {t.description && <div className="desc">{t.description}</div>}
                  <div className="row-meta"><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /><Badge>{t.category}</Badge><span className={`tone-${d.tone}`}>{d.label}</span></div>
                </div>
                <div className="task-actions">
                  <button className="icon-btn" onClick={() => setModal(t)} aria-label={`Edit "${t.title}"`}><Pencil size={18} /></button>
                  <button className="icon-btn danger" onClick={() => setConfirm(t)} aria-label={`Delete "${t.title}"`}><Trash2 size={18} /></button>
                </div>
              </article>
            );
          })}
          {pg.pages > 1 && (
            <div className="pager">
              <button className="btn btn-ghost btn-sm" disabled={pg.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))}><ChevronLeft size={16} />Previous</button>
              <span>Page {pg.page} of {pg.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pg.page >= pg.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))}>Next<ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}

      {modal && <TaskModal task={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast(m); reload(); }} />}
      {confirm && (
        <Modal title="Delete this task?" onClose={() => setConfirm(null)}>
          <p className="muted">“{confirm.title}” will be removed permanently and won't count in your analytics.</p>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setConfirm(null)}>Keep task</button><button className="btn btn-danger" onClick={remove}>Delete task</button></div>
        </Modal>
      )}
    </div>
  );
}
