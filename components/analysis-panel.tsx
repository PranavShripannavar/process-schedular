import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Task } from '@/lib/scheduling';
export default function AnalysisPanel({ tasks, quantum, valid }: { tasks: Task[]; quantum: number; valid: boolean }) {
  const [state,setState]=useState<{loading:boolean; markdown?:string; error?:string; model?:string}>({loading:false});
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>{controller.current?.abort();setState({loading:false});return()=>controller.current?.abort();},[tasks,quantum]);
  async function analyze() {
    controller.current?.abort(); const active=new AbortController(); controller.current=active; setState({loading:true});
    try { const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tasks,quantum}),signal:active.signal}); const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Analysis unavailable.'); if(!active.signal.aborted) setState({loading:false,markdown:data.markdown,model:data.model}); }
    catch(error) { if(!active.signal.aborted) setState({loading:false,error:error instanceof Error?error.message:'Analysis unavailable.'}); }
  }
  return <>
    <div className="section-head"><div><span className="eyebrow">04 / INTERPRET</span><h2>Beyond the numbers</h2></div><span className="tag">GEMINI</span></div>
    <p className="analysis-intro">Explore why this workload behaves this way, the trade-offs behind each policy, and what changes on a real AI server.</p>
    <button className="primary" onClick={analyze} disabled={!valid||state.loading}>{state.loading?'Analysing workload…':'Analyse this workload'} <span aria-hidden="true">↗</span></button>
    <div aria-live="polite" aria-busy={state.loading}>{state.loading&&<p className="hint">Recomputing all four algorithms and preparing an explanation…</p>}{state.error&&<p className="error" role="alert">{state.error}</p>}{state.markdown&&<><div className="markdown"><ReactMarkdown>{state.markdown}</ReactMarkdown></div><p className="hint">Generated with {state.model}. The tables above are the measured source of truth.</p></>}</div>
  </>;
}
