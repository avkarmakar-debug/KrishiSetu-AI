import { Download, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEEDED_REGIONAL_PILOT_STATS } from '../data/sampleData';
import type { CropCase } from '../types';

interface InsightsDashboardProps {
  cases: CropCase[];
}

export function InsightsDashboard({ cases }: InsightsDashboardProps) {
  // Merge live saved cases with seeded regional anonymised pilot baseline
  const baselineTotal = SEEDED_REGIONAL_PILOT_STATS.districtBreakdown.reduce(
    (sum, d) => sum + d.aiAnswered + d.escalated,
    0
  );
  const baselineEscalated = SEEDED_REGIONAL_PILOT_STATS.districtBreakdown.reduce(
    (sum, d) => sum + d.escalated,
    0
  );

  const liveEscalated = cases.filter(
    (c) => c.status === 'with_expert' || c.status === 'verified'
  ).length;
  const totalCases = baselineTotal + cases.length;
  const totalEscalated = baselineEscalated + liveEscalated;
  const escalationRate = Math.round((totalEscalated / Math.max(1, totalCases)) * 100);
  const highConfidenceRate = 100 - escalationRate;

  const avgResponseSec =
    cases.length > 0
      ? (
          (SEEDED_REGIONAL_PILOT_STATS.baselineAvgResponseSec * 20 +
            cases.reduce((acc, c) => acc + c.responseTimeMs / 1000, 0)) /
          (20 + cases.length)
        ).toFixed(1)
      : SEEDED_REGIONAL_PILOT_STATS.baselineAvgResponseSec.toFixed(1);

  // Merge top diseases chart data
  const diseaseMap = new Map<string, number>();
  for (const row of SEEDED_REGIONAL_PILOT_STATS.diseaseCounts) {
    diseaseMap.set(row.name, row.cases);
  }
  for (const c of cases) {
    const key = c.likely_problem.length > 26 ? `${c.likely_problem.slice(0, 26)}…` : c.likely_problem;
    const matched = Array.from(diseaseMap.keys()).find(
      (k) =>
        key.toLowerCase().includes(k.toLowerCase().split(' ')[1] || k.toLowerCase()) ||
        k.toLowerCase().includes(key.toLowerCase())
    );
    if (matched) {
      diseaseMap.set(matched, (diseaseMap.get(matched) || 0) + 1);
    } else {
      diseaseMap.set(key, (diseaseMap.get(key) || 0) + 1);
    }
  }
  const topDiseasesData = Array.from(diseaseMap.entries())
    .map(([name, count]) => ({ name, cases: count }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 6);

  // Merge district breakdown data
  const districtMap = new Map<string, { district: string; aiAnswered: number; escalated: number }>();
  for (const row of SEEDED_REGIONAL_PILOT_STATS.districtBreakdown) {
    districtMap.set(row.district, { ...row });
  }
  for (const c of cases) {
    const shortDistrict = c.district.split(',')[0].trim();
    const existing = districtMap.get(shortDistrict) || {
      district: shortDistrict,
      aiAnswered: 0,
      escalated: 0,
    };
    if (c.status === 'with_expert' || c.status === 'verified') {
      existing.escalated += 1;
    } else {
      existing.aiAnswered += 1;
    }
    districtMap.set(shortDistrict, existing);
  }
  const districtChartData = Array.from(districtMap.values());

  // Weekly trend with today's live session cases reflected on latest day
  const weeklyTrendData = SEEDED_REGIONAL_PILOT_STATS.weeklyTrend.map((point, idx) =>
    idx === SEEDED_REGIONAL_PILOT_STATS.weeklyTrend.length - 1
      ? {
          ...point,
          total: point.total + cases.length,
          escalated: point.escalated + liveEscalated,
        }
      : point
  );

  const handleExportCsv = () => {
    const header = ['CaseRef', 'District', 'Crop', 'DetectedIssue', 'ConfidencePct', 'Status'];
    const rows = cases.map((c) => [
      c.id,
      `"${c.district}"`,
      `"${c.crop.replace(/"/g, '""')}"`,
      `"${c.likely_problem.replace(/"/g, '""')}"`,
      String(c.confidence),
      c.status,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `krishisetu-anonymised-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-12 space-y-6">
      {/* Header + Export */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#E5E8E2]">
        <div>
          <p className="text-xs font-semibold text-[#1B7F3B]">
            NGO, DAE & institutional partner view
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#14231A]">
            Regional Crop-Health Insights
          </h1>
          <p className="mt-1 text-sm text-[#4A5D52]">
            Aggregated live session detections combined with seeded pilot baseline · Sample institutional analytics
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#DCE2D9] hover:border-[#1B7F3B] text-sm font-semibold text-[#14231A] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#1B7F3B]" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Privacy Compliance Banner */}
      <div className="rounded-2xl bg-[#F2F6F3] border border-[#DCE5DE] p-4 flex items-center gap-3 text-xs sm:text-sm text-[#314438]">
        <ShieldCheck className="w-5 h-5 text-[#1B7F3B] shrink-0" />
        <p>
          <strong>Privacy by design:</strong> Zero farmer names, phone numbers, GPS pins, or voice recordings appear in this dashboard. Only anonymised district-level crop health trends are shown.
        </p>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
          <p className="text-xs font-semibold text-[#4A5D52]">Total Cases This Week</p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#14231A] tabular-nums">
            {totalCases}
          </p>
          <p className="mt-1 text-xs text-[#1B7F3B] font-medium">
            Includes {cases.length} live session cases
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
          <p className="text-xs font-semibold text-[#4A5D52]">AI High-Confidence Rate</p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#1B7F3B] tabular-nums">
            {highConfidenceRate}%
          </p>
          <p className="mt-1 text-xs text-[#4A5D52]">Confidence ≥ 70% threshold</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
          <p className="text-xs font-semibold text-[#4A5D52]">Agronomist Escalation Rate</p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#B45309] tabular-nums">
            {escalationRate}%
          </p>
          <p className="mt-1 text-xs text-[#4A5D52]">
            {totalEscalated} cases routed for human safety check
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
          <p className="text-xs font-semibold text-[#4A5D52]">Avg. AI Response Time</p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#14231A] tabular-nums">
            {avgResponseSec}s
          </p>
          <p className="mt-1 text-xs text-[#4A5D52]">Photo + voice to structured plan</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Diseases This Week */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E6DF] p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            Top Crop Issues This Week
          </h2>
          <p className="text-xs text-[#4A5D52] mb-4">
            Anonymised case count by detected disease or nutrient stress
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topDiseasesData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1EC" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#4A5D52' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 12, fill: '#14231A' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #DCE2D9',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cases" name="Cases" fill="#1B7F3B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by District */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E6DF] p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            Cases by District (AI vs. Expert Escalated)
          </h2>
          <p className="text-xs text-[#4A5D52] mb-4">
            Shows regional demand and agronomist support load
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtChartData}
                margin={{ top: 4, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1EC" vertical={false} />
                <XAxis dataKey="district" tick={{ fontSize: 12, fill: '#14231A' }} />
                <YAxis tick={{ fontSize: 12, fill: '#4A5D52' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #DCE2D9',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="aiAnswered"
                  name="AI Confident"
                  stackId="a"
                  fill="#1B7F3B"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="escalated"
                  name="Escalated to Agronomist"
                  stackId="a"
                  fill="#E5A100"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7-Day Trend + Anonymised Live Cases Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E6DF] p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            7-Day Volume & Escalation Trend
          </h2>
          <p className="text-xs text-[#4A5D52] mb-4">
            Daily queries vs. safety-escalated cases
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 6, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1EC" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#4A5D52' }} />
                <YAxis tick={{ fontSize: 12, fill: '#4A5D52' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #DCE2D9',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total checks"
                  stroke="#1B7F3B"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="escalated"
                  name="Expert review"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anonymised Recent Detections Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E6DF] p-5 sm:p-6 overflow-hidden">
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            Recent Anonymised Detections
          </h2>
          <p className="text-xs text-[#4A5D52] mb-4">
            Live local cases stripped of all personal details
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5E8E2] text-xs font-semibold text-[#4A5D52]">
                  <th className="py-2.5 pr-3">District</th>
                  <th className="py-2.5 pr-3">Crop</th>
                  <th className="py-2.5 pr-3">Detected Issue</th>
                  <th className="py-2.5 pr-3 text-right">Confidence</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2ED]">
                {cases.slice(0, 7).map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFBF9]">
                    <td className="py-3 pr-3 text-[#314438] whitespace-nowrap">
                      {c.district.split(',')[0]}
                    </td>
                    <td className="py-3 pr-3 font-medium text-[#14231A] whitespace-nowrap">
                      {c.crop}
                    </td>
                    <td className="py-3 pr-3 text-[#314438] max-w-[200px] truncate">
                      {c.likely_problem}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums font-semibold text-[#14231A]">
                      {c.confidence}%
                    </td>
                    <td className="py-3 text-right whitespace-nowrap text-xs font-semibold">
                      {c.status === 'verified' ? (
                        <span className="text-[#0F766E]">Verified</span>
                      ) : c.status === 'with_expert' ? (
                        <span className="text-[#B45309]">With expert</span>
                      ) : (
                        <span className="text-[#1B7F3B]">AI answered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
