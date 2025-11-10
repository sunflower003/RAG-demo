// /src/rag_chatbot/retrieval/reranker.js

const { CohereClient } = require('cohere-ai');
require('dotenv').config();

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

const TOP_N_RESULTS = 15; // Tăng lên 15 để có đủ không gian cho 6 sản phẩm
const DIVERSIFY_RESULTS = true; // Bật chế độ đa dạng hóa sản phẩm
const MIN_PRODUCTS_COVERAGE = 6; // Đảm bảo ít nhất 6 sản phẩm được đại diện

/**
 * Đa dạng hóa kết quả để đảm bảo mỗi sản phẩm có ít nhất 1 proposition
 * @param {Array<object>} documents - Documents gốc với product_id
 * @param {Array<number>} rerankedIndices - Indices đã được rerank
 * @param {number} targetCount - Số lượng kết quả mong muốn
 * @returns {Array<string>} - Danh sách propositions đã đa dạng hóa
 */
function diversifyResults(documents, rerankedIndices, targetCount) {
    const selected = [];
    const seenProducts = new Set();
    const productFirstProp = new Map(); // Track proposition đầu tiên của mỗi sản phẩm
    
    // Thu thập tất cả unique products từ reranked results
    for (const idx of rerankedIndices) {
        const doc = documents[idx];
        const productId = doc.product_id?.toString();
        
        if (productId && !productFirstProp.has(productId)) {
            productFirstProp.set(productId, {
                text: doc.proposition_text,
                idx: idx
            });
        }
    }
    
    // Bước 1: Đảm bảo mỗi sản phẩm có ít nhất 1 proposition
    for (const [productId, propInfo] of productFirstProp.entries()) {
        selected.push(propInfo.text);
        seenProducts.add(productId);
    }
    
    console.log(`Reranker: Bước 1 - Đã chọn ${selected.length} propositions từ ${seenProducts.size} sản phẩm`);
    
    // Bước 2: Điền thêm các propositions theo thứ tự rerank cho đến targetCount
    for (const idx of rerankedIndices) {
        if (selected.length >= targetCount) break;
        
        const doc = documents[idx];
        const text = doc.proposition_text;
        
        if (!selected.includes(text)) {
            selected.push(text);
        }
    }
    
    console.log(`Reranker: Bước 2 - Tổng ${selected.length} propositions từ ${seenProducts.size} sản phẩm khác nhau`);
    return selected;
}

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
            topN: Math.min(TOP_N_RESULTS * 3, documents.length), // Lấy nhiều hơn để đa dạng hóa
        });

        // Lấy indices đã được rerank
        const rerankedIndices = rerankResponse.results.map(result => result.index);
        
        // Áp dụng diversification nếu bật
        let finalResults;
        if (DIVERSIFY_RESULTS) {
            finalResults = diversifyResults(documents, rerankedIndices, TOP_N_RESULTS);
        } else {
            // Logic cũ: chỉ lấy text theo thứ tự
            finalResults = rerankedIndices
                .slice(0, TOP_N_RESULTS)
                .map(idx => textsToRerank[idx]);
        }

        console.log(`Reranker: Đã lọc từ ${documents.length} xuống còn ${finalResults.length} kết quả.`);
        return finalResults;

    } catch (e) {
        console.error("Reranker: Lỗi khi gọi Cohere API:", e);
        return documents.slice(0, TOP_N_RESULTS).map(doc => doc.proposition_text);
    }
}

module.exports = {
    rerankDocuments
};