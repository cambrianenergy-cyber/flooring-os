"use client";
import { useState } from "react";

interface CommissionEntry {
  rep: string;
  job: string;
  amount: number;
  commissionRate: number;
}

export default function CommissionTracker() {
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [rep, setRep] = useState("");
  const [job, setJob] = useState("");
  const [amount, setAmount] = useState(0);
  const [commissionRate, setCommissionRate] = useState(5);

  const handleAdd = () => {
    if (!rep || !job || !amount) return;
    setEntries([...entries, { rep, job, amount, commissionRate }]);
    setRep("");
    setJob("");
    setAmount(0);
    setCommissionRate(5);
  };

  return (
    <div className="max-w-lg mx-auto p-4 border rounded bg-background text-slate-900 mt-8">
      <h2 className="text-xl font-bold mb-2">Commission Tracker</h2>
      <div className="mb-2 flex gap-2">
        <input
          value={rep}
          onChange={(e) => setRep(e.target.value)}
          placeholder="Rep Name"
          className="border rounded px-2 py-1 flex-1"
        />
        <input
          value={job}
          onChange={(e) => setJob(e.target.value)}
          placeholder="Job"
          className="border rounded px-2 py-1 flex-1"
        />
      </div>
      <div className="mb-2 flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount ($)"
          className="border rounded px-2 py-1 flex-1"
        />
        <input
          type="number"
          value={commissionRate}
          onChange={(e) => setCommissionRate(Number(e.target.value))}
          placeholder="Rate (%)"
          className="border rounded px-2 py-1 w-20"
        />
      </div>
      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        disabled={!rep || !job || !amount}
      >
        Add Entry
      </button>
      <div>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Rep</th>
              <th className="p-2">Job</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Rate (%)</th>
              <th className="p-2">Commission</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx}>
                <td className="p-2">{entry.rep}</td>
                <td className="p-2">{entry.job}</td>
                <td className="p-2">${entry.amount.toFixed(2)}</td>
                <td className="p-2">{entry.commissionRate}%</td>
                <td className="p-2 font-bold text-blue-700">
                  ${((entry.amount * entry.commissionRate) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
