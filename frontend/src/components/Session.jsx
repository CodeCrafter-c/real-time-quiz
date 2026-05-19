import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom";
import socket from "../socket";
import Lobby from "./lobby";
import Question from "./question";

function Session() {
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [options, setOptions] = useState([]);
  const [quesData, setQuesData] = useState({
    question:"",  
    questionId:"",
    currentQuestionIndex:0,
    totalQuestions:0,
    title:"",
    revealAt:0,
    answerEndAt:0
  });
  const {role,setRole}=useState("");
  const [joinCode,setJoinCode] = useState("");
  const {sessionId} = useParams()

  useEffect(() => {
    socket.emit("join_session", {sessionId})

    socket.on("session_joined", ({data}) => {
      console.log("joined as", data.role, data.sessionId)
      setRole(data.role);
      if(data.joinCode){
        setJoinCode(data.joinCode)
      }
      setParticipants(data.participants)
    })

    socket.on("user_joined", ({ userId }) => {
      console.log("joined",userId)
      setParticipants(prev => [...prev, userId])
    })

    socket.on("question_started", ({data}) => {
      console.log("question started", data)
      setQuesData(data);
      setOptions([])       
      setPhase("question")
    })

    socket.on("options_revealed", ({ options }) => {
      setOptions(options)
      setPhase("options")
    })

    socket.on("error", ({ message }) => {
      setError(message)
    })

    return () => {
      socket.off("session_joined")
      socket.off("user_joined")
      socket.off("question_started")
      socket.off("options_revealed")
      socket.off("error")
    }
  }, [])

  function handleStart() {
    socket.emit("start_question", { sessionId })
  }

  if (phase === "lobby") return (
    <Lobby
      role={role}
      joinCode={joinCode}
      participants={participants}
      onStart={handleStart}
      error={error}
    />
  )

  if (phase === "question" || phase === "options") return (
    <Question
      role={role}
      question={quesData.question}
      questionId={quesData.questionId}
      currentQuestionIndex={quesData.currentQuestionIndex}
      totalQuestions={quesData.totalQuestions}
      title={quesData.title}
      options={options}
      revealAt={quesData.revealAt}
      answerEndAt={quesData.answerEndAt}
    />
  )
}

export default Session