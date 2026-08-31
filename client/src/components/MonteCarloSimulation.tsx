import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  Dices,
  Info,
  TrendingUp,
} from "lucide-react";

interface Props {
  projectId: number;
}

export function MonteCarloSimulation({ projectId }: Props) {
  const query = trpc.project.monteCarloForecast.useQuery(
    { projectId },
    { enabled: Boolean(projectId) }
  );

  if (query.isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-[28px] border border-[#E1E5DB] bg-white p-7" />
    );
  }

  const data = query.data;
  if (!data) return null;

  const maxHistogramCount = Math.max(...data.histogram.map(b => b.count), 1);

  return (
    <article className="rounded-[28px] border border-[#E1E5DB] bg-white p-7 shadow-[0_16px_42px_rgba(27,60,45,.06)] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E1E5DB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9DE7D3] text-[#19352D]">
              <Dices className="h-4 w-4" />
            </span>
            <div>
              <p className="eyebrow text-[#718079]">Stochastic Intelligence</p>
              <h2 className="display-heading text-2xl text-[#19352D]">
                Monte Carlo Release Forecaster
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#718079]">
            Simulates 1,000 sprint iterations factoring in defect cycle variance, active blockers, and DAG depth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#19352D] text-white border-0 px-3 py-1 font-mono text-xs">
            1,000 Iterations
          </Badge>
          <Badge className="bg-[#A8E6CF] text-[#19352D] border-0 px-3 py-1 font-bold text-xs">
            {data.onTimeProbability}% On-Time Confidence
          </Badge>
        </div>
      </div>

      {/* 3 Core Statistical Percentiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E5DB] bg-[#FAFAF6] p-4 text-center">
          <p className="eyebrow text-[#718079]">P50 · Median</p>
          <p className="display-heading mt-1 text-3xl text-[#19352D]">
            {data.p50Days} <span className="text-base font-normal">days</span>
          </p>
          <p className="mt-1 text-[11px] text-[#718079]">50% of runs finish earlier</p>
        </div>

        <div className="rounded-2xl border-2 border-[#75937E] bg-[#F4FAF6] p-4 text-center">
          <p className="eyebrow text-[#2B5436] font-bold">P80 · Target Milestone</p>
          <p className="display-heading mt-1 text-3xl text-[#2B5436]">
            {data.p80Days} <span className="text-base font-normal">days</span>
          </p>
          <p className="mt-1 text-[11px] text-[#2B5436]">Recommended sprint commitment</p>
        </div>

        <div className="rounded-2xl border border-[#FFD8D2] bg-[#FFF5F4] p-4 text-center">
          <p className="eyebrow text-[#B8423A]">P95 · Risk Buffer</p>
          <p className="display-heading mt-1 text-3xl text-[#B8423A]">
            {data.p95Days} <span className="text-base font-normal">days</span>
          </p>
          <p className="mt-1 text-[11px] text-[#B8423A]">95% certainty worst-case limit</p>
        </div>
      </div>

      {/* Visual Probability Distribution Curve */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#718079]">
          <span>Sprint Delivery Probability Distribution (Days to Zero Blockers)</span>
          <span className="font-mono text-[11px]">Historical Mean: {data.meanCycleTimeDays}d / issue</span>
        </div>

        <div className="h-28 w-full rounded-2xl border border-[#E1E5DB] bg-[#FAFAF6] p-3 flex items-end gap-1.5 overflow-x-auto">
          {data.histogram.map(bin => {
            const heightPercent = Math.max(8, (bin.count / maxHistogramCount) * 100);
            const isP50 = bin.day === Math.floor(data.p50Days);
            const isP80 = bin.day === Math.floor(data.p80Days);
            const isP95 = bin.day === Math.floor(data.p95Days);

            return (
              <div
                key={bin.day}
                className="flex-1 flex flex-col items-center gap-1 group relative min-w-[20px]"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isP80
                      ? "bg-[#75937E] shadow-sm"
                      : isP50
                      ? "bg-[#19352D]"
                      : isP95
                      ? "bg-[#FF7164]"
                      : "bg-[#D6DDD4] group-hover:bg-[#BAC6B8]"
                  }`}
                />
                <span className="text-[10px] font-mono font-medium text-[#718079]">
                  {bin.day}d
                </span>

                {/* Tooltip on hover */}
                <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-[#19352D] text-white text-[10px] py-1 px-2 rounded-lg z-20 whitespace-nowrap shadow-md">
                  <span>Day {bin.day}: {bin.count} runs ({bin.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Footnote */}
      <div className="flex items-center gap-2 text-[11px] text-[#718079] bg-[#FAFAF6] rounded-xl p-3 border border-[#E1E5DB]">
        <Info className="h-4 w-4 shrink-0 text-[#19352D]" />
        <span>
          Mathematical model computes 1,000 Box-Muller stochastic trials incorporating {data.totalOpen} open defects, {data.blockerCount} critical release blockers, and concurrency scaling.
        </span>
      </div>
    </article>
  );
}
