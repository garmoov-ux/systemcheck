import React, { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { SearchInput } from '../../components/ui/SearchInput';
import { FIELD_DEVICE_MASTER } from '@shared/field-device-master';
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
  const [masterSearch, setMasterSearch] = useState('');
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

  const handleDeviceIdChange = (nextIdRaw: string) => {
    const cleanId = nextIdRaw.toUpperCase().trim();
    setDeviceId(cleanId);
    const master = FIELD_DEVICE_MASTER[cleanId];
    if (master && !isEditingExisting) {
      setDeviceName(master.name);
      if (master.ip) setIp(master.ip);
    }
  };

  const matchedMaster = FIELD_DEVICE_MASTER[deviceId.trim().toUpperCase()];

  const masterSuggestions = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    if (!q) return [];
    const registeredIds = new Set(devices.map((d) => d.deviceId.toUpperCase()));
    return Object.entries(FIELD_DEVICE_MASTER)
      .filter(
        ([id, info]) =>
          id.toLowerCase().includes(q) ||
          info.name.toLowerCase().includes(q) ||
          info.ip.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map(([id, info]) => ({
        id,
        ...info,
        alreadyRegistered: registeredIds.has(id),
      }));
  }, [masterSearch, devices]);

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
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563eb]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563eb]" />
    );
  };

  const handleSelectRow = (item: DeviceRecord) => {
    setDeviceId(item.deviceId);
    setDeviceName(item.deviceName || FIELD_DEVICE_MASTER[item.deviceId]?.name || '');
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
    <div className="h-full p-3.5 w-full min-h-0 grid grid-cols-12 gap-3">
      {/* 좌측: 장비 등록·수정 + 현장 마스터 검색 + CSV 관리 */}
      <div className="col-span-4 min-h-0 flex flex-col gap-3">
        <UtilityCard
          title={isEditingExisting ? `장비 수정 (${deviceId})` : '단속장비 등록 · 수정'}
          rightAction={
            isEditingExisting ? (
              <PillButton variant="pearl-capsule" size="sm" onClick={handleResetForm}>
                <Plus className="w-3 h-3" />
                <span>신규 전환</span>
              </PillButton>
            ) : undefined
          }
          className="shrink-0"
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2.5">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-[11.5px] font-semibold text-[#334155] mb-1">
                  장비번호
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => handleDeviceIdChange(e.target.value)}
                  placeholder="예: B0041, F0001"
                  className="w-full h-[32px] px-2.5 rounded-[7px] bg-[#f8fafc] border border-[#cbd5e1] text-[12.5px] font-bold focus:bg-[#ffffff] focus:outline-2 focus:outline-[#2563eb]"
                />
              </div>

              <div className="col-span-7">
                <label className="block text-[11.5px] font-semibold text-[#334155] mb-1">
                  장비 IP 주소
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="예: 50.11.30.100"
                  className="w-full h-[32px] px-2.5 rounded-[7px] bg-[#f8fafc] border border-[#cbd5e1] text-[12.5px] font-mono focus:bg-[#ffffff] focus:outline-2 focus:outline-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11.5px] font-semibold text-[#334155]">
                  장비명 (현장 설치 위치)
                </label>
                {matchedMaster && (
                  <span className="text-[10.5px] text-[#2563eb] font-semibold">
                    {matchedMaster.type} · {matchedMaster.vendor}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="장비번호 입력 시 현장 위치 자동 매칭"
                className="w-full h-[32px] px-2.5 rounded-[7px] bg-[#f8fafc] border border-[#cbd5e1] text-[12.5px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#2563eb]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#334155] mb-1">
                  원격 데스크톱 포트
                </label>
                <input
                  type="number"
                  value={portMS}
                  onChange={(e) => setPortMS(Number(e.target.value) || 3389)}
                  className="w-full h-[30px] px-2.5 rounded-[7px] bg-[#f8fafc] border border-[#cbd5e1] text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#334155] mb-1">
                  원격 제어 포트
                </label>
                <input
                  type="number"
                  value={portVNC}
                  onChange={(e) => setPortVNC(Number(e.target.value) || 5900)}
                  className="w-full h-[30px] px-2.5 rounded-[7px] bg-[#f8fafc] border border-[#cbd5e1] text-[12.5px]"
                />
              </div>
            </div>

            <PillButton type="submit" variant="primary" size="sm" className="w-full">
              <Save className="w-3.5 h-3.5" />
              <span>{isEditingExisting ? '선택 장비 정보 저장' : '점검 목록에 장비 추가'}</span>
            </PillButton>
          </form>
        </UtilityCard>

        <UtilityCard
          title="현장 마스터 검색 및 CSV 일괄 관리"
          badge={
            <span className="text-[11px] text-[#64748b]">
              현장DB {Object.keys(FIELD_DEVICE_MASTER).length}대 내장
            </span>
          }
          className="flex-1 min-h-0"
          bodyClassName="justify-between gap-2"
        >
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <SearchInput
              value={masterSearch}
              onChange={setMasterSearch}
              placeholder="미등록 현장장비 검색 (예: 한천초, F0001)"
              className="w-full shrink-0"
            />

            <div className="flex-1 min-h-0 overflow-y-auto border border-[#e2e8f0] rounded-[7px] bg-[#f8fafc] divide-y divide-[#e2e8f0]">
              {masterSuggestions.length === 0 ? (
                <div className="p-3 text-[11.5px] text-[#64748b] leading-relaxed">
                  전체 653대 현장 마스터 정보(위치·IP·제조사)가 내장되어 있습니다. 위 검색창에서 현장명이나 장비번호를 검색해 클릭하면 즉시 입력폼에 채워집니다.
                </div>
              ) : (
                masterSuggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setDeviceId(m.id);
                      setDeviceName(m.name);
                      setIp(m.ip);
                      setIsEditingExisting(m.alreadyRegistered);
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-[#eff6ff] flex items-center justify-between gap-2 text-[11.5px] cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#0f172a] mr-1.5">{m.id}</span>
                      <span className="text-[#334155] truncate">{m.name}</span>
                    </div>
                    <span className="text-[10.5px] font-mono text-[#2563eb] shrink-0">{m.ip}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1 shrink-0">
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void onExportCsv()}>
              <Download className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>CSV 저장</span>
            </PillButton>
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void onImportCsv()}>
              <Upload className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>CSV 불러오기</span>
            </PillButton>
            <PillButton
              variant="pearl-capsule"
              size="sm"
              onClick={() => void onReloadCsv()}
              title="기본 110대 초기 장비 목록으로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748b]" />
              <span>초기 복원</span>
            </PillButton>
          </div>
        </UtilityCard>
      </div>

      {/* 우측: 방법 A 단일 테두리 장비 목록 테이블 */}
      <section className="col-span-8 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col min-h-0">
        <div className="px-3.5 py-2.5 border-b border-[#cbd5e1] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] font-bold text-[#0f172a]">전체 등록 장비 목록</h2>
            <span className="text-[12px] text-[#64748b]">
              총 <strong className="text-[#0f172a]">{devices.length.toLocaleString()}</strong>대 등록 (행 클릭 시 수정)
            </span>
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="등록 장비번호 · 현장명 · IP 검색"
            className="w-[230px]"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] border-b border-[#cbd5e1] text-[12px] font-semibold text-[#334155] z-10">
              <tr>
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
                    onClick={() => handleSort('portMS')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>포트(RDP/VNC)</span>
                    {renderSortIcon('portMS')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('checkTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>최종 점검</span>
                    {renderSortIcon('checkTime')}
                  </button>
                </th>
                <th className="py-2 px-3 text-right whitespace-nowrap">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {filteredAndSortedDevices.map((item) => {
                const selected = isEditingExisting && deviceId === item.deviceId;
                return (
                  <tr
                    key={item.deviceId}
                    onClick={() => handleSelectRow(item)}
                    className={`cursor-pointer transition-colors ${
                      selected ? 'bg-[#eff6ff]' : 'hover:bg-[#f8fafc]'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-[#0f172a] whitespace-nowrap">
                      {item.deviceId}
                    </td>
                    <td
                      className="py-2 px-3 text-[#334155] font-medium max-w-[210px] truncate"
                      title={item.deviceName || '-'}
                    >
                      {item.deviceName || '-'}
                    </td>
                    <td className="py-2 px-3 text-[#334155] font-mono text-[12px] whitespace-nowrap">
                      {item.ip}
                    </td>
                    <td className="py-2 px-3 text-[#475569] font-mono text-[12px] whitespace-nowrap">
                      {item.portMS} / {item.portVNC}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold border ${
                          item.status === 'Up'
                            ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                            : 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
                        }`}
                      >
                        {item.status === 'Up' ? '정상 가동' : '연결 끊김'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11.5px] text-[#64748b] font-mono whitespace-nowrap">
                      {item.checkTime ? item.checkTime.slice(5) : '-'}
                    </td>
                    <td
                      className="py-2 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void onDeleteDevice(item.deviceId)}
                        className="text-[#64748b] hover:text-[#e11d48] p-1 cursor-pointer"
                        title={`${item.deviceId} 장비 삭제`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
