import { useEffect, useState } from 'react';
import type { ConfigData } from '../components/ConfigurationSection/types';

declare global {
  interface Window { electronAPI: any }
}

export default function useConfiguration() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConfigData>({ general: {}, db: {}, security: {}, email: {}, advanced: {} });
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await window.electronAPI.configurationLoad();
    if (res.success) setConfig(res.data);
    setDirty(false);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await window.electronAPI.configurationSave(config);
    setDirty(false);
    await load();
  };

  const importEnv = async () => {
    const res = await window.electronAPI.configurationImport();
    if (res.success) setConfig(res.data);
    setDirty(true);
  };

  const exportEnv = async () => {
    // Build content from current config by asking main to stringify via save flow
    await window.electronAPI.configurationSave(config);
    // After saving, ask main to export userData .env
    const env = await window.electronAPI.settingsGetEnv();
    await window.electronAPI.configurationExport(env.content);
  };

  const testDatabase = async (dbParts: any) => {
    return await window.electronAPI.configurationTestDatabase(dbParts);
  };

  const updateField = (path: string[], value: any) => {
    setConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let cur: any = copy;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] = cur[path[i]] || {};
      cur[path[path.length - 1]] = value;
      return copy;
    });
    setDirty(true);
  };

  const addVariable = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, advanced: { ...(prev.advanced || {}), [key]: value } }));
    setDirty(true);
  };

  const removeVariable = (key: string) => {
    setConfig((prev) => {
      const copy = { ...prev.advanced };
      delete copy[key];
      return { ...prev, advanced: copy };
    });
    setDirty(true);
  };

  return { loading, config, dirty, load, save, importEnv, exportEnv, testDatabase, updateField, addVariable, removeVariable };
}
