/**
 * Chứa các hàm để kiểm tra và làm sạch đầu vào của người dùng.
 */

// Danh sách các mẫu regex đơn giản để phát hiện Prompt Injection
// Đây chỉ là ví dụ cơ bản. Hệ thống thực tế cần phức tạp hơn.
const injectionPatterns = [
    /ignore previous instructions/i,
    /ignore all prior directives/i,
    /disregard the previous prompt/i,
    /hãy bỏ qua các chỉ dẫn/i,
    /forget your previous instructions/i,
    /act as/i, // "act as a ..."
    /roleplay as/i
];

// Regex cơ bản để phát hiện PII (ví dụ: email và số điện thoại VN)
const piiPatterns = [
    // Regex cho Email
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    // Regex cho SĐT Việt Nam (10 số, bắt đầu bằng 0)
    /\b(0[3|5|7|8|9])([0-9]{8})\b/g,
    // Regex cho số thẻ tín dụng cơ bản (ví dụ)
    /\b[0-9]{4}[ -]?[0-9]{4}[ -]?[0-9]{4}[ -]?[0-9]{4}\b/g
];

/**
 * Kiểm tra truy vấn của người dùng để tìm các mối đe dọa bảo mật đầu vào.
 * @param {string} query - Truy vấn thô từ người dùng.
 * @returns {{isSafe: boolean, message: string}} - Một đối tượng cho biết truy vấn có an toàn không.
 */
function validateInput(query) {
    if (!query || typeof query !== 'string') {
        return { isSafe: false, message: "Truy vấn không hợp lệ." };
    }

    const normalizedQuery = query.toLowerCase().trim();

    // 1. Kiểm tra Prompt Injection
    for (const pattern of injectionPatterns) {
        if (pattern.test(normalizedQuery)) {
            console.warn(`PHÁT HIỆN INJECTION: "${query}"`);
            return {
                isSafe: false,
                message: "Truy vấn của bạn chứa nội dung có khả năng gây hại. Vui lòng thử lại."
            };
        }
    }

    // 2. Kiểm tra PII
    for (const pattern of piiPatterns) {
        if (pattern.test(query)) { // Kiểm tra trên query gốc (chưa lowercase) để giữ độ chính xác
            console.warn(`PHÁT HIỆN PII: "${query}"`);
            return {
                isSafe: false,
                message: "Vui lòng không nhập thông tin cá nhân nhạy cảm (như email, số điện thoại, ...) vào khung chat."
            };
        }
    }

    // 3. Nếu vượt qua tất cả
    return { isSafe: true, message: "An toàn" };
}

module.exports = {
    validateInput
};