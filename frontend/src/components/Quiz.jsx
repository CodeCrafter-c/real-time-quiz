import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"

function Quiz() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const BACKEND_URL = import.meta.env.VITE_BACKEND_PATH
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/quiz/${quizId}`, {
          withCredentials: true
        })
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [])

  async function handleStartSession() {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/v1/users/create-session/Quiz/${quizId}`, {}, {
        withCredentials: true
      })

      navigate(`/session/new/${res.data.sessionId}`, {
        state: {
          role: "host",
          joinCode: res.data.joinCode,
          sessionId: res.data.sessionId
        }
      })
    }
    catch (err) {
      setError(err.response?.data?.message || "cannot start a session right now!")
    }
  }

  if (loading) return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  if (error) return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <p className="text-sm text-red-500">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <p className="text-sm text-gray-400">Quiz not found</p>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto py-10 px-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Quiz</p>
          <h1 className="text-2xl font-medium">{data.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{data.questions?.length} questions</p>
        </div>
        <button
          onClick={handleStartSession}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Start session
        </button>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {data.questions?.map((q, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium mb-3">
              <span className="text-gray-400 mr-2">{i + 1}.</span>
              {q.question}
            </p>
            <ul className="flex flex-col gap-2">
              {q.options.map((option, j) => (
                <li
                  key={j}
                  className={`text-sm px-3 py-2 rounded-lg border ${
                    j === q.correctAnswer
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-gray-100 text-gray-600"
                  }`}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Quiz