import React from "react";
import SummaryCard from "./SummaryCard";

interface BillingSummaryCardsProps {
  pastDue: number;
  canceled: number;
  active: number;
  totalMRR: number;
}

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  pastDue,
  canceled,
  active,
  totalMRR,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
    <SummaryCard label="Past Due" value={pastDue} color="bg-red-50" />
    <SummaryCard label="Canceled" value={canceled} color="bg-gray-100" />
    <SummaryCard label="Active" value={active} color="bg-green-50" />
    <SummaryCard
      label="Total MRR"
      value={`$${(totalMRR / 100).toLocaleString()}`}
      color="bg-blue-50"
    />
  </div>
);

export default BillingSummaryCards;
