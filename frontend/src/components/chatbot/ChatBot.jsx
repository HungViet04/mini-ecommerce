/**
 * ChatBot Component
 * Trợ lý cửa hàng — tra cứu sản phẩm từ database
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services';

const WELCOME_MESSAGE =
  'Xin chào! 👋 Mình là trợ lý cửa hàng — tra cứu sản phẩm trực tiếp từ kho hàng. Bạn có thể hỏi tên sản phẩm, giá, hoặc "cách đặt hàng".';

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

function ChatMessage({ message, onLinkClick }) {
  const isBot = message.role === 'bot';

  const handleClick = (e) => {
    const link = e.target.closest('a.chat-message__link');
    if (!link || !onLinkClick) return;
    onLinkClick(e, link.getAttribute('href') || '');
  };

  return (
    <div
      className={`chat-message ${isBot ? 'chat-message--bot' : 'chat-message--user'}`}
      onClick={isBot ? handleClick : undefined}
    >
      {isBot && <div className="chat-message__avatar">🛒</div>}
      <div
        className="chat-message__bubble"
        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-message chat-message--bot">
      <div className="chat-message__avatar">🛒</div>
      <div className="chat-message__bubble chat-typing">
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </div>
  );
}

export function ChatBot({ activeFloating, onFloatingChange }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', content: WELCOME_MESSAGE }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [, setError] = useState(null);

  const chatbotRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isCartActive = activeFloating === 'cart';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

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

    setMessages((prev) => [...prev, { role: 'user', content: trimmedInput }]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendMessage(trimmedInput, sessionId);

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      setMessages((prev) => [...prev, { role: 'bot', content: result.reply }]);
    } catch (err) {
      const errorMessage = err?.message || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
      setError(errorMessage);
      setMessages((prev) => [...prev, { role: 'bot', content: '⚠️ ' + errorMessage }]);
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
        // ignore
      }
    }
    setSessionId(null);
    setMessages([{ role: 'bot', content: WELCOME_MESSAGE }]);
    setError(null);
  }, [sessionId]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      onFloatingChange?.(next ? 'chat' : null);
      return next;
    });
  }, [onFloatingChange]);

  const suggestions = ['Có sản phẩm gì đang bán?', 'điện thoại dưới 50 triệu', 'Cách đặt hàng?'];

  const handleSuggestion = useCallback((text) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleBotLinkClick = useCallback(
    (e, href) => {
      if (!href) return;
      if (href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    },
    [navigate]
  );

  return (
    <div className="chatbot" ref={chatbotRef}>
      {!isCartActive && (
        <button
          className={`chatbot__toggle ${isOpen ? 'chatbot__toggle--open' : ''}`}
          onClick={toggleChat}
          aria-label={isOpen ? 'Đóng chat' : 'Mở chat hỗ trợ'}
        >
          {isOpen ? '✕' : '💬'}
        </button>
      )}

      {isOpen && (
        <div className="chatbot__window">
          <div className="chatbot__header">
            <div className="chatbot__header-info">
              <span className="chatbot__header-icon">🛒</span>
              <div>
                <h3 className="chatbot__title">Trợ lý cửa hàng</h3>
                <span className="chatbot__status">Tra cứu từ kho hàng</span>
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

          <div className="chatbot__messages">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} onLinkClick={handleBotLinkClick} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

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
