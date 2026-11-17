import React, { useState } from 'react';
import { GlobalNav, type NavTab } from './components/layout/GlobalNav';
import { StatusFooter } from './components/layout/StatusFooter';
import { DashboardView } from './features/dashboard/DashboardView';
import { DeviceManageView } from './features/devices/DeviceManageView';
import { HistoryView } from './features/history/HistoryView';
import { MonthlyStatsView } from './features/stats/MonthlyStatsView';
import { RealtimeLogsView } from './features/logs/RealtimeLogsView';
import { SettingsView } from './features/settings/SettingsView';
import { ProgramInfoView } from './features/about/ProgramInfoView';
import { useSystemCheckState } from './hooks/useSystemCheckState';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const {
    config,
    summary,
    devices,
    checkingDeviceId,
    toastMessage,
    showToast,
    toggleScheduler,
    runAllNow,
    runSingleDevice,
    upsertDevice,
    deleteDevice,
    reloadCsv,
    importCsv,
    exportCsv,
    connectMstsc,
    connectVnc,
    saveConfig,
    runCleanupNow,
  } = useSystemCheckState();

  return (
    <div className="h-screen overflow-hidden flex bg-[#f1f5f9] text-[#0f172a] select-none">
      <GlobalNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSchedulerRunning={summary.isSchedulerRunning}
        isCheckingNow={summary.isCheckingNow}
        onToggleScheduler={() => void toggleScheduler()}
        onRunAllNow={() => void runAllNow()}
      />

      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {toastMessage && (
          <div className="fixed bottom-10 right-6 z-50 bg-[#0f172a] text-white px-4 py-2 rounded-[8px] text-[12px] font-medium border border-[#334155] apple-product-shadow">
            {toastMessage}
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              devices={devices}
              checkingDeviceId={checkingDeviceId}
              onRunAllNow={() => void runAllNow()}
              onRunSingleDevice={(id) => void runSingleDevice(id)}
              onConnectMstsc={(ip, port) => void connectMstsc(ip, port)}
              onConnectVnc={(ip, port) => void connectVnc(ip, port)}
            />
          )}

          {activeTab === 'devices' && (
            <DeviceManageView
              devices={devices}
              onUpsertDevice={upsertDevice}
              onDeleteDevice={deleteDevice}
              onReloadCsv={reloadCsv}
              onImportCsv={importCsv}
              onExportCsv={exportCsv}
            />
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'stats' && <MonthlyStatsView onStatusMessage={showToast} />}

          {activeTab === 'logs' && (
            <RealtimeLogsView
              logDir={config?.paths.logDir ?? './log'}
              onStatusMessage={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={saveConfig}
              onRunCleanupNow={runCleanupNow}
            />
          )}

          {activeTab === 'about' && (
            <ProgramInfoView
              onRunAllNow={() => void runAllNow()}
              onRunCleanupNow={() => void runCleanupNow()}
              onStatusMessage={showToast}
            />
          )}
        </main>

        <StatusFooter />
      </div>
    </div>
  );
};
