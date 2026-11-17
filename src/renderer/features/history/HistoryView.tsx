import React, { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import { PillButton } from '../../components/ui/PillButton';
import type { CheckHistoryRecord, HistoryQueryFilter } from '@shared/types/domain';

export const HistoryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'Up' | 'Down'>('ALL');
  const [keepAlive, setKeepAlive] = useState<'ALL' | 'OK' | 'FAIL'>('ALL');
  const [items, setItems] = useState<CheckHistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = useCallback(async () => {
    const filter: HistoryQueryFilter = {
      search,
      status,
      keepAlive,
      limit: 200,
      offset: 0,
    };
    const res = await window.systemCheckApi.queryHistory(filter);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotalCount(res.data.totalCount);
    }
  }, [search, status, keepAlive]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleExport = async () => {
    await window.systemCheckApi.exportHistoryCsv({
      search,
      status,
      keepAlive,
    });
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto flex flex-col gap-4 min-h-0">
      <section className="bg-[#ffffff] rounded-[18px] border border-[#e0e0e0] px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <OptionChip
            label="전체 상태"
            selected={status === 'ALL'}
            onClick={() => setStatus('ALL')}
          />
          <OptionChip
            label="정상 가동"
            selected={status === 'Up'}
            onClick={() => setStatus('Up')}
          />
          <OptionChip
            label="연결 끊김"
            selected={status === 'Down'}
            onClick={() => setStatus('Down')}
          />
          <span className="h-4 w-px bg-[#e0e0e0] mx-1" />
          <OptionChip
            label="생존신호 전체"
            selected={keepAlive === 'ALL'}
            onClick={() => setKeepAlive('ALL')}
          />
          <OptionChip
            label="생존신호 성공"
            selected={keepAlive === 'OK'}
            onClick={() => setKeepAlive('OK')}
          />
          <OptionChip
            label="생존신호 실패"
            selected={keepAlive === 'FAIL'}
            onClick={() => setKeepAlive('FAIL')}
          />
        </div>

        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="장비번호 또는 IP 주소 검색..."
            className="w-[240px]"
          />
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchHistory()}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>목록 새로고침</span>
          </PillButton>
          <PillButton variant="secondary-pill" size="sm" onClick={() => void handleExport()}>
            <Download className="w-3.5 h-3.5" />
            <span>이력 파일 저장</span>
          </PillButton>
        </div>
      </section>

      <UtilityCard
        title="장비 점검 및 생존신호 전송 이력"
        badge={
          <span className="text-[12px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {totalCount.toLocaleString()}건 조회됨 (최근 200건 표시)
          </span>
        }
        className="flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[12px] font-semibold text-[#333333] z-10">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">점검 시각</th>
                <th className="py-2.5 px-4 whitespace-nowrap">장비번호</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IP 주소</th>
                <th className="py-2.5 px-4 whitespace-nowrap">응답 확인</th>
                <th className="py-2.5 px-4 whitespace-nowrap">원격 데스크톱 연결</th>
                <th className="py-2.5 px-4 whitespace-nowrap">원격 제어(VNC) 연결</th>
                <th className="py-2.5 px-4 whitespace-nowrap">응답 지연</th>
                <th className="py-2.5 px-4 whitespace-nowrap">센터 생존신호</th>
                <th className="py-2.5 px-4 whitespace-nowrap">최종 판정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[13px] bg-[#ffffff]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#7a7a7a]">
                    조회된 점검 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-2 px-4 text-[12px] text-[#7a7a7a] whitespace-nowrap">
                      {row.checkedAt}
                    </td>
                    <td className="py-2 px-4 font-semibold text-[#1d1d1f] whitespace-nowrap">
                      {row.deviceId}
                    </td>
                    <td className="py-2 px-4 text-[#333333] whitespace-nowrap">{row.ip}</td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className={row.pingOk ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}>
                        {row.pingOk ? '정상' : '응답 없음'}
                      </span>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className={row.msPortOpen ? 'text-[#0066cc] font-medium' : 'text-[#7a7a7a]'}>
                        {row.msPortOpen ? `성공 (${row.portMS})` : `실패 (${row.portMS})`}
                      </span>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className={row.vncPortOpen ? 'text-[#0066cc] font-medium' : 'text-[#7a7a7a]'}>
                        {row.vncPortOpen ? `성공 (${row.portVNC})` : `실패 (${row.portVNC})`}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-[12px] text-[#7a7a7a] whitespace-nowrap">
                      {row.latencyMs !== null ? `${row.latencyMs}ms` : '-'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {row.keepAliveOk ? (
                        <span className="text-[#0066cc] font-medium">
                          전송 성공 ({row.keepAliveCode ?? 200})
                        </span>
                      ) : (
                        <span className="text-[#7a7a7a]">
                          {row.keepAliveCode ? `실패 (${row.keepAliveCode})` : '미전송'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.status === 'Up'
                            ? 'bg-[#0066cc]/10 text-[#0066cc]'
                            : 'bg-[#272729] text-white'
                        }`}
                      >
                        {row.status === 'Up' ? '정상 가동' : '연결 끊김'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </UtilityCard>
    </div>
  );
};
