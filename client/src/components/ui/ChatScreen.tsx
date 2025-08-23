import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { sessionManager } from '../../lib/sessionSigners';
import MessageRenderer from './MessageRenderer';

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
  const [hasSessionKey, setHasSessionKey] = useState(false);
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
      checkSessionKey();
    }
  }, [account]);

  const checkSessionKey = () => {
    if (!account?.address) return;
    const hasSession = sessionManager.hasValidSession(account.address);
    setHasSessionKey(hasSession);
    
    if (!hasSession) {
      createSessionKey();
    }
  };

  const createSessionKey = async () => {
    if (!account?.address) return;
    
    try {
      console.log('[ChatScreen] Creating session key for automated transactions');
      const sessionData = await sessionManager.createSessionKey(account.address);
      await sessionManager.registerSessionWithBackend(account.address);
      setHasSessionKey(true);
      
      // Add system message about session setup
      const sessionMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🔐 Session key created for automated transactions. I can now execute blockchain operations on your behalf for the next 24 hours. Session expires at ${sessionData.expiresAt.toLocaleTimeString()}.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, sessionMessage]);
    } catch (error) {
      console.error('[ChatScreen] Error creating session key:', error);
    }
  };

  const fetchActiveTasks = async () => {
    if (!account?.address) return;
    
    try {
      const response = await fetch(`/api/agents/tasks?userId=${account.address}`);
      
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
          'Content-Type': 'application/json'
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
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Puppets AI</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Web3 Task Companion</p>
          </div>
        </div>
        
        {/* Active Tasks Indicator - Mobile Optimized */}
        {activeTasks.length > 0 && (
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 hidden sm:inline">{activeTasks.length} active tasks</span>
            <span className="text-gray-600 sm:hidden">{activeTasks.length}</span>
          </div>
        )}
      </div>

      {/* Messages - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="mt-1 text-blue-500 flex-shrink-0" size={14} />
                )}
                {message.role === 'user' && (
                  <User className="mt-1 text-white flex-shrink-0" size={14} />
                )}
                <div className="min-w-0 flex-1">
                  {message.role === 'assistant' ? (
                    <MessageRenderer 
                      content={message.content} 
                      className="text-gray-800 text-sm sm:text-base" 
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-white break-words">
                      {message.content}
                    </p>
                  )}
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
            <div className="bg-white border shadow-sm rounded-lg px-3 sm:px-4 py-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin text-blue-500" size={14} />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts - Mobile Optimized */}
      {messages.length === 1 && (
        <div className="px-3 sm:px-6 py-2">
          <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors break-words text-left max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form - Mobile Optimized */}
      <div className="bg-white border-t px-3 sm:px-6 py-3 sm:py-4 safe-area-inset-bottom">
        {!account ? (
          <div className="text-center text-gray-500 py-4">
            <Bot size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Connect your wallet to start chatting</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me to deploy contracts, mint NFTs, transfer tokens..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base min-h-[44px] max-h-32"
                disabled={isLoading}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 sm:p-3 rounded-xl transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}