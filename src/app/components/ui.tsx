import type { ReactNode } from 'react';

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6 dark:bg-stone-900 dark:ring-stone-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Bar({ label, value, max = 100, highlight = false, suffix = '' }: { label: ReactNode; value: number; max?: number; highlight?: boolean; suffix?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-28 shrink-0 truncate sm:w-36">{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className={`h-full rounded-full ${highlight ? 'bg-indigo-600' : 'bg-stone-400 dark:bg-stone-500'}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
      <div className="w-12 text-right tabular-nums text-stone-500">{value.toFixed(0)}{suffix}</div>
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{children}</span>;
}

export function List({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">{items.map((x) => <li key={x}>{x}</li>)}</ul>;
}
