const { generateChatResponse } = require('../external_services/llm_service');

/**
 * Xây dựng một chuỗi ngữ cảnh từ các trường quan trọng của sản phẩm.
 * Điều này đảm bảo LLM nhận được TẤT CẢ thông tin có liên quan.
 * @param {object} product - Đối tượng sản phẩm đầy đủ.
 * @returns {string} - Một chuỗi văn bản chứa dữ liệu sản phẩm.
 */
function buildProductContext(product) {
    let context = `Name: ${product.name}\n`;
    
    // Thêm các trường văn bản nếu chúng tồn tại
    if (product.description) {
        context += `Description: ${product.description}\n`;
    }
    if (product.subDescription) {
        context += `SubDescription: ${product.subDescription}\n`;
    }
    if (product.company) {
        context += `Company: ${product.company}\n`;
    }
    if (product.country) {
        context += `Country: ${product.country}\n`;
    }
    if (product.region) {
        context += `Region: ${product.region}\n`;
    }

    // Thêm các thẻ (tags)
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
        context += `Tags: ${product.tags.join(', ')}\n`;
    }
    
    // Thêm các số liệu quan trọng
    if (product.abv) {
        context += `ABV (Alcohol by Volume): ${product.abv}\n`;
    }
    if (product.price) {
        // Xử lý định dạng $numberInt hoặc chỉ là số
        const price = typeof product.price === 'object' ? product.price.$numberInt : product.price;
        context += `Price: ${price}\n`;
    }
    
    return context;
}

/**
 * Sử dụng LLM để trích xuất các "mệnh đề" (sự thật nguyên tử) từ thông tin sản phẩm.
 * [cite_start]Đây là chiến lược "Propositions" được mô tả trong Giai đoạn 2 của kế hoạch[cite: 7, 8].
 *
 * @param {object} product - Đối tượng sản phẩm (ví dụ: { name, description, tags }).
 * @returns {Promise<string[]>} - Một mảng các chuỗi, mỗi chuỗi là một mệnh đề.
 */
async function extractPropositions(product) {
    console.log(`Extracting propositions for product: ${product.name}`);

     // 1. Định nghĩa System Prompt (Không đổi)
     const systemPrompt = `
        Bạn là một chuyên gia trích xuất dữ liệu.
        Nhiệm vụ của bạn là trích xuất TẤT CẢ các sự thật nguyên tử (atomic facts or propositions) từ thông tin sản phẩm được cung cấp.

        BẠN PHẢI tuân thủ các quy tắc sau:
        1. Trả lời bằng một mảng JSON chứa các chuỗi (JSON string array). Ví dụ: ["Sự thật 1", "Sự thật 2"].
        2. KHÔNG thêm bất kỳ lời giải thích hay văn bản nào khác ngoài mảng JSON.
        3. Mỗi sự thật phải là một câu đơn giản, hoàn chỉnh.
        4. LUÔN LUÔN bắt đầu mỗi câu bằng tên sản phẩm ('${product.name}') để giữ ngữ cảnh.
        5. Trích xuất thông tin từ TẤT CẢ các trường được cung cấp.

        Ví dụ đầu ra cho một sản phẩm khác:
        [
        "${product.name} là một loại rượu vang.",
        "${product.name} được chứng nhận hữu cơ.",
        "${product.name} có 120 calo."
        ]
    `;
    
    // 2. TẠO TRUY VẤN MỘT CÁCH TỰ ĐỘNG
    const userQuery = `Hãy trích xuất các mệnh đề từ sản phẩm này:\n${buildProductContext(product)}`;
    
    let llmOutput = ''; // Khai báo bên ngoài để catch block có thể truy cập
    
    try {
        // 3. Gọi LLM service
        const response = await generateChatResponse(systemPrompt, userQuery);
        llmOutput = response.content; // Lấy nội dung

        // 4. Phân tích cú pháp phản hồi JSON
        const propositions = JSON.parse(llmOutput);

        if (Array.isArray(propositions)) {
            console.log(`Extracted successfully ${propositions.length} propositions.`);
            return propositions;
        }

        // Xử lý trường hợp LLM trả về không phải mảng
        console.warn('LLM response was not an array. Output:', llmOutput);
        return [];

    } catch (e) {
        // 5. SỬA LỖI TRONG CATCH BLOCK
        console.error(`Error extracting propositions for ${product.name}:`, e.message);
        // In ra output thô từ LLM (nếu có) để gỡ lỗi, vì lỗi này
        // thường xảy ra do LLM trả về JSON không hợp lệ
        console.error('LLM Raw Output (that caused parse error):', llmOutput); 
        return []; // Luôn trả về mảng rỗng khi thất bại
    }
}

module.exports = {
    extractPropositions
}