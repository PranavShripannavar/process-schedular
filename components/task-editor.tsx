import type { Task } from '@/lib/scheduling';
export default function TaskEditor({ tasks, onChange, reset }: { tasks: Task[]; onChange: (tasks: Task[]) => void; reset: () => void }) {
  const update = (i: number, key: keyof Task, value: string) => onChange(tasks.map((t, n) => n === i ? { ...t, [key]: ['arrival', 'burst', 'priority'].includes(key) ? value === '' ? NaN : Number(value) : value } : t));
  const add = () => { let id = 1; while (tasks.some(t => t.id === `P${id}`)) id++; onChange([...tasks, { id: `P${id}`, name: 'New AI task', arrival: 0, burst: 3, priority: 1 }]); };
  return <>
    <div className="section-head"><div><span className="eyebrow">01 / WORKLOAD</span><h2>The ready queue</h2></div><div className="actions"><button onClick={reset}>Reset</button><button onClick={add} disabled={tasks.length >= 20}>+ Add task</button></div></div>
    <p className="hint">Time in abstract CPU units. Priority 1 is most urgent.</p>
    <div className="task-grid table-heading" aria-hidden="true"><span>ID</span><span>AI / ML task</span><span>Arrival</span><span>Burst</span><span>Priority</span><span /></div>
    <div className="task-list">{tasks.map((task, i) => <div className="task-grid" key={i}>
      <label className="id-cell"><span className="mobile-label">ID</span><i className={`dot task-${i % 5}`} /><input aria-label={`Process ID row ${i + 1}`} value={task.id} maxLength={12} onChange={e => update(i, 'id', e.target.value)} /></label>
      <label className="name-cell"><span className="mobile-label">Task name</span><input aria-label={`Task name row ${i + 1}`} value={task.name} maxLength={80} onChange={e => update(i, 'name', e.target.value)} /></label>
      {(['arrival', 'burst', 'priority'] as const).map(key => <label key={key}><span className="mobile-label">{key}</span><input aria-label={`${key} row ${i + 1}`} type="number" min={key === 'arrival' ? 0 : 1} max={key === 'priority' ? 100 : 1000} step={1} value={Number.isNaN(task[key]) ? '' : task[key]} onChange={e => update(i, key, e.target.value)} /></label>)}
      <button className="remove" aria-label={`Remove task row ${i + 1}`} disabled={tasks.length === 1} onClick={() => onChange(tasks.filter((_, n) => n !== i))}>×</button>
    </div>)}</div><div className="panel-foot"><span>{tasks.length.toString().padStart(2, '0')} / 20 processes</span><span>Changes recalculate instantly</span></div>
  </>;
}
