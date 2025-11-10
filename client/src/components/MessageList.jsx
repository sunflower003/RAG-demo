// client/src/components/MessageList.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Hàm format text: chuyển \n thành <br/>
 */
function formatMessage(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => {
        // Debug: Log để xem có \n không
        if (msg.role === 'assistant') {
          console.log('Message content:', msg.content);
          console.log('Has newlines:', msg.content.includes('\n'));
        }
        
        return (
          <div key={index} className={`message ${msg.role}`}>
            <p>{formatMessage(msg.content)}</p>
          </div>
        );
      })}
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