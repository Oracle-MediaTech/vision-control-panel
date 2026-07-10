import React, { useState } from "react";

export default function AdvancedTab({
  config,
  addVariable,
  removeVariable,
  update,
}: any) {
  const advanced = config?.advanced || {};

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newKey.trim()) return;

    addVariable(newKey.trim(), newValue);

    setNewKey("");
    setNewValue("");
  };

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Advanced Configuration
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Configure additional environment variables that are not managed by the
          standard settings pages.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="font-medium text-amber-900">Advanced Users Only</h4>

        <p className="mt-2 text-sm text-amber-700">
          Changes made here are written directly into the application's
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">.env</code>
          file. Incorrect values may prevent the backend from starting.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h3 className="font-semibold">Custom Environment Variables</h3>
        </div>

        <div className="divide-y divide-zinc-200">
          {Object.entries(advanced).length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              No custom environment variables have been added.
            </div>
          )}

          {Object.entries(advanced).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4 p-5">
              <div className="w-64">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Variable
                </label>

                <input
                  disabled
                  value={key}
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
                />
              </div>

              <div className="flex-1">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Value
                </label>

                <input
                  value={String(value)}
                  onChange={(e) => update(["advanced", key], e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <button
                onClick={() => removeVariable(key)}
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold">Add New Variable</h3>

        <p className="mt-1 text-sm text-zinc-500">
          Add additional environment variables required by custom modules or
          integrations.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Variable Name
            </label>

            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              placeholder="MY_CUSTOM_VARIABLE"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Variable Value
            </label>

            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!newKey.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );
}
