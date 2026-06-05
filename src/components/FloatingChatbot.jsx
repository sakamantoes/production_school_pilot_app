// components/FloatingChatbot.jsx
import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  HelpCircle
} from "lucide-react";
import { getChatResponse, getQuickSuggestions } from "../utils/chatAssistant";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: "bot",
          text: "👋 Hi there! I'm your AI assistant. How can I help you today?",
          timestamp: new Date()
        }
      ]);
      setQuickSuggestions(getQuickSuggestions());
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getChatResponse(message);

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      setQuickSuggestions(getQuickSuggestions());
    }, 500);
  };

  const handleQuickSuggestion = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-200 ${
          isMinimized ? "w-80 h-14" : "w-80 md:w-96 h-[480px]"
        }`}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-white/20 p-1 rounded-full">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">AI Assistant</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(!isMinimized)} 
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCloseChat}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-[calc(480px-180px)] bg-gray-50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-3 flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm ${
                      msg.type === "user" 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm" 
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-[10px] mt-1 ${msg.type === "user" ? "text-blue-100" : "text-gray-400"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="px-3 py-2 border-t border-gray-100 bg-white">
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickSuggestion(s)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-full hover:shadow-md transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;