import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Monitor, RefreshCw, Tv } from 'lucide-react';
import { DashboardHeroTile } from './DashboardHeroTile';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import type { CheckerSummary, DeviceRecord } from '@shared/types/domain';

interface DashboardViewProps {
  summary: CheckerSummary;
  devices: DeviceRecord[];
  checkingDeviceId: string | null;
  onRunAllNow: () => void;
  onToggleScheduler: () => void;
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
  | 'vncPortOpen'
  | 'keepAliveOk'
  | 'checkTime';

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  devices,
  checkingDeviceId,
  onRunAllNow,
  onToggleScheduler,
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
      } else if (
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
  }, [devices, statusFilter, search, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-[#b0b0b5]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0066cc]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0066cc]" />
    );
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto flex flex-col gap-4 min-h-0">
      <DashboardHeroTile
        summary={summary}
        onRunAllNow={onRunAllNow}
        onToggleScheduler={onToggleScheduler}
      />

      <UtilityCard
        title="장비별 실시간 연결 상태 및 원격 접속"
        badge={
          <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
            표시 장비 {filteredAndSortedDevices.length.toLocaleString()}대 (헤더 클릭 시 정렬)
          </span>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <OptionChip
              label="전체 장비"
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
              placeholder="장비번호 · 장비명 · IP 검색..."
              className="w-[240px] ml-1"
            />
          </div>
        }
        className="flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[13px] font-semibold text-[#333333] z-10">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceId')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceId')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비명</span>
                    {renderSortIcon('deviceName')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('ip')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>IP 주소</span>
                    {renderSortIcon('ip')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('latencyMs')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>응답 확인</span>
                    {renderSortIcon('latencyMs')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('msPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 데스크톱 포트</span>
                    {renderSortIcon('msPortOpen')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('vncPortOpen')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 제어 포트</span>
                    {renderSortIcon('vncPortOpen')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('keepAliveOk')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>센터 생존신호</span>
                    {renderSortIcon('keepAliveOk')}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>최종 점검 시각</span>
                    {renderSortIcon('checkTime')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">원격 접속 · 개별 점검</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[14px] bg-[#ffffff]">
              {filteredAndSortedDevices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#7a7a7a]">
                    조건에 해당하는 단속장비가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAndSortedDevices.map((item) => {
                  const isUp = item.status === 'Up';
                  const isSingleChecking = checkingDeviceId === item.deviceId;
                  return (
                    <tr key={item.deviceId} className="hover:bg-[#f5f5f7]/70 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                            isUp
                              ? 'bg-[#0066cc]/10 text-[#0066cc]'
                              : 'bg-[#272729] text-white'
                          }`}
                        >
                          {isUp ? '정상 가동' : '연결 끊김'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#1d1d1f] whitespace-nowrap">
                        {item.deviceId}
                      </td>
                      <td
                        className="py-2 px-3 text-[#333333] max-w-[140px] truncate"
                        title={item.deviceName || '-'}
                      >
                        {item.deviceName || '-'}
                      </td>
                      <td className="py-2 px-3 text-[#333333] whitespace-nowrap">{item.ip}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`text-[13px] font-medium ${
                            item.pingOk ? 'text-[#0066cc]' : 'text-[#7a7a7a]'
                          }`}
                        >
                          {item.pingOk ? '정상' : '응답 없음'}
                        </span>
                        {item.latencyMs !== null && (
                          <span className="text-[12px] text-[#7a7a7a] ml-1">
                            ({item.latencyMs}ms)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[13px] ${
                            item.msPortOpen ? 'text-[#0066cc] font-semibold' : 'text-[#7a7a7a]'
                          }`}
                        >
                          <span>{item.msPortOpen ? '열림' : '닫힘'}</span>
                          <span className="text-[12px] text-[#7a7a7a] font-normal">
                            ({item.portMS})
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[13px] ${
                            item.vncPortOpen ? 'text-[#0066cc] font-semibold' : 'text-[#7a7a7a]'
                          }`}
                        >
                          <span>{item.vncPortOpen ? '열림' : '닫힘'}</span>
                          <span className="text-[12px] text-[#7a7a7a] font-normal">
                            ({item.portVNC})
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {item.keepAliveOk ? (
                          <span className="text-[13px] text-[#0066cc] font-medium">
                            전송 완료 ({item.keepAliveCode ?? 200})
                          </span>
                        ) : (
                          <span className="text-[13px] text-[#7a7a7a]">
                            {item.keepAliveCode ? `실패 (${item.keepAliveCode})` : '미전송'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[13px] text-[#7a7a7a] whitespace-nowrap">
                        {item.checkTime || '-'}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onConnectMstsc(item.ip, item.portMS)}
                            title={`${item.deviceId} 원격 데스크톱 연결 (${item.ip}:${item.portMS})`}
                            className="h-[28px] px-2.5 rounded-[7px] bg-[#fafafc] hover:bg-[#0066cc] hover:text-white border border-[#e0e0e0] text-[12px] text-[#1d1d1f] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>원격 데스크톱</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onConnectVnc(item.ip, item.portVNC)}
                            title={`${item.deviceId} 원격 제어 연결 (${item.ip}:${item.portVNC})`}
                            className="h-[28px] px-2.5 rounded-[7px] bg-[#fafafc] hover:bg-[#0066cc] hover:text-white border border-[#e0e0e0] text-[12px] text-[#1d1d1f] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>원격 제어</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRunSingleDevice(item.deviceId)}
                            disabled={isSingleChecking}
                            title={`${item.deviceId} 즉시 개별 점검`}
                            className="w-[28px] h-[28px] rounded-[7px] bg-[#fafafc] hover:bg-[#e8e8ed] border border-[#e0e0e0] text-[#333333] inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isSingleChecking ? 'animate-spin text-[#0066cc]' : ''}`}
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
      </UtilityCard>
    </div>
  );
};
