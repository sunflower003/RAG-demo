// /server/index.js (File chính)

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db'); // Nhập hàm kết nối của bạn

// Nhập routes
const chatRoutes = require('./src/routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Kết nối CSDL
connectDB();

// Middlewares
app.use(cors()); // Cho phép frontend gọi API
app.use(express.json()); // Phân tích JSON body

// Sử dụng Routes
// Mọi route trong chatRoutes sẽ có tiền tố /api/chat
app.use('/api/chat', chatRoutes); 

// Route cơ bản
app.get('/', (req, res) => {
    res.send('MERN-RAG Chatbot Backend đang chạy!');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});