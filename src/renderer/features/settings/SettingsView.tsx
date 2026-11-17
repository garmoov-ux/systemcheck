import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, Sparkles } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { KeepAliveSendMode, SystemCheckAppConfig } from '@shared/types/domain';

interface SettingsViewProps {
  config: SystemCheckAppConfig | null;
  onSaveConfig: (nextConfig: SystemCheckAppConfig) => Promise<void>;
  onRunCleanupNow: () => Promise<void>;
}

interface SegmentOption<T> {
  label: string;
  value: T;
}

function SegmentedControl<T extends string | number | boolean>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-[8px] bg-[#e2e8f0] gap-0.5 shrink-0">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              active
                ? 'bg-[#2563eb] text-white font-semibold'
                : 'text-[#334155] hover:text-[#0f172a] font-medium'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const INTERVAL_OPTIONS: SegmentOption<number>[] = [
  { label: '30초', value: 30 },
  { label: '60초', value: 60 },
  { label: '100초', value: 100 },
  { label: '180초', value: 180 },
  { label: '300초', value: 300 },
];

const CONCURRENCY_OPTIONS: SegmentOption<number>[] = [
  { label: '5대', value: 5 },
  { label: '10대', value: 10 },
  { label: '15대', value: 15 },
  { label: '25대', value: 25 },
  { label: '40대', value: 40 },
];

const TIMEOUT_OPTIONS: SegmentOption<number>[] = [
  { label: '2초', value: 2 },
  { label: '3초', value: 3 },
  { label: '5초', value: 5 },
];

const BOOL_OPTIONS: SegmentOption<boolean>[] = [
  { label: '사용함', value: true },
  { label: '사용 안 함', value: false },
];

const SEND_MODE_OPTIONS: SegmentOption<KeepAliveSendMode>[] = [
  { label: '열린 포트별', value: 'per_open_port' },
  { label: '장비당 1회', value: 'once_per_device' },
];

const CLOSE_OPTIONS: SegmentOption<boolean>[] = [
  { label: '트레이 숨김', value: true },
  { label: '완전 종료', value: false },
];

const LOG_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '영구', value: 0 },
];

const DB_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '180일', value: 180 },
  { label: '영구', value: 0 },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onRunCleanupNow,
}) => {
  const [draft, setDraft] = useState<SystemCheckAppConfig | null>(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  if (!draft) {
    return <div className="p-8 text-center text-[#64748b]">설정을 불러오는 중입니다...</div>;
  }

  const handlePickLogDir = async () => {
    const res = await window.systemCheckApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, paths: { ...draft.paths, logDir: res.data } });
    }
  };

  const handlePickVncFile = async () => {
    const res = await window.systemCheckApi.selectFile();
    if (res.success && res.data) {
      setDraft({ ...draft, paths: { ...draft.paths, vncViewerPath: res.data } });
    }
  };

  return (
    <div className="h-full p-3.5 w-full min-h-0 flex flex-col gap-3">
      {/* 상단 설정 저장 액션 바 */}
      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-[15px] font-bold text-[#0f172a] whitespace-nowrap">
            전체 환경 설정 관리
          </h2>
          <span className="text-[12px] text-[#64748b] truncate">
            점검 주기, 병렬 속도, 센터 생존신호 주소 및 보관 기간을 관리합니다.
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void onRunCleanupNow()}>
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>경과 데이터 즉시 정리</span>
          </PillButton>
          <PillButton variant="primary" size="sm" onClick={() => void onSaveConfig(draft)}>
            <Save className="w-3.5 h-3.5" />
            <span>설정 저장</span>
          </PillButton>
        </div>
      </div>

      {/* 본문 2단 그리드 */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        <div className="col-span-6 min-h-0 flex flex-col gap-3">
          <UtilityCard title="주기 점검 및 병렬 속도 설정" className="shrink-0">
            <div className="rounded-[8px] bg-[#f8fafc] border border-[#cbd5e1] divide-y divide-[#e2e8f0]">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">자동 점검 반복 주기</div>
                  <div className="text-[11px] text-[#64748b]">전체 점검 완료 후 다음 점검 대기 시간</div>
                </div>
                <SegmentedControl
                  options={INTERVAL_OPTIONS}
                  value={draft.checker.intervalSec}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      checker: { ...draft.checker, intervalSec: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">동시 병렬 점검 장비 수</div>
                  <div className="text-[11px] text-[#64748b]">여러 장비를 동시에 점검하여 시간 단축</div>
                </div>
                <SegmentedControl
                  options={CONCURRENCY_OPTIONS}
                  value={draft.checker.concurrency}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      checker: { ...draft.checker, concurrency: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">포트 연결 제한 시간</div>
                  <div className="text-[11px] text-[#64748b]">원격 포트(3389/5900) 응답 대기 시간</div>
                </div>
                <SegmentedControl
                  options={TIMEOUT_OPTIONS}
                  value={draft.checker.tcpTimeoutSec}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      checker: { ...draft.checker, tcpTimeoutSec: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">시작 시 자동 점검 실행</div>
                  <div className="text-[11px] text-[#64748b]">실행 즉시 전체 장비 점검 가동</div>
                </div>
                <SegmentedControl
                  options={BOOL_OPTIONS}
                  value={draft.checker.autoStartOnLaunch}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      checker: { ...draft.checker, autoStartOnLaunch: val },
                    })
                  }
                />
              </div>
            </div>
          </UtilityCard>

          <UtilityCard title="로그 및 원격 제어 프로그램 경로" className="flex-1 min-h-0">
            <div className="rounded-[8px] bg-[#f8fafc] border border-[#cbd5e1] divide-y divide-[#e2e8f0]">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-[12.5px] font-semibold text-[#0f172a] w-[108px] shrink-0">
                  로그 기록 폴더
                </span>
                <input
                  type="text"
                  value={draft.paths.logDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: e.target.value } })
                  }
                  placeholder="./log"
                  className="flex-1 min-w-0 h-[28px] px-2.5 rounded-[6px] bg-[#ffffff] border border-[#cbd5e1] text-[12px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: './log' } })
                  }
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>./log</span>
                </PillButton>
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickLogDir()}
                >
                  변경
                </PillButton>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-[12.5px] font-semibold text-[#0f172a] w-[108px] shrink-0">
                  원격 제어 뷰어
                </span>
                <input
                  type="text"
                  value={draft.paths.vncViewerPath}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      paths: { ...draft.paths, vncViewerPath: e.target.value },
                    })
                  }
                  placeholder="비워두면 설치된 뷰어 자동 탐색"
                  className="flex-1 min-w-0 h-[28px] px-2.5 rounded-[6px] bg-[#ffffff] border border-[#cbd5e1] text-[12px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickVncFile()}
                >
                  찾기
                </PillButton>
              </div>
            </div>
          </UtilityCard>
        </div>

        <div className="col-span-6 min-h-0 flex flex-col gap-3">
          <UtilityCard title="센터 생존신호 전송 및 시스템 동작" className="shrink-0">
            <div className="rounded-[8px] bg-[#f8fafc] border border-[#cbd5e1] divide-y divide-[#e2e8f0]">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">센터 생존신호 자동 전송</div>
                  <div className="text-[11px] text-[#64748b]">포트 연결 시 센터 서버로 가동 신호 전송</div>
                </div>
                <SegmentedControl
                  options={BOOL_OPTIONS}
                  value={draft.keepAlive.enabled}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      keepAlive: { ...draft.keepAlive, enabled: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-[12.5px] font-semibold text-[#0f172a] w-[115px] shrink-0">
                  센터 수신 주소
                </span>
                <input
                  type="text"
                  value={draft.keepAlive.url}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      keepAlive: { ...draft.keepAlive, url: e.target.value },
                    })
                  }
                  className="flex-1 min-w-0 h-[28px] px-2.5 rounded-[6px] bg-[#ffffff] border border-[#cbd5e1] text-[12px] font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">생존신호 호출 방식</div>
                  <div className="text-[11px] text-[#64748b]">열린 포트별 또는 장비당 1회 전송</div>
                </div>
                <SegmentedControl
                  options={SEND_MODE_OPTIONS}
                  value={draft.keepAlive.sendMode}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      keepAlive: { ...draft.keepAlive, sendMode: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">창 닫기 버튼 클릭 동작</div>
                  <div className="text-[11px] text-[#64748b]">트레이 우클릭으로 완전 종료 가능</div>
                </div>
                <SegmentedControl
                  options={CLOSE_OPTIONS}
                  value={draft.system.minimizeToTrayOnClose}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      system: { ...draft.system, minimizeToTrayOnClose: val },
                    })
                  }
                />
              </div>
            </div>
          </UtilityCard>

          <UtilityCard
            title="보관 기간 및 자동 삭제"
            className="flex-1 min-h-0"
            bodyClassName="justify-between"
          >
            <div className="rounded-[8px] bg-[#f8fafc] border border-[#cbd5e1] divide-y divide-[#e2e8f0]">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">로그 파일 보관 기간</div>
                  <div className="text-[11px] text-[#64748b]">경과된 일자별 로그 자동 삭제</div>
                </div>
                <SegmentedControl
                  options={LOG_RETENTION_OPTIONS}
                  value={draft.retention.logDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, logDays: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">점검 이력 보관 기간</div>
                  <div className="text-[11px] text-[#64748b]">내장 DB의 오래된 이력 자동 정리</div>
                </div>
                <SegmentedControl
                  options={DB_RETENTION_OPTIONS}
                  value={draft.retention.dbHistoryDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, dbHistoryDays: val },
                    })
                  }
                />
              </div>
            </div>

            <div className="text-[11.5px] text-[#64748b] flex items-center justify-between px-1 pt-1">
              <span>보관 기간 경과 데이터는 매시간 자동 정리됩니다.</span>
              <span className="font-semibold text-[#2563eb]">우측 상단 [설정 저장] 클릭 시 반영</span>
            </div>
          </UtilityCard>
        </div>
      </div>
    </div>
  );
};
