import { useState, useEffect, useCallback, useRef } from 'react';
import type { PM2Status, LanInfo, DeployProgress } from '../types';

const api = window.electronAPI;

export function usePM2Status(pollInterval = 5000) {
  const [status, setStatus] = useState<PM2Status>({
    running: false, pid: null, uptime: 0, memory: 0, restarts: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const s = await api.pm2Status();
      setStatus(s);
    } catch {
      setStatus({ running: false, pid: null, uptime: 0, memory: 0, restarts: 0 });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollInterval);
    return () => clearInterval(id);
  }, [refresh, pollInterval]);

  return { status, refresh };
}

export function useLanInfo() {
  const [info, setInfo] = useState<LanInfo | null>(null);

  useEffect(() => {
    api.getLanInfo().then(setInfo).catch(console.error);
  }, []);

  return info;
}

export function useServerAction() {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    setLoading(true);
    try {
      let result;
      if (action === 'start') result = await api.pm2Start();
      else if (action === 'stop') result = await api.pm2Stop();
      else result = await api.pm2Restart();

      if (result && !result.success) {
        alert(`Action failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
    setTimeout(() => setLoading(false), 1500);
  }, []);

  return { loading, execute };
}

export function useLogs() {
  const [active, setActive] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    api.onPm2Log((line: string) => {
      setLines(prev => {
        const next = [...prev, line];
        return next.length > 500 ? next.slice(-500) : next;
      });
    });
  }, []);

  const toggle = useCallback(() => {
    if (!active) {
      api.pm2StartLogs();
      setActive(true);
    } else {
      api.pm2StopLogs();
      setActive(false);
    }
  }, [active]);

  const clear = useCallback(() => {
    api.pm2StopLogs();
    setLines([]);
    if (active) {
      setTimeout(() => api.pm2StartLogs(), 100);
    }
  }, [active]);
  const stop = useCallback(() => {
    api.pm2StopLogs();
    setActive(false);
  }, []);

  return { active, lines, toggle, clear, stop, setLines };
}

export function useDeploy() {
  const [deploying, setDeploying] = useState(false);
  const [steps, setSteps] = useState<Record<number, string>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [failedStep, setFailedStep] = useState<number | null>(null);
  const deployingRef = useRef(false);

  useEffect(() => {
    api.onDeployProgress((data: DeployProgress) => {
      setSteps(prev => ({ ...prev, [data.step]: data.status }));
      if (data.status === 'error') {
        setFailedStep(data.step);
      }
    });

    api.onDeployLog((line: string) => {
      setLogs(prev => {
        const next = [...prev, line];
        return next.length > 500 ? next.slice(-500) : next;
      });
    });

    api.onDeployComplete((data) => {
      deployingRef.current = false;
      setDeploying(false);
      if (data.success) {
        setLogs(prev => [...prev, 'Deploy completed successfully!']);
        setFailedStep(null);
      } else {
        setLogs(prev => [...prev, `Deploy failed: ${data.error || 'Unknown error'}`]);
      }
    });
  }, []);

  const start = useCallback(() => {
    if (deployingRef.current) return;
    deployingRef.current = true;
    setDeploying(true);
    setSteps({});
    setLogs([]);
    setFailedStep(null);
    api.deployStart();
  }, []);

  const continueFromFailed = useCallback(() => {
    if (deployingRef.current || failedStep === null) return;
    deployingRef.current = true;
    setDeploying(true);
    setSteps(prev => {
      const next = { ...prev };
      delete next[failedStep];
      return next;
    });
    setLogs([]);
    setFailedStep(null);
    api.deployContinue(failedStep);
  }, [failedStep]);

  const cancel = useCallback(() => {
    api.deployCancel();
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { deploying, steps, logs, start, continueFromFailed, failedStep, cancel, clearLogs };
}
