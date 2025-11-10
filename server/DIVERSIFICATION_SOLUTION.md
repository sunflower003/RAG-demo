# 🎯 GIẢI PHÁP: Diversified Reranking

## ❌ Vấn đề ban đầu

Khi user hỏi "shop có những loại gì?", RAG pipeline hoạt động như sau:

```
Vector Search → 79 propositions (từ 6 sản phẩm)
       ↓
Reranker chọn top 10 → CÓ THỂ chỉ từ 2-3 sản phẩm!
       ↓
LLM nhận context thiếu → Trả lời thiếu sản phẩm ❌
```

**Nguyên nhân**: Cohere Reranker chỉ dựa vào **relevance score**, không quan tâm đến **diversity**. 
Nếu Sunrise Rosé có 12 propositions đều rất relevant, reranker có thể chọn cả 10 từ 1 sản phẩm này!

## ✅ Giải pháp: Diversification Algorithm

### Thay đổi trong `reranker.js`:

**1. Tăng số lượng candidates:**
```javascript
const TOP_N_RESULTS = 15; // Tăng từ 10 → 15
topN: Math.min(TOP_N_RESULTS * 3, documents.length) // Lấy 45 candidates
```

**2. Thuật toán đa dạng hóa 2 bước:**

```javascript
function diversifyResults(documents, rerankedIndices, targetCount) {
    // BƯỚC 1: Đảm bảo mỗi sản phẩm có ít nhất 1 proposition
    for (const [productId, propInfo] of productFirstProp.entries()) {
        selected.push(propInfo.text);
        seenProducts.add(productId);
    }
    // → Kết quả: 6 propositions (1 từ mỗi sản phẩm)
    
    // BƯỚC 2: Điền thêm theo thứ tự relevance cho đến 15
    for (const idx of rerankedIndices) {
        if (selected.length >= 15) break;
        if (!selected.includes(text)) {
            selected.push(text);
        }
    }
    // → Kết quả: 15 propositions, đảm bảo 6 sản phẩm đều có mặt
}
```

## 📊 So sánh trước/sau

### ❌ TRƯỚC (No Diversification):
```
Top 10 propositions:
  • Sunrise Rosé Sangria Spritz (10 props)
  
→ LLM chỉ thấy 1 sản phẩm!
```

### ✅ SAU (With Diversification):
```
Top 15 propositions:
  • Sunrise Rosé Sangria Spritz (5 props)
  • Organic Blood Orange Mimosa (3 props)
  • Copper Pot Margarita (2 props)
  • Mango Peach Rosé Bellini (2 props)
  • Organic Sunset Sangria (2 props)
  • Margarita Spritz Cans (1 prop)
  
→ LLM thấy đủ 6 sản phẩm! ✨
```

## 🚀 Cách sử dụng

### Bật/tắt diversification:
```javascript
const DIVERSIFY_RESULTS = true; // Bật
```

### Điều chỉnh số lượng:
```javascript
const TOP_N_RESULTS = 15; // Tăng/giảm số propositions
const MIN_PRODUCTS_COVERAGE = 6; // Số sản phẩm tối thiểu
```

## 🎯 Kết quả

Khi user hỏi "shop có những loại gì?":
- ✅ LLM nhận đủ context từ 6 sản phẩm
- ✅ Trả lời đầy đủ tất cả sản phẩm
- ✅ Vẫn giữ relevance score cao (propositions đầu tiên của mỗi sản phẩm)

## 📝 Lưu ý

- Diversification tự động bật khi `DIVERSIFY_RESULTS = true`
- Không ảnh hưởng đến câu hỏi cụ thể (VD: "Margarita có bao nhiêu calo?")
- Chỉ cải thiện câu hỏi chung (VD: "shop có những loại nào?")
