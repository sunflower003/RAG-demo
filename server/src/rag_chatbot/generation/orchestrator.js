const { getCoVeSystemPrompt } = require('../prompt_templates/system_prompt');

/**
 * Xây dựng system prompt cuối cùng bằng cách nối các chunk
 * và chèn chúng vào mẫu CoVe.
 * @param {Array<string>} rerankedChunks - Mảng các chuỗi mệnh đề (ví dụ: 3-5 kết quả từ reranker).
 * @returns {string} - System prompt hoàn chỉnh, sẵn sàng để gửi đến LLM.
 */
function buildSystemPrompt(rerankedChunks) {
    if (!rerankedChunks || rerankedChunks.length === 0) {
        console.warn("Orchestrator: Không có chunk nào được cung cấp. Tạo prompt không có ngữ cảnh.");
        // Trả về prompt CoVe với ngữ cảnh trống
        return getCoVeSystemPrompt("Không có thông tin nào được tìm thấy.");
    }

    // 1. Nối 3-5 chunks lại thành một chuỗi context duy nhất [cite: 33]
    // Chúng ta dùng "---" để tách biệt rõ ràng các mệnh đề cho LLM
    const context = rerankedChunks.join("\n---\n"); 

    // 2. Tải mẫu prompt và chèn context vào
    const finalSystemPrompt = getCoVeSystemPrompt(context);

    return finalSystemPrompt;
}

module.exports = {
    buildSystemPrompt
};