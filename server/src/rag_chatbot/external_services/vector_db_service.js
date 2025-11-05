const mongoose = require('mongoose');
const { getEmbedding } = require('../data_ingestion/indexer'); // Nhập hàm tạo vector

// Tên của Chỉ mục Vector bạn đã tạo trên Atlas
const VECTOR_INDEX_NAME = "vector_index_beverages";
// Số lượng ứng viên tìm kiếm (nên cao hơn 'limit' để tăng độ chính xác)
const NUM_CANDIDATES = 200;
// Số lượng kết quả hàng đầu chúng ta muốn trả về
const LIMIT = 100; // Tăng từ 50 lên 100 để có nhiều propositions hơn 

/**
 * Thực hiện tìm kiếm vector trên MongoDB Atlas để tìm các mệnh đề liên quan nhất.
 *
 * @param {string} query - Truy vấn của người dùng (đã được viết lại).
 * @returns {Promise<Array<object>>} - Một mảng các tài liệu mệnh đề phù hợp.
 */
async function vectorSearch(query) {
    console.log(`Vector Search: Đang thực hiện tìm kiếm cho: "${query}"`);

    // 1. Lấy đối tượng 'db' gốc từ Mongoose
    // Chúng ta cần 'db' gốc để chạy lệnh aggregate với $vectorSearch
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Không thể kết nối MongoDB. Đảm bảo Mongoose đã kết nối.");
    }
    const embeddingsCollection = db.collection("products_embeddings");

    try {
        // 2. Chuyển đổi truy vấn thành vector
        const queryVector = await getEmbedding(query); // [cite: 27]
        if (!queryVector) {
            console.error("Vector Search: Không thể tạo vector cho truy vấn.");
            return [];
        }

        // 3. Định nghĩa Pipeline Aggregation với $vectorSearch
        const pipeline = [
            {
                $vectorSearch: {
                    index: VECTOR_INDEX_NAME, // Tên của chỉ mục
                    path: "proposition_embedding", // Trường chứa vector trong collection
                    queryVector: queryVector, // Vector của truy vấn
                    numCandidates: NUM_CANDIDATES, // Số lượng ứng viên để quét
                    limit: LIMIT // Trả về 50 kết quả hàng đầu 
                }
            },
            {
                // $project để chỉ lấy các trường chúng ta cần
                $project: {
                    _id: 0, // Ẩn _id
                    product_id: 1, // Lấy ID sản phẩm để liên kết
                    proposition_text: 1, // Lấy văn bản mệnh đề
                    score: { $meta: "vectorSearchScore" } // Lấy điểm tương đồng
                }
            }
        ];

        // 4. Thực thi truy vấn
        const results = await embeddingsCollection.aggregate(pipeline).toArray();
        
        console.log(`Vector Search: Tìm thấy ${results.length} kết quả phù hợp.`);
        return results;

    } catch (e) {
        console.error("Vector Search: Lỗi trong quá trình tìm kiếm vector:", e);
        return []; // Trả về mảng rỗng nếu có lỗi
    }
}

module.exports = {
    vectorSearch
};