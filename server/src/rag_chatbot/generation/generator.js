// Nhập hàm gọi API OpenAI thực tế
const { generateChatResponse } = require('../external_services/llm_service');

/**
 * Đóng gói yêu cầu cuối cùng và gọi LLM để tạo phản hồi.
 * @param {string} systemPrompt - System prompt hoàn chỉnh (từ orchestrator).
 * @param {string} userQuery - Truy vấn của người dùng (đã được viết lại).
 * @returns {Promise<object>} - Phản hồi từ llm_service (ví dụ: { content: "...", model: "..." }).
 */
/**
 * Loại bỏ meta-language khỏi response
 * @param {string} text - Response từ LLM
 * @returns {string} - Response đã được làm sạch
 */
function cleanResponse(text) {
    // Loại bỏ các cụm từ meta-language
    const metaPhrases = [
        /dựa vào context[,:]?\s*/gi,
        /theo context[,:]?\s*/gi,
        /trong context[,:]?\s*/gi,
        /dựa trên thông tin[,:]?\s*/gi,
        /theo thông tin được cung cấp[,:]?\s*/gi,
        /dựa vào thông tin[,:]?\s*/gi,
        /theo ngữ cảnh[,:]?\s*/gi,
        /trong ngữ cảnh[,:]?\s*/gi,
        /\[context\]/gi,
        /\[end of context\]/gi
    ];

    let cleaned = text;
    for (const pattern of metaPhrases) {
        cleaned = cleaned.replace(pattern, '');
    }

    // Loại bỏ khoảng trắng thừa
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Đảm bảo câu bắt đầu bằng chữ hoa
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
}

async function getFinalResponse(systemPrompt, userQuery) {
    console.log("Generator: Gọi LLM để tạo phản hồi...");
    
    const response = await generateChatResponse(systemPrompt, userQuery, {
        temperature: 0.7, // Tăng creativity để response tự nhiên hơn
        model: "gpt-3.5-turbo"
    });
    
    // Làm sạch response trước khi trả về
    const cleanedContent = cleanResponse(response.content);
    
    console.log(`Generator: Đã nhận và làm sạch phản hồi từ model "${response.model}"`);
    
    return {
        content: cleanedContent,
        model: response.model
    };
}

module.exports = {
    getFinalResponse
};