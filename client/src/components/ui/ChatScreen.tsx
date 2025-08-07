import { useGameState } from "../../lib/stores/useGameState";

export default function ChatScreen() {
  const { setGamePhase } = useGameState();

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center p-4">
      <div className="game-card bg-white/95 backdrop-blur rounded-2xl w-full max-w-md text-center shadow-2xl border border-white/20">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Puppets AI</h1>
            <p className="text-purple-600 font-medium">Your Everyday AI Buddy</p>
          </div>

          {/* About Puppets AI */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">About Puppets AI</h2>
            <div className="text-gray-600 leading-relaxed mb-4 text-left space-y-3">
              <p>
                Puppets AI is your everyday AI buddy for web3 tasks, daily work, and fun games — all powered by a smart multi-agent system. With its drag-and-drop agent builder, anyone can create new skills for their AI friend.
              </p>
              <p>
                Puppets AI solves the messy agent UX by acting as a single gateway and simple interface for managing many agents in one place — no more juggling separate bots for each task.
              </p>
            </div>
            
            {/* Features Preview */}
            <div className="text-left space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Multi-agent system
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                Drag-and-drop builder
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Web3 & daily tasks
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                Single interface for all agents
              </div>
            </div>

            <div className="text-sm text-purple-600 font-medium">
              Chat feature coming soon! 🚀
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setGamePhase('start')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Back to Game
            </button>
            
            <button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-6 rounded-xl transition-all"
              disabled
            >
              Notify Me When Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}