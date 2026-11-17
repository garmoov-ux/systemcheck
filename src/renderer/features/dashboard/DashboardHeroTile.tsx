import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import type { CheckerSummary } from '@shared/types/domain';

interface DashboardHeroTileProps {
  summary: CheckerSummary;
  onRunAllNow: () => void;
  onToggleScheduler: () => void;
}

export const DashboardHeroTile: React.FC<DashboardHeroTileProps> = ({
  summary,
  onRunAllNow,
  onToggleScheduler,
}) => {
  const uptimeRate =
    summary.totalDevices > 0
      ? Math.round((summary.upDevices / summary.totalDevices) * 1000) / 10
      : 0;

  const durationSec =
    summary.lastCycleDurationMs !== null
      ? `${(summary.lastCycleDurationMs / 1000).toFixed(1)}초`
      : '-';

  return (
    <section className="bg-[#272729] text-white rounded-[18px] px-6 py-4 flex flex-col justify-between gap-3 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                summary.isCheckingNow
                  ? 'bg-[#2997ff] animate-ping'
                  : summary.isSchedulerRunning
                    ? 'bg-[#2997ff]'
                    : 'bg-[#7a7a7a]'
              }`}
            />
            <span className="text-[12px] font-semibold text-[#2997ff] whitespace-nowrap">
              {summary.isCheckingNow
                ? `실시간 병렬 점검 진행 중 (${summary.checkedProgress} / ${summary.totalDevices}대)`
                : summary.isSchedulerRunning
                  ? `자동 주기 점검 작동 중 (${summary.intervalSec}초 주기)`
                  : '자동 주기 점검 일시정지됨'}
            </span>
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.2] text-white whitespace-nowrap">
            무인교통단속장비 실시간 상태 점검 및 생존신호 관제
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PillButton
            variant="dark-utility"
            size="sm"
            onClick={onRunAllNow}
            disabled={summary.isCheckingNow}
            className="border border-[#3a3a3c]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${summary.isCheckingNow ? 'animate-spin' : ''}`} />
            <span>즉시 전체 점검</span>
          </PillButton>
          <PillButton variant="primary" size="sm" onClick={onToggleScheduler}>
            {summary.isSchedulerRunning ? '자동 점검 일시정지' : '자동 점검 시작'}
          </PillButton>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 pt-3 border-t border-white/10">
        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">전체 등록 장비</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] mt-0.5 whitespace-nowrap">
            {summary.totalDevices.toLocaleString()}
            <span className="text-[12px] font-normal text-[#cccccc] ml-1">대</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">정상 가동 장비</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-[#2997ff] mt-0.5 whitespace-nowrap">
            {summary.upDevices.toLocaleString()}
            <span className="text-[12px] font-normal text-[#cccccc] ml-1">대</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">연결 끊김 (점검 필요)</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-white mt-0.5 whitespace-nowrap">
            {summary.downDevices.toLocaleString()}
            <span className="text-[12px] font-normal text-[#cccccc] ml-1">대</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">원격 데스크톱 / VNC 열림</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-white mt-0.5 whitespace-nowrap">
            {summary.msOpenCount}
            <span className="text-[13px] font-normal text-[#cccccc] mx-1">/</span>
            {summary.vncOpenCount}
            <span className="text-[12px] font-normal text-[#cccccc] ml-1">대</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">센터 생존신호 응답</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-[#2997ff] mt-0.5 whitespace-nowrap">
            {summary.keepAliveSuccessCount.toLocaleString()}
            <span className="text-[12px] font-normal text-[#cccccc] ml-1">대</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#cccccc] whitespace-nowrap">장비 가동률 · 소요시간</div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-white mt-0.5 whitespace-nowrap">
            {uptimeRate}%
            <span className="text-[11px] font-normal text-[#cccccc] ml-1.5">({durationSec})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#cccccc] pt-1">
        <div className="flex items-center gap-4">
          <span>최근 점검 완료: {summary.lastCycleCompletedAt ?? '점검 대기 중'}</span>
          <span>·</span>
          <span>다음 자동 점검 예정: {summary.nextCheckAt ?? '-'}</span>
        </div>
        <div>원격 데스크톱(3389) 또는 원격 제어(5900) 연결 가능 시 정상 가동으로 판정</div>
      </div>
    </section>
  );
};
