import { useState } from "react";
import { useStore } from "../_stores/useStore";

export default function UserMetaEditor({
  name,
  onSave,
}: {
  name: string;
  onSave: (nextName: string) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const setState = useStore.setState;

  const handleSave = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    onSave(trimmedName);
    setState({ name: trimmedName });
  };

  return (
    <div className="flex max-w-full items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2 py-1.5 sm:max-w-105">
      <input
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSave();
          }
        }}
        className="h-8 min-w-0 flex-1 rounded-full border border-slate-700 bg-slate-800 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
        placeholder="Your name"
      />
      <button
        onClick={handleSave}
        className="h-8 whitespace-nowrap rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 text-xs text-indigo-200 hover:opacity-90"
      >
        Rename
      </button>
    </div>
  );
}
