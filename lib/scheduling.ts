export type Task = { id: string; name: string; arrival: number; burst: number; priority: number };
export type Algorithm = 'FCFS' | 'SJF' | 'Round Robin' | 'Priority';
export type Slice = { id: string | null; start: number; end: number };
export type ProcessMetrics = Task & { completion: number; turnaround: number; waiting: number; response: number };
export type Result = { algorithm: Algorithm; timeline: Slice[]; processes: ProcessMetrics[]; averageWaiting: number; averageTurnaround: number; averageResponse: number; utilization: number; idle: number; contextSwitches: number; duration: number };
export const algorithms: Algorithm[] = ['FCFS', 'SJF', 'Round Robin', 'Priority'];
export const defaultTasks: Task[] = [
  { id: 'P1', name: 'Data preprocessing', arrival: 0, burst: 7, priority: 2 },
  { id: 'P2', name: 'Model training', arrival: 2, burst: 12, priority: 3 },
  { id: 'P3', name: 'Model validation', arrival: 4, burst: 4, priority: 2 },
  { id: 'P4', name: 'Model inference', arrival: 5, burst: 2, priority: 1 },
  { id: 'P5', name: 'Report generation', arrival: 9, burst: 5, priority: 4 },
];

export function validateInput(value: unknown): { tasks: Task[]; quantum: number } {
  if (!value || typeof value !== 'object') throw new Error('Provide a workload.');
  const { tasks, quantum } = value as { tasks: unknown; quantum: unknown };
  if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 20) throw new Error('Enter 1–20 tasks.');
  if (!Number.isInteger(quantum) || (quantum as number) < 1 || (quantum as number) > 100) throw new Error('Quantum must be an integer from 1 to 100.');
  const ids = new Set<string>();
  const clean = tasks.map((t: unknown) => {
    if (!t || typeof t !== 'object') throw new Error('Invalid task.');
    const row = t as Task;
    if (typeof row.id !== 'string' || !/^[A-Za-z0-9_-]{1,12}$/.test(row.id) || ids.has(row.id)) throw new Error('Use unique process IDs (1–12 letters, numbers, hyphens or underscores).');
    ids.add(row.id);
    if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 80) throw new Error('Task names must contain 1–80 characters.');
    for (const [key, min, max] of [['arrival', 0, 1000], ['burst', 1, 1000], ['priority', 1, 100]] as const) {
      if (!Number.isInteger(row[key]) || row[key] < min || row[key] > max) throw new Error(`${key} must be an integer from ${min} to ${max}.`);
    }
    return { id: row.id, name: row.name.trim(), arrival: row.arrival, burst: row.burst, priority: row.priority };
  });
  return { tasks: clean, quantum: quantum as number };
}

function append(timeline: Slice[], id: string | null, start: number, end: number) {
  const last = timeline.at(-1);
  if (last && last.id === id && last.end === start) last.end = end;
  else timeline.push({ id, start, end });
}

function measure(algorithm: Algorithm, tasks: Task[], timeline: Slice[]): Result {
  const processes = tasks.map(task => {
    const slices = timeline.filter(s => s.id === task.id);
    const completion = slices.at(-1)!.end;
    const turnaround = completion - task.arrival;
    return { ...task, completion, turnaround, waiting: turnaround - task.burst, response: slices[0].start - task.arrival };
  });
  const average = (key: 'waiting' | 'turnaround' | 'response') => processes.reduce((sum, p) => sum + p[key], 0) / tasks.length;
  const duration = timeline.at(-1)!.end;
  const idle = timeline.filter(s => s.id === null).reduce((sum, s) => sum + s.end - s.start, 0);
  // Count direct changes between distinct running processes. Idle dispatches are excluded.
  const contextSwitches = timeline.slice(1).filter((s, i) => s.id !== null && timeline[i].id !== null && s.id !== timeline[i].id).length;
  return { algorithm, timeline, processes, averageWaiting: average('waiting'), averageTurnaround: average('turnaround'), averageResponse: average('response'), utilization: 100 * (duration - idle) / duration, idle, contextSwitches, duration };
}

function nonPreemptive(tasks: Task[], algorithm: Algorithm, comparator: (a: Task, b: Task) => number): Result {
  const pending = [...tasks];
  const timeline: Slice[] = [];
  let time = 0;
  while (pending.length) {
    const ready = pending.filter(t => t.arrival <= time);
    if (!ready.length) {
      const next = Math.min(...pending.map(t => t.arrival));
      append(timeline, null, time, next);
      time = next;
      continue;
    }
    // Stable sort preserves input order after comparator and arrival ties.
    ready.sort((a, b) => comparator(a, b) || a.arrival - b.arrival);
    const task = ready[0];
    append(timeline, task.id, time, time + task.burst);
    time += task.burst;
    pending.splice(pending.indexOf(task), 1);
  }
  return measure(algorithm, tasks, timeline);
}

export const fcfs = (tasks: Task[]) => nonPreemptive(validateInput({ tasks, quantum: 1 }).tasks, 'FCFS', (a, b) => a.arrival - b.arrival);
export const sjf = (tasks: Task[]) => nonPreemptive(validateInput({ tasks, quantum: 1 }).tasks, 'SJF', (a, b) => a.burst - b.burst);
export const priority = (tasks: Task[]) => nonPreemptive(validateInput({ tasks, quantum: 1 }).tasks, 'Priority', (a, b) => a.priority - b.priority);

export function roundRobin(tasks: Task[], quantum: number): Result {
  tasks = validateInput({ tasks, quantum }).tasks;
  const arrivals = [...tasks].sort((a, b) => a.arrival - b.arrival);
  const remaining = new Map(tasks.map(t => [t.id, t.burst]));
  const queue: Task[] = [];
  const timeline: Slice[] = [];
  let cursor = 0;
  let time = 0;
  const admit = () => { while (cursor < arrivals.length && arrivals[cursor].arrival <= time) queue.push(arrivals[cursor++]); };
  while (cursor < arrivals.length || queue.length) {
    admit();
    if (!queue.length) {
      const next = arrivals[cursor].arrival;
      append(timeline, null, time, next);
      time = next;
      admit();
    }
    const task = queue.shift()!;
    const run = Math.min(quantum, remaining.get(task.id)!);
    append(timeline, task.id, time, time + run);
    time += run;
    remaining.set(task.id, remaining.get(task.id)! - run);
    admit(); // Includes arrivals at the quantum boundary, before requeueing.
    if (remaining.get(task.id)! > 0) queue.push(task);
  }
  return measure('Round Robin', tasks, timeline);
}

export function compare(tasks: Task[], quantum: number) {
  const results = [fcfs(tasks), sjf(tasks), roundRobin(tasks, quantum), priority(tasks)];
  const ranked = [...results].sort((a, b) => a.averageWaiting - b.averageWaiting || a.averageTurnaround - b.averageTurnaround);
  const winners = ranked.filter(r => r.averageWaiting === ranked[0].averageWaiting && r.averageTurnaround === ranked[0].averageTurnaround).map(r => r.algorithm);
  return { results, winner: ranked[0].algorithm, winners, margin: ranked[1].averageWaiting - ranked[0].averageWaiting };
}
