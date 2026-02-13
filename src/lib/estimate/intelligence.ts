export type EstimateRoom = {
  name: string;
  sqft: number;
  materialRate?: number; // per sqft
  laborRate?: number; // per sqft
  materialCostRate?: number; // per sqft cost (optional)
  laborCostRate?: number; // per sqft cost (optional)
};

export function computeEstimateIntelligence(args: {
  rooms: EstimateRoom[];
  commissionPct: number; // 0.04 - 0.10
  minMarginPct?: number; // e.g. 0.25
}) {
  const minMarginPct = args.minMarginPct ?? 0.25;

  const totals = args.rooms.reduce(
    (acc, r) => {
      const sqft = r.sqft || 0;
      const sellMaterial = (r.materialRate ?? 0) * sqft;
      const sellLabor = (r.laborRate ?? 0) * sqft;

      const costMaterial = (r.materialCostRate ?? 0) * sqft;
      const costLabor = (r.laborCostRate ?? 0) * sqft;

      acc.sell += sellMaterial + sellLabor;
      acc.cost += costMaterial + costLabor;
      acc.sqft += sqft;
      return acc;
    },
    { sell: 0, cost: 0, sqft: 0 },
  );

  const grossProfit = totals.sell - totals.cost;
  const marginPct = totals.sell > 0 ? grossProfit / totals.sell : 0;

  const commission = totals.sell * args.commissionPct;
  const netAfterCommission = grossProfit - commission;

  const flags: string[] = [];
  if (marginPct < minMarginPct)
    flags.push(
      `Margin below target (${Math.round(marginPct * 100)}% < ${Math.round(minMarginPct * 100)}%)`,
    );
  if (args.commissionPct < 0.04 || args.commissionPct > 0.1)
    flags.push("Commission out of allowed band (4%–10%)");
  if (netAfterCommission < 0)
    flags.push("Deal becomes unprofitable after commission");

  // A recommended minimum sell to hit margin target
  // sell*(1 - minMarginPct) = cost  => sell = cost / (1 - minMarginPct)
  const recommendedMinSell =
    totals.cost > 0 ? totals.cost / (1 - minMarginPct) : 0;

  return {
    totals,
    grossProfit,
    marginPct,
    commission,
    netAfterCommission,
    recommendedMinSell,
    flags,
  };
}
