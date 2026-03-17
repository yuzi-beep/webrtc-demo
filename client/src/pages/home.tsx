import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");

  const createRoom = () => {
    const roomId = crypto.randomUUID();
    navigate(`/room/${roomId}`);
  };

  const joinRoom = () => {
    const trimmed = roomInput.trim();
    if (trimmed) {
      const match = trimmed.match(/\/room\/(.+)$/);
      const roomId = match ? match[1] : trimmed;
      navigate(`/room/${roomId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-bg-primary relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top left, rgba(108,92,231,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.1) 0%, transparent 50%)",
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-accent/15 -top-[100px] -left-[100px] blur-[80px] animate-float" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-purple-500/12 -bottom-[80px] -right-[80px] blur-[80px] animate-float-delayed" />

      {/* Card */}
      <div className="relative z-10 bg-bg-glass backdrop-blur-[20px] border border-border-glass rounded-3xl p-12 text-center max-w-[480px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Logo */}
        <div className="w-[72px] h-[72px] mx-auto mb-6 gradient-primary rounded-2xl flex items-center justify-center text-[32px] shadow-[0_0_30px_rgba(108,92,231,0.3)]">
          📹
        </div>

        <h1 className="text-[28px] font-bold mb-2 gradient-text">
          WebRTC Meet
        </h1>
        <p className="text-[15px] text-text-secondary mb-9 leading-relaxed">
          Premium video conferencing — up to 4 participants,
          <br />
          no sign-up required.
        </p>

        {/* Create Button */}
        <button
          className="w-full py-4 px-8 text-base font-semibold text-white gradient-primary rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden tracking-wide hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(108,92,231,0.3)] active:translate-y-0 group"
          onClick={createRoom}
          id="create-room-btn"
        >
          <span className="absolute inset-0 gradient-shine opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative">✨ Create New Meeting</span>
        </button>

        {/* Join Section */}
        <div className="mt-6 pt-6 border-t border-border-glass">
          <p className="text-[13px] text-text-muted mb-3">
            Or join an existing meeting
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 py-3 px-4 text-sm font-sans text-text-primary bg-bg-secondary border border-border-glass rounded-lg outline-none transition-all duration-300 placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,92,231,0.15)]"
              type="text"
              placeholder="Paste room link or ID"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              id="join-room-input"
            />
            <button
              className="py-3 px-5 text-sm font-semibold text-text-primary bg-bg-tertiary border border-border-glass rounded-lg transition-all duration-300 hover:bg-bg-glass-hover hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={joinRoom}
              disabled={!roomInput.trim()}
              id="join-room-btn"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
