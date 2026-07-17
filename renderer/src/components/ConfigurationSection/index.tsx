import React from "react";
import GeneralTab from "./GeneralTab";
import DatabaseTab from "./DatabaseTab";
import SecurityTab from "./SecurityTab";
import EmailTab from "./EmailTab";
import AdvancedTab from "./AdvancedTab";
import ImportExport from "./ImportExport";
import useConfiguration from "../../hooks/useConfiguration";

export default function ConfigurationSection() {
  const cfg = useConfiguration();

  if (cfg.loading) return <div>Loading configuration...</div>;

  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">Configuration</h2>
      <div className="mt-2">
        <div className="flex flex-col gap-6">
          <GeneralTab config={cfg.config} update={cfg.updateField} />
          <DatabaseTab
            config={cfg.config}
            update={cfg.updateField}
            testDb={cfg.testDatabase}
          />
          <SecurityTab config={cfg.config} update={cfg.updateField} />
          <EmailTab config={cfg.config} update={cfg.updateField} />
          <AdvancedTab
            config={cfg.config}
            addVariable={cfg.addVariable}
            removeVariable={cfg.removeVariable}
            update={cfg.updateField}
          />
        </div>
        <div className="mt-4  gap-2">
          <ImportExport
            importEnv={cfg.importEnv}
            exportEnv={cfg.exportEnv}
            restoreDefaults={cfg.restoreDefault}
            save={cfg.save}
            cancel={cfg.load}
            dirty={cfg.dirty}
          />
        </div>
      </div>
    </section>
  );
}
