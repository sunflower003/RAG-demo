# AI Agent Instructions - MERN-RAG Chatbot

## Architecture Overview

This is a **MERN stack RAG (Retrieval-Augmented Generation) chatbot** for a beverage e-commerce site. The architecture follows a strict separation of concerns:

- **Frontend**: React + Vite (`client/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: MongoDB Atlas (dual-purpose: operational DB + vector store)
- **AI Services**: OpenAI (embeddings + GPT), Cohere (reranking)

### Key Design Decision: Propositions-Based RAG

Unlike typical RAG systems that chunk documents by character count, this project uses **"Propositions"** - LLM-generated atomic factoids. Each product description is decomposed into independent, self-contained statements that include the product name. This ensures precise retrieval even for short descriptions.

**Example Flow**:
```
Product: "Margarita Spritz Cans"
Description: "Organic agave wine with lime juice. 110 Calories. No Added Sugar."

↓ (LLM Processing in chunker.js)

Propositions:
1. "Margarita Spritz Cans là rượu vang từ agave hữu cơ."
2. "Margarita Spritz Cans được kết hợp với nước ép chanh."
3. "Margarita Spritz Cans có 110 Calo mỗi lon."
4. "Margarita Spritz Cans không thêm đường."
```

## RAG Pipeline (7 Steps)

The chatbot follows a **7-step pipeline** orchestrated in `server/src/controllers/chatController.js`:

1. **Input Guardrail** (`guardrails/input_guardrail.js`) - Blocks prompt injection, PII leaks
2. **Query Rewriting** (`retrieval/query_rewriter.js`) - Rewrites user query using chat history
3. **Vector Search** (`external_services/vector_db_service.js`) - Retrieves ~50 candidates from MongoDB Atlas
4. **Reranking** (`retrieval/reranker.js`) - Uses Cohere to select top 3-5 chunks
5. **Orchestration** (`generation/orchestrator.js`) - Builds CoVe (Chain of Verification) prompt
6. **Generation** (`generation/generator.js`) - Calls GPT to generate response
7. **Output Guardrail** (`guardrails/output_guardrail.js`) - Validates response safety

## Critical Project Conventions

### 1. Service Pattern (Singleton Exports)
All services export a **single instance**, not a class:
```javascript
// ✅ Correct (used throughout)
class LLMService { /* ... */ }
module.exports = new LLMService();

// ❌ Wrong
module.exports = LLMService;
```

### 2. Environment Variables
- Use `OPENAI_API_KEY` (not `OPEN_API_KEY`)
- Use `process.env.OPENAI_API_KEY` in constructors
- MongoDB connection uses Mongoose (`server/config/db.js`)

### 3. MongoDB Collections
- `products` - Product catalog (Mongoose model in `src/models/`)
- `products_embeddings` - Vector embeddings (raw MongoDB collection, NO Mongoose)
- `chathistories` - Chat sessions (Mongoose model `ChatHistory`)

### 4. Vector Search Index
Atlas Search Index name: `vector_index_beverages` (1536 dimensions, cosine similarity)
```json
{
  "type": "vector",
  "path": "proposition_embedding",
  "numDimensions": 1536,
  "similarity": "cosine"
}
```

## Developer Workflows

### Initial Setup
```bash
# Backend
cd server
npm install
# Create .env with: OPENAI_API_KEY, MONGO_URI, PORT
npm run ingest  # Run data ingestion (chunking + embedding)
npm run dev     # Start server (port 3369)

# Frontend
cd client
npm install
npm run dev     # Start Vite dev server
```

### Data Ingestion Pipeline
Run `server/ingest.js` to process products:
1. `chunker.js` - Calls OpenAI to create propositions
2. `indexer.js` - Generates embeddings for each proposition
3. Inserts into `products_embeddings` collection

**Command**: `npm run ingest` or `npm run ingest:clear` (clears old embeddings)

### Debugging RAG Pipeline
Enable verbose logging in `chatController.js`:
```javascript
console.log("🔍 Rewritten Query:", rewrittenQuery);
console.log("📄 Retrieved Docs:", documents.length);
console.log("🎯 Reranked Chunks:", rerankedChunks);
```

## Critical Files to Understand

### Core Pipeline
- `server/src/controllers/chatController.js` - Main orchestration
- `server/src/rag_chatbot/prompt_templates/system_prompt.js` - CoVe prompt template
- `server/src/rag_chatbot/data_ingestion/chunker.js` - Propositions generation

### Service Boundaries
- `external_services/llm_service.js` - OpenAI client wrapper
- `external_services/vector_db_service.js` - MongoDB vector operations
- `retrieval/reranker.js` - Cohere reranking API

### Frontend State Management
- `client/src/components/ChatWindow.jsx` - Manages `sessionId` and message history
- API endpoint: `POST http://localhost:3369/api/chat`
- Request body: `{ query: string, sessionId: string }`

## Common Pitfalls

1. **Model Names**: `gpt-5-nano` or `chatgpt-4o-latest`
2. **Embedding Dimensions**: Always 1536 for `text-embedding-3-small`
3. **Vector Search**: Must query `products_embeddings` collection (NOT `products`)
4. **Reranking**: Cohere expects array of strings, not objects
5. **CoVe Prompt**: LLM must return ONLY Step 4 (Final Answer), not intermediate steps

## Testing Approaches

### Test Individual Components
```bash
# Test chunker with sample product
node server/src/rag_chatbot/data_ingestion/test_chunker.js

# Test vector search
node -e "require('./server/src/rag_chatbot/external_services/vector_db_service').vectorSearch('margarita').then(console.log)"
```

### Verify Vector Index
Check Atlas Console → Search → `vector_index_beverages` status must be "Active"

## Response Style Guideline

The chatbot uses a **playful, friendly Vietnamese tone** (specified in `system_prompt.js`). Responses should:
- Be concise and fun
- NEVER fabricate information not in context
- Use product names explicitly in answers
- Follow CoVe (Chain of Verification) reasoning internally but only show final answer

## Security & Secrets

- **NEVER commit** `.env` files (add to `.gitignore`)
- Rotate exposed API keys immediately
- Input guardrails check for: SQL injection patterns, PII regex, profanity
- Output guardrails validate: toxicity, hallucination markers

## Key Dependencies

- `openai` ^6.8.0 - Chat completion + embeddings
- `cohere-ai` ^7.19.0 - Reranking
- `mongoose` ^8.19.3 - MongoDB ODM
- `express` ^5.1.0 - API server
- `react` ^19.0.0 - Frontend UI
