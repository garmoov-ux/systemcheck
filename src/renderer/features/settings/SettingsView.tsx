import React, { useState, useEffect } from 'react';
import { Save, Sparkles } from 'lucide-react';
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
    <div className="inline-flex items-center p-1 rounded-[10px] bg-[#e8e8ed] gap-0.5 shrink-0">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-[28px] px-3 rounded-[8px] text-[12px] whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              active
                ? 'bg-[#0066cc] text-white font-semibold'
                : 'text-[#333333] hover:text-[#1d1d1f] font-normal'
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
  { label: '열린 포트별 전송', value: 'per_open_port' },
  { label: '장비당 1회 전송', value: 'once_per_device' },
];

const CLOSE_OPTIONS: SegmentOption<boolean>[] = [
  { label: '트레이로 숨김', value: true },
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
    return <div className="p-8 text-center text-[#7a7a7a]">설정을 불러오는 중입니다...</div>;
  }

  const handlePickCheckDir = async () => {
    const res = await window.systemCheckApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, paths: { ...draft.paths, checkDir: res.data } });
    }
  };

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
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto min-h-0 grid grid-cols-12 gap-4">
      {/* 좌측: 주기 점검 속도 설정 + 파일 및 원격 제어기 경로 */}
      <div className="col-span-6 min-h-0 flex flex-col gap-4">
        <UtilityCard title="주기 점검 및 병렬 속도 설정" className="shrink-0">
          <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  자동 점검 반복 주기
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  전체 장비 점검 완료 후 다음 점검까지의 대기 시간
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  동시 병렬 점검 장비 수
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  여러 장비를 동시에 점검하여 전체 소요 시간 단축
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  포트 연결 제한 시간
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  원격 데스크톱(3389) 및 VNC(5900) 응답 대기 시간
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  프로그램 시작 시 자동 점검 실행
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  실행 즉시 전체 장비 상태 점검 및 주기 타이머 가동
                </div>
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

        <UtilityCard
          title="파일 및 원격 제어기 경로"
          className="flex-1 min-h-0"
          bodyClassName="justify-between"
        >
          <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[135px] shrink-0">
                장비 목록 폴더
              </span>
              <input
                type="text"
                value={draft.paths.checkDir}
                onChange={(e) =>
                  setDraft({ ...draft, paths: { ...draft.paths, checkDir: e.target.value } })
                }
                className="flex-1 min-w-0 h-[30px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[12px]"
              />
              <PillButton
                variant="pearl-capsule"
                size="sm"
                onClick={() => void handlePickCheckDir()}
              >
                변경
              </PillButton>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[135px] shrink-0">
                로그 기록 폴더
              </span>
              <input
                type="text"
                value={draft.paths.logDir}
                onChange={(e) =>
                  setDraft({ ...draft, paths: { ...draft.paths, logDir: e.target.value } })
                }
                className="flex-1 min-w-0 h-[30px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[12px]"
              />
              <PillButton
                variant="pearl-capsule"
                size="sm"
                onClick={() => void handlePickLogDir()}
              >
                변경
              </PillButton>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[135px] shrink-0">
                VNC 뷰어 실행 파일
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
                placeholder="비워두면 내장/설치된 TightVNC 자동 탐색"
                className="flex-1 min-w-0 h-[30px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[12px]"
              />
              <PillButton
                variant="pearl-capsule"
                size="sm"
                onClick={() => void handlePickVncFile()}
              >
                찾아보기
              </PillButton>
            </div>
          </div>

          <div className="text-[12px] text-[#7a7a7a] px-1 pt-2">
            원격 데스크톱(3389)은 윈도우 기본 내장 클라이언트(mstsc.exe)로 즉시 실행됩니다.
          </div>
        </UtilityCard>
      </div>

      {/* 우측: 센터 생존신호·시스템 동작 + 보관 기간·자동 삭제 */}
      <div className="col-span-6 min-h-0 flex flex-col gap-4">
        <UtilityCard
          title="센터 생존신호 전송 및 시스템 동작"
          rightAction={
            <PillButton variant="primary" size="sm" onClick={() => void onSaveConfig(draft)}>
              <Save className="w-3.5 h-3.5" />
              <span>설정 저장</span>
            </PillButton>
          }
          className="shrink-0"
        >
          <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  센터 생존신호 자동 전송
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  포트 연결 성공 시 센터 서버로 장비 가동 신호 전송
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[140px] shrink-0">
                센터 수신 서버 주소
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
                className="flex-1 min-w-0 h-[30px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[12px]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  생존신호 호출 방식
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  열린 포트마다 전송(기존 호환) 또는 장비당 1회 전송
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  창 닫기 버튼 클릭 시 동작
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  트레이 아이콘 우클릭으로 완전 종료 가능
                </div>
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
          rightAction={
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void onRunCleanupNow()}>
              <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>지금 정리</span>
            </PillButton>
          }
          className="flex-1 min-h-0"
          bodyClassName="justify-between"
        >
          <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  일자별 로그 파일 보관 기간
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  보관 기간 경과 로그 파일 자동 삭제
                </div>
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

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  장비 점검 이력 보관 기간
                </div>
                <div className="text-[11px] text-[#7a7a7a] whitespace-nowrap">
                  내장 데이터베이스의 오래된 점검 이력 자동 정리
                </div>
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

          <div className="text-[12px] text-[#7a7a7a] flex items-center justify-between px-1 pt-2">
            <span>보관 기간이 지난 파일과 이력은 매시간 자동으로 정리됩니다.</span>
            <span className="font-semibold text-[#333333]">설정 변경 후 [설정 저장] 클릭</span>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
};
