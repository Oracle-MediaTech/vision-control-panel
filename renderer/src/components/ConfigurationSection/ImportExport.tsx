import React from "react";

export default function ImportExport({
  importEnv,
  exportEnv,
  restoreDefaults,
  save,
  cancel,
  dirty,
}: any) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5  shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Configuration Actions
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Import, export, restore defaults, or save your server configuration.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={importEnv}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Import .env
            </button>

            <button
              onClick={exportEnv}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Export .env
            </button>

            <button
              onClick={restoreDefaults}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
            >
              Restore Defaults
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={cancel}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={!dirty}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {dirty && (
        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            You have unsaved changes. Click <strong>Save Configuration</strong>{" "}
            to apply them to the server.
          </p>
        </div>
      )}
    </div>
  );
}
