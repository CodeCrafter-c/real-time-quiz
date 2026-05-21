import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom"
import Dashboard from "./components/dashboard"
import Landing from "./components/Landing"
import Quiz from "./components/Quiz"
import Session from "./components/Session"

function ProtectedRoute({ children }) {
  const isAuth = document.cookie.includes("token")
  return isAuth ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:quizId" element={
            <ProtectedRoute>
                <Quiz />
            </ProtectedRoute>
        } />
        <Route path="/session/new/:sessionId" element={
            <ProtectedRoute>
                <Session />
            </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App