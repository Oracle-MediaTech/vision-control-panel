import React from "react";

function randomSecret(len = 32) {
  const arr = new Uint8Array(len);

  if (
    typeof window !== "undefined" &&
    (window.crypto || (window as any).msCrypto)
  ) {
    (window.crypto || (window as any).msCrypto).getRandomValues(arr as any);
  } else {
    for (let i = 0; i < len; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(arr)
    .map((b) => ("0" + b.toString(16)).slice(-2))
    .join("");
}

export default function SecurityTab({ config, update }: any) {
  const security = config?.security || {};

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Security Settings
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Configure authentication and JWT security for the backend.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6">
          {/* JWT Secret */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              JWT Secret Key
            </label>

            <div className="flex gap-3">
              <input
                type="text"
                value={security.jwtSecret || ""}
                onChange={(e) =>
                  update(["security", "jwtSecret"], e.target.value)
                }
                placeholder="JWT Secret"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              <button
                type="button"
                onClick={() =>
                  update(["security", "jwtSecret"], randomSecret(32))
                }
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-100"
              >
                Generate
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Used to sign and verify JWT tokens. Keep this value secret and
              never share it publicly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Access Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Access Token Expiry
              </label>

              <input
                type="number"
                value={security.accessTokenExpiry || ""}
                onChange={(e) =>
                  update(["security", "accessTokenExpiry"], e.target.value)
                }
                placeholder="720"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              <p className="text-xs text-zinc-500">
                Expiration time for access tokens (in minutes).
              </p>
            </div>

            {/* Refresh Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Refresh Token Expiry
              </label>

              <input
                type="number"
                value={security.refreshTokenExpiry || ""}
                onChange={(e) =>
                  update(["security", "refreshTokenExpiry"], e.target.value)
                }
                placeholder="1440"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              <p className="text-xs text-zinc-500">
                Expiration time for refresh tokens (in minutes).
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-800">
              Security Recommendation
            </h4>

            <p className="mt-1 text-sm text-amber-700">
              Changing the JWT secret will immediately invalidate all existing
              user sessions. Users will be required to log in again after the
              server restarts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
