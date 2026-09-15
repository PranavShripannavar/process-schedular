import { motion, useReducedMotion } from 'framer-motion';
import type { Algorithm, Result } from '@/lib/scheduling';
import { motionToken } from './motion-tokens';
export default function ComparisonTable({ results, winners, margin }: { results: Result[]; winners: Algorithm[]; margin: number }) {
  const reduced = useReducedMotion(); const max = Math.max(1,...results.map(r=>r.averageWaiting));
  return <>
    <div className="section-head"><div><span className="eyebrow">03 / COMPARE</span><h2>One workload. Four outcomes.</h2></div></div>
    <div className="verdict"><span className="winner-mark">↗</span><p><strong>{winners.join(' / ')} {winners.length > 1 ? 'tie for best' : 'wins'}</strong><br/><span>{winners.length > 1 ? 'Equal lowest average waiting and turnaround times.' : `${margin.toFixed(2)} fewer waiting units than the next-best algorithm.`}</span></p></div>
    <table className="comparison"><caption className="sr-only">All algorithm averages and context switches</caption><thead><tr><th>Algorithm</th><th>Avg WT</th><th>Avg TAT</th><th>Avg RT</th><th>Switches</th></tr></thead><tbody>{results.map(r=><tr className={winners.includes(r.algorithm) ? 'winning' : ''} key={r.algorithm}><th>{r.algorithm}{winners.includes(r.algorithm)&&<span className="best">BEST</span>}<div className="bar-track"><motion.div initial={reduced?false:{width:0}} animate={{width:`${100*r.averageWaiting/max}%`}} transition={{duration:motionToken('slow')}} /></div></th><td>{r.averageWaiting.toFixed(2)}</td><td>{r.averageTurnaround.toFixed(2)}</td><td>{r.averageResponse.toFixed(2)}</td><td>{r.contextSwitches}</td></tr>)}</tbody></table>
    <p className="hint">Lower waiting time wins; turnaround breaks ties. Averages in CPU units.</p>
  </>;
}
