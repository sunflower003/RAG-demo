const mongoose = require('mongoose');

// Định nghĩa cấu trúc cho một tin nhắn đơn lẻ
const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'], // Vai trò: người dùng hoặc trợ lý
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { _id: false }); // _id: false để không tạo _id cho từng tin nhắn

const chatHistorySchema = new mongoose.Schema({
    // Sử dụng sessionId để nhóm các cuộc trò chuyện
    // Frontend sẽ cần tạo và gửi 'sessionId' này
    sessionId: {
        type: String,
        required: true,
        index: true // Đánh chỉ mục để truy vấn nhanh
    },
    messages: [messageSchema] // Một mảng các tin nhắn
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;