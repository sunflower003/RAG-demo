const { model } = require("mongoose");
const OpenAI = require("openai");
require('dotenv').config();

/**
 * Hàm này chịu trách nhiệm gọi API OpenAI Chat Completion.
 * Nó được thiết kế để sử dụng trong pipeline RAG thời gian thực.
 *
 * @param {string} systemPrompt - Prompt hệ thống (ví dụ: prompt CoVe)[cite: 96].
 * @param {string} userQuery - Truy vấn của người dùng.
 * @returns {Promise<string>} - Chuỗi nội dung phản hồi từ LLM.
 */

const openai = new OpenAI();

async function generateChatResponse(systemPrompt, userQuery) {
    console.log("Calling OpenAI Chat Completion API...");

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            temperature: 1,
        });
        return {
            content: response.choices[0].message.content,
            model: response.model
        }
    } catch (e) {
        console.error("Error calling OpenAI API:", e);
        return "Sorry, there was an error processing your request.";
    }
}

module.exports = {
    generateChatResponse
};
