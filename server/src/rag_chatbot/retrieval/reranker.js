// /src/rag_chatbot/retrieval/reranker.js

const { CohereClient } = require('cohere-ai');
require('dotenv').config();

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

const TOP_N_RESULTS = 10; // Tăng từ 5 lên 10 để có nhiều context hơn 

/**
 * Sử dụng Cohere Rerank API để xếp hạng lại các kết quả từ vector search.
 *
 * @param {string} query - Truy vấn gốc (đã được viết lại) của người dùng.
 * @param {Array<object>} documents - Mảng các tài liệu (50 kết quả từ vectorSearch).
 * @returns {Promise<Array<string>>} - Một mảng chứa 3-5 chuỗi mệnh đề liên quan nhất.
 */
async function rerankDocuments(query, documents) {
    console.log(`Reranker: Đang xếp hạng lại ${documents.length} tài liệu...`);

    if (!documents || documents.length === 0) {
        console.warn("Reranker: Không có tài liệu nào để xếp hạng.");
        return [];
    }
    if (!process.env.COHERE_API_KEY) {
        console.warn("Reranker: COHERE_API_KEY chưa được đặt. Bỏ qua xếp hạng.");
        return documents.slice(0, TOP_N_RESULTS).map(doc => doc.proposition_text);
    }

    // Mảng các chuỗi văn bản gốc
    const textsToRerank = documents.map(doc => doc.proposition_text);

    try {
        const rerankResponse = await cohere.rerank({
            model: "rerank-english-v3.0", // Hoặc "rerank-multilingual-v3.0"
            query: query,
            documents: textsToRerank,
            topN: TOP_N_RESULTS,
        });

        // --- SỬA LỖI Ở ĐÂY ---
        // Kết quả trả về chứa 'index' trỏ đến mảng 'textsToRerank' gốc
        const rerankedTexts = rerankResponse.results.map(result => {
            // Dùng result.index để lấy đúng văn bản từ mảng gốc
            return textsToRerank[result.index]; 
        });
        // --- KẾT THÚC SỬA LỖI ---

        console.log(`Reranker: Đã lọc từ ${documents.length} xuống còn ${rerankedTexts.length} kết quả.`);
        return rerankedTexts;

    } catch (e) {
        console.error("Reranker: Lỗi khi gọi Cohere API:", e);
        return documents.slice(0, TOP_N_RESULTS).map(doc => doc.proposition_text);
    }
}

module.exports = {
    rerankDocuments
};