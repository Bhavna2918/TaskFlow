import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useTeamStore } from '../store/useTeamStore';
import { useSocket } from '../hooks/useSocket';
import { Search, Send, MessageSquare, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  timestamp: string;
  recipientId?: string;
  text?: string;
}

const Inbox: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { team, fetchTeam } = useTeamStore();
  const socketService = useSocket();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const mRes = await api.get('/messages');
      setMessages(mRes.data);
      await fetchTeam();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch chat logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Set default active user once team loads
  useEffect(() => {
    const otherUsers = team.filter(u => u.id !== currentUser?.id);
    if (!activeUser && otherUsers.length > 0) {
      setActiveUser(otherUsers[0]);
    }
  }, [team, activeUser, currentUser]);

  // Socket Listeners for Real-time messaging
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleReceiveMessage = (msg: MessageItem) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleMessageSent = (msg: MessageItem) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleRemoteTyping = (data: { senderId: string }) => {
      if (activeUser && data.senderId === activeUser.id) {
        setIsTyping(true);
      }
    };

    const handleRemoteStopTyping = (data: { senderId: string }) => {
      if (activeUser && data.senderId === activeUser.id) {
        setIsTyping(false);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('typing', handleRemoteTyping);
    socket.on('stop_typing', handleRemoteStopTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('typing', handleRemoteTyping);
      socket.off('stop_typing', handleRemoteStopTyping);
    };
  }, [socketService, activeUser]);

  // Scroll chat board
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeUser, isTyping]);

  // Mark active messages as read
  useEffect(() => {
    if (!currentUser || !activeUser || messages.length === 0) return;

    const unreadMsgs = messages.filter(m => m.senderId === activeUser.id && m.receiverId === currentUser.id && !m.read);
    if (unreadMsgs.length > 0) {
      // Optimistically update local read status
      setMessages(prev => prev.map(m => m.senderId === activeUser.id ? { ...m, read: true } : m));
      // Call endpoint to notify server
      unreadMsgs.forEach(m => {
        api.put(`/messages/${m.id}`, { read: true }).catch(console.error);
      });
    }
  }, [messages, activeUser, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedMessage(e.target.value);
    
    if (currentUser && activeUser) {
      socketService.emitTyping(currentUser.id, activeUser.id);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitStopTyping(currentUser.id, activeUser.id);
      }, 1500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeUser || !currentUser) return;

    // Send via socket connection
    socketService.sendMessage(currentUser.id, activeUser.id, typedMessage);
    setTypedMessage('');
    socketService.emitStopTyping(currentUser.id, activeUser.id);
  };

  const otherUsers = team.filter(u => u.id !== currentUser?.id);
  const filteredUsers = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chatMessages = messages.filter(m => 
    (m.senderId === currentUser?.id && m.receiverId === activeUser?.id) ||
    (m.senderId === activeUser?.id && m.receiverId === currentUser?.id)
  );

  const getUserUnreadCount = (userId: string) => {
    return messages.filter(m => m.senderId === userId && m.receiverId === currentUser?.id && !m.read).length;
  };

  const getLastMessage = (userId: string) => {
    const conversation = messages.filter(m => 
      (m.senderId === currentUser?.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === currentUser?.id)
    );
    return conversation.length > 0 ? conversation[conversation.length - 1] : null;
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col font-sans">
      {error ? (
        <div className="flex-1 rounded-2xl border border-white/5 shadow-glass bg-[#0f1424]/85 p-8 text-center text-red-500 font-semibold flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-10 h-10 text-red-500 animate-bounce" />
          <h3 className="text-lg">Failed to load chat workspace</h3>
          <p className="text-xs text-gray-400 max-w-md">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs hover:opacity-90 transition-all font-bold"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex-1 rounded-2xl border border-white/5 shadow-glass bg-[#0f1424]/85 flex items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl border border-white/5 shadow-glass bg-[#0f1424]/85 overflow-hidden flex">
          
          {/* Left Side: Users List */}
          <div className="w-80 border-r border-white/5 flex flex-col bg-white/[0.01] shrink-0">
            {/* Search */}
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">No team members found</div>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = activeUser?.id === user.id;
                  const unread = getUserUnreadCount(user.id);
                  const lastMsg = getLastMessage(user.id);
                  const initials = user.name.charAt(0);

                  return (
                    <button
                      key={user.id}
                      onClick={() => setActiveUser(user)}
                      className={`w-full p-3 rounded-xl flex items-start gap-3 transition-all duration-200 text-left ${
                        isActive 
                          ? 'bg-indigo-500/10 border-l-4 border-indigo-500 text-white' 
                          : 'hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm uppercase">
                            {initials}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f1424]"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                          {lastMsg && (
                            <span className="text-[9px] text-gray-500 shrink-0">
                              {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 capitalize mt-0.5 font-bold">{user.role}</p>
                        
                        {lastMsg && (
                          <p className="text-[10px] text-gray-400 truncate mt-1.5 font-medium">
                            {lastMsg.senderId === currentUser?.id ? 'You: ' : ''}
                            {lastMsg.message}
                          </p>
                        )}
                      </div>

                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500 text-white rounded-full shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Active Chat Board */}
          <div className="flex-1 flex flex-col bg-white/[0.005]">
            {activeUser ? (
              <>
                {/* Active User Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {activeUser.avatar ? (
                        <img 
                          src={activeUser.avatar} 
                          alt={activeUser.name} 
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm uppercase">
                          {activeUser.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f1424]"></span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">{activeUser.name}</h3>
                      <p className="text-[10px] text-gray-400 capitalize font-medium">{activeUser.role} - Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Sync Connected
                    </span>
                  </div>
                </div>

                {/* Chat Message list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl shadow-neon-glow">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Secure Encrypted Session</h4>
                        <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Send a message to sync communication details with {activeUser.name}.</p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isSelf = msg.senderId === currentUser?.id;
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md p-3 rounded-2xl text-xs font-semibold border ${
                            isSelf 
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/20 text-white rounded-tr-none shadow-lg'
                              : 'bg-white/5 border-white/5 text-gray-250 rounded-tl-none'
                          }`}>
                            <p className="leading-relaxed">{msg.message}</p>
                            <div className={`flex items-center gap-1 justify-end mt-1.5 text-[8.5px] ${isSelf ? 'text-indigo-200' : 'text-gray-500'}`}>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isSelf && <Check className="w-3 h-3 text-cyan-300" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/5 text-gray-400 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5 shadow-sm shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Send Input Box */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/[0.01] flex gap-2">
                  <input
                    type="text"
                    placeholder={`Write secure message to ${activeUser.name}...`}
                    value={typedMessage}
                    onChange={handleInputChange}
                    className="flex-1 h-11 px-4 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <ShieldAlert className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-xs">No active conversation. Select a team member to begin messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
