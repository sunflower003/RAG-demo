// client/src/components/MessageList.jsx
import React, { useEffect, useRef } from 'react';

function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.role}`}>
          <p>{msg.content}</p>
        </div>
      ))}
      {isLoading && (
        <div className="message assistant">
          <p><i>Đang suy nghĩ...</i></p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;