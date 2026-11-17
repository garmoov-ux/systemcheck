import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, RefreshCw } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import { PillButton } from '../../components/ui/PillButton';
import type { CheckHistoryRecord, HistoryQueryFilter } from '@shared/types/domain';

type SortKey =
  | 'checkedAt'
  | 'deviceId'
  | 'deviceName'
  | 'ip'
  | 'pingOk'
  | 'msPortOpen'
  | 'vncPortOpen'
  | 'latencyMs'
  | 'keepAliveOk'
  | 'status';

export const HistoryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'Up' | 'Down'>('ALL');
  const [keepAlive, setKeepAlive] = useState<'ALL' | 'OK' | 'FAIL'>('ALL');
  const [items, setItems] = useState<CheckHistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('checkedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchHistory = useCallback(async () => {
    const filter: HistoryQueryFilter = {
      search,
      status,
      keepAlive,
      limit: 250,
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'latencyMs') {
        cmp = (a.latencyMs ?? 999999) - (b.latencyMs ?? 999999);
      } else if (
        sortKey === 'pingOk' ||
        sortKey === 'msPortOpen' ||
        sortKey === 'vncPortOpen' ||
        sortKey === 'keepAliveOk'
      ) {
        cmp = a[sortKey] - b[sortKey];
      } else {
        cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'ko', {
          numeric: true,
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-[#b0b0b5]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0066cc]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0066cc]" />
    );
  };

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
            placeholder="장비번호 · 장비명 · IP 검색..."
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
          <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {totalCount.toLocaleString()}건 조회됨 (컬럼 헤더 클릭 시 정렬)
          </span>
        }
        className="flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[13px] font-semibold text-[#333333] z-10">
              <tr>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkedAt')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>점검 시각</span>
                    {renderSortIcon('checkedAt')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceId')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceId')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비명</span>
                    {renderSortIcon('deviceName')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('ip')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>IP 주소</span>
                    {renderSortIcon('ip')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('pingOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>응답 확인</span>
                    {renderSortIcon('pingOk')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('msPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 데스크톱 포트</span>
                    {renderSortIcon('msPortOpen')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('vncPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 제어 포트</span>
                    {renderSortIcon('vncPortOpen')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('latencyMs')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>응답 지연</span>
                    {renderSortIcon('latencyMs')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('keepAliveOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>센터 생존신호</span>
                    {renderSortIcon('keepAliveOk')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>최종 판정</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[14px] bg-[#ffffff]">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#7a7a7a]">
                    조회된 점검 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedItems.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-2 px-3.5 text-[13px] text-[#7a7a7a] whitespace-nowrap">
                      {row.checkedAt}
                    </td>
                    <td className="py-2 px-3.5 font-semibold text-[#1d1d1f] whitespace-nowrap">
                      {row.deviceId}
                    </td>
                    <td
                      className="py-2 px-3.5 text-[#333333] max-w-[140px] truncate"
                      title={row.deviceName || '-'}
                    >
                      {row.deviceName || '-'}
                    </td>
                    <td className="py-2 px-3.5 text-[#333333] whitespace-nowrap">{row.ip}</td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className={row.pingOk ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}>
                        {row.pingOk ? '정상' : '응답 없음'}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className={row.msPortOpen ? 'text-[#0066cc] font-medium' : 'text-[#7a7a7a]'}>
                        {row.msPortOpen ? `성공 (${row.portMS})` : `실패 (${row.portMS})`}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className={row.vncPortOpen ? 'text-[#0066cc] font-medium' : 'text-[#7a7a7a]'}>
                        {row.vncPortOpen ? `성공 (${row.portVNC})` : `실패 (${row.portVNC})`}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-[13px] text-[#7a7a7a] whitespace-nowrap">
                      {row.latencyMs !== null ? `${row.latencyMs}ms` : '-'}
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
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
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
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
