import type { AIUsageRecord } from "./useAIUsageData";

export interface ValueTilesProps {
  usageData: AIUsageRecord[];
  loading: boolean;
  cap: number;
}
export interface UsageChartProps {
  usageData: AIUsageRecord[];
  loading: boolean;
}
export interface TeamLeaderboardProps {
  usageData: AIUsageRecord[];
  loading: boolean;
}
export interface OptimizationTipsProps {
  usageData: AIUsageRecord[];
}
// Placeholder components for scaffolding
export function PlanBadge({ plan }: { plan: string }) {
  return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{plan}</span>;
}
export function MonthPicker() {
  return <div className="mb-4">[Month Picker]</div>;
}
export function ValueTiles({ usageData, loading, cap }: ValueTilesProps) {
  void usageData; void loading; void cap;
  return <div className="mb-8">[Value Tiles]</div>;
}
export function UsageLineChart({ usageData, loading }: UsageChartProps) {
  void usageData; void loading;
  return <div className="h-64 bg-gray-50 rounded">[Usage Line Chart]</div>;
}
export function FeatureDonutChart({ usageData, loading }: UsageChartProps) {
  void usageData; void loading;
  return <div className="h-64 bg-gray-50 rounded">[Feature Donut Chart]</div>;
}
export function TeamLeaderboard({ usageData, loading }: TeamLeaderboardProps) {
  void usageData; void loading;
  return <div className="mb-8">[Team Leaderboard]</div>;
}
export function OptimizationTips({ usageData }: OptimizationTipsProps) {
  void usageData;
  return <div className="p-4 bg-yellow-50 rounded">[Optimization Tips]</div>;
}
export function UpgradeCTA() {
  return <div className="p-4 bg-pink-100 rounded text-center font-bold">[Upgrade CTA]</div>;
}
