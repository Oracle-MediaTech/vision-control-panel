import React from "react";

export default function EmailTab({ config, update }: any) {
  const email = config?.email || {};

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Email Settings</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Configure the SMTP server used for sending emails such as password
          resets, notifications, and system alerts.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* SMTP Host */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              SMTP Host
            </label>

            <input
              type="text"
              value={email.smtpHost || ""}
              onChange={(e) => update(["email", "smtpHost"], e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Address of your outgoing mail server.
            </p>
          </div>

          {/* SMTP Port */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              SMTP Port
            </label>

            <input
              type="number"
              value={email.smtpPort || ""}
              onChange={(e) => update(["email", "smtpPort"], e.target.value)}
              placeholder="465"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Common ports are <strong>465</strong> (SSL) or{" "}
              <strong>587</strong> (TLS).
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              SMTP Username
            </label>

            <input
              type="text"
              value={email.smtpUsername || ""}
              onChange={(e) =>
                update(["email", "smtpUsername"], e.target.value)
              }
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Username or email used to authenticate with the SMTP server.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              SMTP Password
            </label>

            <input
              type="password"
              value={email.smtpPassword || ""}
              onChange={(e) =>
                update(["email", "smtpPassword"], e.target.value)
              }
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <p className="text-xs text-zinc-500">
              Password or application-specific password for your SMTP account.
            </p>
          </div>

          {/* Secure */}
          <div className="md:col-span-2">
            <div className="flex items-start gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <input
                id="smtpSecure"
                type="checkbox"
                checked={!!email.smtpSecure}
                onChange={(e) =>
                  update(["email", "smtpSecure"], e.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />

              <div>
                <label
                  htmlFor="smtpSecure"
                  className="cursor-pointer text-sm font-medium text-zinc-800"
                >
                  Enable Secure SMTP (SSL/TLS)
                </label>

                <p className="mt-1 text-xs text-zinc-500">
                  Enable this if your SMTP provider requires SSL/TLS encryption.
                  This is recommended for most production environments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-800">
            Recommended Settings
          </h4>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-700">
            <li>Gmail: smtp.gmail.com — Port 465 (SSL) or 587 (TLS)</li>
            <li>Outlook: smtp.office365.com — Port 587</li>
            <li>Private Email: mail.yourdomain.com — Port 465</li>
            <li>Use App Passwords whenever your provider supports them.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
