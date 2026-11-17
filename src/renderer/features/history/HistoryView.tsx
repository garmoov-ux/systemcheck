import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, RefreshCw } from 'lucide-react';
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
      limit: 300,
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
      } else if (sortKey === 'pingOk' || sortKey === 'msPortOpen' || sortKey === 'keepAliveOk') {
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
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563eb]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563eb]" />
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
    <div className="h-full p-3.5 w-full flex flex-col gap-3 min-h-0">
      {/* 방법 A: 상단 필터 및 제어 바 */}
      <section className="bg-[#ffffff] rounded-[10px] border border-[#cbd5e1] px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 shrink-0">
          <OptionChip label="전체 상태" selected={status === 'ALL'} onClick={() => setStatus('ALL')} />
          <OptionChip label="정상 가동" selected={status === 'Up'} onClick={() => setStatus('Up')} />
          <OptionChip label="연결 끊김" selected={status === 'Down'} onClick={() => setStatus('Down')} />
          <span className="h-4 w-px bg-[#cbd5e1] mx-1" />
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

        <div className="flex items-center gap-1.5 shrink-0">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="장비번호 · 현장명 · IP 검색"
            className="w-[205px]"
          />
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchHistory()}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새로고침</span>
          </PillButton>
          <PillButton variant="secondary-pill" size="sm" onClick={() => void handleExport()}>
            <Download className="w-3.5 h-3.5" />
            <span>CSV 내보내기</span>
          </PillButton>
        </div>
      </section>

      {/* 방법 A: 단일 보더 이력 테이블 */}
      <section className="flex-1 min-h-0 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col">
        <div className="px-3.5 py-2 border-b border-[#cbd5e1] flex items-center justify-between shrink-0">
          <h2 className="text-[14px] font-bold text-[#0f172a]">장비 점검 및 생존신호 전송 이력</h2>
          <span className="text-[11.5px] text-[#64748b]">
            총 <strong className="text-[#0f172a]">{totalCount.toLocaleString()}</strong>건 조회됨
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] border-b border-[#cbd5e1] text-[12px] font-semibold text-[#334155] z-10">
              <tr>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkedAt')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>점검 시각</span>
                    {renderSortIcon('checkedAt')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceId')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceId')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비명 (현장 위치)</span>
                    {renderSortIcon('deviceName')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('ip')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>IP 주소</span>
                    {renderSortIcon('ip')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('pingOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>응답 확인</span>
                    {renderSortIcon('pingOk')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('msPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>원격 포트 (3389 / 5900)</span>
                    {renderSortIcon('msPortOpen')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('latencyMs')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>지연</span>
                    {renderSortIcon('latencyMs')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('keepAliveOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>생존신호</span>
                    {renderSortIcon('keepAliveOk')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>최종 판정</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#64748b]">
                    조회된 점검 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedItems.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fafc]">
                    <td className="py-1.5 px-3 text-[11.5px] text-[#64748b] font-mono whitespace-nowrap">
                      {row.checkedAt}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-[#0f172a] whitespace-nowrap">
                      {row.deviceId}
                    </td>
                    <td
                      className="py-1.5 px-3 text-[#334155] font-medium max-w-[180px] truncate"
                      title={row.deviceName || '-'}
                    >
                      {row.deviceName || '-'}
                    </td>
                    <td className="py-1.5 px-3 text-[#334155] font-mono text-[12px] whitespace-nowrap">
                      {row.ip}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span
                        className={row.pingOk ? 'text-[#2563eb] font-semibold' : 'text-[#64748b]'}
                      >
                        {row.pingOk ? '정상' : '미응답'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap text-[12px]">
                      <span className={row.msPortOpen ? 'text-[#2563eb] font-semibold' : 'text-[#94a3b8]'}>
                        RDP:{row.msPortOpen ? '열림' : '닫힘'}
                      </span>
                      <span className="text-[#cbd5e1] mx-1">·</span>
                      <span className={row.vncPortOpen ? 'text-[#2563eb] font-semibold' : 'text-[#94a3b8]'}>
                        VNC:{row.vncPortOpen ? '열림' : '닫힘'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[12px] text-[#475569] font-mono whitespace-nowrap">
                      {row.latencyMs !== null ? `${row.latencyMs}ms` : '-'}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      {row.keepAliveOk ? (
                        <span className="text-[#059669] font-semibold">
                          성공({row.keepAliveCode ?? 200})
                        </span>
                      ) : (
                        <span className="text-[#64748b]">
                          {row.keepAliveCode ? `실패(${row.keepAliveCode})` : '대기'}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold border ${
                          row.status === 'Up'
                            ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                            : 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
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
      </section>
    </div>
  );
};
