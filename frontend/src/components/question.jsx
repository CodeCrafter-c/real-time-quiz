


import { useEffect, useState } from "react";
import socket from "../socket";

function Question({ question, questionId, currentQuestionIndex, totalQuestions, title, options, sessionId,revealAt,answerEndAt }) {
  const [answered, setAnswered] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [answerTimer, setAnswerTimer] = useState(0);
  
  useEffect(() => {
    if (options.length > 0) return 

    const questionTimer = Math.max(0, Math.ceil((revealAt - Date.now()) / 1000))
    if (questionTimer === 0) {
      socket.emit("reveal_options", { sessionId, questionId })
      return
    }
    setQuestionTimer(questionTimer)
  }, [options])

  // 20s timer — starts only after options are revealed
  useEffect(() => {
    if (options.length === 0) return // options not revealed yet, don't start

    const answerTimer = Math.max(0, Math.ceil((answerEndAt - Date.now()) / 1000))
    if (answerTimer === 0) return // time up
    setAnswerTimer(answerTimer)
  }, [options])

  // reset everything when question changes
  useEffect(() => {
    setQuestionTimer(0)
    setAnswerTimer(0)
    setAnswered(false)
  }, [questionId])

  useEffect(() => {
    if (!revealAt) return;
    const questionTimer = Math.max(0, Math.ceil((revealAt - Date.now()) / 1000));
    setQuestionTimer(questionTimer);
    if (questionTimer === 0) socket.emit("reveal_options", { sessionId, questionId });
  }, [revealAt]);

  function handleAnswer(i) {
    if (answered || answerTimer === 0) return
    setAnswered(true)
    socket.emit("submit_answer", { sessionId, questionId, answer: i })
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-sm text-gray-400 mt-1">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </p>
      <h2 className="text-2xl font-medium mt-4 mb-6">{question}</h2>

      {options.length === 0 ? (
        <>
          <p className="text-gray-400 mb-2">Options will be revealed shortly...</p>
          <p className="text-sm text-gray-500">{questionTimer}s</p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {answerTimer > 0 ? `${answerTimer}s to answer` : "Time up"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered || answerTimer === 0}
                className={`p-4 border rounded-xl text-sm text-left ${
                  answered || answerTimer === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && <p className="text-sm text-gray-400 mt-4">Answer submitted</p>}
        </>
      )}
    </div>
  )
}

export default Question