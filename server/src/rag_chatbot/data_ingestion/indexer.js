const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI();

// Model embedding
const EMBEDDING_MODEL = 'text-embedding-3-small';

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Tạo một vector embedding cho một chuỗi văn bản bằng mô hình OpenAI.
 * @param {string} text - Chuỗi văn bản đầu vào (ví dụ: một mệnh đề).
 * @returns {Promise<number[]>} - Một mảng số (vector) đại diện cho văn bản.
 */

async function getEmbedding(text) {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid input text for embedding.');
        return null;
    }

    const inputText = text.replace(/\n/g, ' ');

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: inputText,
            dimensions: EMBEDDING_DIMENSIONS,
        });

        // Trả về vector embedding từ phản hồi
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error fetching embedding:', error);
        return null;
    }
}

module.exports = {
    getEmbedding
};