// /src/rag_chatbot/retrieval/query_rewriter.js

const { generateChatResponse } = require('../external_services/llm_service');

/**
 * Định dạng lịch sử chat thành một chuỗi văn bản đơn giản cho LLM.
 * @param {Array<object>} chatHistory - Mảng các tin nhắn (ví dụ: { role: 'user' | 'assistant', content: '...' }).
 * @returns {string} - Lịch sử chat đã được định dạng.
 */
function formatChatHistory(chatHistory) {
    if (!chatHistory) {
        return "";
    }
    return chatHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
}

/**
 * Viết lại truy vấn của người dùng dựa trên lịch sử chat để tạo một truy vấn độc lập.
 * @param {string} currentQuery - Truy vấn mới, có thể mơ hồ của người dùng (ví dụ: "Nó bao nhiêu calo?").
 * @param {Array<object>} chatHistory - Lịch sử các tin nhắn trước đó.
 * @returns {Promise<string>} - Truy vấn đã được viết lại, rõ ràng và độc lập.
 */
async function rewriteQuery(currentQuery, chatHistory) {
    
    // Tối ưu hóa: Nếu không có lịch sử, không cần viết lại.
    if (!chatHistory || chatHistory.length === 0) {
        console.log("Query Rewriter: Không có lịch sử, bỏ qua viết lại.");
        return currentQuery;
    }

    // 1. Định nghĩa System Prompt chuyên dụng cho việc viết lại
    const systemPrompt = `Bạn là một chuyên gia viết lại truy vấn (query rewriter).
Nhiệm vụ của bạn là viết lại một truy vấn mới, có thể còn mơ hồ (từ người dùng) thành một truy vấn cụ thể, độc lập, có thể dùng để tìm kiếm.
Sử dụng lịch sử trò chuyện được cung cấp để lấy ngữ cảnh.

QUY TẮC TUYỆT ĐỐI:
1. CHỈ trả về truy vấn đã được viết lại. KHÔNG thêm bất kỳ lời chào hay giải thích nào (ví dụ: "Đây là truy vấn đã viết lại:").
2. Nếu truy vấn mới đã rõ ràng và độc lập (ví dụ: "Giá của Margarita Spritz Cans là bao nhiêu?"), hãy trả về NGUYÊN BẢN.
3. Nếu truy vấn mới là một câu hỏi tiếp nối (ví dụ: "Nó có bao nhiêu calo?"), hãy dùng lịch sử chat để giải quyết các đại từ ("nó", "cái đó") và viết lại (ví dụ: "Margarita Spritz Cans có bao nhiêu calo?").
4. Nếu truy vấn mới chỉ là lời chào (ví dụ: "Chào bạn", "Cảm ơn"), hãy trả về NGUYÊN BẢN.`;

    // 2. Tạo truy vấn người dùng (user query) cho LLM
    const formattedHistory = formatChatHistory(chatHistory);
    const userQueryForLLM = `Lịch sử Chat:
${formattedHistory}

Truy vấn mới của người dùng:
${currentQuery}
`;

    try {
        // 3. Gọi LLM Service (tái sử dụng)
        // Chúng ta dùng model mạnh (như gpt-4-turbo) để đảm bảo nó hiểu đúng ngữ cảnh
        console.log("Query Rewriter: Đang gọi LLM để viết lại truy vấn...");
        
        // Giả sử llm_service trả về { content: "...", model: "..." }
        const response = await generateChatResponse(systemPrompt, userQueryForLLM);
        const rewrittenQuery = response.content.trim();
        
        // Xóa dấu ngoặc kép nếu LLM vô tình thêm vào
        const finalQuery = rewrittenQuery.replace(/^"|"$/g, '');

        console.log(`Query Rewriter: Gốc: "${currentQuery}" -> Viết lại: "${finalQuery}"`);
        return finalQuery;

    } catch (e) {
        console.error("Query Rewriter: Lỗi khi viết lại truy vấn:", e);
        // An toàn: Nếu viết lại thất bại, trả về truy vấn gốc
        // Điều này tốt hơn là làm sập toàn bộ pipeline.
        return currentQuery;
    }
}

module.exports = {
    rewriteQuery
};