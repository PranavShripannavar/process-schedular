'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import Lenis from 'lenis';
import { algorithms, compare, defaultTasks, validateInput, type Algorithm } from '@/lib/scheduling';
import TaskEditor from './task-editor';
import GanttChart from './gantt-chart';
import Metrics from './metrics';
import ComparisonTable from './comparison-table';
import AnalysisPanel from './analysis-panel';
import { motionToken } from './motion-tokens';

export default function Scheduler() {
  const [tasks,setTasks]=useState(defaultTasks); const [quantum,setQuantum]=useState(3); const [algorithm,setAlgorithm]=useState<Algorithm>('FCFS');
  const reduced=useReducedMotion(); const {scrollY}=useScroll(); const travel=useTransform(scrollY,[0,motionToken('scroll-range')||1],[0,motionToken('travel')]); const y=useSpring(travel,{stiffness:motionToken('stiffness')||1,damping:motionToken('damping')});
  useEffect(()=>{if(reduced)return;const lenis=new Lenis({autoRaf:true,anchors:true});return()=>lenis.destroy();},[reduced]);
  const computation=useMemo(()=>{try{validateInput({tasks,quantum});return {data:compare(tasks,quantum),error:''};}catch(e){return {data:null,error:(e as Error).message};}},[tasks,quantum]);
  const result=computation.data?.results.find(r=>r.algorithm===algorithm);
  const lift=reduced?undefined:{y:motionToken('lift')};
  return <>
    <a className="skip" href="#workload">Skip to scheduler</a>
    <header><a className="brand" href="#"><span className="brand-icon" aria-hidden="true">▥</span>dispatch<span className="brand-slash">/</span></a><nav aria-label="Sections"><a href="#workload">Workload</a><a href="#results">Results</a><a href="#compare">Compare</a></nav><span className="header-note">CPU SCHEDULING LAB</span></header>
    <main>
      <section className="intro"><div><div className="eyebrow">OPERATING SYSTEMS / ASSIGNMENT 01</div><h1>Every cycle<br/><em>has a consequence.</em></h1><p>A CPU scheduling simulator for AI workloads.<br/>Change the queue. See the trade-offs.</p></div><motion.div className="intro-number" style={{y:reduced?0:y}} aria-hidden="true"><span>04</span><small>POLICIES<br/>ONE PROCESSOR</small></motion.div></section>
      <motion.section id="workload" className="panel" whileHover={lift}><TaskEditor tasks={tasks} onChange={setTasks} reset={()=>{setTasks(defaultTasks.map(t=>({...t})));setQuantum(3);}}/></motion.section>
      <section id="results" className="results-section"><div className="section-head"><div><span className="eyebrow">02 / EXECUTION</span><h2>Follow the processor</h2></div><label className="quantum">RR quantum<input aria-label="Round Robin quantum" type="number" min="1" max="100" step="1" value={Number.isNaN(quantum)?'':quantum} onChange={e=>setQuantum(e.target.value===''?NaN:Number(e.target.value))}/></label></div>
        <fieldset className="algorithm-select"><legend className="sr-only">Scheduling algorithm</legend>{algorithms.map(a=><label key={a} className={a===algorithm?'checked':''}><input type="radio" name="algorithm" value={a} checked={a===algorithm} onChange={()=>setAlgorithm(a)}/>{a}<span>{a==='Round Robin'?'PREEMPTIVE':'NON-PREEMPTIVE'}</span></label>)}</fieldset>
        {computation.error&&<p className="error" role="alert">{computation.error}</p>}
        {result&&<motion.div className="panel result-panel" whileHover={lift}><GanttChart result={result} tasks={tasks}/><Metrics result={result}/></motion.div>}
      </section>
      <div className="lower-grid"><motion.section id="compare" className="panel" whileHover={lift}>{computation.data?<ComparisonTable {...computation.data}/>:<p>Correct the workload to compare algorithms.</p>}</motion.section><motion.section id="analysis" className="panel analysis-panel" whileHover={lift}><AnalysisPanel tasks={tasks} quantum={quantum} valid={!computation.error}/></motion.section></div>
      <details className="assumptions"><summary>Simulation assumptions & metric definitions</summary><p>One CPU, known CPU bursts, no I/O blocking, and zero context-switch overhead. FCFS, SJF and Priority run a selected process to completion. Ties use arrival time, then input order. Round Robin admits arrivals at or before the slice end before requeueing the running process.</p><p>CPU utilisation = busy time ÷ elapsed time from 0 to final completion × 100. Initial and intermediate gaps count as idle time. Context switches count direct changes between distinct processes; idle dispatches and consecutive slices of the same process are excluded. Colours repeat after five processes; IDs identify every process.</p></details>
    </main>
    <footer><div className="brand">dispatch /</div><p>Pranav Shripannavar · PRN 202501110195 · Division C · Batch C2<br/>Operating Systems · Assignment 1 · Unit 2 Process and Thread Management · CO2</p><a href="https://github.com/PranavShripannavar/process-schedular" target="_blank" rel="noreferrer">Source code ↗</a></footer>
  </>;
}
