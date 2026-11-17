import React, { useState, useMemo } from 'react';
import { Monitor, RefreshCw, Tv } from 'lucide-react';
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

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (q && !d.deviceId.toLowerCase().includes(q) && !d.ip.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [devices, statusFilter, search]);

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
          <span className="text-[12px] text-[#7a7a7a] font-normal whitespace-nowrap">
            표시 장비 {filteredDevices.length.toLocaleString()}대
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
              placeholder="장비번호 또는 IP 주소 검색..."
              className="w-[240px] ml-1"
            />
          </div>
        }
        className="flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[12px] font-semibold text-[#333333] z-10">
              <tr>
                <th className="py-2.5 px-3.5 whitespace-nowrap">상태</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">장비번호</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">IP 주소</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">응답 확인</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">원격 데스크톱 (포트)</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">원격 제어 VNC (포트)</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">센터 생존신호</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">최종 점검 시각</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">원격 접속 · 개별 점검</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[13px] bg-[#ffffff]">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#7a7a7a]">
                    조건에 해당하는 단속장비가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((item) => {
                  const isUp = item.status === 'Up';
                  const isSingleChecking = checkingDeviceId === item.deviceId;
                  return (
                    <tr key={item.deviceId} className="hover:bg-[#f5f5f7]/70 transition-colors">
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                            isUp
                              ? 'bg-[#0066cc]/10 text-[#0066cc]'
                              : 'bg-[#272729] text-white'
                          }`}
                        >
                          {isUp ? '정상 가동' : '연결 끊김'}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 font-semibold text-[#1d1d1f] whitespace-nowrap">
                        {item.deviceId}
                      </td>
                      <td className="py-2 px-3.5 text-[#333333] whitespace-nowrap">{item.ip}</td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span
                          className={`text-[12px] font-medium ${
                            item.pingOk ? 'text-[#0066cc]' : 'text-[#7a7a7a]'
                          }`}
                        >
                          {item.pingOk ? '정상' : '응답 없음'}
                        </span>
                        {item.latencyMs !== null && (
                          <span className="text-[11px] text-[#7a7a7a] ml-1.5">
                            ({item.latencyMs}ms)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[12px] ${
                            item.msPortOpen ? 'text-[#0066cc] font-semibold' : 'text-[#7a7a7a]'
                          }`}
                        >
                          <span>{item.msPortOpen ? '열림' : '닫힘'}</span>
                          <span className="text-[11px] text-[#7a7a7a] font-normal">
                            ({item.portMS})
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[12px] ${
                            item.vncPortOpen ? 'text-[#0066cc] font-semibold' : 'text-[#7a7a7a]'
                          }`}
                        >
                          <span>{item.vncPortOpen ? '열림' : '닫힘'}</span>
                          <span className="text-[11px] text-[#7a7a7a] font-normal">
                            ({item.portVNC})
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        {item.keepAliveOk ? (
                          <span className="text-[12px] text-[#0066cc] font-medium">
                            전송 완료 ({item.keepAliveCode ?? 200})
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#7a7a7a]">
                            {item.keepAliveCode ? `실패 (${item.keepAliveCode})` : '미전송'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-[12px] text-[#7a7a7a] whitespace-nowrap">
                        {item.checkTime || '-'}
                      </td>
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onConnectMstsc(item.ip, item.portMS)}
                            title={`${item.deviceId} 원격 데스크톱 연결 (${item.ip}:${item.portMS})`}
                            className="h-[26px] px-2.5 rounded-[7px] bg-[#fafafc] hover:bg-[#0066cc] hover:text-white border border-[#e0e0e0] text-[11px] text-[#1d1d1f] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Monitor className="w-3 h-3" />
                            <span>원격 데스크톱</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onConnectVnc(item.ip, item.portVNC)}
                            title={`${item.deviceId} VNC 연결 (${item.ip}:${item.portVNC})`}
                            className="h-[26px] px-2.5 rounded-[7px] bg-[#fafafc] hover:bg-[#0066cc] hover:text-white border border-[#e0e0e0] text-[11px] text-[#1d1d1f] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Tv className="w-3 h-3" />
                            <span>VNC 연결</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRunSingleDevice(item.deviceId)}
                            disabled={isSingleChecking}
                            title={`${item.deviceId} 즉시 개별 점검`}
                            className="w-[26px] h-[26px] rounded-[7px] bg-[#fafafc] hover:bg-[#e8e8ed] border border-[#e0e0e0] text-[#333333] inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isSingleChecking ? 'animate-spin text-[#0066cc]' : ''}`}
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
