import React, { useState } from "react";

export default function DatabaseTab({ config, update, testDb }: any) {
  const db = config?.db || {};

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    const res = await testDb({
      username: db.username,
      password: db.password,
      host: db.host,
      port: db.port,
      database: db.database,
      schema: db.schema,
    });

    setTesting(false);

    if (res.success) {
      setResult({
        success: true,
        message: "Successfully connected to the database.",
      });
    } else {
      setResult({
        success: false,
        message: res.error || "Unable to connect to the database.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Database Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configure the PostgreSQL database connection used by the backend.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Host */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Host</label>

            <input
              type="text"
              value={db.host || ""}
              onChange={(e) => update(["db", "host"], e.target.value)}
              placeholder="localhost"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Database server hostname or IP address.
            </p>
          </div>

          {/* Port */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Port</label>

            <input
              type="number"
              value={db.port || ""}
              onChange={(e) => update(["db", "port"], e.target.value)}
              placeholder="5432"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">PostgreSQL server port.</p>
          </div>

          {/* Database */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Database
            </label>

            <input
              type="text"
              value={db.database || ""}
              onChange={(e) => update(["db", "database"], e.target.value)}
              placeholder="visiondb"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Name of the database to connect to.
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Username
            </label>

            <input
              type="text"
              value={db.username || ""}
              onChange={(e) => update(["db", "username"], e.target.value)}
              placeholder="postgres"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">Database user account.</p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Password
            </label>

            <input
              type="password"
              value={db.password || ""}
              onChange={(e) => update(["db", "password"], e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Password for the selected database user.
            </p>
          </div>

          {/* Schema */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Schema</label>

            <input
              type="text"
              value={db.schema || ""}
              onChange={(e) => update(["db", "schema"], e.target.value)}
              placeholder="public"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              PostgreSQL schema used by Prisma.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6">
          <button
            onClick={handleTest}
            disabled={testing}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {testing ? "Testing Connection..." : "Test Connection"}
          </button>

          {result && (
            <div
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
