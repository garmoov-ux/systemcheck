import React from 'react';
import {
  Activity,
  BarChart3,
  Database,
  Info,
  Pause,
  Play,
  RefreshCw,
  ScrollText,
  Server,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'devices'
  | 'history'
  | 'stats'
  | 'logs'
  | 'settings'
  | 'about';

interface GlobalNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSchedulerRunning: boolean;
  isCheckingNow: boolean;
  onToggleScheduler: () => void;
  onRunAllNow: () => void;
}

const TABS: { id: NavTab; label: string; title: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: '현황',
    title: '실시간 장비 상태 점검 및 원격 접속',
    icon: <Activity className="w-[17px] h-[17px]" />,
  },
  {
    id: 'devices',
    label: '장비',
    title: '단속장비 현장 목록 등록·수정 및 CSV 관리',
    icon: <Server className="w-[17px] h-[17px]" />,
  },
  {
    id: 'history',
    label: '이력',
    title: '상태 점검 및 생존신호 전송 이력 조회',
    icon: <Database className="w-[17px] h-[17px]" />,
  },
  {
    id: 'stats',
    label: '통계',
    title: '월별 가동률 통계 차트 및 PDF 보고서 출력',
    icon: <BarChart3 className="w-[17px] h-[17px]" />,
  },
  {
    id: 'logs',
    label: '로그',
    title: '실시간 운용 로그 조회 및 검색',
    icon: <ScrollText className="w-[17px] h-[17px]" />,
  },
  {
    id: 'settings',
    label: '설정',
    title: '주기 점검·병렬 수·생존신호 및 보관 기간 설정',
    icon: <Settings className="w-[17px] h-[17px]" />,
  },
  {
    id: 'about',
    label: '정보',
    title: '프로그램 정보 · 버전 기록 · 유지보수 도구',
    icon: <Info className="w-[17px] h-[17px]" />,
  },
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
    <aside className="w-[66px] h-full bg-[#0f172a] text-slate-300 border-r border-[#1e293b] flex flex-col items-center justify-between py-2.5 shrink-0 select-none">
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => onSelectTab('about')}
          title="SystemCheck 프로그램 정보"
          className="relative w-[48px] h-[34px] rounded-[8px] bg-[#1e293b] hover:bg-[#334155] border border-[#334155] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <span className="text-[11.5px] font-extrabold tracking-tight text-white leading-none">
            Sys<span className="text-[#34d399]">Chk</span>
          </span>
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${
              isSchedulerRunning ? 'bg-[#10b981] animate-pulse' : 'bg-[#f59e0b]'
            }`}
          />
        </button>

        <div className="w-8 h-[1px] bg-[#1e293b]" />

        <nav className="flex flex-col items-center gap-1 w-full px-1.5">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={t.title}
                onClick={() => onSelectTab(t.id)}
                className={`w-full py-1.5 rounded-[7px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-[#2563eb] text-white font-semibold'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-100 font-normal'
                }`}
              >
                {t.icon}
                <span className="text-[10.5px] leading-none">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        <div className="w-8 h-[1px] bg-[#1e293b] mb-0.5" />

        <button
          type="button"
          onClick={onToggleScheduler}
          title={
            isSchedulerRunning
              ? '자동 주기 점검 작동 중 (클릭 시 일시정지)'
              : '자동 주기 점검 시작'
          }
          className={`w-full py-1.5 rounded-[7px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer border ${
            isSchedulerRunning
              ? 'bg-[#064e3b]/60 text-[#34d399] border-[#059669]/60 hover:bg-[#064e3b]'
              : 'bg-[#1e293b] text-[#fbbf24] border-[#475569] hover:bg-[#334155]'
          }`}
        >
          {isSchedulerRunning ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
          <span className="text-[10px] font-medium leading-none">
            {isSchedulerRunning ? '점검중' : '정지됨'}
          </span>
        </button>

        <button
          type="button"
          onClick={onRunAllNow}
          disabled={isCheckingNow}
          title="전체 장비 즉시 점검 실행"
          className="w-full py-1.5 rounded-[7px] bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#38bdf8] ${isCheckingNow ? 'animate-spin' : ''}`}
          />
          <span className="text-[10px] leading-none">즉시점검</span>
        </button>
      </div>
    </aside>
  );
};
