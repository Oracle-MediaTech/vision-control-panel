import React from "react";

export default function GeneralTab({ config, update }: any) {
  const general = config?.general || {};

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          General Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configure the basic application settings.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Application Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Application Name
            </label>

            <input
              type="text"
              value={general.applicationName || ""}
              onChange={(e) =>
                update(["general", "applicationName"], e.target.value)
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Vision Control Panel"
            />

            <p className="text-xs text-zinc-500">
              Display name used throughout the application.
            </p>
          </div>

          {/* Port */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Server Port
            </label>

            <input
              type="number"
              value={general.port || ""}
              onChange={(e) => update(["general", "port"], e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="3030"
            />

            <p className="text-xs text-zinc-500">
              Port the backend server will listen on.
            </p>
          </div>

          {/* NODE_ENV */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">
              Environment
            </label>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">NODE_ENV</p>
                <p className="text-xs text-zinc-500">
                  This value is fixed in production.
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {general.nodeEnv || "production"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
