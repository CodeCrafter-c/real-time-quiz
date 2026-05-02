import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket.js";
import axios from "axios";
function Dashboard() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [content,setContent]=useState([]);
  // const [poll,setPoll]=useState([]);
  const navigate = useNavigate();
  async function handleJoin() {
    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }
    if (joinCode.length !== 6 || !/^\d+$/.test(joinCode)) {
      setError("Code must be 6 digits");
      return;
    }

    setError("");
    try{
    const res=await axios.post(`${import.meta.env.VITE_BACKEND_PATH}/api/v1/users/join-session`, {
      joinCode
    }, { withCredentials: true })
    if (res.data.session_id) {
      navigate(`/session/participants/${res.data.session_id}`);
    } else {
      setError(res.data.message || "Something went wrong");
    }
    }catch(err){
      setError(err.response?.data?.message || "Something went wrong");
    }
  }




useEffect(() => {
  async function fetchContent() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_PATH}/api/v1/users/me`,
        { withCredentials: true }
      );
      const content = res.data.content;
      setContent(content);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  fetchContent();
}, []);

  console.log("content ",content)
  return (
  <div className="max-w-xl mx-auto py-10 px-4">

    <div className="mb-8">
      <p className="text-sm text-gray-400">Welcome back</p>
      <h1 className="text-2xl font-medium">Dashboard</h1>
    </div>

    {/* Your content */}
    {content.filter(i => i.type === "quiz").length > 0 && (
  <div className="mb-4">
    <p className="text-xs text-gray-400 mb-2">Quizzes</p>
    {content.filter(i => i.type === "quiz").map(q => (
      <div key={q.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 mb-2">
        <span className="text-sm">{q.title}</span>
        <button
          onClick={() => navigate(`/quiz/${q.id}`)}
          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
        >
          Open
        </button>
      </div>
    ))}
  </div>
)}

{content.filter(i => i.type === "poll").length > 0 && (
  <div className="mb-4">
    <p className="text-xs text-gray-400 mb-2">Polls</p>
    {content.filter(i => i.type === "poll").map(p => (
      <div key={p.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 mb-2">
        <span className="text-sm">{p.title}</span>
        <button
          onClick={() => navigate(`/poll/${p.id}`)}
          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
        >
          Open
        </button>
      </div>
    ))}
  </div>
)}

    {/* Join section */}
    <div className="border border-gray-200 rounded-xl p-5 mb-4">
      <p className="text-sm font-medium text-gray-500 mb-3">Join a session</p>
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={joinCode}
          onChange={e => {
            setError("");
            setJoinCode(e.target.value.replace(/\D/g, ""));
          }}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest"
        />
        <button
          onClick={handleJoin}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Join
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>

    {/* Create section */}
    <p className="text-sm font-medium text-gray-500 mt-6 mb-3">Create new</p>
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Quiz", desc: "Multiple choice", path: "/create/quiz" },
        { label: "Poll", desc: "Audience voting", path: "/create/poll" },
        { label: "Open ended", desc: "Free text", path: "/create/open-ended" },
      ].map(({ label, desc, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex flex-col items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left"
        >
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-gray-400 mt-1">{desc}</span>
        </button>
      ))}
    </div>

  </div>
);
}

export default Dashboard;