import React, { useState } from 'react';
import { GlobalNav, type NavTab } from './components/layout/GlobalNav';
import { StatusFooter } from './components/layout/StatusFooter';
import { DashboardView } from './features/dashboard/DashboardView';
import { DeviceManageView } from './features/devices/DeviceManageView';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';
import { useSystemCheckState } from './hooks/useSystemCheckState';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const {
    config,
    summary,
    devices,
    checkingDeviceId,
    toastMessage,
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
    <div className="h-screen overflow-hidden flex flex-col bg-[#f5f5f7] text-[#1d1d1f] select-none">
      <GlobalNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSchedulerRunning={summary.isSchedulerRunning}
        isCheckingNow={summary.isCheckingNow}
        onToggleScheduler={() => void toggleScheduler()}
        onRunAllNow={() => void runAllNow()}
      />

      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 bg-[#272729] text-white px-4 py-2.5 rounded-full text-[12px] font-medium border border-white/10">
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
            onToggleScheduler={() => void toggleScheduler()}
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

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={saveConfig}
            onRunCleanupNow={runCleanupNow}
          />
        )}
      </main>

      <StatusFooter />
    </div>
  );
};
