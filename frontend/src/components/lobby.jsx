
export default function Lobby({role, joinCode, participants, onStart, error }) {

  if(role==="participant"){
    return(
      <div className="flex flex-col items-center justify-center h-screen">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <p className="text-4xl font-medium">Waiting for host to start the quiz</p>
        {participants.length > 0 && (
          <p className="text-sm text-gray-500 mt-6">
            {participants.length} participant{participants.length > 1 ? "s" : ""} joined
          </p>
        )}
      </div>
    )
  }

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
      <button
        onClick={onStart}
        className="mt-6 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
      >
        Start Quiz
      </button>
    </div>
  )
}