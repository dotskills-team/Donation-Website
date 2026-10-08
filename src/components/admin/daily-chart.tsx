"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { money } from "@/lib/format";

export interface DailyRow {
  date: string;
  count: number;
  total: number;
}

export function DailyChart({ rows }: { rows: DailyRow[] }) {
  if (rows.length === 0) return <Empty title="No collections in this period" />;
  return (
    <div className="space-y-2">
      <div className="h-60 p-4" role="img" aria-label="Daily collection chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e2de" />
            <XAxis dataKey="date" tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: "#e3f1ec" }} />
            <Bar dataKey="total" fill="#0e6b52" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th className="text-right">Donations</Th>
            <Th className="text-right">Total collection</Th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r) => (
            <tr key={r.date}>
              <Td>{r.date}</Td>
              <Td className="text-right tabular-nums">{r.count}</Td>
              <Td className="text-right tabular-nums">{money(r.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
