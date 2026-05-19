import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import socket from "../socket"

function ParticipantSession() {
  const { sessionId } = useParams()
  const [status, setStatus] = useState("joining")
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    socket.emit("join_session", { sessionId })

    socket.on("session_joined", ({ role }) => {
      console.log("joined as", role)
      setStatus("waiting")
    })

    // someone else joined the same room
    socket.on("user_joined", ({ userId }) => {
      setParticipantCount(prev => prev + 1)
    })


    socket.on("question_started", ({ question }) => {
      console.log("question started", question)
      // setStatus("question") — you'll handle this next
    })

    socket.on("error", ({ message }) => {
      console.log("error", message)
      setStatus("error")
    })

    return () => {
      socket.off("session_joined")
      socket.off("user_joined")
      socket.off("question_started")
      socket.off("error")
    }
  }, [sessionId])

  if (status === "joining") return <p>Joining...</p>
  if (status === "error") return <p>Could not join session</p>

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-medium">Waiting for host to start...</h1>
      {participantCount > 0 && (
        <p className="text-sm text-gray-400 mt-3">{participantCount} others in room</p>
      )}
    </div>
  )
}

export default ParticipantSession