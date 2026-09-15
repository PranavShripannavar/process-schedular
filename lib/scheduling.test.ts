import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultTasks, fcfs, sjf, priority, roundRobin, compare, validateInput, type Task } from './scheduling.ts';

test('hand-computed default workload: every non-preemptive process and average', () => {
  const cases = [
    [fcfs(defaultTasks), ['P1','P2','P3','P4','P5'], [7,19,23,25,30], [0,5,15,18,16], 10.8,16.8],
    [sjf(defaultTasks), ['P1','P4','P3','P5','P2'], [7,30,13,9,18], [0,16,5,2,4], 5.4,11.4],
    [priority(defaultTasks), ['P1','P4','P3','P2','P5'], [7,25,13,9,30], [0,11,5,2,16], 6.8,12.8],
  ] as const;
  for (const [r, order, completion, waiting, aw, at] of cases) {
    assert.deepEqual(r.timeline.map(s=>s.id), order);
    assert.deepEqual(r.processes.map(p=>p.completion), completion);
    assert.deepEqual(r.processes.map(p=>p.waiting), waiting);
    assert.deepEqual(r.processes.map(p=>p.turnaround), completion.map((c,i)=>c-defaultTasks[i].arrival));
    assert.deepEqual(r.processes.map(p=>p.response), waiting);
    assert.equal(r.averageWaiting, aw); assert.equal(r.averageTurnaround, at);
    assert.equal(r.utilization,100); assert.equal(r.idle,0); assert.equal(r.contextSwitches,4);
  }
});
test('RR q=3 admits new arrivals before requeueing; all expected metrics', () => {
  const r=roundRobin(defaultTasks,3);
  assert.deepEqual(r.timeline.map(s=>s.id),['P1','P2','P1','P3','P4','P2','P5','P1','P3','P2','P5','P2']);
  assert.deepEqual(r.processes.map(p=>p.completion),[21,30,22,14,27]);
  assert.deepEqual(r.processes.map(p=>p.waiting),[14,16,14,7,13]);
  assert.deepEqual(r.processes.map(p=>p.turnaround),[21,28,18,9,18]);
  assert.deepEqual(r.processes.map(p=>p.response),[0,1,5,7,8]);
  assert.equal(r.averageWaiting,12.8); assert.equal(r.averageTurnaround,18.8);
  assert.equal(r.averageResponse,4.2); assert.equal(r.contextSwitches,11);
});
test('idle CPU, including initial idle time, is explicit and included in utilization',()=>{
  const tasks:Task[]=[{id:'A',name:'A',arrival:0,burst:2,priority:1},{id:'B',name:'B',arrival:8,burst:2,priority:1}];
  for(const run of [fcfs,sjf,priority,(t:Task[])=>roundRobin(t,1)]) {
    const r=run(tasks); assert.deepEqual(r.timeline,[{id:'A',start:0,end:2},{id:null,start:2,end:8},{id:'B',start:8,end:10}]);
    assert.equal(r.utilization,40); assert.equal(r.idle,6); assert.equal(r.contextSwitches,0);
  }
  assert.equal(fcfs([{...tasks[0],arrival:3}]).utilization,40);
});
test('RR merges consecutive slices and admits exact-boundary arrivals',()=>{
  const a={id:'A',name:'A',arrival:0,burst:5,priority:1};
  assert.deepEqual(roundRobin([a],2).timeline,[{id:'A',start:0,end:5}]);
  const b={...a,id:'B',arrival:2,burst:1};
  assert.deepEqual(roundRobin([a,b],2).timeline.map(s=>s.id),['A','B','A']);
});
test('stable ties, unsorted arrivals, no mutation, and winner ties',()=>{
  const tasks:Task[]=[{id:'B',name:'B',arrival:2,burst:1,priority:1},{id:'A',name:'A',arrival:0,burst:2,priority:1}];
  const copy=structuredClone(tasks); assert.equal(fcfs(tasks).timeline[0].id,'A'); assert.deepEqual(tasks,copy);
  assert.equal(compare(defaultTasks,3).winner,'SJF');
  assert.equal(compare([tasks[0]],3).winners.length,4);
  assert.deepEqual(sjf(tasks.map(t=>({...t,arrival:0,burst:1}))).timeline.map(s=>s.id),['B','A']);
});
test('validation rejects malformed, duplicate, empty, fractional and excessive inputs',()=>{
  for(const tasks of [[],Array(21).fill(defaultTasks[0]),[defaultTasks[0],defaultTasks[0]],[{...defaultTasks[0],arrival:-1}],[{...defaultTasks[0],burst:0}],[{...defaultTasks[0],burst:1.5}],[{...defaultTasks[0],priority:0}],[{...defaultTasks[0],name:''}],[{...defaultTasks[0],id:'bad id'}]]) assert.throws(()=>validateInput({tasks,quantum:3}));
  for(const quantum of [0,101,1.5,NaN,'3',null]) assert.throws(()=>roundRobin(defaultTasks,quantum as number));
});
test('hand-computed quantum variations q=2 and q=5',()=>{
  for(const [q,ct,rt,wt,tat,response,switches] of [[2,[21,30,16,12,26],[0,0,2,5,7],11,17,2.8,14],[5,[18,30,14,16,23],[0,3,6,9,9],10.2,16.2,5.4,6]] as const){
    const r=roundRobin(defaultTasks,q); assert.deepEqual(r.processes.map(p=>p.completion),ct); assert.deepEqual(r.processes.map(p=>p.response),rt);
    assert.equal(r.averageWaiting,wt);assert.equal(r.averageTurnaround,tat);assert.equal(r.averageResponse,response);assert.equal(r.contextSwitches,switches);
  }
});
