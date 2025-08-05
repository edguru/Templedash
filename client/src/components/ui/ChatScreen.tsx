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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Chat Companion</h1>
            <p className="text-purple-600 font-medium">AI-Powered Game Assistant</p>
          </div>

          {/* Coming Soon Content */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Coming Soon!</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your AI companion will help you master Temple Runner with personalized tips, 
              strategy advice, and real-time game coaching.
            </p>
            
            {/* Features Preview */}
            <div className="text-left space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Real-time gameplay tips
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                Strategy optimization
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Performance analysis
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                Personalized challenges
              </div>
            </div>

            <div className="text-sm text-purple-600 font-medium">
              Stay tuned for updates! 📢
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