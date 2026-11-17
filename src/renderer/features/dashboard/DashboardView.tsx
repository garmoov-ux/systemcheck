import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Monitor, RefreshCw, Tv } from 'lucide-react';
import { DashboardHeroTile } from './DashboardHeroTile';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import { PillButton } from '../../components/ui/PillButton';
import type { CheckerSummary, DeviceRecord } from '@shared/types/domain';

interface DashboardViewProps {
  summary: CheckerSummary;
  devices: DeviceRecord[];
  checkingDeviceId: string | null;
  onRunAllNow: () => void;
  onRunSingleDevice: (deviceId: string) => void;
  onConnectMstsc: (ip: string, portMS: number) => void;
  onConnectVnc: (ip: string, portVNC: number) => void;
}

type SortKey =
  | 'status'
  | 'deviceId'
  | 'deviceName'
  | 'ip'
  | 'latencyMs'
  | 'msPortOpen'
  | 'keepAliveOk'
  | 'checkTime';

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  devices,
  checkingDeviceId,
  onRunAllNow,
  onRunSingleDevice,
  onConnectMstsc,
  onConnectVnc,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Up' | 'Down'>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('deviceId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredAndSortedDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = devices.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (
        q &&
        !d.deviceId.toLowerCase().includes(q) &&
        !(d.deviceName || '').toLowerCase().includes(q) &&
        !d.ip.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'latencyMs') {
        const la = a.latencyMs ?? 999999;
        const lb = b.latencyMs ?? 999999;
        cmp = la - lb;
      } else if (sortKey === 'msPortOpen' || sortKey === 'keepAliveOk') {
        cmp = a[sortKey] - b[sortKey];
      } else {
        cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'ko', {
          numeric: true,
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [devices, statusFilter, search, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563eb]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563eb]" />
    );
  };

  return (
    <div className="h-full p-3.5 w-full flex flex-col gap-3 min-h-0">
      <DashboardHeroTile summary={summary} />

      {/* 방법 A: 단일 보더 테이블 시트 */}
      <section className="flex-1 min-h-0 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col">
        <div className="px-3.5 py-2.5 border-b border-[#cbd5e1] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-[14.5px] font-bold text-[#0f172a] whitespace-nowrap">
              장비별 실시간 연결 상태 및 원격 접속
            </h2>
            <span className="text-[12px] text-[#64748b] whitespace-nowrap">
              표시 <strong className="text-[#0f172a]">{filteredAndSortedDevices.length}</strong>대
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <OptionChip
              label="전체"
              count={devices.length}
              selected={statusFilter === 'ALL'}
              onClick={() => setStatusFilter('ALL')}
            />
            <OptionChip
              label="정상 가동"
              count={summary.upDevices}
              selected={statusFilter === 'Up'}
              onClick={() => setStatusFilter('Up')}
            />
            <OptionChip
              label="연결 끊김"
              count={summary.downDevices}
              selected={statusFilter === 'Down'}
              onClick={() => setStatusFilter('Down')}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="장비번호 · 현장명 · IP 검색"
              className="w-[205px]"
            />
            <PillButton
              variant="primary"
              size="sm"
              disabled={summary.isCheckingNow}
              onClick={onRunAllNow}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${summary.isCheckingNow ? 'animate-spin' : ''}`} />
              <span>전체 점검</span>
            </PillButton>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] border-b border-[#cbd5e1] text-[12px] font-semibold text-[#334155] z-10">
              <tr>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceId')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceId')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비명 (현장 위치)</span>
                    {renderSortIcon('deviceName')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('ip')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>IP 주소</span>
                    {renderSortIcon('ip')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('latencyMs')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>응답 확인</span>
                    {renderSortIcon('latencyMs')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('msPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>원격 포트 (3389 / 5900)</span>
                    {renderSortIcon('msPortOpen')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('keepAliveOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>생존신호</span>
                    {renderSortIcon('keepAliveOk')}
                  </button>
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>최종 점검 시각</span>
                    {renderSortIcon('checkTime')}
                  </button>
                </th>
                <th className="py-2 px-2.5 text-right whitespace-nowrap">원격 접속 · 점검</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {filteredAndSortedDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#64748b]">
                    조건에 해당하는 단속장비가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAndSortedDevices.map((item) => {
                  const isUp = item.status === 'Up';
                  const isSingleChecking = checkingDeviceId === item.deviceId;
                  return (
                    <tr key={item.deviceId} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold border ${
                            isUp
                              ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                              : 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
                          }`}
                        >
                          {isUp ? '정상 가동' : '연결 끊김'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-[#0f172a] whitespace-nowrap">
                        {item.deviceId}
                      </td>
                      <td
                        className="py-1.5 px-2.5 text-[#334155] font-medium max-w-[180px] truncate"
                        title={item.deviceName || '-'}
                      >
                        {item.deviceName || '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-[#334155] font-mono text-[12px] whitespace-nowrap">
                        {item.ip}
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap text-[12px]">
                        <span
                          className={
                            item.pingOk ? 'text-[#2563eb] font-semibold' : 'text-[#64748b]'
                          }
                        >
                          {item.pingOk ? '정상' : '미응답'}
                        </span>
                        {item.latencyMs !== null && (
                          <span className="text-[11px] text-[#64748b] ml-1">
                            ({item.latencyMs}ms)
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap text-[12px]">
                        <span
                          className={
                            item.msPortOpen ? 'text-[#2563eb] font-semibold' : 'text-[#94a3b8]'
                          }
                        >
                          RDP:{item.msPortOpen ? '열림' : '닫힘'}
                        </span>
                        <span className="text-[#cbd5e1] mx-1">·</span>
                        <span
                          className={
                            item.vncPortOpen ? 'text-[#2563eb] font-semibold' : 'text-[#94a3b8]'
                          }
                        >
                          VNC:{item.vncPortOpen ? '열림' : '닫힘'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap text-[12px]">
                        {item.keepAliveOk ? (
                          <span className="text-[#059669] font-semibold">
                            성공({item.keepAliveCode ?? 200})
                          </span>
                        ) : (
                          <span className="text-[#64748b]">
                            {item.keepAliveCode ? `실패(${item.keepAliveCode})` : '대기'}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-[11.5px] text-[#64748b] font-mono whitespace-nowrap">
                        {item.checkTime ? item.checkTime.slice(5) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onConnectMstsc(item.ip, item.portMS)}
                            title={`${item.deviceId} 원격 데스크톱 (${item.ip}:${item.portMS})`}
                            className="h-[24px] px-2 rounded-[5px] bg-[#f8fafc] hover:bg-[#2563eb] hover:text-white border border-[#cbd5e1] text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Monitor className="w-3 h-3" />
                            <span>데스크톱</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onConnectVnc(item.ip, item.portVNC)}
                            title={`${item.deviceId} 원격 제어 (${item.ip}:${item.portVNC})`}
                            className="h-[24px] px-2 rounded-[5px] bg-[#f8fafc] hover:bg-[#2563eb] hover:text-white border border-[#cbd5e1] text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Tv className="w-3 h-3" />
                            <span>원격제어</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRunSingleDevice(item.deviceId)}
                            disabled={isSingleChecking}
                            title={`${item.deviceId} 개별 즉시 점검`}
                            className="w-[24px] h-[24px] rounded-[5px] bg-[#f8fafc] hover:bg-[#e2e8f0] border border-[#cbd5e1] text-[#334155] inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isSingleChecking ? 'animate-spin text-[#2563eb]' : ''}`}
                            />
                          </button>
                        </div>
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
