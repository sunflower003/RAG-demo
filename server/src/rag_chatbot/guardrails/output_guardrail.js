/**
 * Chứa các hàm để kiểm tra và làm sạch đầu ra của LLM
 * trước khi gửi cho người dùng.
 */

// DANH SÁCH TỪ KHÓA ĐỘC HẠI / THIÊN VỊ (VÍ DỤ CƠ BẢN)
// Trong một hệ thống thực tế, bạn nên sử dụng API kiểm duyệt (moderation API)
// chuyên dụng để có kết quả tốt hơn.
const toxicityPatterns = [
    /từ_khóa_tục_tĩu_1/i,
    /từ_khóa_phân_biệt_chủng_tộc/i,
    /từ_khóa_thiên_vị/i
    // ... (thêm các mẫu regex khác)
];

// DANH SÁCH THÔNG TIN BÍ MẬT NỘI BỘ (VÍ DỤ)
// Đây là những từ mà chatbot KHÔNG BAO GIỜ được phép nói ra
const confidentialPatterns = [
    /internal-db-password/i, // Mật khẩu
    /ProjectPhoenix/i, // Tên mã nội bộ
    /admin_panel_url/i, // URL nội bộ
    /COHERE_API_KEY/i, // Khóa API
    /OPENAI_API_KEY/i,
    /sk-[a-zA-Z0-9]{40,}/, // Regex chung cho API key
];

/**
 * Phản hồi an toàn, chung chung để trả về nếu phát hiện vi phạm.
 */
const SAFE_FALLBACK_MESSAGE = "Ối! Có lỗi xảy ra rồi! 😅 Bạn thử hỏi lại câu khác nhé! ✨";

/**
 * Kiểm tra xem response có chứa meta-language không
 */
function containsMetaLanguage(content) {
    const metaPatterns = [
        /dựa vào context/i,
        /theo context/i,
        /trong context/i,
        /dựa trên thông tin/i,
        /theo thông tin được cung cấp/i,
        /\[context\]/i,
        /draft:/i,
        /plan:/i,
        /execute:/i,
        /final answer:/i,
        /bước \d+:/i
    ];

    for (const pattern of metaPatterns) {
        if (pattern.test(content)) {
            console.warn(`⚠️ Phát hiện meta-language: ${pattern}`);
            return true;
        }
    }
    return false;
}

/**
 * Kiểm tra xem nội dung có an toàn không
 */
function isSafe(content) {
    const unsafeKeywords = [
        "API key",
        "password",
        "secret",
        "token",
        // Thêm các từ khóa nhạy cảm khác
    ];

    const lowerContent = content.toLowerCase();

    for (const keyword of unsafeKeywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
            console.warn(`⚠️ Output không an toàn. Chứa: "${keyword}"`);
            return false;
        }
    }

    return true;
}

/**
 * Validate output từ LLM
 * @param {string} output - Response từ LLM
 * @returns {Object} - { isSafe: boolean, message: string }
 */
function validateOutput(output) {
    if (!output || typeof output !== 'string' || output.trim().length === 0) {
        return {
            isSafe: false,
            message: SAFE_FALLBACK_MESSAGE
        };
    }

    // Kiểm tra meta-language
    if (containsMetaLanguage(output)) {
        console.warn('⚠️ Response chứa meta-language, sẽ được làm sạch ở generator');
        // Không block, vì đã có cleanResponse trong generator
    }

    // Kiểm tra an toàn
    if (!isSafe(output)) {
        return {
            isSafe: false,
            message: SAFE_FALLBACK_MESSAGE
        };
    }

    return {
        isSafe: true,
        message: output
    };
}

module.exports = {
    validateOutput,
    SAFE_FALLBACK_MESSAGE
};

/**
 * Quét phản hồi của LLM để tìm nội dung độc hại, thiên vị hoặc bí mật.
 * @param {string} responseText - Chuỗi phản hồi thô từ LLM.
 * @returns {{isSafe: boolean, message: string}} 
 * - {isSafe: true, message: responseText} nếu an toàn.
 * - {isSafe: false, message: SAFE_FALLBACK_MESSAGE} nếu vi phạm.
 */
function validateOutput(responseText) {
    if (!responseText || typeof responseText !== 'string') {
        return { isSafe: false, message: SAFE_FALLBACK_MESSAGE };
    }

    // 1. Kiểm tra Độc tính / Thiên vị (Toxicity / Bias) 
    for (const pattern of toxicityPatterns) {
        if (pattern.test(responseText)) {
            console.warn(`PHÁT HIỆN ĐỘC TÍNH/THIÊN VỊ TRONG ĐẦU RA: "${responseText}"`);
            return {
                isSafe: false,
                message: SAFE_FALLBACK_MESSAGE
            };
        }
    }

    // 2. Kiểm tra Thông tin Bí mật (Confidential Information) 
    for (const pattern of confidentialPatterns) {
        if (pattern.test(responseText)) {
            console.warn(`PHÁT HIỆN RÒ RỈ BÍ MẬT TRONG ĐẦU RA: "${responseText}"`);
            return {
                isSafe: false,
                message: SAFE_FALLBACK_MESSAGE
            };
        }
    }

    // 3. Nếu vượt qua tất cả
    return { isSafe: true, message: responseText };
}

module.exports = {
    validateOutput,
    SAFE_FALLBACK_MESSAGE // Xuất tất cả thông báo này để controller có thể dùng
};