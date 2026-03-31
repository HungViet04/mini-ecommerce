/**
 * ChatBot Component
 * Floating AI chatbot widget for product consultation
 * Pattern: Controlled Component with local state
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services';

/**
 * Format message text with basic markdown-like styling
 */
function formatMessage(text) {
  if (!text) return '';

  const escapeHtml = (input) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeText = escapeHtml(text);

  const withLinks = safeText.replace(
    /\[([^\]]+)\]\((\/products\/\d+|https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" class="chat-message__link">$1</a>'
  );

  return withLinks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

/**
 * Single chat message bubble
 */
function ChatMessage({ message, onLinkClick }) {
  const isBot = message.role === 'bot';

  const handleClick = (e) => {
    const link = e.target.closest('a.chat-message__link');
    if (!link || !onLinkClick) return;

    const href = link.getAttribute('href') || '';
    onLinkClick(e, href);
  };

  return (
    <div
      className={`chat-message ${isBot ? 'chat-message--bot' : 'chat-message--user'}`}
      onClick={isBot ? handleClick : undefined}
    >
      {isBot && <div className="chat-message__avatar">🤖</div>}
      <div
        className="chat-message__bubble"
        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
      />
    </div>
  );
}

/**
 * Typing indicator when bot is responding
 */
function TypingIndicator() {
  return (
    <div className="chat-message chat-message--bot">
      <div className="chat-message__avatar">🤖</div>
      <div className="chat-message__bubble chat-typing">
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </div>
  );
}

/**
 * Main ChatBot component
 */
export function ChatBot({ activeFloating, onFloatingChange }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content:
        'Xin chào! 👋 Tôi là trợ lý AI của cửa hàng. Tôi có thể giúp bạn tìm sản phẩm, tư vấn mua hàng hoặc trả lời câu hỏi. Bạn cần hỗ trợ gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [, setError] = useState(null);

  const chatbotRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isCartActive = activeFloating === 'cart';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // When reopening chat, always jump to the latest message.
  useEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });

    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  // Close chatbot when clicking outside of it.
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (!chatbotRef.current?.contains(event.target)) {
        setIsOpen(false);
        onFloatingChange?.(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onFloatingChange]);

  useEffect(() => {
    if (isCartActive && isOpen) {
      setIsOpen(false);
    }
  }, [isCartActive, isOpen]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendMessage(trimmedInput, sessionId);

      if (result.sessionId && !sessionId) {
        setSessionId(result.sessionId);
      }

      setMessages((prev) => [...prev, { role: 'bot', content: result.reply }]);
    } catch (err) {
      const errorMessage = err?.message || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: '⚠️ ' + errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClearChat = useCallback(async () => {
    if (sessionId) {
      try {
        await chatService.clearSession(sessionId);
      } catch {
        // Ignore cleanup errors
      }
    }
    setSessionId(null);
    setMessages([
      {
        role: 'bot',
        content:
          'Xin chào! 👋 Tôi là trợ lý AI của cửa hàng. Tôi có thể giúp bạn tìm sản phẩm, tư vấn mua hàng hoặc trả lời câu hỏi. Bạn cần hỗ trợ gì?',
      },
    ]);
    setError(null);
  }, [sessionId]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      onFloatingChange?.(next ? 'chat' : null);
      return next;
    });
  }, [onFloatingChange]);

  // Quick suggestion buttons
  const suggestions = ['Có sản phẩm gì đang bán?', 'Tư vấn sản phẩm giá rẻ', 'Cách đặt hàng?'];

  const handleSuggestion = useCallback((text) => {
    setInput(text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const handleBotLinkClick = useCallback(
    (e, href) => {
      if (!href) return;

      // Keep SPA state (including chat history) when opening internal links.
      if (href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    },
    [navigate]
  );

  return (
    <div className="chatbot" ref={chatbotRef}>
      {/* Chat toggle button */}
      {!isCartActive && (
        <button
          className={`chatbot__toggle ${isOpen ? 'chatbot__toggle--open' : ''}`}
          onClick={toggleChat}
          aria-label={isOpen ? 'Đóng chat' : 'Mở chat hỗ trợ'}
        >
          {isOpen ? '✕' : '💬'}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot__window">
          {/* Header */}
          <div className="chatbot__header">
            <div className="chatbot__header-info">
              <span className="chatbot__header-icon">🤖</span>
              <div>
                <h3 className="chatbot__title">Trợ lý AI</h3>
                <span className="chatbot__status">Trực tuyến</span>
              </div>
            </div>
            <button
              className="chatbot__clear-btn"
              onClick={handleClearChat}
              title="Xóa cuộc trò chuyện"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot__messages">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} onLinkClick={handleBotLinkClick} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only show when few messages) */}
          {messages.length <= 1 && (
            <div className="chatbot__suggestions">
              {suggestions.map((text, index) => (
                <button
                  key={index}
                  className="chatbot__suggestion-btn"
                  onClick={() => handleSuggestion(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot__input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot__input"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={500}
            />
            <button
              className="chatbot__send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Gửi tin nhắn"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
