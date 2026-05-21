export default function Result({ gameState, onShowLeaderboard }) {
  const { role, result, options } = gameState;

  if (role === "host") {
    return (
      <div className="flex flex-col items-center h-full">
        <h2 className="text-3xl font-bold mb-8">Question Results</h2>

        <div className="stats shadow bg-base-200 mb-10 w-full max-w-md">
          <div className="stat place-items-center">
            <div className="stat-title">Total Answered</div>
            <div className="stat-value">{result?.totalAnswered || 0}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">Total Correct</div>
            <div className="stat-value text-success">{result?.totalCorrect || 0}</div>
          </div>
        </div>

        <div className="w-full max-w-md space-y-4 mb-10">
          {result?.counts?.map((opt, i) => (
            <div key={i} className="flex flex-col mb-2">
              <div className="flex justify-between items-end mb-1">
                <span className={`font-medium text-lg ${i === result.correctAnswer ? "text-success" : ""}`}>
                  {opt.option}
                  {i === result.correctAnswer && (
                    <span className="ml-2 text-sm badge badge-success">Correct</span>
                  )}
                </span>
                <span className="text-base-content/70">{opt.count} votes</span>
              </div>
              <progress
                className="progress progress-primary w-full h-4"
                value={opt.count}
                max={result.totalAnswered || 1}
              />
            </div>
          ))}
        </div>

        {/* FIX: host must emit get_leaderboard to advance; this is the trigger */}
        <button
          onClick={onShowLeaderboard}
          className="btn btn-primary btn-lg w-full max-w-md"
        >
          Show Leaderboard
        </button>
      </div>
    );
  }

  // Participant view
  // options are preserved in gameState from the options phase
  const correctAnswerText =
    typeof result?.correctAnswer === "number" && options?.length
      ? options[result.correctAnswer]
      : null;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <h2
        className={`text-6xl font-bold mb-6 ${
          result?.isCorrect ? "text-success" : "text-error"
        }`}
      >
        {result?.isCorrect ? "Correct!" : "Incorrect"}
      </h2>

      {!result?.isCorrect && correctAnswerText && (
        <div className="bg-base-200 p-6 rounded-xl w-full max-w-md my-4 shadow-sm">
          <p className="text-lg text-base-content/70 mb-2">The correct answer was:</p>
          <p className="text-2xl font-semibold">{correctAnswerText}</p>
        </div>
      )}

      <div className="mt-8 p-6 bg-base-200 rounded-xl w-full max-w-md shadow-sm">
        <p className="text-lg text-base-content/70">Points Earned</p>
        <p className="text-5xl font-mono font-bold mt-2 text-primary">
          +{result?.points || 0}
        </p>
      </div>

      <p className="text-base-content/60 animate-pulse mt-8">
        Waiting for host to continue...
      </p>
    </div>
  );
}