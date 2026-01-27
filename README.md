# MERN-RAG Chatbot - Beverage E-Commerce

> Hệ thống chatbot thông minh sử dụng RAG (Retrieval-Augmented Generation) để tư vấn sản phẩm đồ uống

## Mục lục

* [Giới thiệu](#-giới-thiệu)
* [Tính năng](#-tính-năng)
* [Kiến trúc](#-kiến-trúc)
* [Cài đặt](#-cài-đặt)
* [Sử dụng](#-sử-dụng)
* [Pipeline RAG](#-pipeline-rag)
* [API Documentation](#-api-documentation)
* [Documentation](https://drive.google.com/drive/folders/1FRcoBCCJf2emiyREFh4xDge2Ik7ZHY-c?usp=drive_link)
* [Troubleshooting](#-troubleshooting)

## Giới thiệu

Dự án này là một chatbot thông minh được xây dựng bằng **MERN stack** (MongoDB, Express, React, Node.js) kết hợp với kỹ thuật **RAG (Retrieval-Augmented Generation)** để tư vấn sản phẩm đồ uống.

### Propositions-Based RAG

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

## Tính năng

* Tìm kiếm thông minh với Vector Search trên MongoDB Atlas
* Reranking kết quả bằng Cohere
* Chain of Verification (CoVe) để tự kiểm tra độ chính xác
* Input / Output Guardrails chống prompt injection và nội dung độc hại
* Query Rewriting dựa trên lịch sử chat
* Lưu lịch sử hội thoại
* Giao diện React với Vite

## Kiến trúc

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

* React 19
* Vite
* Axios

**Backend:**

* Node.js
* Express 5
* Mongoose

**AI Services:**

* OpenAI GPT-5-nano (Chat completion)
* OpenAI text-embedding-3-small (Embeddings)
* Cohere Rerank v3 (Reranking)

**Database:**

* MongoDB Atlas (Operational DB + Vector Store)

## Cài đặt

### Yêu cầu hệ thống

* Node.js >= 18.x
* npm hoặc yarn
* MongoDB Atlas account
* OpenAI API key
* Cohere API key

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
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
OPENAI_API_KEY=sk-proj-...your-key...
COHERE_API_KEY=...your-key...
PORT=3369
```

Không commit file `.env` lên Git.

### Bước 4: Tạo Vector Search Index trên MongoDB Atlas

1. Truy cập MongoDB Atlas Console
2. Chọn cluster
3. Vào tab Search → Create Search Index
4. Chọn JSON Editor và dán cấu hình:

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
    { "type": "filter", "path": "product_id" },
    { "type": "filter", "path": "category" }
  ]
}
```

5. Collection: `products_embeddings`
6. Đợi index ở trạng thái Active

### Bước 5: Ingest dữ liệu

```bash
cd server
npm run ingest
```

Hoặc xóa dữ liệu cũ trước khi ingest:

```bash
npm run ingest:clear
```

## Sử dụng

### Chạy Development Server

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
cd client
npm run dev
```

### Ví dụ câu hỏi

* Shop có các loại đồ uống gì?
* Margarita Spritz Cans có bao nhiêu calo?
* Sản phẩm nào là organic?
* Giá của Mango Peach Rosé là bao nhiêu?

## Pipeline RAG

```
User Query
  → Input Guardrail
  → Query Rewriting
  → Vector Search
  → Reranking
  → Orchestration
  → Generation
  → Output Guardrail
  → Response
```

## API Documentation

### POST /api/chat

**Request:**

```json
{
  "query": "Shop có các loại đồ uống gì?",
  "sessionId": "user-123-session-456"
}
```

**Response:**

```json
{
  "answer": "Shop có nhiều loại đồ uống như Margarita Spritz Cans, Mango Peach Rosé Bellini Spritz và Organic Blood Orange Mimosa.",
  "model": "gpt-3.5-turbo"
}
```

## Troubleshooting

### MONGO_URI is not defined

* Kiểm tra file `.env`

### OpenAI API key is invalid

* Kiểm tra API key
* Tạo key mới trên OpenAI

### Chatbot trả lời sai

* Kiểm tra Search Index trên MongoDB Atlas
* Chạy lại ingest

## License

MIT

## Contributing

Pull Request luôn được chào đón.

## Contact

* GitHub: Your GitHub
* Email: Your Email
