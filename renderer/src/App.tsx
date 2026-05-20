import { Header } from './components/Header';
import { UrlSection } from './components/UrlSection';
import { ServerControls } from './components/ServerControls';
import { DeploySection } from './components/DeploySection';
import { LogViewer } from './components/LogViewer';
import { usePM2Status, useLanInfo, useServerAction, useLogs, useDeploy } from './hooks/useElectron';

export default function App() {
  const { status, refresh } = usePM2Status();
  const lanInfo = useLanInfo();
  const { loading, execute } = useServerAction();
  const logs = useLogs();
  const deploy = useDeploy();

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    await execute(action);
    setTimeout(refresh, 1500);
    if (action === 'start' && !logs.active) {
      logs.toggle();
    }
  };

  const handleStartDeploy = () => {
    if (logs.active) logs.stop();
    deploy.start();
  };

  const handleClearLogs = () => {
    logs.clear();
    deploy.clearLogs();
  };

  const allLogs = deploy.deploying || deploy.logs.length > 0 ? deploy.logs : logs.lines;

  return (
    <div className="min-h-screen">
      <Header status={status} />
      <main className="p-5 px-6 flex flex-col gap-4 max-w-[900px] mx-auto w-full">
        <UrlSection info={lanInfo} />
        <ServerControls status={status} loading={loading} onAction={handleServerAction} />
        <DeploySection
          deploying={deploy.deploying}
          steps={deploy.steps}
          onStart={handleStartDeploy}
          onCancel={deploy.cancel}
        />
        <LogViewer
          active={logs.active || deploy.deploying || deploy.logs.length > 0}
          lines={allLogs}
          onToggle={deploy.deploying ? () => {} : logs.toggle}
          onClear={handleClearLogs}
        />
      </main>
    </div>
  );
}
