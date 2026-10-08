"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, Td, Th } from "@/components/ui/table";
import { METHOD_LABEL, money } from "@/lib/format";
import type { MethodRow } from "@/types";

export function MethodChart({ rows }: { rows: MethodRow[] }) {
  const data = rows.map((r) => ({ name: METHOD_LABEL[r.method], total: r.total }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-64 p-4" aria-label="Collection by method chart" role="img">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e2de" />
            <XAxis dataKey="name" tickLine={false} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: "#e3f1ec" }} />
            <Bar dataKey="total" fill="#0e6b52" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Table className="min-w-0">
        <thead>
          <tr>
            <Th>Collection method</Th>
            <Th className="text-right">Donations</Th>
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.method}>
              <Td>{METHOD_LABEL[r.method]}</Td>
              <Td className="text-right tabular-nums">{r.count}</Td>
              <Td className="text-right tabular-nums">{money(r.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
