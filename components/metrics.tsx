import { animate, motion, useReducedMotion } from 'framer-motion';
import { motionToken } from './motion-tokens';
import { useEffect, useRef } from 'react';
import type { Result } from '@/lib/scheduling';
export function Counter({ value, digits = 2 }: { value: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null); const previous = useRef(value); const reduced = useReducedMotion();
  useEffect(() => { if (!ref.current) return; if (reduced) { ref.current.textContent = value.toFixed(digits); previous.current = value; return; } const control = animate(previous.current, value, { duration: motionToken('slow'), onUpdate: v => { if (ref.current) ref.current.textContent = v.toFixed(digits); } }); previous.current = value; return () => control.stop(); }, [value, digits, reduced]);
  return <span ref={ref}>{value.toFixed(digits)}</span>;
}
export default function Metrics({ result }: { result: Result }) {
  const reduced = useReducedMotion();
  return <>
    <div className="metric-grid">{[['Average waiting',result.averageWaiting,'units'],['Average turnaround',result.averageTurnaround,'units'],['Average response',result.averageResponse,'units'],['CPU utilisation',result.utilization,'%']].map(([label,value,unit])=><motion.div className="metric" key={label} whileHover={reduced?undefined:{y:motionToken('lift')}}><span>{label}</span><strong><Counter value={Number(value)}/><small>{unit}</small></strong></motion.div>)}</div>
    <div className="stats-line"><span><b>{result.contextSwitches}</b> context switches</span><span><b>{result.idle}</b> idle units</span><span><b>{result.processes.length}</b> completed processes</span></div>
    <h3>Per-process accounting</h3>
    <table className="metrics-table"><caption className="sr-only">{result.algorithm} per-process metrics in CPU units</caption><thead><tr><th>Process</th><th><abbr title="Completion time">CT</abbr></th><th><abbr title="Turnaround time">TAT</abbr></th><th><abbr title="Waiting time">WT</abbr></th><th><abbr title="Response time">RT</abbr></th></tr></thead><tbody>{result.processes.map(p=><tr key={p.id}><th>{p.id}</th><td>{p.completion}</td><td>{p.turnaround}</td><td>{p.waiting}</td><td>{p.response}</td></tr>)}</tbody><tfoot><tr><th>Average</th><td>—</td><td>{result.averageTurnaround.toFixed(2)}</td><td>{result.averageWaiting.toFixed(2)}</td><td>{result.averageResponse.toFixed(2)}</td></tr></tfoot></table>
    <p className="formula">CT = finish time · TAT = CT − arrival · WT = TAT − burst · RT = first start − arrival</p>
  </>;
}
