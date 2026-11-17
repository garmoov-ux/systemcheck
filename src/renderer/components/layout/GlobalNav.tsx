import React from 'react';
import {
  Activity,
  Database,
  Pause,
  Play,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'devices' | 'history' | 'settings';

interface GlobalNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSchedulerRunning: boolean;
  isCheckingNow: boolean;
  onToggleScheduler: () => void;
  onRunAllNow: () => void;
}

const TABS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '실시간 점검 현황', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'devices', label: '장비 목록 관리', icon: <Server className="w-3.5 h-3.5" /> },
  { id: 'history', label: '점검 이력 조회', icon: <Database className="w-3.5 h-3.5" /> },
  { id: 'settings', label: '환경 설정', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const GlobalNav: React.FC<GlobalNavProps> = ({
  activeTab,
  onSelectTab,
  isSchedulerRunning,
  isCheckingNow,
  onToggleScheduler,
  onRunAllNow,
}) => {
  return (
    <header className="h-[48px] bg-[#000000] text-white px-5 flex items-center justify-between gap-4 shrink-0 select-none border-b border-[#272729]">
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-2 font-semibold text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#2997ff]" />
          <span>단속장비 상태 점검기</span>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                className={`h-[32px] px-3.5 rounded-full text-[13px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-[#0066cc] text-white font-semibold'
                    : 'text-[#cccccc] hover:text-white font-normal'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 우측 원형 아이콘 컨트롤 클러스터 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRunAllNow}
          disabled={isCheckingNow}
          title="전체 장비 즉시 점검 실행"
          aria-label="전체 장비 즉시 점검 실행"
          className="w-[34px] h-[34px] rounded-full bg-[#1d1d1f] hover:bg-[#2a2a2c] text-[#cccccc] hover:text-white flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer border border-[#3a3a3c] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#2997ff] ${isCheckingNow ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onToggleScheduler}
          title={
            isSchedulerRunning
              ? '자동 주기 점검 작동 중 (클릭 시 일시정지)'
              : '자동 주기 점검 시작'
          }
          aria-label={isSchedulerRunning ? '자동 주기 점검 일시정지' : '자동 주기 점검 시작'}
          className={`relative w-[34px] h-[34px] rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer ${
            isSchedulerRunning
              ? 'bg-[#272729] text-[#2997ff] border border-[#2997ff]/50'
              : 'bg-[#0066cc] text-white'
          }`}
        >
          {isSchedulerRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2997ff] border-2 border-[#000000] animate-pulse" />
            </>
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>
    </header>
  );
};
