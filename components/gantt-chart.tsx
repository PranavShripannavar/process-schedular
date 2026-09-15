import { motion, useReducedMotion } from 'framer-motion';
import type { Result, Task } from '@/lib/scheduling';
import { motionToken } from './motion-tokens';
export default function GanttChart({ result, tasks }: { result: Result; tasks: Task[] }) {
  const reduced = useReducedMotion();
  return <>
    <div className="timeline-meta"><span>CPU EXECUTION / {result.algorithm.toUpperCase()}</span><span>{result.duration} units total</span></div>
    <div className="gantt" role="img" aria-label={`${result.algorithm} timeline. ${result.timeline.map(s => `${s.id ?? 'Idle'} from ${s.start} to ${s.end}`).join('; ')}`}>
      {result.timeline.map((s, i) => <motion.div key={`${s.id}-${s.start}-${s.end}`} className={`slice ${s.id === null ? 'idle' : `task-${tasks.findIndex(t => t.id === s.id) % 5}`}`} style={{ flexGrow: s.end - s.start, flexBasis: 0 }} initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: motionToken('slow'), delay: Math.min(i * motionToken('stagger'), motionToken('max-delay')) }} title={`${s.id ?? 'Idle'}: ${s.start}–${s.end} (${s.end - s.start} units)`}>
        {(s.end - s.start) / result.duration >= .055 && <span>{s.id ?? 'Idle'}</span>}
      </motion.div>)}
    </div>
    <div className="time-axis" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i}>{Number((result.duration * i / 5).toFixed(1))}</span>)}</div>
    <div className="gantt-legend">{tasks.map((t, i) => <span key={t.id}><i className={`dot task-${i % 5}`} />{t.id} <small>{t.name}</small></span>)}{result.idle > 0 && <span><i className="dot idle" />Idle</span>}</div>
    <details className="sequence"><summary>Exact execution sequence · {result.timeline.length} blocks</summary><ol>{result.timeline.map((s,i) => <li key={i}><strong>{s.id ?? 'Idle'}</strong> {s.start}–{s.end}</li>)}</ol></details>
  </>;
}
