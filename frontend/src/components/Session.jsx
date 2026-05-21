import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import Lobby from "./lobby";
import Question from "./question";
import Result from "./result";
import Leaderboard from "./leaderboard";

function Session() {
  const { sessionId } = useParams();

  const [gameState, setGameState] = useState({
    phase: "lobby",
    role: "",
    joinCode: "",
    participants: 0,
    error: "",
    question: null,
    options: [],
    result: null,
    leaderboard: [],
    answerCounts: null,
  });

  useEffect(() => {
    // FIX 1: socket has autoConnect:false — must connect before emitting
    if (!socket.connected) {
      socket.connect();
    }

    // FIX 2: emit join_session after ensuring connection
    socket.emit("join_session", { sessionId });

    socket.on("session_joined", ({ data }) => {
      setGameState(prev => ({
        ...prev,
        role: data.role,
        joinCode: data.joinCode || prev.joinCode,
        // participantsCount from store starts at 0; real count comes via user_joined
        participants: data.participantsCount ?? prev.participants,
        phase: "lobby",
      }));
    });

    // FIX 3: backend emits { userId }, NOT { participantsCount }
    // increment locally on each user_joined event
    socket.on("user_joined", ({data}) => {
      setGameState(prev=>({ ...prev, participants:data?.participantsCount??prev.participants+1}));
    });

    socket.on("question_started", (data) => {
      setGameState(prev => ({
        ...prev,
        phase: "question",
        question: data,
        options: [],
        result: null,
        answerCounts: null,
      }));
    });

    socket.on("options_revealed", ({ options }) => {
      setGameState(prev => ({
        ...prev,
        phase: "options",
        options: options,
      }));
    });

    // FIX 4: backend emits { totalResponses, totalParticipants, questionId }
    // NOT { counts } — update answerCounts with the correct shape
    socket.on("answer_stats_updated", (data) => {
      setGameState(prev => ({
        ...prev,
        answerCounts: {
          totalResponses: data.totalResponses,
          totalParticipants: data.totalParticipants,
          questionId: data.questionId,
        },
      }));
    });

    // FIX 5: show_results is the only results event (answer_result doesn't exist)
    // host gets: { counts, correctAnswer, totalAnswered, totalCorrect }
    // participant gets: { counts, correctAnswer, yourAnswer, isCorrect, points }
    socket.on("show_results", (data) => {
      setGameState(prev => ({
        ...prev,
        phase: "result",
        result: data,
      }));
    });

    // FIX 6: submitted_answer — let participant know their answer was received
    // (phase stays "options" until show_results arrives)
    socket.on("submitted_answer", () => {
      // no phase change needed here; Question component tracks answered locally
    });

    socket.on("leaderboard_data", (data) => {
      setGameState(prev => ({
        ...prev,
        phase: "leaderboard",
        leaderboard: data.leaderboard,
        totalParticipants: data.totalParticipants,
      }));
    });

    socket.on("error", ({ message }) => {
      setGameState(prev => ({ ...prev, error: message }));
    });

    return () => {
      socket.off("session_joined");
      socket.off("user_joined");
      socket.off("question_started");
      socket.off("options_revealed");
      socket.off("answer_stats_updated");
      socket.off("show_results");
      socket.off("submitted_answer");
      socket.off("leaderboard_data");
      socket.off("error");
    };
  }, [sessionId]);

  function handleStart() {
    socket.emit("start_question", { sessionId });
  }

  // FIX 7: host triggers leaderboard explicitly via get_leaderboard event
  function handleShowLeaderboard() {
    socket.emit("get_leaderboard", { sessionId });
  }

  const renderPhase = () => {
    switch (gameState.phase) {
      case "lobby":
        return <Lobby gameState={gameState} onStart={handleStart} />;
      case "question":
      case "options":
        return <Question gameState={gameState} socket={socket} sessionId={sessionId} />;
      case "result":
        return (
          <Result
            gameState={gameState}
            socket={socket}
            sessionId={sessionId}
            onShowLeaderboard={handleShowLeaderboard}
          />
        );
      case "leaderboard":
        return <Leaderboard gameState={gameState} socket={socket} sessionId={sessionId} />;
      default:
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-base-200 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl shadow-xl bg-base-100 rounded-box p-6 min-h-[600px]">
        {renderPhase()}
      </div>
    </div>
  );
}

export default Session;