import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import { InteractiveStatsChart } from './InteractiveStatsChart';
import type { MonthlyCheckStatsReport } from '@shared/types/domain';

interface MonthlyStatsViewProps {
  onStatusMessage: (msg: string) => void;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftYearMonth(ym: string, deltaMonths: number): string {
  const [yStr, mStr] = ym.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const MonthlyStatsView: React.FC<MonthlyStatsViewProps> = ({ onStatusMessage }) => {
  const [selectedYm, setSelectedYm] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<MonthlyCheckStatsReport | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async (targetYm?: string) => {
    if (typeof window.systemCheckApi.getMonthlyStats !== 'function') return;
    const res = await window.systemCheckApi.getMonthlyStats(targetYm);
    if (res.success && res.data) {
      setReport(res.data);
      setSelectedYm(res.data.yearMonth);
    }
  }, []);

  useEffect(() => {
    void fetchStats(selectedYm);
  }, [selectedYm, fetchStats]);

  useEffect(() => {
    const unsub = window.systemCheckApi.onSummaryUpdated(() => {
      void fetchStats(selectedYm);
    });
    return () => unsub();
  }, [selectedYm, fetchStats]);

  const activeYm = selectedYm || report?.yearMonth || getCurrentYearMonth();
  const [yLabel, mLabel] = activeYm.split('-');

  const handleExportPdf = async () => {
    if (typeof window.systemCheckApi.exportMonthlyPdf !== 'function') return;
    setExporting(true);
    try {
      const res = await window.systemCheckApi.exportMonthlyPdf(activeYm);
      if (res.success && res.data) {
        onStatusMessage(`PDF 보고서 출력 완료: ${res.data.filePath}`);
      } else if (res.error) {
        onStatusMessage(res.error);
      }
    } finally {
      setExporting(false);
    }
  };

  const totalChecks = report?.totalChecks ?? 0;
  const upPct = totalChecks > 0 ? (((report?.upCount ?? 0) / totalChecks) * 100).toFixed(1) : '0.0';
  const downPct =
    totalChecks > 0 ? (((report?.downCount ?? 0) / totalChecks) * 100).toFixed(1) : '0.0';
  const kaPct =
    totalChecks > 0
      ? (((report?.keepAliveOkCount ?? 0) / totalChecks) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="h-full p-3.5 w-full min-h-0 flex flex-col gap-3">
      {/* 상단 연월 선택 (아이콘 스테퍼) 및 PDF 보고서 출력 바 */}
      <section className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedYm(shiftYearMonth(activeYm, -1))}
              title="이전 달"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 h-7 flex items-center justify-center text-[13px] font-bold text-[#0f172a] whitespace-nowrap border-x border-[#e2e8f0] bg-[#ffffff] min-w-[104px]">
              {yLabel}년 {mLabel}월
            </div>

            <button
              type="button"
              onClick={() => setSelectedYm(shiftYearMonth(activeYm, 1))}
              title="다음 달"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[12px] text-[#64748b] truncate">
            차트에 마우스를 올리면 상세 가동률 및 점검 수치가 표시됩니다.
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchStats(activeYm)}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새로고침</span>
          </PillButton>
          <PillButton
            variant="primary"
            size="sm"
            disabled={exporting}
            onClick={() => void handleExportPdf()}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{exporting ? 'PDF 생성 중...' : 'PDF 보고서 출력'}</span>
          </PillButton>
        </div>
      </section>

      {/* 월간 요약 KPI 4단 */}
      <div className="grid grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-[#0f172a] text-white border border-[#1e293b] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-slate-300">월간 평균 가동률</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              등록 {report?.totalDevices ?? 0}대 · 점검 {totalChecks.toLocaleString()}건
            </div>
          </div>
          <div className="text-[22px] font-bold text-[#38bdf8]">
            {report?.uptimeRate ?? 0}
            <span className="text-[12px] text-slate-300 ml-0.5">%</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">정상 가동 판정 (Up)</div>
            <div className="text-[11px] text-[#2563eb] font-medium mt-0.5">비중 {upPct}%</div>
          </div>
          <div className="text-[22px] font-bold text-[#2563eb]">
            {(report?.upCount ?? 0).toLocaleString()}
            <span className="text-[12px] text-[#64748b] ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">연결 끊김 판정 (Down)</div>
            <div className="text-[11px] text-[#e11d48] font-medium mt-0.5">비중 {downPct}%</div>
          </div>
          <div className="text-[22px] font-bold text-[#e11d48]">
            {(report?.downCount ?? 0).toLocaleString()}
            <span className="text-[12px] text-[#64748b] ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">센터 생존신호 응답</div>
            <div className="text-[11px] text-[#059669] font-medium mt-0.5">
              성공률 {kaPct}% · 평균 {report?.avgLatencyMs ?? 0}ms
            </div>
          </div>
          <div className="text-[22px] font-bold text-[#059669]">
            {(report?.keepAliveOkCount ?? 0).toLocaleString()}
            <span className="text-[12px] text-[#64748b] ml-1">건</span>
          </div>
        </div>
      </div>

      {/* 하단 2단: 탭형 인터랙티브 차트 + 장비별 가동 실적 시트 */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        <InteractiveStatsChart report={report} yearLabel={yLabel} monthLabel={mLabel} />

        <section className="col-span-5 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col min-h-0">
          <div className="px-3.5 py-2.5 border-b border-[#cbd5e1] flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-bold text-[#0f172a]">장비별 가동률 실적</h3>
            <span className="text-[11.5px] text-[#64748b]">
              총 {report?.deviceStats.length ?? 0}대 집계
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 bg-[#f1f5f9] border-b border-[#cbd5e1] text-[#334155]">
                <tr>
                  <th className="py-2 px-2.5 font-semibold">장비번호</th>
                  <th className="py-2 px-2.5 font-semibold">현장명</th>
                  <th className="py-2 px-2.5 font-semibold text-right">정상/끊김</th>
                  <th className="py-2 px-2.5 font-semibold text-right">가동률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {!report || report.deviceStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-[#64748b]">
                      집계된 장비 점검 실적이 없습니다.
                    </td>
                  </tr>
                ) : (
                  report.deviceStats.map((dev) => (
                    <tr key={dev.deviceId} className="hover:bg-[#f8fafc]">
                      <td className="py-1.5 px-2.5 font-bold text-[#0f172a] whitespace-nowrap">
                        {dev.deviceId}
                      </td>
                      <td
                        className="py-1.5 px-2.5 text-[#334155] max-w-[130px] truncate"
                        title={dev.deviceName || '-'}
                      >
                        {dev.deviceName || '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right whitespace-nowrap font-mono">
                        <span className="text-[#2563eb] font-semibold">{dev.upCount}</span>
                        <span className="text-[#94a3b8] mx-1">/</span>
                        <span className="text-[#e11d48] font-semibold">{dev.downCount}</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-[#0f172a] whitespace-nowrap">
                        {dev.uptimeRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
