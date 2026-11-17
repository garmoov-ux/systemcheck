import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FolderOpen, RefreshCw, Radio } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import type { LogEntry } from '@shared/types/domain';

interface RealtimeLogsViewProps {
  logDir: string;
  onStatusMessage: (msg: string) => void;
}

const CATEGORIES = ['ALL', '시스템점검', '장비상세'] as const;
const LEVELS = ['ALL', '정보', '주의', '오류'] as const;

export const RealtimeLogsView: React.FC<RealtimeLogsViewProps> = ({
  logDir,
  onStatusMessage,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (typeof window.systemCheckApi.getRecentLogs !== 'function') return;
    const res = await window.systemCheckApi.getRecentLogs(400);
    if (res.success && res.data) {
      setLogs(res.data);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      void fetchLogs();
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchLogs, autoRefresh]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (level !== 'ALL' && item.level !== level) return false;
      if (q && !item.message.toLowerCase().includes(q) && !item.fileName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [logs, category, level, search]);

  const handleOpenLogFolder = async () => {
    if (typeof window.systemCheckApi.openFolderPath !== 'function') return;
    const res = await window.systemCheckApi.openFolderPath(logDir || './log');
    if (res.success && res.data) {
      onStatusMessage(`로그 폴더를 열었습니다: ${res.data.opened}`);
    }
  };

  return (
    <div className="h-full p-3.5 w-full min-h-0 flex flex-col gap-3">
      {/* 방법 A: 상단 필터 및 제어 바 */}
      <section className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[15px] font-bold text-[#0f172a] whitespace-nowrap">
              실시간 운용 로그
            </h2>
            <span className="text-[12px] text-[#64748b] whitespace-nowrap">
              표시 <strong className="text-[#0f172a] font-semibold">{filteredLogs.length}</strong>건 (로그 저장 경로: {logDir})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <PillButton
              variant={autoRefresh ? 'secondary-pill' : 'pearl-capsule'}
              size="sm"
              onClick={() => setAutoRefresh((prev) => !prev)}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-[#2563eb] animate-pulse' : 'text-[#64748b]'}`} />
              <span>{autoRefresh ? '자동갱신 켜짐(3초)' : '자동갱신 꺼짐'}</span>
            </PillButton>
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchLogs()}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </PillButton>
            <PillButton variant="dark-utility" size="sm" onClick={() => void handleOpenLogFolder()}>
              <FolderOpen className="w-3.5 h-3.5" />
              <span>로그 폴더 열기</span>
            </PillButton>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#e2e8f0]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="로그 메시지 · 장비번호 · IP 검색"
            className="w-[260px] shrink-0"
          />

          <div className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <OptionChip key={cat} selected={category === cat} onClick={() => setCategory(cat)}>
                {cat === 'ALL' ? '전체 구분' : cat}
              </OptionChip>
            ))}
            <span className="mx-1 text-[#cbd5e1]">|</span>
            {LEVELS.map((lv) => (
              <OptionChip key={lv} selected={level === lv} onClick={() => setLevel(lv)}>
                {lv === 'ALL' ? '전체 수준' : lv}
              </OptionChip>
            ))}
          </div>
        </div>
      </section>

      {/* 방법 A: 하단 단일 테두리 로그 테이블 시트 */}
      <section className="flex-1 min-h-0 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] z-10 border-b border-[#cbd5e1] text-[#334155] text-[12px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap w-[148px]">기록 시각</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap w-[88px]">구분</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap w-[72px]">수준</th>
                <th className="py-2.5 px-3 font-semibold">상세 로그 내용</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right w-[170px]">로그 파일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#64748b]">
                    조건에 해당하는 로그 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const levelBadge =
                    entry.level === '오류'
                      ? 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
                      : entry.level === '주의'
                        ? 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
                        : 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';

                  return (
                    <tr key={entry.id} className="hover:bg-[#f8fafc] align-top">
                      <td className="py-2 px-3 text-[12px] text-[#64748b] whitespace-nowrap font-mono">
                        {entry.timestamp}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-semibold text-[#334155]">
                        {entry.category}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border ${levelBadge}`}
                        >
                          {entry.level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#0f172a] break-all leading-relaxed">
                        {entry.message}
                      </td>
                      <td className="py-2 px-3 text-[11.5px] text-[#64748b] text-right whitespace-nowrap font-mono">
                        {entry.fileName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
