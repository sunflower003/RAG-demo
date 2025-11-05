// client/src/App.jsx
import React from 'react';
import ChatWindow from './components/ChatWindow';
import './App.css'; // Chúng ta sẽ thêm 1 file CSS cơ bản

function App() {
  return (
    <div className="app-container">
      <h1>MERN-RAG Chatbot Đồ uống</h1>
      <ChatWindow />
    </div>
  );
}

export default App;