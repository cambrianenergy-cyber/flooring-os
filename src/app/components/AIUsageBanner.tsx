import React from "react";

interface AIUsageBannerProps {
  percent: number; // 0-1
  used: number;
  cap: number;
  daysRemaining: number | null;
  resetDate: Date;
  topFeature?: { featureKey: string; count: number } | null;
  isElite: boolean;
}

export function AIUsageBanner({ percent, used, cap, daysRemaining, resetDate, topFeature, isElite }: AIUsageBannerProps) {
  let message = null;
  let cta = null;
  let color = "bg-blue-900";

  if (percent >= 1) {
    if (isElite) {
      message = "You've hit your cap. Buy overage or wait for reset.";
      cta = <button className="ml-2 bg-accent text-background rounded px-3 py-1 font-bold">Buy Overage</button>;
      color = "bg-red-900";
    } else {
      message = "You've hit your monthly AI cap.";
      cta = <button className="ml-2 bg-accent text-background rounded px-3 py-1 font-bold">Upgrade Plan</button>;
      color = "bg-red-900";
    }
  } else if (percent >= 0.8) {
    message = "Upgrade to avoid slowdown. You're close to your monthly AI cap.";
    cta = <button className="ml-2 bg-accent text-background rounded px-3 py-1 font-bold">Upgrade Plan</button>;
    color = "bg-orange-700";
  } else if (percent >= 0.6) {
    message = "You’re a power user—here’s how to stretch usage.";
    color = "bg-yellow-700";
  } else {
    message = "AI usage is healthy.";
    color = "bg-blue-900";
  }

  return (
    <div className={`rounded-lg p-4 mb-4 text-white flex flex-col md:flex-row items-center justify-between ${color}`}>
      <div>
        <div className="font-bold text-lg mb-1">AI Usage</div>
        <div className="mb-1">{Math.round(percent * 100)}% used ({used.toLocaleString()} / {cap.toLocaleString()} tokens)</div>
        {daysRemaining !== null && (
          <div className="mb-1">Estimated days remaining: <span className="font-semibold">{Math.max(0, Math.round(daysRemaining))}</span></div>
        )}
        <div className="mb-1">Reset date: {resetDate.toLocaleDateString()}</div>
        {topFeature && (
          <div className="mb-1">Biggest drain: <span className="font-semibold">{topFeature.featureKey}</span> ({topFeature.count} runs)</div>
        )}
        <div className="text-xs text-muted">No surprise: usage resets monthly. You’ll always see your usage and get notified before limits.</div>
      </div>
      <div className="mt-3 md:mt-0 flex items-center">{message} {cta}</div>
    </div>
  );
}
