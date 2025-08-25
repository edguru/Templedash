import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Plus, Search, MessageCircle, 
  Clock, Trash2, Archive, Star, Filter, X 
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
  sessionId: string;
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
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768); // Desktop: open, Mobile: closed by default
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'starred' | 'recent'>('all');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [hasSessionKey, setHasSessionKey] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const account = useActiveAccount();

  const currentThread = threads.find(t => t.id === currentThreadId);
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
      initializeUser();
      fetchActiveTasks();
      checkSessionKey();
    }
  }, [account]);

  // Handle window resize for mobile/desktop detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !showSidebar) {
        setShowSidebar(true); // Always show sidebar on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);

  const initializeUser = async () => {
    if (!account?.address) return;
    
    try {
      // Get or create user through wallet auth
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
        await fetchChatThreads(data.user.id);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const fetchChatThreads = async (userIdParam?: number) => {
    const effectiveUserId = userIdParam || userId;
    if (!effectiveUserId) return;

    try {
      setIsLoadingThreads(true);
      const response = await fetch(`/api/chat/sessions/${effectiveUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Convert backend sessions to frontend thread format
        const convertedThreads: ChatThread[] = await Promise.all(
          sessions.map(async (session: any) => {
            // Load messages for each session to get preview
            const messagesResponse = await fetch(`/api/chat/history/${session.sessionId}`);
            let messages: ChatMessage[] = [];
            let preview = 'No messages yet';

            if (messagesResponse.ok) {
              const historyData = await messagesResponse.json();
              messages = convertHistoryToMessages(historyData.history || []);
              if (messages.length > 0) {
                const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                preview = lastUserMessage ? lastUserMessage.content.slice(0, 50) + '...' : preview;
              }
            }

            return {
              id: session.sessionId,
              sessionId: session.sessionId,
              title: session.title || 'New Chat',
              preview,
              lastMessage: new Date(session.lastMessageAt),
              messageCount: session.messageCount || 0,
              isStarred: false, // TODO: Add starred field to backend
              isArchived: session.isArchived || false,
              messages
            };
          })
        );

        setThreads(convertedThreads);
        
        // Set current thread to the most recent one if none selected
        if (!currentThreadId && convertedThreads.length > 0) {
          setCurrentThreadId(convertedThreads[0].sessionId);
        }
      }
    } catch (error) {
      console.error('Error fetching chat threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const convertHistoryToMessages = (history: any[]): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    
    history.forEach((conversation: any) => {
      if (conversation.userMessage) {
        messages.push({
          id: `user-${conversation.id}`,
          role: 'user',
          content: conversation.userMessage,
          timestamp: new Date(conversation.createdAt)
        });
      }
      
      if (conversation.companionResponse) {
        messages.push({
          id: `assistant-${conversation.id}`,
          role: 'assistant',
          content: conversation.companionResponse,
          timestamp: new Date(conversation.createdAt)
        });
      }
    });
    
    return messages;
  };

  useEffect(() => {
    const handleResize = () => {
      // Only adjust sidebar on major screen transitions, preserve user intent
      const isMobile = window.innerWidth < 768;
      const isDesktop = window.innerWidth >= 768;
      
      // Only auto-adjust if transitioning between mobile/desktop
      // Don't force changes during minor resizes
      if (isDesktop && window.innerWidth >= 1024) {
        // Large desktop screens: ensure sidebar is visible
        setShowSidebar(true);
      }
      // For mobile and tablet, preserve current state unless it's initial load
    };
    
    // Set initial state based on screen size
    const initialState = window.innerWidth >= 768;
    setShowSidebar(initialState);
    
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

  const createNewThread = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: 'New Chat'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newThread: ChatThread = {
          id: data.sessionId,
          sessionId: data.sessionId,
          title: 'New Chat',
          preview: 'Start a new conversation...',
          lastMessage: new Date(),
          messageCount: 0,
          isStarred: false,
          isArchived: false,
          messages: []
        };
        
        setThreads(prev => [newThread, ...prev]);
        setCurrentThreadId(data.sessionId);
        setShowSidebar(false); // Auto-hide on mobile after creating
      }
    } catch (error) {
      console.error('Error creating new thread:', error);
    }
  };

  // Auto-create first thread if none exist
  useEffect(() => {
    if (threads.length === 0 && userId && account?.address) {
      createNewThread();
    }
  }, [userId, threads.length]);

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

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/chat/sessions/${threadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setThreads(prev => prev.filter(thread => thread.id !== threadId));
        if (currentThreadId === threadId && threads.length > 1) {
          const remainingThreads = threads.filter(t => t.id !== threadId);
          setCurrentThreadId(remainingThreads[0].id);
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const renameThread = async (threadId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle
        }),
      });

      if (response.ok) {
        setThreads(prev => prev.map(thread => 
          thread.id === threadId ? { ...thread, title: newTitle } : thread
        ));
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
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
      preview: inputValue.trim().slice(0, 50) + '...'
    }));

    // Auto-generate title from first message
    const currentThread = threads.find(t => t.id === currentThreadId);
    if (currentThread && currentThread.messageCount === 0 && inputValue.trim()) {
      const autoTitle = generateTitleFromMessage(inputValue.trim());
      await renameThread(currentThreadId, autoTitle);
    }

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
          walletAddress: account.address,
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

  const generateTitleFromMessage = (message: string): string => {
    // Remove common prefixes and clean up the message
    const cleanMessage = message
      .replace(/^(please|can you|could you|help me|i want to|i need to)\s*/i, '')
      .replace(/\?$/, '')
      .trim();

    // Take first 30 characters and ensure it ends properly
    let title = cleanMessage.slice(0, 30);
    if (cleanMessage.length > 30) {
      // Find the last complete word
      const lastSpace = title.lastIndexOf(' ');
      if (lastSpace > 15) {
        title = title.slice(0, lastSpace) + '...';
      } else {
        title = title + '...';
      }
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title || 'New Chat';
  };

  const examplePrompts = [
    "Deploy an ERC20 token called 'MyToken'",
    "Check my CAMP token balance",
    "Mint 1 NFT to my wallet",
    "Transfer 0.1 CAMP to 0x123...",
    "What DeFi opportunities are available?"
  ];

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex relative max-h-screen">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - Thread List */}
      <div className={`${
        showSidebar ? 'w-80 md:w-80' : 'w-0 md:w-0'
      } ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'} 
      transition-all duration-300 bg-white/90 backdrop-blur-sm border-r border-indigo-200/50 flex flex-col shadow-lg md:shadow-none
      ${showSidebar ? 'overflow-visible mobile-sidebar-fix' : 'overflow-hidden mobile-sidebar-hidden'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-indigo-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-gray-800">Conversations</h2>
              {/* Mobile Close Button */}
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <button
              onClick={createNewThread}
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
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
        <div className="flex-1 chat-scroll-area p-2 min-h-0">
          {isLoadingThreads ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin text-indigo-500" size={20} />
                <span className="text-indigo-600">Loading conversations...</span>
              </div>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={32} className="mx-auto mb-3 text-indigo-300" />
              <p className="text-sm text-indigo-500">No conversations yet</p>
              <button
                onClick={createNewThread}
                className="mt-3 text-sm bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Start First Chat
              </button>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setCurrentThreadId(thread.sessionId);
                  // Only auto-close on mobile screens (< 768px)
                  if (window.innerWidth < 768) {
                    setShowSidebar(false);
                  }
                  // Desktop and tablet: keep sidebar open for easy navigation
                }}
                className={`p-4 md:p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 group touch-manipulation ${
                  thread.id === currentThreadId 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'hover:bg-indigo-50 bg-white/50 active:bg-indigo-100'
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
                <div className="flex flex-col space-y-1 ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleThreadStar(thread.id, e)}
                    className={`p-2 md:p-1 rounded hover:bg-black/10 touch-manipulation ${thread.isStarred ? 'text-yellow-400' : thread.id === currentThreadId ? 'text-white' : 'text-gray-400'}`}
                  >
                    <Star size={16} className="md:w-3 md:h-3" />
                  </button>
                  <button
                    onClick={(e) => deleteThread(thread.sessionId, e)}
                    className={`p-2 md:p-1 rounded hover:bg-black/10 touch-manipulation ${thread.id === currentThreadId ? 'text-white' : 'text-gray-400'}`}
                  >
                    <Trash2 size={16} className="md:w-3 md:h-3" />
                  </button>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col mobile-chat-container">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-indigo-100 transition-colors touch-manipulation"
              title={showSidebar ? "Close conversations" : "Open conversations"}
            >
              {showSidebar && window.innerWidth < 768 ? (
                <X size={20} className="text-indigo-600" />
              ) : (
                <MessageCircle size={20} className="text-indigo-600" />
              )}
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                {currentThread?.title || 'Puppets AI'}
              </h1>
              <p className="text-sm text-indigo-600">AI Companion & Web3 Assistant</p>
            </div>
            {/* New Chat Button */}
            <button
              onClick={createNewThread}
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              title="Start new conversation"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {activeTasks.length > 0 && (
            <div className="flex items-center space-x-2 text-sm bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">{activeTasks.length} active</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 chat-scroll-area px-4 py-4 space-y-4 min-h-0">
          {currentThread?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-lg word-wrap break-words overflow-hidden ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white mr-2 sm:mr-0'
                    : 'bg-white/80 backdrop-blur-sm border border-indigo-200/50 ml-2 sm:ml-0'
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
                        className="text-gray-800 message-content" 
                      />
                    ) : (
                      <p className="text-white break-words message-content">
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

        {/* Example Prompts - Only show when no threads exist or current thread is empty */}
        {(threads.length === 0 || (currentThread && currentThread.messages.length === 0)) && (
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

        {/* No threads placeholder */}
        {threads.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-indigo-300" />
              <h3 className="text-lg font-medium text-indigo-600 mb-2">Start Your First Conversation</h3>
              <p className="text-indigo-500 mb-4">Create a new thread to begin chatting with your AI companion</p>
              <button
                onClick={createNewThread}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} className="inline mr-2" />
                Start New Chat
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-indigo-200/50 px-4 py-4 mobile-safe-input">
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