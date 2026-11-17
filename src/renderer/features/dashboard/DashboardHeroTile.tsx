import React, { useState, useEffect } from 'react';
import type { CheckerSummary } from '@shared/types/domain';

interface DashboardHeroTileProps {
  summary: CheckerSummary;
}

function parseLocalDateTimeMs(dateTimeStr: string | null): number | null {
  if (!dateTimeStr) return null;
  const isoLike = dateTimeStr.replace(' ', 'T');
  const ms = Date.parse(isoLike);
  return Number.isNaN(ms) ? null : ms;
}

export const DashboardHeroTile: React.FC<DashboardHeroTileProps> = ({ summary }) => {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (!summary.isSchedulerRunning || summary.isCheckingNow || !summary.nextCheckAt) {
        setRemainingSec(null);
        return;
      }
      const targetMs = parseLocalDateTimeMs(summary.nextCheckAt);
      if (targetMs === null) {
        setRemainingSec(null);
        return;
      }
      const diffSec = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setRemainingSec(diffSec);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 250);
    return () => clearInterval(timer);
  }, [summary.isSchedulerRunning, summary.isCheckingNow, summary.nextCheckAt]);

  const uptimeRate =
    summary.totalDevices > 0
      ? Math.round((summary.upDevices / summary.totalDevices) * 1000) / 10
      : 0;

  return (
    <section className="grid grid-cols-5 gap-2.5 shrink-0">
      <div className="bg-[#0f172a] text-white border border-[#1e293b] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-slate-300 whitespace-nowrap block">
            정상 가동 장비
          </span>
          <span className="text-[10.5px] text-[#34d399] font-medium">가동률 {uptimeRate}%</span>
        </div>
        <span className="text-[21px] font-bold tracking-[-0.02em] text-[#38bdf8] whitespace-nowrap">
          {summary.upDevices.toLocaleString()}
          <span className="text-[11.5px] font-normal text-slate-400 ml-0.5">대</span>
        </span>
      </div>

      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[#475569] whitespace-nowrap block">
            전체 등록 장비
          </span>
          <span className="text-[10.5px] text-[#64748b]">응답 {summary.pingOkCount}대</span>
        </div>
        <span className="text-[21px] font-bold tracking-[-0.02em] text-[#0f172a] whitespace-nowrap">
          {summary.totalDevices.toLocaleString()}
          <span className="text-[11.5px] font-normal text-[#64748b] ml-0.5">대</span>
        </span>
      </div>

      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[#475569] whitespace-nowrap block">
            연결 끊김
          </span>
          <span className="text-[10.5px] text-[#64748b]">점검 필요</span>
        </div>
        <span
          className={`text-[21px] font-bold tracking-[-0.02em] whitespace-nowrap ${
            summary.downDevices > 0 ? 'text-[#e11d48]' : 'text-[#0f172a]'
          }`}
        >
          {summary.downDevices.toLocaleString()}
          <span className="text-[11.5px] font-normal text-[#64748b] ml-0.5">대</span>
        </span>
      </div>

      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[#475569] whitespace-nowrap block">
            센터 생존신호
          </span>
          <span className="text-[10.5px] text-[#64748b]">
            포트 {summary.msOpenCount}/{summary.vncOpenCount}
          </span>
        </div>
        <span className="text-[21px] font-bold tracking-[-0.02em] text-[#2563eb] whitespace-nowrap">
          {summary.keepAliveSuccessCount.toLocaleString()}
          <span className="text-[11.5px] font-normal text-[#64748b] ml-0.5">대</span>
        </span>
      </div>

      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[#475569] whitespace-nowrap block">
            주기 점검 카운트
          </span>
          <span className="text-[10.5px] text-[#64748b]">누적 {summary.completedCycles}회</span>
        </div>
        <div className="text-[19px] font-bold tracking-[-0.02em] text-[#059669] whitespace-nowrap">
          {summary.isCheckingNow ? (
            <span className="text-[14px] text-[#2563eb]">
              {summary.checkedProgress}/{summary.totalDevices} 점검중
            </span>
          ) : summary.isSchedulerRunning && remainingSec !== null ? (
            <>
              {remainingSec}
              <span className="text-[11.5px] font-normal text-[#64748b] ml-0.5">초</span>
            </>
          ) : (
            <span className="text-[13px] font-semibold text-[#64748b]">일시정지</span>
          )}
        </div>
      </div>
    </section>
  );
};
