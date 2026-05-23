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
    totalQuestions: 0,
  });

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // handles both first connect and reconnects
    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
    });

    // emit immediately for the case socket is already connected
    if (socket.connected) {
      socket.emit("join_session", { sessionId });
    }

    socket.on("session_joined", ({ data }) => {
      setGameState(prev => ({
        ...prev,
        role: data.role,
        joinCode: data.joinCode || prev.joinCode,
        participants: data.participantsCount ?? prev.participants,
        // no hardcoded phase — let phase replay events handle it
      }));
    });

    socket.on("user_joined", ({ participantsCount }) => {
      setGameState(prev => ({ ...prev, participants: participantsCount }));
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

    socket.on("options_revealed", ({ questionId, options }) => {
      setGameState(prev => ({
        ...prev,
        phase: "options",
        options: options,
      }));
    });

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

    socket.on("show_results", (data) => {
      setGameState(prev => ({
        ...prev,
        phase: "result",
        result: data,
      }));
    });

    socket.on("submitted_answer", () => {
      // no phase change — Question component tracks answered locally
    });

    socket.on("leaderboard_data", (data) => {
      setGameState(prev => ({
        ...prev,
        phase: "leaderboard",
        leaderboard: data.leaderboard,
        totalParticipants: data.totalParticipants,
        totalQuestions: data.totalQuestions,
      }));
    });

    socket.on("error", ({ message }) => {
      setGameState(prev => ({ ...prev, error: message }));
    });

    return () => {
      socket.off("connect");
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