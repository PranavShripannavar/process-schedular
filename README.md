# AI Task Scheduler

Pranav Shripannavar · PRN 202501110195 · Division C · Batch C2  
Operating Systems · Assignment 1 · Unit 2 Process and Thread Management · CO2

## Problem and OS concept

An AI server receives preprocessing, training, validation, inference and reporting jobs. This simulator applies CPU scheduling to show how selection policy changes completion, turnaround, waiting and response times. A task record represents the scheduling fields of a process control block; the ready queue models runnable processes. This is a single-CPU teaching model, with known bursts, no I/O blocking and zero switching overhead. It does not schedule real OS processes, threads or GPU kernels.

## Approach

Next.js App Router, TypeScript and React. Pure functions in `lib/scheduling.ts` implement FCFS, non-preemptive SJF and non-preemptive Priority through one comparator-based driver. Round Robin has a live queue and remaining-burst map. New arrivals, including exact-boundary arrivals, enter before the preempted process is requeued. Adjacent slices for the same process merge. Ties use arrival time then input order.

CT is final completion; TAT = CT − arrival; WT = TAT − burst; RT = first start − arrival. Utilisation uses elapsed time from 0 to final completion, including initial and intermediate idle periods. Context switches count direct changes between distinct processes, excluding idle dispatches. Winner: minimum average WT, then average TAT; exact ties are shown.

The backend validates 1–20 tasks, unique IDs, bounded integer times and priorities, and quantum 1–100. It recomputes results, discovers Flash models supporting `generateContent`, and sends measured data without task names to Gemini. Temporary model-availability errors can fall back to another discovered Flash model. The key is read only inside the API route. UI analysis clears when inputs change.

## Test case and results

| Process | Task | Arrival | Burst | Priority |
|---|---|---:|---:|---:|
| P1 | Data preprocessing | 0 | 7 | 2 |
| P2 | Model training | 2 | 12 | 3 |
| P3 | Model validation | 4 | 4 | 2 |
| P4 | Model inference | 5 | 2 | 1 |
| P5 | Report generation | 9 | 5 | 4 |

| Algorithm | Avg WT | Avg TAT | Avg RT | Switches |
|---|---:|---:|---:|---:|
| FCFS | 10.80 | 16.80 | 10.80 | 4 |
| SJF | 5.40 | 11.40 | 5.40 | 4 |
| RR q=3 | 12.80 | 18.80 | 4.20 | 11 |
| Priority | 6.80 | 12.80 | 6.80 | 4 |

SJF wins by 1.40 waiting units over Priority and 5.40 over FCFS. FCFS runs long training before short validation/inference jobs. SJF completes shorter ready jobs first; Priority runs training before reporting. RR improves average first response over the non-preemptive policies in this workload but has more switches and longer waiting. All four use 100% of the CPU here; throughput is 5/30 tasks per unit.

RR q=2: WT 11.00, TAT 17.00, RT 2.80, 14 switches. RR q=5: WT 10.20, TAT 16.20, RT 5.40, 6 switches. Quantum effects on waiting need not be monotonic. With A=(arrival 0, burst 2) and B=(arrival 8, burst 2), the timeline is A 0–2, Idle 2–8, B 8–10; utilisation is 40%.

Seven `node --test` tests check hand-computed per-process metrics and sequences, quantum variations, boundary arrivals, stable ties, idle gaps, non-mutation, merged slices and invalid inputs.

## Run

Use Node.js 22.13+ (24 LTS recommended).

```sh
npm ci
# Create .env.local containing GEMINI_API_KEY=your_key
npm test
npm run build
npm start
```

Open http://localhost:3000. For development, use `npm run dev`.

## Vercel

1. Open https://vercel.com/new and import `PranavShripannavar/process-schedular`.
2. Keep Next.js as the framework and the repository root as the root directory.
3. Add `GEMINI_API_KEY` under project Settings → Environment Variables for Production, Preview and Development.
4. Deploy; if the deployment already exists, open Deployments → latest deployment → Redeploy so it receives the variable.
5. On the live URL, click **Analyse this workload**. A successful response has the four requested sections. Live evidence and the submission PDF are completed after the production URL is available.

## Demonstration and submission

Show the default workload, all four policies, RR quantum 2/3/5, and the idle case. Explain convoy effect, response versus completion, starvation risk under SJF/Priority, and why switching overhead or GPU/I/O work changes real-server behaviour. Source, report and execution evidence address the assignment rubric (4 correctness, 3 demonstration, 3 analysis, scaled to 5).

The assignment says implementations “may be” in C++/Java/Python. Confirm with the instructor that this TypeScript web implementation is acceptable. Generated reports, evidence and ZIP files are ignored by Git.

Technical references: [Next.js](https://nextjs.org/docs/app), [Gemini model discovery](https://ai.google.dev/api/models), [Gemini generation](https://ai.google.dev/api/generate-content).
