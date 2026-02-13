"use client";

interface EstimateTemplateProps {
  product: string;
  sqft: number;
  accessories: string[];
  total: number;
  customerName: string;
}

export default function EstimateTemplate({
  product,
  sqft,
  accessories,
  total,
  customerName,
}: EstimateTemplateProps) {
  return (
    <div className="max-w-lg mx-auto p-4 border rounded bg-background text-slate-900">
      <h2 className="text-xl font-bold mb-2">Estimate for {customerName}</h2>
      <div className="mb-2">
        Product: <span className="font-semibold">{product}</span>
      </div>
      <div className="mb-2">
        Square Feet: <span className="font-semibold">{sqft}</span>
      </div>
      <div className="mb-2">
        Accessories:{" "}
        <span className="font-semibold">
          {accessories.join(", ") || "None"}
        </span>
      </div>
      <div className="mb-4 font-bold text-lg">Total: ${total.toFixed(2)}</div>
      <div className="mt-4 text-xs text-gray-500">
        Thank you for considering Square Flooring Pro Suite!
      </div>
    </div>
  );
}
