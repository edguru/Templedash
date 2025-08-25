import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Plus, Search, MessageCircle, 
  Clock, Trash2, Archive, Star, Filter 
} from 'lucide-react';
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

interface ChatThread {
  id: string;
  title: string;
  preview: string;
  lastMessage: Date;
  messageCount: number;
  isStarred: boolean;
  isArchived: boolean;
  messages: ChatMessage[];
}

interface ActiveTask {
  id: string;
  title: string;
  status: string;
  progress?: number;
}

export default function ChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: '1',
      title: 'Web3 Welcome',
      preview: 'Hi! I\'m your Web3 companion...',
      lastMessage: new Date(),
      messageCount: 1,
      isStarred: false,
      isArchived: false,
      messages: [{
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your Web3 companion. I can help you deploy contracts, mint NFTs, transfer tokens, and automate blockchain tasks. What would you like to do?",
        timestamp: new Date()
      }]
    }
  ]);
  
  const [currentThreadId, setCurrentThreadId] = useState<string>('1');
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'starred' | 'recent'>('all');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [hasSessionKey, setHasSessionKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const account = useActiveAccount();

  const currentThread = threads.find(t => t.id === currentThreadId) || threads[0];
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'starred' && thread.isStarred) ||
                         (filterType === 'recent' && new Date().getTime() - thread.lastMessage.getTime() < 86400000);
    
    return matchesSearch && matchesFilter && !thread.isArchived;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentThread?.messages]);

  useEffect(() => {
    if (account?.address) {
      fetchActiveTasks();
      checkSessionKey();
    }
  }, [account]);

  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      console.log('[ChatThreads] Creating session key for automated transactions');
      const sessionData = await sessionManager.createSessionKey(account.address);
      await sessionManager.registerSessionWithBackend(account.address);
      setHasSessionKey(true);
      
      const sessionMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🔐 Session key created for automated transactions. I can now execute blockchain operations on your behalf for the next 24 hours. Session expires at ${sessionData.expiresAt.toLocaleTimeString()}.`,
        timestamp: new Date()
      };
      
      updateCurrentThread(thread => ({
        ...thread,
        messages: [...thread.messages, sessionMessage],
        lastMessage: new Date(),
        messageCount: thread.messageCount + 1
      }));
    } catch (error) {
      console.error('[ChatThreads] Error creating session key:', error);
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

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      preview: 'Start a new conversation...',
      lastMessage: new Date(),
      messageCount: 0,
      isStarred: false,
      isArchived: false,
      messages: []
    };
    
    setThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    setShowSidebar(false); // Auto-hide on mobile after creating
  };

  const updateCurrentThread = (updater: (thread: ChatThread) => ChatThread) => {
    setThreads(prev => prev.map(thread => 
      thread.id === currentThreadId ? updater(thread) : thread
    ));
  };

  const toggleThreadStar = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.map(thread => 
      thread.id === threadId ? { ...thread, isStarred: !thread.isStarred } : thread
    ));
  };

  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    if (currentThreadId === threadId && threads.length > 1) {
      const remainingThreads = threads.filter(t => t.id !== threadId);
      setCurrentThreadId(remainingThreads[0].id);
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

    // Update thread with user message
    updateCurrentThread(thread => ({
      ...thread,
      messages: [...thread.messages, userMessage],
      lastMessage: new Date(),
      messageCount: thread.messageCount + 1,
      title: thread.messageCount === 0 ? inputValue.trim().slice(0, 30) + '...' : thread.title,
      preview: inputValue.trim().slice(0, 50) + '...'
    }));

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
          userId: account.address,
          conversationId: currentThreadId
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

        updateCurrentThread(thread => ({
          ...thread,
          messages: [...thread.messages, assistantMessage],
          lastMessage: new Date(),
          messageCount: thread.messageCount + 1
        }));

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
      
      updateCurrentThread(thread => ({
        ...thread,
        messages: [...thread.messages, errorMessage],
        lastMessage: new Date(),
        messageCount: thread.messageCount + 1
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    "Deploy an ERC20 token called 'MyToken'",
    "Check my CAMP token balance",
    "Mint 1 NFT to my wallet",
    "Transfer 0.1 CAMP to 0x123...",
    "What DeFi opportunities are available?"
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar - Thread List */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm border-r border-indigo-200/50 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-indigo-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Conversations</h2>
            <button
              onClick={createNewThread}
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={16} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 text-sm"
            />
          </div>
          
          {/* Filters */}
          <div className="flex space-x-1">
            {(['all', 'starred', 'recent'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  filterType === filter 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => {
                setCurrentThreadId(thread.id);
                setShowSidebar(false);
              }}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 group ${
                thread.id === currentThreadId 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                  : 'hover:bg-indigo-50 bg-white/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageCircle size={14} className={thread.id === currentThreadId ? 'text-white' : 'text-indigo-500'} />
                    <h3 className={`font-medium text-sm truncate ${thread.id === currentThreadId ? 'text-white' : 'text-gray-800'}`}>
                      {thread.title}
                    </h3>
                  </div>
                  <p className={`text-xs truncate ${thread.id === currentThreadId ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {thread.preview}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${thread.id === currentThreadId ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {thread.lastMessage.toLocaleDateString()}
                    </span>
                    <span className={`text-xs ${thread.id === currentThreadId ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {thread.messageCount} msgs
                    </span>
                  </div>
                </div>
                
                {/* Thread Actions */}
                <div className="flex flex-col space-y-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleThreadStar(thread.id, e)}
                    className={`p-1 rounded hover:bg-black/10 ${thread.isStarred ? 'text-yellow-400' : thread.id === currentThreadId ? 'text-white' : 'text-gray-400'}`}
                  >
                    <Star size={12} />
                  </button>
                  <button
                    onClick={(e) => deleteThread(thread.id, e)}
                    className={`p-1 rounded hover:bg-black/10 ${thread.id === currentThreadId ? 'text-white' : 'text-gray-400'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-indigo-100 transition-colors md:hidden"
            >
              <MessageCircle size={20} className="text-indigo-600" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {currentThread?.title || 'Puppets AI'}
              </h1>
              <p className="text-sm text-indigo-600">AI Companion & Web3 Assistant</p>
            </div>
          </div>
          
          {activeTasks.length > 0 && (
            <div className="flex items-center space-x-2 text-sm bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">{activeTasks.length} active</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {currentThread?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'bg-white/80 backdrop-blur-sm border border-indigo-200/50'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="mt-1 text-indigo-500 flex-shrink-0" size={16} />
                  )}
                  {message.role === 'user' && (
                    <User className="mt-1 text-white flex-shrink-0" size={16} />
                  )}
                  <div className="min-w-0 flex-1">
                    {message.role === 'assistant' ? (
                      <MessageRenderer 
                        content={message.content} 
                        className="text-gray-800" 
                      />
                    ) : (
                      <p className="text-white break-words">
                        {message.content}
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin text-indigo-500" size={16} />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Example Prompts */}
        {currentThread?.messages.length === 0 && (
          <div className="px-4 py-2">
            <p className="text-sm text-indigo-600 mb-3 font-medium">✨ Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="text-sm bg-white/80 backdrop-blur-sm hover:bg-indigo-50 text-indigo-700 px-3 py-2 rounded-full transition-all duration-200 border border-indigo-200/50 hover:border-indigo-300 shadow-md hover:shadow-lg"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-indigo-200/50 px-4 py-4">
          {!account ? (
            <div className="text-center text-indigo-600 py-6">
              <Bot size={32} className="mx-auto mb-3 text-indigo-400" />
              <p className="font-medium">Connect your wallet to start chatting</p>
              <p className="text-sm text-indigo-500 mt-1">Experience seamless Web3 automation</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me to deploy contracts, check balances, analyze markets..."
                  className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm min-h-[50px] max-h-32"
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
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-xl transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl"
              >
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}