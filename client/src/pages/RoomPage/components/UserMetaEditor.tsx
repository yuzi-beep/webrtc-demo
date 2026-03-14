import { useEffect, useState } from "react";

export default function UserMetaEditor({
  token,
  name,
  onChangeName,
}: {
  token: string;
  name: string;
  onChangeName: (nextName: string) => void;
}) {
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  const handleSave = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    onChangeName(trimmedName);
  };

  return (
    <div className="flex items-center gap-2 bg-bg-glass border border-border-glass rounded-full px-2 py-1.5 max-w-[420px]">
      <span className="text-[11px] text-text-secondary whitespace-nowrap px-2">
        {token.slice(0, 8)}
      </span>
      <input
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSave();
          }
        }}
        className="h-8 min-w-0 flex-1 rounded-full px-3 text-xs bg-bg-secondary border border-border-glass text-text-primary placeholder:text-text-secondary focus:outline-none"
        placeholder="Your name"
      />
      <button
        onClick={handleSave}
        className="h-8 px-3 rounded-full text-xs bg-accent/20 border border-accent text-accent hover:opacity-90 whitespace-nowrap"
      >
        Rename
      </button>
    </div>
  );
}
