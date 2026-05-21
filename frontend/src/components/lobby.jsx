export default function Lobby({ gameState, onStart }) {
  const { role, joinCode, participants, error } = gameState;

  if (role === "participant") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        <p className="text-4xl font-medium">Waiting for host to start the quiz</p>
        {/* FIX: participants starts at 0 and increments per user_joined event,
            show count only after at least 1 has joined */}
        <p className="text-sm text-base-content/60 mt-6">
          {participants} participant{participants !== 1 ? "s" : ""} in lobby
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {error && <p className="text-error text-sm mb-4">{error}</p>}
      <p className="text-4xl font-medium">Join using this code</p>
      <h1 className="text-6xl font-bold my-4">{joinCode}</h1>
      <p className="text-base-content/60 mt-2">Share this with your friends</p>
      <p className="text-sm text-base-content/60 mt-6">
        {participants} participant{participants !== 1 ? "s" : ""} joined
      </p>
      <button onClick={onStart} className="btn btn-primary mt-8">
        Start Quiz
      </button>
    </div>
  );
}