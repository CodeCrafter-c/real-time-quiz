import { useEffect, useState } from "react";
import socket from "../socket";

function Question({ gameState, sessionId }) {
  const { role, question: quesData, options, answerCounts } = gameState;
  const {
    question,
    questionId,
    currentQuestionIndex,
    totalQuestions,
    title,
    revealAt,
    answerEndAt,
  } = quesData || {};

  const [answered, setAnswered] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [answerTimer, setAnswerTimer] = useState(0);

  useEffect(() => {
    setAnswered(false);
  }, [questionId]);

  useEffect(() => {
    function syncTimer() {
      const now = Date.now();
      if (!options || options.length === 0) {
        setQuestionTimer(Math.max(0, Math.ceil((revealAt - now) / 1000)));
      } else {
        setAnswerTimer(Math.max(0, Math.ceil((answerEndAt - now) / 1000)));
      }
    }
    syncTimer();
    const interval = setInterval(syncTimer, 250);
    return () => clearInterval(interval);
  }, [options, revealAt, answerEndAt]);

  function handleAnswer(i) {
    if (answered || answerTimer <= 0 || role === "host") return;
    setAnswered(true);
    socket.emit("submit_answer", { sessionId, questionId, answer: i });
  }

  const optionsVisible = options && options.length > 0;

  // Host sees question text + live response counter (from answer_stats_updated)
  if (role === "host") {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 h-full flex flex-col">
        <div className="text-center mb-8">
          <p className="text-sm text-base-content/60">{title}</p>
          <p className="text-sm text-base-content/60 mt-1">
            Question {currentQuestionIndex !== undefined ? currentQuestionIndex + 1 : 1} of{" "}
            {totalQuestions || 1}
          </p>
          <h2 className="text-3xl font-medium mt-4">{question}</h2>
        </div>

        {!optionsVisible ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <div className="text-5xl font-mono mb-4 p-8 bg-base-300 rounded-full w-32 h-32 flex items-center justify-center shadow-inner">
              {questionTimer}
            </div>
            <p className="text-base-content/60 animate-pulse">Revealing options shortly...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow gap-6">
            <span
              className={`text-2xl font-mono px-6 py-2 rounded-full ${
                answerTimer > 0
                  ? "bg-primary text-primary-content"
                  : "bg-error text-error-content"
              }`}
            >
              {answerTimer > 0 ? `${answerTimer}s left` : "Time's up!"}
            </span>

            {/* FIX: show live response stats from answer_stats_updated */}
            <div className="stats shadow bg-base-200 w-full max-w-sm">
              <div className="stat place-items-center">
                <div className="stat-title">Responses</div>
                <div className="stat-value">
                  {answerCounts?.totalResponses ?? 0}
                  <span className="text-base font-normal text-base-content/50">
                    {" "}/ {answerCounts?.totalParticipants ?? "?"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-base-content/60 text-sm">Waiting for participants to answer...</p>
          </div>
        )}
      </div>
    );
  }

  // Participant view
  return (
    <div className="max-w-xl mx-auto py-10 px-4 h-full flex flex-col">
      <div className="text-center mb-8">
        <p className="text-sm text-base-content/60">{title}</p>
        <p className="text-sm text-base-content/60 mt-1">
          Question {currentQuestionIndex !== undefined ? currentQuestionIndex + 1 : 1} of{" "}
          {totalQuestions || 1}
        </p>
        <h2 className="text-3xl font-medium mt-4">{question}</h2>
      </div>

      {!optionsVisible ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="text-5xl font-mono mb-4 p-8 bg-base-300 rounded-full w-32 h-32 flex items-center justify-center shadow-inner">
            {questionTimer}
          </div>
          <p className="text-base-content/60 animate-pulse">Options will be revealed shortly...</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow">
          <div className="text-center mb-6">
            <span
              className={`text-2xl font-mono px-6 py-2 rounded-full ${
                answerTimer > 0
                  ? "bg-primary text-primary-content"
                  : "bg-error text-error-content"
              }`}
            >
              {answerTimer > 0 ? `${answerTimer}s left` : "Time's up!"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-grow">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered || answerTimer <= 0}
                className={`btn btn-lg h-auto p-6 text-xl transition-all ${
                  answered || answerTimer <= 0
                    ? "btn-disabled opacity-60"
                    : "btn-primary hover:-translate-y-1"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {answered && (
            <p className="text-center text-success mt-8 text-lg font-medium">
              Answer submitted! Waiting for results...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Question;