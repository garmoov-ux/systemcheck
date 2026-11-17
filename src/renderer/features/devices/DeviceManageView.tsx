import React, { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FolderSync,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { SearchInput } from '../../components/ui/SearchInput';
import type { DeviceRecord, DeviceUpsertInput } from '@shared/types/domain';

interface DeviceManageViewProps {
  devices: DeviceRecord[];
  onUpsertDevice: (input: DeviceUpsertInput) => Promise<boolean>;
  onDeleteDevice: (deviceId: string) => Promise<void>;
  onReloadCsv: () => Promise<void>;
  onImportCsv: () => Promise<void>;
  onExportCsv: () => Promise<void>;
}

type SortKey = 'deviceId' | 'deviceName' | 'ip' | 'portMS' | 'portVNC' | 'status' | 'checkTime';

export const DeviceManageView: React.FC<DeviceManageViewProps> = ({
  devices,
  onUpsertDevice,
  onDeleteDevice,
  onReloadCsv,
  onImportCsv,
  onExportCsv,
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ip, setIp] = useState('');
  const [portMS, setPortMS] = useState(3389);
  const [portVNC, setPortVNC] = useState(5900);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
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
    const list = q
      ? devices.filter(
          (d) =>
            d.deviceId.toLowerCase().includes(q) ||
            (d.deviceName || '').toLowerCase().includes(q) ||
            d.ip.toLowerCase().includes(q),
        )
      : [...devices];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'portMS' || sortKey === 'portVNC') {
        cmp = a[sortKey] - b[sortKey];
      } else {
        cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'ko', {
          numeric: true,
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [devices, search, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-[#b0b0b5]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0066cc]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0066cc]" />
    );
  };

  const handleSelectRow = (item: DeviceRecord) => {
    setDeviceId(item.deviceId);
    setDeviceName(item.deviceName || '');
    setIp(item.ip);
    setPortMS(item.portMS);
    setPortVNC(item.portVNC);
    setIsEditingExisting(true);
  };

  const handleResetForm = () => {
    setDeviceId('');
    setDeviceName('');
    setIp('');
    setPortMS(3389);
    setPortVNC(5900);
    setIsEditingExisting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUpsertDevice({
      deviceId,
      deviceName,
      ip,
      portMS,
      portVNC,
    });
    if (ok && !isEditingExisting) {
      handleResetForm();
    }
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto min-h-0 grid grid-cols-12 gap-4">
      <div className="col-span-4 min-h-0 flex flex-col gap-4">
        <UtilityCard
          title={isEditingExisting ? `장비 정보 수정 (${deviceId})` : '신규 단속장비 등록'}
          rightAction={
            isEditingExisting ? (
              <PillButton variant="pearl-capsule" size="sm" onClick={handleResetForm}>
                <Plus className="w-3.5 h-3.5" />
                <span>신규 등록 전환</span>
              </PillButton>
            ) : undefined
          }
          className="shrink-0"
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  장비번호
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                  placeholder="예: B0041, F0036"
                  className="w-full h-[38px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  장비명 (설치 위치·별칭)
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="예: 신천대로 1차로"
                  className="w-full h-[38px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                장비 IP 주소
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="예: 50.11.30.100"
                className="w-full h-[38px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  원격 데스크톱 포트
                </label>
                <input
                  type="number"
                  value={portMS}
                  onChange={(e) => setPortMS(Number(e.target.value) || 3389)}
                  className="w-full h-[38px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  원격 제어 포트
                </label>
                <input
                  type="number"
                  value={portVNC}
                  onChange={(e) => setPortVNC(Number(e.target.value) || 5900)}
                  className="w-full h-[38px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
                />
              </div>
            </div>

            <div className="pt-1">
              <PillButton type="submit" variant="primary" size="md" className="w-full">
                <Save className="w-4 h-4" />
                <span>{isEditingExisting ? '선택 장비 정보 저장' : '장비 목록에 추가'}</span>
              </PillButton>
            </div>
          </form>
        </UtilityCard>

        <UtilityCard
          title="장비 목록 파일 관리"
          className="flex-1 min-h-0"
          bodyClassName="justify-between"
        >
          <div className="space-y-2.5">
            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onImportCsv()}
              className="w-full justify-start px-4"
            >
              <Upload className="w-4 h-4 text-[#0066cc]" />
              <span>장비 목록 파일 가져오기</span>
            </PillButton>

            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onExportCsv()}
              className="w-full justify-start px-4"
            >
              <Download className="w-4 h-4 text-[#0066cc]" />
              <span>장비 목록 파일 내보내기</span>
            </PillButton>

            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onReloadCsv()}
              className="w-full justify-start px-4"
            >
              <FolderSync className="w-4 h-4 text-[#0066cc]" />
              <span>기본 목록 파일 다시 불러오기</span>
            </PillButton>
          </div>

          <div className="text-[13px] text-[#7a7a7a] px-1 pt-2">
            우측 목록에서 장비를 선택하면 장비명·IP·포트를 수정할 수 있습니다.
          </div>
        </UtilityCard>
      </div>

      <UtilityCard
        title="전체 등록 장비 목록"
        badge={
          <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {devices.length.toLocaleString()}대 등록 (헤더 클릭 시 정렬)
          </span>
        }
        rightAction={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="장비번호 · 장비명 · IP 검색..."
            className="w-[260px]"
          />
        }
        className="col-span-8 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[13px] font-semibold text-[#333333] z-10">
              <tr>
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
                    onClick={() => handleSort('portMS')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 데스크톱 포트</span>
                    {renderSortIcon('portMS')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('portVNC')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>원격 제어 포트</span>
                    {renderSortIcon('portVNC')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>현재 상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>최종 점검 시각</span>
                    {renderSortIcon('checkTime')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[14px] bg-[#ffffff]">
              {filteredAndSortedDevices.map((item) => {
                const selected = isEditingExisting && deviceId === item.deviceId;
                return (
                  <tr
                    key={item.deviceId}
                    onClick={() => handleSelectRow(item)}
                    className={`cursor-pointer transition-colors ${
                      selected ? 'bg-[#0066cc]/8' : 'hover:bg-[#f5f5f7]/70'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-[#1d1d1f] whitespace-nowrap">
                      {item.deviceId}
                    </td>
                    <td
                      className="py-2.5 px-3.5 text-[#333333] max-w-[160px] truncate"
                      title={item.deviceName || '-'}
                    >
                      {item.deviceName || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-[#333333] whitespace-nowrap">{item.ip}</td>
                    <td className="py-2.5 px-3.5 text-[#333333] whitespace-nowrap">{item.portMS}</td>
                    <td className="py-2.5 px-3.5 text-[#333333] whitespace-nowrap">{item.portVNC}</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                          item.status === 'Up'
                            ? 'bg-[#0066cc]/10 text-[#0066cc]'
                            : 'bg-[#272729] text-white'
                        }`}
                      >
                        {item.status === 'Up' ? '정상 가동' : '연결 끊김'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-[13px] text-[#7a7a7a] whitespace-nowrap">
                      {item.checkTime || '-'}
                    </td>
                    <td
                      className="py-2.5 px-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void onDeleteDevice(item.deviceId)}
                        className="text-[#7a7a7a] hover:text-[#1d1d1f] p-1 cursor-pointer"
                        title={`${item.deviceId} 장비 삭제`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </UtilityCard>
    </div>
  );
};
