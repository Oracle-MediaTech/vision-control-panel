import { Header } from './components/Header';
import { UrlSection } from './components/UrlSection';
import { ServerControls } from './components/ServerControls';
import { DatabaseSection } from './components/DatabaseSection';
import { DeploySection } from './components/DeploySection';
import { LogViewer } from './components/LogViewer';
import { usePM2Status, useLanInfo, useServerAction, useLogs, useDeploy, useDbDump } from './hooks/useElectron';
import type { DeployTarget } from './types';

export default function App() {
  const { status, refresh } = usePM2Status();
  const lanInfo = useLanInfo();
  const { loading, execute } = useServerAction();
  const logs = useLogs();
  const deploy = useDeploy();
  const dbDump = useDbDump();

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    await execute(action);
    setTimeout(refresh, 1500);
    if (action === 'start' && !logs.active) {
      logs.toggle();
    }
  };

  const handleStartDeploy = (target: DeployTarget) => {
    if (logs.active) logs.stop();
    deploy.start(target);
  };

  return (
    <div className="min-h-screen">
      <Header status={status} />
      <main className="p-5 px-6 flex flex-col gap-4 max-w-[900px] mx-auto w-full">
        <UrlSection info={lanInfo} />
        <ServerControls status={status} loading={loading} onAction={handleServerAction} />
        <DatabaseSection
          dumping={dbDump.dumping}
          lastResult={dbDump.lastResult}
          logs={dbDump.logs}
          onDump={dbDump.dump}
        />
        <DeploySection
          deploying={deploy.deploying}
          steps={deploy.steps}
          failedStep={deploy.failedStep}
          activeTarget={deploy.activeTarget}
          onStart={handleStartDeploy}
          onContinue={deploy.continueFromFailed}
          onCancel={deploy.cancel}
        />
        <LogViewer
          serverActive={logs.active}
          serverLogs={logs.lines}
          deployLogs={deploy.logs}
          deploying={deploy.deploying}
          onToggleServer={logs.toggle}
          onClearServer={logs.clear}
          onClearDeploy={deploy.clearLogs}
        />
      </main>
    </div>
  );
}
