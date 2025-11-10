// --- Nhập 6 bước của pipeline RAG ---
const { validateInput } = require('../rag_chatbot/guardrails/input_guardrail');
const { rewriteQuery } = require('../rag_chatbot/retrieval/query_rewriter');
const { vectorSearch } = require('../rag_chatbot/external_services/vector_db_service');
const { rerankDocuments } = require('../rag_chatbot/retrieval/reranker');
const { buildSystemPrompt } = require('../rag_chatbot/generation/orchestrator');
const { getFinalResponse } = require('../rag_chatbot/generation/generator');
const { validateOutput, SAFE_FALLBACK_MESSAGE } = require('../rag_chatbot/guardrails/output_guardrail');

// Nhập Model
const ChatHistory = require('../models/ChatHistory');
const mongoose = require('mongoose');

/**
 * Kiểm tra xem câu hỏi có phải là yêu cầu liệt kê tất cả sản phẩm không
 */
function isListAllProductsQuery(query) {
    const listPatterns = [
        /có những? (?:loại|vị|sản phẩm|đồ uống) (?:gì|nào)/i,
        /(?:liệt kê|cho (?:tôi|mình) biết) (?:tất cả|các|những) (?:sản phẩm|đồ uống)/i,
        /menu (?:của |)(?:shop|quán)/i,
        /bán (?:những gì|gì)/i,
        /có (?:bán |)gì/i,
        /(?:tất cả|toàn bộ) (?:sản phẩm|đồ uống|vị)/i
    ];
    return listPatterns.some(pattern => pattern.test(query));
}

/**
 * Lấy tất cả sản phẩm từ database và tạo câu trả lời
 */
async function getAllProductsList() {
    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).toArray();
    
    const productNames = products.map(p => p.name);
    
    return {
        answer: `Chào bạn dễ thương nhé! 🍹✨

Hiện tại shop có ${productNames.length} vị đồ uống siêu ngon nè:

${productNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Bạn muốn mình tư vấn vị nào chi tiết hơn không nhé? 😊💚`,
        products: productNames
    };
}

/**
 * Xử lý yêu cầu chat, thực thi toàn bộ pipeline RAG
 */
async function handleChatRequest(req, res) {
    // 1. Lấy dữ liệu từ frontend
    // Frontend cần gửi: query (câu hỏi) và sessionId (để tải lịch sử)
    const { query, sessionId } = req.body;

    if (!query || !sessionId) {
        return res.status(400).json({ error: 'Thiếu query hoặc sessionId.' });
    }

    try {
        // --- BƯỚC 1: INPUT GUARDRAIL ---
        const inputCheck = validateInput(query);
        if (!inputCheck.isSafe) {
            return res.status(400).json({ answer: inputCheck.message });
        }

        // --- BƯỚC 1.5: KIỂM TRA CÂU HỎI LIỆT KÊ SẢN PHẨM ---
        if (isListAllProductsQuery(query)) {
            console.log("🎯 Phát hiện câu hỏi liệt kê sản phẩm → Trả về danh sách đầy đủ");
            const response = await getAllProductsList();
            
            // Lưu vào lịch sử
            let chatSession = await ChatHistory.findOne({ sessionId });
            const newUserMessage = { role: 'user', content: query };
            const botMessage = { role: 'assistant', content: response.answer };

            if (!chatSession) {
                await ChatHistory.create({
                    sessionId: sessionId,
                    messages: [newUserMessage, botMessage]
                });
            } else {
                chatSession.messages.push(newUserMessage, botMessage);
                await chatSession.save();
            }

            return res.status(200).json({
                answer: response.answer,
                model: 'direct-query'
            });
        }

        // Tải lịch sử chat từ DB
        let chatSession = await ChatHistory.findOne({ sessionId });
        const history = chatSession ? chatSession.messages : [];

        // --- BƯỚC 2: QUERY REWRITING --- [cite: 64]
        const rewrittenQuery = await rewriteQuery(query, history);

        // --- BƯỚC 3: VECTOR SEARCH --- [cite: 68]
        const documents = await vectorSearch(rewrittenQuery);
        
        console.log(`🔍 Query: "${rewrittenQuery}"`);
        console.log(`📄 Vector Search Results: ${documents.length} documents`);

        // --- BƯỚC 4: RERANKING --- [cite: 72]
        const rerankedChunks = await rerankDocuments(rewrittenQuery, documents);
        
        console.log(`🎯 Reranked Results: ${rerankedChunks.length} chunks`);
        
        // Debug: Kiểm tra xem có đủ sản phẩm không
        const uniqueProducts = new Set();
        for (const chunk of rerankedChunks) {
            // Extract product name từ proposition text (thường bắt đầu bằng tên sản phẩm)
            const match = chunk.match(/^([^là]+)/);
            if (match) {
                uniqueProducts.add(match[1].trim());
            }
        }
        console.log(`📊 Unique products in chunks: ${uniqueProducts.size}`);
        console.log(`📝 Products:`, Array.from(uniqueProducts));
        console.log(`📝 Sample chunks:`, rerankedChunks.slice(0, 3));

        // --- BƯỚC 5: GENERATION & ORCHESTRATION --- [cite: 76]
        // 5a. Điều phối (Tạo system prompt)
        const systemPrompt = buildSystemPrompt(rerankedChunks);
        
        // 5b. Tạo (Gọi LLM) [cite: 94]
        const llmResponse = await getFinalResponse(systemPrompt, rewrittenQuery);

        // --- BƯỚC 6: OUTPUT GUARDRAIL --- [cite: 97]
        const outputCheck = validateOutput(llmResponse.content);
        const finalAnswer = outputCheck.isSafe ? outputCheck.message : SAFE_FALLBACK_MESSAGE;

        // --- BƯỚC 7: TRẢ VỀ PHẢN HỒI --- [cite: 100]
        res.status(200).json({
            answer: finalAnswer,
            model: llmResponse.model // Gửi kèm model đã sử dụng (từ llm_service)
        });

        // --- (Nền) Lưu tin nhắn mới vào lịch sử DB ---
        const newUserMessage = { role: 'user', content: query }; // Lưu query gốc
        const botMessage = { role: 'assistant', content: finalAnswer };

        if (!chatSession) {
            // Tạo phiên mới nếu chưa tồn tại
            await ChatHistory.create({
                sessionId: sessionId,
                messages: [newUserMessage, botMessage]
            });
        } else {
            // Thêm vào phiên đã có
            chatSession.messages.push(newUserMessage, botMessage);
            await chatSession.save();
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong chatController:", error);
        res.status(500).json({ answer: "Xin lỗi, đã có lỗi xảy ra trên máy chủ." });
    }
}

module.exports = {
    handleChatRequest
};