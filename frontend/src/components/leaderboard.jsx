export default function Leaderboard({ gameState, socket, sessionId }) {
  const { role, leaderboard } = gameState;

  const handleNextQuestion = () => {
    socket.emit("start_question", { sessionId });
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-primary">Leaderboard</h2>
      
      <div className="w-full bg-base-200 rounded-box p-4 shadow-inner flex-grow overflow-y-auto mb-8">
        {leaderboard && leaderboard.length > 0 ? (
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-lg">Rank</th>
                <th className="text-lg">Player</th>
                <th className="text-lg text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={player.userId} className={index < 3 ? "bg-base-100 font-bold" : ""}>
                  <td className="text-xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${player.rank}`}
                  </td>
                  <td className="text-lg">{`Player ${player.userId.substring(0, 4)}`}</td>
                  <td className="text-right text-lg font-mono text-primary">{player.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50 italic">
            No scores yet
          </div>
        )}
      </div>

      {role === "host" ? (
        <button 
          onClick={handleNextQuestion}
          className="btn btn-primary btn-lg w-full max-w-md"
        >
          Next Question
        </button>
      ) : (
        <p className="text-base-content/60 animate-pulse mt-4">
          Waiting for host to proceed...
        </p>
      )}
    </div>
  );
}
