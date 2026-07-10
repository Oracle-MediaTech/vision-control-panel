import React from "react";

export default function EnvVariableRow({
  name,
  value,
  onChange,
  onDelete,
}: any) {
  return (
    <div className="flex gap-2 items-center">
      <input
        className="input w-1/3"
        value={name}
        onChange={(e) => onChange("key", e.target.value)}
      />
      <input
        className="input flex-1"
        value={value}
        onChange={(e) => onChange("value", e.target.value)}
      />
      <button className="btn" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
