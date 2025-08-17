import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  taskId?: string;
}

interface ActiveTask {
  id: string;
  title: string;
  status: string;
  progress?: number;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Web3 companion. I can help you deploy contracts, mint NFTs, transfer tokens, and automate blockchain tasks. What would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const account = useActiveAccount();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (account?.address) {
      fetchActiveTasks();
    }
  }, [account]);

  const fetchActiveTasks = async () => {
    if (!account?.address) return;
    
    try {
      const response = await fetch('/api/agents/tasks', {
        headers: {
          'Authorization': `wallet_${account.address}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !account?.address) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `wallet_${account.address}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: account.address
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          taskId: data.taskId
        };

        setMessages(prev => [...prev, assistantMessage]);

        // If a task was created, refresh active tasks
        if (data.taskCreated) {
          setTimeout(fetchActiveTasks, 1000);
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
  };

  const examplePrompts = [
    "Deploy an ERC20 token called 'MyToken'",
    "Check my CAMP token balance",
    "Mint 1 NFT to my wallet",
    "Transfer 0.1 CAMP to 0x123...",
    "What tasks do I have active?"
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Puppets AI</h1>
            <p className="text-sm text-gray-500">Web3 Task Companion</p>
          </div>
        </div>
        
        {/* Active Tasks Indicator */}
        {activeTasks.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">{activeTasks.length} active tasks</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="mt-1 text-blue-500 flex-shrink-0" size={16} />
                )}
                {message.role === 'user' && (
                  <User className="mt-1 text-white flex-shrink-0" size={16} />
                )}
                <div>
                  <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                    {message.content}
                  </p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin text-blue-500" size={16} />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length === 1 && (
        <div className="px-6 py-2">
          <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white border-t px-6 py-4">
        {!account ? (
          <div className="text-center text-gray-500 py-4">
            <Bot size={24} className="mx-auto mb-2 text-gray-400" />
            <p>Connect your wallet to start chatting</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me to deploy contracts, mint NFTs, transfer tokens..."
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
  );
}