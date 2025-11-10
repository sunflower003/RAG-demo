# 🍹 MERN-RAG Chatbot - Beverage E-Commerce

> Hệ thống chatbot thông minh sử dụng RAG (Retrieval-Augmented Generation) để tư vấn sản phẩm đồ uống

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)](https://www.mongodb.com/mern-stack)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI-blue)](https://openai.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)](https://www.mongodb.com/atlas)

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Kiến trúc](#-kiến-trúc)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Pipeline RAG](#-pipeline-rag)
- [API Documentation](#-api-documentation)
- [Documentation](https://drive.google.com/drive/folders/1FRcoBCCJf2emiyREFh4xDge2Ik7ZHY-c?usp=drive_link)
- [Troubleshooting](#-troubleshooting)

## 🎯 Giới thiệu

Dự án này là một chatbot thông minh được xây dựng bằng **MERN stack** (MongoDB, Express, React, Node.js) kết hợp với kỹ thuật **RAG (Retrieval-Augmented Generation)** để tư vấn sản phẩm đồ uống.

### Điểm đặc biệt: Propositions-Based RAG

Khác với các hệ thống RAG thông thường sử dụng chunking theo ký tự, dự án này sử dụng **"Propositions"** - các sự kiện nguyên tử (atomic factoids) được tạo bởi LLM. Mỗi mô tả sản phẩm được phân tách thành các câu độc lập, tự chứa đầy đủ thông tin.

**Ví dụ:**
```
Sản phẩm: "Margarita Spritz Cans"
Mô tả: "Organic agave wine with lime juice. 110 Calories. No Added Sugar."

↓ (Xử lý bởi LLM)

Propositions:
1. Margarita Spritz Cans là rượu vang từ agave hữu cơ.
2. Margarita Spritz Cans được kết hợp với nước ép chanh.
3. Margarita Spritz Cans có 110 Calo mỗi lon.
4. Margarita Spritz Cans không thêm đường.
```

## ✨ Tính năng

- ✅ **Tìm kiếm thông minh** - Vector search với MongoDB Atlas
- ✅ **Reranking** - Sắp xếp lại kết quả bằng Cohere
- ✅ **Chain of Verification (CoVe)** - Tự kiểm tra độ chính xác trước khi trả lời
- ✅ **Input/Output Guardrails** - Bảo vệ khỏi prompt injection và nội dung độc hại
- ✅ **Query Rewriting** - Viết lại câu hỏi dựa trên lịch sử chat
- ✅ **Lưu lịch sử chat** - Theo dõi cuộc hội thoại
- ✅ **Giao diện thân thiện** - React UI với Vite

## 🏗️ Kiến trúc

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React UI  │ ───▶ │ Express API  │ ───▶ │  MongoDB    │
│  (Vite)     │      │  RAG Pipeline│      │   Atlas     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  OpenAI API │
                     │  Cohere API │
                     └─────────────┘
```

### Tech Stack

**Frontend:**
- React 19
- Vite
- Axios

**Backend:**
- Node.js
- Express 5
- Mongoose

**AI Services:**
- OpenAI GPT-5-nano (Chat completion)
- OpenAI text-embedding-3-small (Embeddings)
- Cohere Rerank v3 (Reranking)

**Database:**
- MongoDB Atlas (Operational DB + Vector Store)

## 🚀 Cài đặt

### Yêu cầu hệ thống

- Node.js >= 18.x
- npm hoặc yarn
- MongoDB Atlas account
- OpenAI API key
- Cohere API key

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd RAG-demo
```

### Bước 2: Cài đặt dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Bước 3: Cấu hình môi trường

Tạo file `.env` trong thư mục `server/`:

```env
# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# OpenAI
OPENAI_API_KEY=sk-proj-...your-key...

# Cohere
COHERE_API_KEY=...your-key...

# Server
PORT=3369
```

**⚠️ BẢO MẬT:** Không bao giờ commit file `.env` lên Git!

### Bước 4: Tạo Vector Search Index trên MongoDB Atlas

1. Truy cập MongoDB Atlas Console
2. Chọn cluster của bạn
3. Vào tab "Search" → "Create Search Index"
4. Chọn "JSON Editor" và paste config sau:

```json
{
  "name": "vector_index_beverages",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "proposition_embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "product_id"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

5. Chọn collection: `products_embeddings`
6. Tạo index và đợi status "Active"

### Bước 5: Ingest dữ liệu

Nạp dữ liệu sản phẩm và tạo embeddings:

```bash
cd server
npm run ingest
```

Hoặc xóa dữ liệu cũ trước khi ingest:

```bash
npm run ingest:clear
```

**Quá trình này bao gồm:**
1. Đọc products từ MongoDB
2. Tạo propositions bằng GPT
3. Tạo embeddings cho mỗi proposition
4. Lưu vào collection `products_embeddings`

## 💻 Sử dụng

### Chạy Development Server

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server chạy tại: `http://localhost:3369`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client chạy tại: `http://localhost:5173`

### Sử dụng Chatbot

1. Mở trình duyệt tại `http://localhost:5173`
2. Nhập câu hỏi về sản phẩm đồ uống
3. Chatbot sẽ trả lời dựa trên database

**Ví dụ câu hỏi:**
- "Shop có các loại đồ uống gì?"
- "Margarita Spritz Cans có bao nhiêu calo?"
- "Sản phẩm nào là organic?"
- "Giá của Mango Peach Rosé là bao nhiêu?"

## 🔄 Pipeline RAG (7 bước)

Mỗi câu hỏi của người dùng đi qua 7 bước xử lý:

```
User Query
    ↓
1️⃣ Input Guardrail
    ↓ (Chặn prompt injection, PII)
2️⃣ Query Rewriting
    ↓ (Viết lại dựa trên lịch sử)
3️⃣ Vector Search
    ↓ (Tìm 100 propositions gần nhất)
4️⃣ Reranking
    ↓ (Lọc còn top 10 bằng Cohere)
5️⃣ Orchestration
    ↓ (Build CoVe prompt)
6️⃣ Generation
    ↓ (Gọi GPT để sinh câu trả lời)
7️⃣ Output Guardrail
    ↓ (Kiểm tra độ an toàn)
Response
```

### Chi tiết từng bước:

1. **Input Guardrail** (`guardrails/input_guardrail.js`)
   - Kiểm tra prompt injection
   - Phát hiện PII (email, số điện thoại)
   - Lọc từ ngữ không phù hợp

2. **Query Rewriting** (`retrieval/query_rewriter.js`)
   - Giải quyết đại từ ("nó", "cái đó")
   - Tạo query độc lập dựa trên context
   - Ví dụ: "Nó bao nhiêu calo?" → "Margarita Spritz Cans có bao nhiêu calo?"

3. **Vector Search** (`external_services/vector_db_service.js`)
   - Chuyển query thành embedding vector (1536 chiều)
   - Tìm kiếm cosine similarity trên MongoDB Atlas
   - Trả về 100 propositions gần nhất

4. **Reranking** (`retrieval/reranker.js`)
   - Sử dụng Cohere Rerank API
   - Chọn 10 propositions liên quan nhất
   - Giảm noise, tăng độ chính xác

5. **Orchestration** (`generation/orchestrator.js`)
   - Nối 10 propositions thành context
   - Chèn vào CoVe prompt template
   - Chuẩn bị input cho LLM

6. **Generation** (`generation/generator.js`)
   - Gọi GPT-3.5-turbo
   - Áp dụng Chain of Verification
   - Trả về câu trả lời đã kiểm chứng

7. **Output Guardrail** (`guardrails/output_guardrail.js`)
   - Kiểm tra toxicity
   - Phát hiện hallucination
   - Trả về fallback message nếu không an toàn

## 📚 API Documentation

### POST `/api/chat`

Gửi câu hỏi và nhận câu trả lời từ chatbot.

**Request Body:**
```json
{
  "query": "Shop có các loại đồ uống gì?",
  "sessionId": "user-123-session-456"
}
```

**Response:**
```json
{
  "answer": "Ô dạ, shop mình có nhiều loại ngon lắm nè! 🍹✨\n• Margarita Spritz Cans\n• Mango Peach Rosé Bellini Spritz\n• Organic Blood Orange Mimosa\nBạn thích loại nào? 😊",
  "model": "gpt-3.5-turbo"
}
```

**Error Response:**
```json
{
  "error": "Thiếu query hoặc sessionId."
}
```

## 🛠️ Cấu trúc Dự án

```
RAG-demo/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Component chính
│   │   │   ├── MessageList.jsx     # Danh sách tin nhắn
│   │   │   └── PromptInput.jsx     # Input field
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                  # Backend Node.js
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── src/
│   │   ├── controllers/
│   │   │   └── chatController.js   # Main RAG orchestration
│   │   ├── models/
│   │   │   └── ChatHistory.js      # Chat session schema
│   │   ├── routes/
│   │   │   └── chatRoutes.js       # API routes
│   │   └── rag_chatbot/
│   │       ├── data_ingestion/
│   │       │   ├── chunker.js      # Propositions generation
│   │       │   └── indexer.js      # Embeddings creation
│   │       ├── external_services/
│   │       │   ├── llm_service.js          # OpenAI wrapper
│   │       │   └── vector_db_service.js    # MongoDB vector ops
│   │       ├── generation/
│   │       │   ├── orchestrator.js         # Prompt building
│   │       │   └── generator.js            # LLM calling
│   │       ├── guardrails/
│   │       │   ├── input_guardrail.js      # Input validation
│   │       │   └── output_guardrail.js     # Output validation
│   │       ├── prompt_templates/
│   │       │   └── system_prompt.js        # CoVe template
│   │       └── retrieval/
│   │           ├── query_rewriter.js       # Query rewriting
│   │           └── reranker.js             # Cohere reranking
│   ├── index.js             # Express server
│   ├── ingest.js            # Data ingestion script
│   └── package.json
│
├── .github/
│   └── copilot-instructions.md    # AI agent guidelines
└── README.md
```

## 🐛 Troubleshooting

### Lỗi: "MONGO_URI is not defined"
**Giải pháp:** Kiểm tra file `.env` trong `server/` có chứa `MONGO_URI`

### Lỗi: "OpenAI API key is invalid"
**Giải pháp:** 
1. Kiểm tra key trong `.env`
2. Tạo key mới tại https://platform.openai.com/api-keys
3. Đảm bảo dùng `OPENAI_API_KEY` (không phải `OPEN_API_KEY`)

### Chatbot trả lời sai hoặc thiếu thông tin
**Nguyên nhân:** Vector search index chưa được tạo hoặc chưa active

**Giải pháp:**
1. Kiểm tra Atlas Console → Search Indexes
2. Đảm bảo index `vector_index_beverages` có status "Active"
3. Chạy lại `npm run ingest:clear`

### Lỗi: "Cannot find module"
**Giải pháp:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

### Chatbot phản hồi chậm
**Nguyên nhân:** OpenAI API hoặc Cohere API chậm

**Giải pháp:**
1. Giảm `TOP_N_RESULTS` trong `reranker.js` (từ 10 xuống 5)
2. Giảm `LIMIT` trong `vector_db_service.js` (từ 100 xuống 50)
3. Sử dụng `gpt-3.5-turbo` thay vì `gpt-4`

## 📊 Scripts

```bash
# Backend
npm run dev          # Chạy server với nodemon
npm start            # Chạy server production
npm run ingest       # Ingest dữ liệu (giữ dữ liệu cũ)
npm run ingest:clear # Ingest dữ liệu (xóa dữ liệu cũ)

# Frontend
npm run dev          # Chạy Vite dev server
npm run build        # Build production
npm run preview      # Preview production build
```

## 🔐 Bảo mật

- ✅ Không commit file `.env`
- ✅ Rotate API keys định kỳ
- ✅ Sử dụng Input/Output Guardrails
- ✅ Validate tất cả user input
- ✅ Rate limiting (TODO)
- ✅ HTTPS trong production (TODO)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

- GitHub: [Your GitHub]
- Email: [Your Email]

---

**Made with ❤️ using MERN Stack + RAG**
