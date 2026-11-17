import React, { useState, useMemo } from 'react';
import { Download, FolderSync, Plus, Save, Trash2, Upload } from 'lucide-react';
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

export const DeviceManageView: React.FC<DeviceManageViewProps> = ({
  devices,
  onUpsertDevice,
  onDeleteDevice,
  onReloadCsv,
  onImportCsv,
  onExportCsv,
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [ip, setIp] = useState('');
  const [portMS, setPortMS] = useState(3389);
  const [portVNC, setPortVNC] = useState(5900);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [search, setSearch] = useState('');

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(
      (d) => d.deviceId.toLowerCase().includes(q) || d.ip.toLowerCase().includes(q),
    );
  }, [devices, search]);

  const handleSelectRow = (item: DeviceRecord) => {
    setDeviceId(item.deviceId);
    setIp(item.ip);
    setPortMS(item.portMS);
    setPortVNC(item.portVNC);
    setIsEditingExisting(true);
  };

  const handleResetForm = () => {
    setDeviceId('');
    setIp('');
    setPortMS(3389);
    setPortVNC(5900);
    setIsEditingExisting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUpsertDevice({
      deviceId,
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
      {/* 좌측: 장비 등록·수정 폼 및 목록 파일 연동 */}
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
            <div>
              <label className="block text-[12px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                장비번호
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                placeholder="예: B0041, F0036"
                className="w-full h-[36px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                장비 IP 주소
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="예: 50.11.30.100"
                className="w-full h-[36px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  원격 데스크톱 포트
                </label>
                <input
                  type="number"
                  value={portMS}
                  onChange={(e) => setPortMS(Number(e.target.value) || 3389)}
                  className="w-full h-[36px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#333333] mb-1 whitespace-nowrap">
                  원격 제어(VNC) 포트
                </label>
                <input
                  type="number"
                  value={portVNC}
                  onChange={(e) => setPortVNC(Number(e.target.value) || 5900)}
                  className="w-full h-[36px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
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
          title="장비 목록 파일 연동"
          subtitle="등록·수정된 장비는 기본 목록 파일(check/data.csv)에 실시간 반영됩니다."
          className="flex-1 min-h-0"
          bodyClassName="justify-between"
        >
          <div className="space-y-2.5">
            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onReloadCsv()}
              className="w-full justify-start px-4"
            >
              <FolderSync className="w-4 h-4 text-[#0066cc]" />
              <span>기본 장비 목록 파일(data.csv) 다시 불러오기</span>
            </PillButton>

            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onImportCsv()}
              className="w-full justify-start px-4"
            >
              <Upload className="w-4 h-4 text-[#0066cc]" />
              <span>외부 장비 목록 파일 찾아서 가져오기</span>
            </PillButton>

            <PillButton
              variant="pearl-capsule"
              size="md"
              onClick={() => void onExportCsv()}
              className="w-full justify-start px-4"
            >
              <Download className="w-4 h-4 text-[#0066cc]" />
              <span>현재 장비 목록을 별도 파일로 백업 저장</span>
            </PillButton>
          </div>

          <div className="rounded-[12px] bg-[#f5f5f7] border border-[#e0e0e0] p-3.5 text-[12px] text-[#7a7a7a] space-y-1">
            <div className="font-semibold text-[#333333]">목록 파일 자동 호환 안내</div>
            <div>
              기존 운영 파일 형식(장비번호, IP, 포트, 점검시각, 상태)과 100% 동일하게 저장됩니다.
            </div>
          </div>
        </UtilityCard>
      </div>

      {/* 우측: 전체 등록 장비 목록 테이블 */}
      <UtilityCard
        title="전체 등록 장비 목록"
        badge={
          <span className="text-[12px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {devices.length.toLocaleString()}대 등록
          </span>
        }
        rightAction={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="장비번호 또는 IP 검색..."
            className="w-[260px]"
          />
        }
        className="col-span-8 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[12px] font-semibold text-[#333333] z-10">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">장비번호</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IP 주소</th>
                <th className="py-2.5 px-4 whitespace-nowrap">원격 데스크톱 포트</th>
                <th className="py-2.5 px-4 whitespace-nowrap">원격 제어(VNC) 포트</th>
                <th className="py-2.5 px-4 whitespace-nowrap">현재 상태</th>
                <th className="py-2.5 px-4 whitespace-nowrap">최종 점검 시각</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-[13px] bg-[#ffffff]">
              {filteredDevices.map((item) => {
                const selected = isEditingExisting && deviceId === item.deviceId;
                return (
                  <tr
                    key={item.deviceId}
                    onClick={() => handleSelectRow(item)}
                    className={`cursor-pointer transition-colors ${
                      selected ? 'bg-[#0066cc]/8' : 'hover:bg-[#f5f5f7]/70'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-[#1d1d1f] whitespace-nowrap">
                      {item.deviceId}
                    </td>
                    <td className="py-2.5 px-4 text-[#333333] whitespace-nowrap">{item.ip}</td>
                    <td className="py-2.5 px-4 text-[#333333] whitespace-nowrap">{item.portMS}</td>
                    <td className="py-2.5 px-4 text-[#333333] whitespace-nowrap">{item.portVNC}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'Up'
                            ? 'bg-[#0066cc]/10 text-[#0066cc]'
                            : 'bg-[#272729] text-white'
                        }`}
                      >
                        {item.status === 'Up' ? '정상 가동' : '연결 끊김'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[12px] text-[#7a7a7a] whitespace-nowrap">
                      {item.checkTime || '-'}
                    </td>
                    <td
                      className="py-2.5 px-4 text-right whitespace-nowrap"
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
