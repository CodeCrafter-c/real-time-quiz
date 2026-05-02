import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import socket from "../socket";

function Session() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_PATH;
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    async function handleStartSession() {
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/v1/users/create-session/Quiz/${quizId}`,
          {},
          { withCredentials: true }
        )
        socket.emit("join_session", { sessionId: res.data.session_id })
        setJoinCode(res.data.joinCode);
        setSessionId(res.data.session_id);
      } catch (err) {
        setError(err.response?.data?.message || "Could not start session")
      }
    }

    handleStartSession();

    // host joined the room successfully
    socket.on("session_joined", ({ role, sessionId }) => {
      console.log("joined as", role, sessionId)
    })

    // someone new joined
    socket.on("user_joined", ({ userId, socketId }) => {
      console.log("user joined", userId)
      setParticipants(prev => [...prev, userId])
    })

    socket.on("error", ({ message }) => {
      setError(message)
    })

    return () => {
      socket.off("session_joined")
      socket.off("user_joined")
      socket.off("error")
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <p className="text-4xl font-medium">Join using this code</p>
      <h1 className="text-6xl font-bold">{joinCode}</h1>
      <p className="text-gray-400 mt-2">Share this with your friends</p>
      {participants.length > 0 && (
        <p className="text-sm text-gray-500 mt-6">
          {participants.length} participant{participants.length > 1 ? "s" : ""} joined
        </p>
      )}
    </div>
  )
}

export default Session