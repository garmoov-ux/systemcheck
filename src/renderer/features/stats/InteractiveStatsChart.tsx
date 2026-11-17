import React, { useState } from 'react';
import { BarChart3, PieChart, Server } from 'lucide-react';
import type {
  DailyCheckStatItem,
  DeviceCheckStatItem,
  MonthlyCheckStatsReport,
} from '@shared/types/domain';

type ChartTab = 'daily' | 'device' | 'distribution';

interface InteractiveStatsChartProps {
  report: MonthlyCheckStatsReport | null;
  yearLabel: string;
  monthLabel: string;
}

export const InteractiveStatsChart: React.FC<InteractiveStatsChartProps> = ({
  report,
  yearLabel,
  monthLabel,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('daily');
  const [hoveredDay, setHoveredDay] = useState<DailyCheckStatItem | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<DeviceCheckStatItem | null>(null);
  const [hoveredDonut, setHoveredDonut] = useState<{
    label: string;
    count: number;
    pct: string;
    color: string;
  } | null>(null);

  const dailyStats = report?.dailyStats ?? [];
  const deviceStats = report?.deviceStats ?? [];
  const totalChecks = report?.totalChecks ?? 0;
  const upCount = report?.upCount ?? 0;
  const downCount = report?.downCount ?? 0;

  const maxDaily = Math.max(...dailyStats.map((d) => d.totalChecks), 4);
  const yTicks = [
    maxDaily,
    Math.round(maxDaily * 0.75),
    Math.round(maxDaily * 0.5),
    Math.round(maxDaily * 0.25),
    0,
  ];

  // 도넛 차트 계산 (r = 54, 둘레 ≈ 339.29)
  const radius = 54;
  const circum = 2 * Math.PI * radius;
  const upRatio = totalChecks > 0 ? upCount / totalChecks : 0;
  const downRatio = totalChecks > 0 ? downCount / totalChecks : 0;
  const upLen = upRatio * circum;
  const downLen = downRatio * circum;

  const portMetrics = [
    {
      label: '정상 가동 (Up)',
      count: upCount,
      pct: totalChecks > 0 ? Math.round((upCount / totalChecks) * 100) : 0,
      color: '#2563eb',
    },
    {
      label: 'ICMP 응답 성공',
      count: report?.pingOkCount ?? 0,
      pct: totalChecks > 0 ? Math.round(((report?.pingOkCount ?? 0) / totalChecks) * 100) : 0,
      color: '#0284c7',
    },
    {
      label: '원격 데스크톱 포트(3389)',
      count: report?.msOpenCount ?? 0,
      pct: totalChecks > 0 ? Math.round(((report?.msOpenCount ?? 0) / totalChecks) * 100) : 0,
      color: '#4f46e5',
    },
    {
      label: '원격 제어 포트(5900)',
      count: report?.vncOpenCount ?? 0,
      pct: totalChecks > 0 ? Math.round(((report?.vncOpenCount ?? 0) / totalChecks) * 100) : 0,
      color: '#0d9488',
    },
    {
      label: '센터 생존신호 응답',
      count: report?.keepAliveOkCount ?? 0,
      pct: totalChecks > 0 ? Math.round(((report?.keepAliveOkCount ?? 0) / totalChecks) * 100) : 0,
      color: '#10b981',
    },
  ];

  return (
    <section className="col-span-7 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-3.5 flex flex-col min-h-0 relative">
      {/* 상단 차트 탭 스위치 */}
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
        <div className="inline-flex items-center p-0.5 rounded-[8px] bg-[#f1f5f9] border border-[#cbd5e1] gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>일자별 가동 추이</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'device'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>장비별 가동률 비교</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>상태 · 포트 분포</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2563eb]" /> 정상 가동
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#e11d48]" /> 연결 끊김
          </span>
        </div>
      </div>

      {/* 탭 1: 일자별 가동 추이 */}
      {activeTab === 'daily' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 flex flex-col relative overflow-hidden">
          {hoveredDay && (
            <div className="absolute top-2.5 right-3 z-20 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3 py-2 text-[11.5px] apple-product-shadow pointer-events-none min-w-[185px]">
              <div className="font-bold text-[#38bdf8] border-b border-[#334155] pb-1 mb-1 flex items-center justify-between">
                <span>{hoveredDay.day}</span>
                <span>가동률 {hoveredDay.uptimeRate}%</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">정상 가동(Up)</span>
                  <span className="font-bold text-[#60a5fa]">{hoveredDay.upCount.toLocaleString()}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">연결 끊김(Down)</span>
                  <span className="font-bold text-[#fb7185]">{hoveredDay.downCount.toLocaleString()}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">생존신호 성공</span>
                  <span className="font-semibold text-[#34d399]">
                    {hoveredDay.keepAliveOkCount.toLocaleString()}건
                  </span>
                </div>
              </div>
            </div>
          )}

          {dailyStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
              {yearLabel}년 {monthLabel}월에 집계된 상태 점검 데이터가 없습니다.
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex gap-2">
              <div className="w-9 flex flex-col justify-between pb-6 pt-2 text-[10.5px] text-[#64748b] text-right font-mono shrink-0">
                {yTicks.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>

              <div className="flex-1 min-w-0 relative flex flex-col">
                <div className="absolute inset-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none">
                  {yTicks.map((_, i) => (
                    <div
                      key={i}
                      className="w-full border-b border-dashed border-[#cbd5e1]/80 last:border-solid last:border-[#94a3b8]"
                    />
                  ))}
                </div>

                <div className="flex-1 min-h-0 flex items-end gap-2 pt-2 pb-6 px-2 overflow-x-auto relative z-10">
                  {dailyStats.map((d) => {
                    const isHovered = hoveredDay?.day === d.day;
                    const ratio = Math.min(d.totalChecks / maxDaily, 1);
                    const totalPct = Math.max(Math.round(ratio * 100), 4);
                    const downPct =
                      d.totalChecks > 0 ? Math.round((d.downCount / d.totalChecks) * 100) : 0;
                    const upPct = Math.max(0, 100 - downPct);

                    return (
                      <div
                        key={d.day}
                        onMouseEnter={() => setHoveredDay(d)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`flex-1 min-w-[32px] h-full flex flex-col items-center justify-end cursor-pointer relative px-1 rounded-[6px] transition-colors ${
                          isHovered ? 'bg-[#e2e8f0]/60' : ''
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold mb-1 transition-transform ${
                            isHovered ? 'text-[#2563eb] scale-110' : 'text-[#0f172a]'
                          }`}
                        >
                          {d.uptimeRate}%
                        </span>

                        <div
                          style={{ height: `${totalPct}%` }}
                          className={`w-full max-w-[26px] rounded-t-[5px] overflow-hidden flex flex-col transition-all ${
                            isHovered ? 'ring-2 ring-[#0f172a]' : ''
                          }`}
                        >
                          {downPct > 0 && (
                            <div style={{ height: `${downPct}%` }} className="bg-[#e11d48] w-full" />
                          )}
                          {upPct > 0 && (
                            <div style={{ height: `${upPct}%` }} className="bg-[#2563eb] w-full" />
                          )}
                        </div>

                        <span
                          className={`absolute -bottom-5 text-[10.5px] whitespace-nowrap ${
                            isHovered ? 'font-bold text-[#0f172a]' : 'text-[#64748b]'
                          }`}
                        >
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 장비별 가동률 비교 */}
      {activeTab === 'device' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3.5 flex flex-col relative overflow-y-auto space-y-2">
          {hoveredDevice && (
            <div className="fixed bottom-12 left-[320px] z-30 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3.5 py-2 text-[11.5px] apple-product-shadow pointer-events-none min-w-[225px]">
              <div className="font-bold text-[#38bdf8] border-b border-[#334155] pb-1 mb-1 flex items-center justify-between gap-2">
                <span>
                  {hoveredDevice.deviceId} ({hoveredDevice.deviceName || '-'})
                </span>
                <span>{hoveredDevice.uptimeRate}%</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <span className="text-slate-300">정상 가동(Up)</span>
                <span className="text-right font-bold text-[#60a5fa]">
                  {hoveredDevice.upCount.toLocaleString()}회
                </span>
                <span className="text-slate-300">연결 끊김(Down)</span>
                <span className="text-right font-bold text-[#fb7185]">
                  {hoveredDevice.downCount.toLocaleString()}회
                </span>
                <span className="text-slate-300">IP · 평균지연</span>
                <span className="text-right font-mono text-white">
                  {hoveredDevice.ip} ({hoveredDevice.avgLatencyMs}ms)
                </span>
              </div>
            </div>
          )}

          {deviceStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
              집계된 장비별 점검 데이터가 없습니다.
            </div>
          ) : (
            deviceStats.map((dev) => {
              const upShare =
                dev.totalChecks > 0 ? Math.round((dev.upCount / dev.totalChecks) * 100) : 0;
              const downShare = Math.max(0, 100 - upShare);

              return (
                <div
                  key={dev.deviceId}
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onMouseLeave={() => setHoveredDevice(null)}
                  className="bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] rounded-[8px] px-3 py-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#0f172a] text-[12.5px] shrink-0">
                        {dev.deviceId}
                      </span>
                      <span className="text-[11.5px] text-[#334155] truncate max-w-[190px]">
                        {dev.deviceName || '-'}
                      </span>
                      <span className="text-[11px] text-[#64748b] font-mono shrink-0">
                        ({dev.ip})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11.5px] shrink-0">
                      <span className="text-[#2563eb] font-semibold">정상 {dev.upCount}</span>
                      <span className="text-[#cbd5e1]">|</span>
                      <span className="text-[#e11d48] font-semibold">끊김 {dev.downCount}</span>
                      <span className="text-[#cbd5e1]">|</span>
                      <span className="font-bold text-[#0f172a]">{dev.uptimeRate}%</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden flex">
                    {upShare > 0 && (
                      <div style={{ width: `${upShare}%` }} className="bg-[#2563eb] h-full" />
                    )}
                    {downShare > 0 && (
                      <div style={{ width: `${downShare}%` }} className="bg-[#e11d48] h-full" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 탭 3: 상태 도넛 차트 & 포트/생존신호 성공률 분포 */}
      {activeTab === 'distribution' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3.5 grid grid-cols-12 gap-3 relative overflow-hidden">
          {hoveredDonut && (
            <div className="absolute top-2.5 right-3 z-20 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3 py-1.5 text-[11.5px] apple-product-shadow pointer-events-none">
              <span className="font-bold" style={{ color: hoveredDonut.color }}>
                {hoveredDonut.label}
              </span>
              <span className="mx-1.5 text-slate-400">:</span>
              <span className="font-bold">{hoveredDonut.count.toLocaleString()}건</span>
              <span className="ml-1 text-slate-300">({hoveredDonut.pct}%)</span>
            </div>
          )}

          <div className="col-span-5 bg-[#ffffff] border border-[#cbd5e1] rounded-[8px] p-3 flex flex-col items-center justify-center">
            <div className="text-[12px] font-bold text-[#334155] mb-2">가동 상태 판정 구성비</div>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                />
                {upLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="16"
                    strokeDasharray={`${upLen} ${circum}`}
                    strokeDashoffset={0}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: '정상 가동 (Up)',
                        count: upCount,
                        pct: (upRatio * 100).toFixed(1),
                        color: '#60a5fa',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                  />
                )}
                {downLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#e11d48"
                    strokeWidth="16"
                    strokeDasharray={`${downLen} ${circum}`}
                    strokeDashoffset={-upLen}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: '연결 끊김 (Down)',
                        count: downCount,
                        pct: (downRatio * 100).toFixed(1),
                        color: '#fb7185',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10.5px] text-[#64748b]">평균 가동률</span>
                <span className="text-[17px] font-extrabold text-[#0f172a]">
                  {report?.uptimeRate ?? 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-7 bg-[#ffffff] border border-[#cbd5e1] rounded-[8px] p-3 flex flex-col justify-between min-h-0">
            <div className="text-[12px] font-bold text-[#334155] mb-1 shrink-0">
              점검 프로토콜별 응답 성공률
            </div>
            <div className="flex-1 flex flex-col justify-around space-y-2">
              {portMetrics.map((m) => (
                <div
                  key={m.label}
                  onMouseEnter={() =>
                    setHoveredDonut({
                      label: m.label,
                      count: m.count,
                      pct: String(m.pct),
                      color: '#38bdf8',
                    })
                  }
                  onMouseLeave={() => setHoveredDonut(null)}
                  className="space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-[#0f172a]">{m.label}</span>
                    <span className="font-mono text-[#334155]">
                      <strong>{m.count.toLocaleString()}</strong>건 ({m.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(m.pct, 2)}%`, backgroundColor: m.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
