import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import type { MonthlyCheckStatsReport } from '@shared/types/domain';

function buildReportHtml(report: MonthlyCheckStatsReport): string {
  const [year, month] = report.yearMonth.split('-');
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalChecks = report.totalChecks;
  const upCount = report.upCount;
  const downCount = report.downCount;

  const upPct = totalChecks > 0 ? ((upCount / totalChecks) * 100).toFixed(1) : '0.0';
  const downPct = totalChecks > 0 ? ((downCount / totalChecks) * 100).toFixed(1) : '0.0';
  const kaPct =
    totalChecks > 0 ? ((report.keepAliveOkCount / totalChecks) * 100).toFixed(1) : '0.0';

  const maxDaily = Math.max(...report.dailyStats.map((d) => d.totalChecks), 4);
  const yTicks = [
    maxDaily,
    Math.round(maxDaily * 0.75),
    Math.round(maxDaily * 0.5),
    Math.round(maxDaily * 0.25),
    0,
  ];

  const dailyChartHtml =
    report.dailyStats.length === 0
      ? '<div style="padding:28px;text-align:center;color:#64748b;font-size:11px;">해당 월에 집계된 상태 점검 데이터가 없습니다.</div>'
      : `<div style="display:flex;gap:8px;height:148px;padding:8px 6px 4px;">
          <div style="width:32px;display:flex;flex-direction:column;justify-content:space-between;padding:4px 0 18px;text-align:right;font-size:9px;color:#64748b;font-family:monospace;">
            ${yTicks.map((t) => `<span>${t}</span>`).join('')}
          </div>
          <div style="flex:1;position:relative;display:flex;flex-direction:column;">
            <div style="position:absolute;inset:4px 0 18px 0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;">
              ${yTicks
                .map(
                  (_, idx) =>
                    `<div style="width:100%;border-bottom:${idx === yTicks.length - 1 ? '1px solid #94a3b8' : '1px dashed #cbd5e1'};"></div>`,
                )
                .join('')}
            </div>
            <div style="flex:1;display:flex;align-items:flex-end;gap:6px;padding:4px 6px 18px;position:relative;z-index:2;">
              ${report.dailyStats
                .map((d) => {
                  const ratio = Math.min(d.totalChecks / maxDaily, 1);
                  const totalH = Math.max(Math.round(ratio * 96), 4);
                  const downH =
                    d.totalChecks > 0 ? Math.round((d.downCount / d.totalChecks) * totalH) : 0;
                  const upH = Math.max(0, totalH - downH);
                  return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:18px;position:relative;">
                    <div style="font-size:9px;font-weight:800;color:#0f172a;margin-bottom:2px;">${d.uptimeRate}%</div>
                    <div style="width:100%;max-width:22px;display:flex;flex-direction:column;border-radius:4px 4px 0 0;overflow:hidden;">
                      ${downH > 0 ? `<div style="height:${downH}px;background:#e11d48;"></div>` : ''}
                      ${upH > 0 ? `<div style="height:${upH}px;background:#2563eb;"></div>` : ''}
                    </div>
                    <div style="position:absolute;bottom:-15px;font-size:9px;color:#475569;font-weight:600;white-space:nowrap;">${d.label}</div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </div>`;

  const radius = 44;
  const circum = 2 * Math.PI * radius;
  const upLen = totalChecks > 0 ? (upCount / totalChecks) * circum : 0;
  const downLen = totalChecks > 0 ? (downCount / totalChecks) * circum : 0;

  const deviceBarsHtml =
    report.deviceStats.length === 0
      ? '<div style="padding:20px;text-align:center;color:#64748b;">집계된 장비 데이터가 없습니다.</div>'
      : report.deviceStats
          .slice(0, 6)
          .map((dev) => {
            const upShare = dev.totalChecks > 0 ? Math.round((dev.upCount / dev.totalChecks) * 100) : 0;
            const downShare = Math.max(0, 100 - upShare);
            return `<div style="margin-bottom:7px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 8px;background:#ffffff;">
              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
                <span><strong style="color:#0f172a;">${dev.deviceId}</strong> <span style="color:#475569;">${dev.deviceName || '-'}</span></span>
                <span><strong style="color:#2563eb;">가동 ${dev.uptimeRate}%</strong> · <span style="color:#64748b;">정상 ${dev.upCount} / 끊김 ${dev.downCount}</span></span>
              </div>
              <div style="width:100%;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;display:flex;">
                ${upShare > 0 ? `<div style="width:${upShare}%;background:#2563eb;height:100%;"></div>` : ''}
                ${downShare > 0 ? `<div style="width:${downShare}%;background:#e11d48;height:100%;"></div>` : ''}
              </div>
            </div>`;
          })
          .join('');

  const deviceRowsHtml =
    report.deviceStats.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:14px;color:#64748b;">집계된 장비 점검 실적이 없습니다.</td></tr>'
      : report.deviceStats
          .slice(0, 40)
          .map(
            (dev) => `<tr>
              <td style="font-weight:700;color:#0f172a;">${dev.deviceId}</td>
              <td>${dev.deviceName || '-'}</td>
              <td style="font-family:monospace;">${dev.ip}</td>
              <td style="text-align:right;font-weight:700;">${dev.totalChecks.toLocaleString()}회</td>
              <td style="text-align:right;color:#1d4ed8;font-weight:600;">${dev.upCount.toLocaleString()} / <span style="color:#e11d48;">${dev.downCount.toLocaleString()}</span></td>
              <td style="text-align:right;font-weight:700;color:#0f172a;">${dev.uptimeRate}%</td>
              <td style="text-align:right;">${dev.avgLatencyMs > 0 ? `${dev.avgLatencyMs}ms` : '-'}</td>
            </tr>`,
          )
          .join('');

  const dailyRowsHtml =
    report.dailyStats.length === 0
      ? '<tr><td colspan="6" style="text-align:center;padding:14px;color:#64748b;">집계된 일자별 내역이 없습니다.</td></tr>'
      : report.dailyStats
          .map(
            (d) => `<tr>
              <td style="font-weight:600;">${d.day}</td>
              <td style="text-align:right;font-weight:700;">${d.totalChecks.toLocaleString()}건</td>
              <td style="text-align:right;color:#1d4ed8;font-weight:600;">${d.upCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#e11d48;font-weight:600;">${d.downCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#059669;font-weight:600;">${d.keepAliveOkCount.toLocaleString()}건</td>
              <td style="text-align:right;font-weight:700;">${d.uptimeRate}%</td>
            </tr>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic", -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 16px 20px; font-size: 10.5px; line-height: 1.4; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
  .badge { display: inline-block; background: #0f172a; color: #38bdf8; font-weight: 700; font-size: 9.5px; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px; }
  h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
  .meta-table { border-collapse: collapse; font-size: 9.5px; }
  .meta-table td { border: 1px solid #cbd5e1; padding: 2.5px 7px; }
  .meta-table td.lbl { background: #f1f5f9; font-weight: 700; color: #334155; }
  .sec-head { display: flex; justify-content: space-between; align-items: center; margin: 11px 0 5px; }
  h2 { font-size: 12.5px; font-weight: 700; color: #0f172a; padding-left: 7px; border-left: 3px solid #2563eb; }
  .legend { display: flex; gap: 10px; font-size: 9.5px; color: #334155; font-weight: 600; }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 8px; }
  .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; background: #f8fafc; }
  .kpi-box .k-label { font-size: 9.5px; color: #64748b; font-weight: 600; }
  .kpi-box .k-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 1px; }
  .kpi-box .k-sub { font-size: 9px; color: #475569; margin-top: 1px; }
  .chart-card { border: 1px solid #cbd5e1; border-radius: 7px; padding: 8px 10px; background: #f8fafc; }
  .split-charts { display: grid; grid-template-columns: 5fr 7fr; gap: 8px; margin-bottom: 8px; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.data-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 7px; text-align: left; font-weight: 700; color: #334155; }
  table.data-table td { border: 1px solid #cbd5e1; padding: 4px 7px; }
  .footer { margin-top: 14px; padding-top: 7px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="badge">SystemCheck 무인교통단속장비 상태 점검기 (v2.1.0)</div>
      <h1>${year}년 ${month}월 무인교통단속장비 상태 점검 및 가동률 운영 보고서</h1>
    </div>
    <table class="meta-table">
      <tr><td class="lbl">대상 연월</td><td>${year}년 ${month}월</td><td class="lbl">발행 일자</td><td>${todayStr}</td></tr>
      <tr><td class="lbl">점검 항목</td><td colspan="3">ICMP 응답 · 원격 데스크톱(3389) · 원격 제어(5900) · 센터 생존신호</td></tr>
      <tr><td class="lbl">기술 지원</td><td colspan="3">㈜ 이노네트웍스 · 강홍선 (s_gain@naver.com)</td></tr>
    </table>
  </div>

  <div class="sec-head">
    <h2>1. 월간 장비 가동률 및 상태 점검 총괄 요약</h2>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box" style="background:#0f172a;color:#ffffff;border-color:#1e293b;">
      <div class="k-label" style="color:#cbd5e1;">평균 장비 가동률</div>
      <div class="k-val" style="color:#38bdf8;">${report.uptimeRate}%</div>
      <div class="k-sub" style="color:#94a3b8;">등록 ${report.totalDevices}대 (현재 정상 ${report.currentUpDevices}대)</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">정상 가동 판정 (Up)</div>
      <div class="k-val" style="color:#2563eb;">${upCount.toLocaleString()}건</div>
      <div class="k-sub">전체 점검 ${totalChecks.toLocaleString()}건 중 ${upPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">연결 끊김 판정 (Down)</div>
      <div class="k-val" style="color:#e11d48;">${downCount.toLocaleString()}건</div>
      <div class="k-sub">전체 점검 대비 ${downPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">센터 생존신호 응답</div>
      <div class="k-val" style="color:#059669;">${report.keepAliveOkCount.toLocaleString()}건</div>
      <div class="k-sub">성공률 ${kaPct}% · 평균 지연 ${report.avgLatencyMs}ms</div>
    </div>
  </div>

  <div class="sec-head">
    <h2>2. 일자별 장비 가동 추이 차트</h2>
    <div class="legend">
      <span><i class="dot" style="background:#2563eb;"></i> 정상 가동 (${upCount.toLocaleString()}건)</span>
      <span><i class="dot" style="background:#e11d48;"></i> 연결 끊김 (${downCount.toLocaleString()}건)</span>
    </div>
  </div>
  <div class="chart-card">${dailyChartHtml}</div>

  <div class="sec-head">
    <h2>3. 가동 상태 구성비 및 주요 장비별 가동률 분석</h2>
  </div>
  <div class="split-charts">
    <div class="chart-card" style="background:#ffffff;display:flex;align-items:center;justify-content:space-around;padding:10px;">
      <div style="position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center;">
        <svg width="110" height="110" viewBox="0 0 110 110" style="transform:rotate(-90deg);">
          <circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#e2e8f0" stroke-width="14" />
          ${upLen > 0 ? `<circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#2563eb" stroke-width="14" stroke-dasharray="${upLen} ${circum}" stroke-dashoffset="0" />` : ''}
          ${downLen > 0 ? `<circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#e11d48" stroke-width="14" stroke-dasharray="${downLen} ${circum}" stroke-dashoffset="${-upLen}" />` : ''}
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:8.5px;color:#64748b;">가동률</span>
          <span style="font-size:13.5px;font-weight:800;color:#0f172a;">${report.uptimeRate}%</span>
        </div>
      </div>
      <div style="font-size:10px;line-height:1.8;">
        <div><i class="dot" style="background:#2563eb;"></i> <strong>정상 가동:</strong> ${upCount.toLocaleString()}건 (${upPct}%)</div>
        <div><i class="dot" style="background:#e11d48;"></i> <strong>연결 끊김:</strong> ${downCount.toLocaleString()}건 (${downPct}%)</div>
        <div><i class="dot" style="background:#10b981;"></i> <strong>생존신호:</strong> ${report.keepAliveOkCount.toLocaleString()}건 (${kaPct}%)</div>
      </div>
    </div>
    <div class="chart-card">${deviceBarsHtml}</div>
  </div>

  <div class="sec-head">
    <h2>4. 일자별 상태 점검 상세 명세</h2>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>점검 일자</th>
        <th style="text-align:right;">총 점검 건수</th>
        <th style="text-align:right;">정상 가동 (Up)</th>
        <th style="text-align:right;">연결 끊김 (Down)</th>
        <th style="text-align:right;">생존신호 성공</th>
        <th style="text-align:right;">평균 가동률</th>
      </tr>
    </thead>
    <tbody>${dailyRowsHtml}</tbody>
  </table>

  <div class="sec-head">
    <h2>5. 단속장비별 상태 점검 명세 (상위 40대)</h2>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>장비번호</th>
        <th>장비명 (현장 위치)</th>
        <th>IP 주소</th>
        <th style="text-align:right;">점검 횟수</th>
        <th style="text-align:right;">정상 / 끊김</th>
        <th style="text-align:right;">가동률</th>
        <th style="text-align:right;">평균 지연</th>
      </tr>
    </thead>
    <tbody>${deviceRowsHtml}</tbody>
  </table>

  <div class="footer">
    <span>프로그램명: SystemCheck (무인교통단속장비 상태 점검기 v2.1.0)</span>
    <span>회사: ㈜ 이노네트웍스 | 제작자: 강홍선 (s_gain@naver.com)</span>
  </div>
</body>
</html>`;
}

export async function generateMonthlyReportPdf(
  report: MonthlyCheckStatsReport,
  outputPath: string,
): Promise<void> {
  const html = buildReportHtml(report);
  const printWin = new BrowserWindow({
    width: 794,
    height: 1123,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await printWin.loadURL(dataUrl);
    const pdfBuffer = await printWin.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
    });
    fs.writeFileSync(outputPath, pdfBuffer);
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.destroy();
    }
  }
}
