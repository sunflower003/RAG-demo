// client/src/components/ChatWindow.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import PromptInput from './PromptInput';

// Tạo một ID phiên ngẫu nhiên khi component được tải
// Backend của bạn cần 'sessionId' này
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

function ChatWindow() {
  // Quản lý mảng tin nhắn và trạng thái isLoading [cite: 48, 107]
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Thêm một tin nhắn chào mừng ban đầu
  useEffect(() => {
    setMessages([
      { role: 'assistant', content: 'Anh chị cần hỗ trợ gì cứ ới em ạ ^^' }
    ]);
  }, []);

  // Hàm xử lý khi người dùng gửi [cite: 49]
  const handleSubmit = async (query) => {
    // Thêm tin nhắn của người dùng và đặt isLoading(true) [cite: 50, 109]
    const userMessage = { role: 'user', content: query };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true); // [cite: 109]

    try {
      // Sử dụng axios.post để gọi backend 
      const response = await axios.post(
        "http://localhost:3369/api/chat/ask", 
        { 
          query: query,
          sessionId: sessionId // Gửi cả sessionId
        }
      );

      // Nhận response.data.answer và thêm nó vào mảng [cite: 51, 112]
      const botMessage = { role: 'assistant', content: response.data.answer };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      const errorMessage = { role: 'assistant', content: 'Xin lỗi, tôi gặp lỗi khi đang kết nối. Vui lòng thử lại.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  return (
    <div className="chat-window">
      <MessageList messages={messages} isLoading={isLoading} />
      <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

export default ChatWindow;