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
        // --- BƯỚC 1: INPUT GUARDRAIL --- [cite: 60]
        const inputCheck = validateInput(query);
        if (!inputCheck.isSafe) {
            return res.status(400).json({ answer: inputCheck.message });
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