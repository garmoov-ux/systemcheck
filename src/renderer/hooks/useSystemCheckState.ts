import { useState, useEffect, useCallback } from 'react';
import type {
  CheckerSummary,
  DeviceRecord,
  DeviceUpsertInput,
  SystemCheckAppConfig,
} from '@shared/types/domain';

export function useSystemCheckState() {
  const [config, setConfig] = useState<SystemCheckAppConfig | null>(null);
  const [summary, setSummary] = useState<CheckerSummary>({
    isSchedulerRunning: false,
    isCheckingNow: false,
    totalDevices: 0,
    upDevices: 0,
    downDevices: 0,
    pingOkCount: 0,
    msOpenCount: 0,
    vncOpenCount: 0,
    keepAliveSuccessCount: 0,
    checkedProgress: 0,
    completedCycles: 0,
    lastCycleStartedAt: null,
    lastCycleCompletedAt: null,
    lastCycleDurationMs: null,
    nextCheckAt: null,
    intervalSec: 100,
  });
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [checkingDeviceId, setCheckingDeviceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const refreshInitialData = useCallback(async () => {
    const [cfgRes, sumRes, devRes] = await Promise.all([
      window.systemCheckApi.getConfig(),
      window.systemCheckApi.getCheckerSummary(),
      window.systemCheckApi.listDevices(),
    ]);
    if (cfgRes.success && cfgRes.data) setConfig(cfgRes.data);
    if (sumRes.success && sumRes.data) setSummary(sumRes.data);
    if (devRes.success && devRes.data) setDevices(devRes.data);
  }, []);

  useEffect(() => {
    void refreshInitialData();

    const unsubSummary = window.systemCheckApi.onSummaryUpdated((nextSummary) => {
      setSummary(nextSummary);
    });

    const unsubDevice = window.systemCheckApi.onDeviceUpdated((updatedDevice) => {
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === updatedDevice.deviceId);
        if (idx === -1) return [...prev, updatedDevice];
        const next = [...prev];
        next[idx] = updatedDevice;
        return next;
      });
    });

    return () => {
      unsubSummary();
      unsubDevice();
    };
  }, [refreshInitialData]);

  const toggleScheduler = useCallback(async () => {
    if (summary.isSchedulerRunning) {
      const res = await window.systemCheckApi.stopChecker();
      if (res.success && res.data) {
        setSummary(res.data);
        showToast('자동 주기 점검이 일시정지되었습니다.');
      }
    } else {
      const res = await window.systemCheckApi.startChecker();
      if (res.success && res.data) {
        setSummary(res.data);
        showToast('자동 주기 점검을 시작했습니다.');
      }
    }
  }, [summary.isSchedulerRunning, showToast]);

  const runAllNow = useCallback(async () => {
    if (summary.isCheckingNow) return;
    showToast('전체 장비 즉시 점검을 시작합니다.');
    await window.systemCheckApi.runAllNow();
  }, [summary.isCheckingNow, showToast]);

  const runSingleDevice = useCallback(
    async (deviceId: string) => {
      setCheckingDeviceId(deviceId);
      try {
        const res = await window.systemCheckApi.runSingleDevice(deviceId);
        if (res.success && res.data) {
          showToast(
            `${deviceId} 점검 완료: ${res.data.status === 'Up' ? '정상 작동' : '연결 실패'}`,
          );
        } else if (res.error) {
          showToast(res.error);
        }
      } finally {
        setCheckingDeviceId(null);
      }
    },
    [showToast],
  );

  const upsertDevice = useCallback(
    async (input: DeviceUpsertInput): Promise<boolean> => {
      const res = await window.systemCheckApi.upsertDevice(input);
      if (res.success && res.data) {
        setDevices(res.data);
        const sumRes = await window.systemCheckApi.getCheckerSummary();
        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        showToast(`장비(${input.deviceId}) 정보가 저장되었습니다.`);
        return true;
      }
      showToast(res.error ?? '장비 저장 실패');
      return false;
    },
    [showToast],
  );

  const deleteDevice = useCallback(
    async (deviceId: string) => {
      const res = await window.systemCheckApi.deleteDevice(deviceId);
      if (res.success && res.data) {
        setDevices(res.data);
        const sumRes = await window.systemCheckApi.getCheckerSummary();
        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        showToast(`장비(${deviceId})가 목록에서 삭제되었습니다.`);
      } else if (res.error) {
        showToast(res.error);
      }
    },
    [showToast],
  );

  const reloadCsv = useCallback(async () => {
    const res = await window.systemCheckApi.reloadDevicesCsv();
    if (res.success && res.data) {
      setDevices(res.data);
      showToast(`장비 목록 파일에서 ${res.data.length}대 장비를 다시 불러왔습니다.`);
    } else if (res.error) {
      showToast(res.error);
    }
  }, [showToast]);

  const importCsv = useCallback(async () => {
    const res = await window.systemCheckApi.importDevicesCsv();
    if (res.success && res.data) {
      setDevices(res.data);
      showToast(`외부 파일에서 ${res.data.length}대 장비를 가져왔습니다.`);
    } else if (res.error) {
      showToast(res.error);
    }
  }, [showToast]);

  const exportCsv = useCallback(async () => {
    const res = await window.systemCheckApi.exportDevicesCsv();
    if (res.success && res.data) {
      showToast(`장비 목록 파일이 저장되었습니다: ${res.data}`);
    } else if (res.error) {
      showToast(res.error);
    }
  }, [showToast]);

  const connectMstsc = useCallback(
    async (ip: string, portMS: number) => {
      const res = await window.systemCheckApi.connectMstsc(ip, portMS);
      if (res.success) {
        showToast(`원격 데스크톱 연결 실행 (${ip}:${portMS})`);
      } else if (res.error) {
        showToast(res.error);
      }
    },
    [showToast],
  );

  const connectVnc = useCallback(
    async (ip: string, portVNC: number) => {
      const res = await window.systemCheckApi.connectVnc(ip, portVNC);
      if (res.success) {
        showToast(`원격 제어(VNC) 연결 실행 (${ip}:${portVNC})`);
      } else if (res.error) {
        showToast(res.error);
      }
    },
    [showToast],
  );

  const saveConfig = useCallback(
    async (nextConfig: SystemCheckAppConfig) => {
      const res = await window.systemCheckApi.saveConfig(nextConfig);
      if (res.success && res.data) {
        setConfig(res.data);
        showToast('환경 설정이 저장되었습니다.');
      } else if (res.error) {
        showToast(res.error);
      }
    },
    [showToast],
  );

  const runCleanupNow = useCallback(async () => {
    const res = await window.systemCheckApi.runRetentionCleanupNow();
    if (res.success && res.data) {
      const { deletedLogFiles, deletedDbRows } = res.data;
      showToast(`오래된 데이터 정리 완료 (로그 ${deletedLogFiles}개, 이력 ${deletedDbRows}건 삭제)`);
    } else if (res.error) {
      showToast(res.error);
    }
  }, [showToast]);

  return {
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
  };
}
