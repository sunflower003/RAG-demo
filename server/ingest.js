// ingest.js
// Tập lệnh chạy một lần để nạp dữ liệu bằng Mongoose

// 1. Nhập các hàm kết nối DB của bạn
const { connectDB, closeDB } = require('./config/db'); // Sửa đường dẫn nếu cần

const { extractPropositions } = require('./src/rag_chatbot/data_ingestion/chunker');
const { getEmbedding } = require('./src/rag_chatbot/data_ingestion/indexer');
const mongoose = require('mongoose');

// Tên cơ sở dữ liệu của bạn (ví dụ: "test" như trong ảnh chụp màn hình)
const DB_NAME = "test"; 

/**
 * Hàm chính để thực thi quá trình nạp dữ liệu
 */
async function main() {
    try {
        // 2. Sử dụng hàm connectDB của bạn
        await connectDB();

        // Lấy đối tượng db gốc từ kết nối mongoose
        const db = mongoose.connection.db;

        const productsCollection = db.collection("products");
        const embeddingsCollection = db.collection("products_embeddings");

        // Đảm bảo collection embeddings trống trước khi nạp
        const count = await embeddingsCollection.countDocuments();
        if (count > 0) {
            console.warn(`Collection 'products_embeddings' đã có ${count} tài liệu.`);
            console.warn("Xóa dữ liệu cũ để nạp lại...");
            await embeddingsCollection.deleteMany({});
        }

        // 1. Đọc tất cả sản phẩm
        const products = await productsCollection.find({}).toArray();
        console.log(`Tìm thấy ${products.length} sản phẩm để xử lý...`);

        let totalPropositions = 0;
        const operations = []; // Mảng để lưu các hoạt động bulkWrite

        // 2. Lặp qua từng sản phẩm
        for (const product of products) {
            // 3. Sử dụng chunker để lấy mệnh đề
            const propositions = await extractPropositions(product);
            
            if (!propositions || propositions.length === 0) {
                console.warn(`Không trích xuất được mệnh đề nào cho sản phẩm: ${product.name}`);
                continue;
            }

            // 4. Lặp qua từng mệnh đề
            for (const propText of propositions) {
                
                // 5. Sử dụng indexer để tạo vector
                const embedding = await getEmbedding(propText);

                if (embedding) {
                    // 6. Chuẩn bị tài liệu mới để lưu
                    const doc = {
                        product_id: product._id, // Liên kết lại sản phẩm gốc
                        product_name: product.name,
                        category: product.category, // Thêm category để lọc
                        proposition_text: propText,
                        proposition_embedding: embedding
                    };
                    
                    // Thêm vào mảng operations để thực hiện bulk insert
                    operations.push({
                        insertOne: {
                            document: doc
                        }
                    });

                    totalPropositions++;
                }
            }
            console.log(`Đã xử lý ${propositions.length} mệnh đề cho ${product.name}`);
        }

        // 7. Thực hiện bulk write để lưu tất cả vào DB
        if (operations.length > 0) {
            console.log(`\nĐang thực hiện bulk write ${operations.length} tài liệu...`);
            await embeddingsCollection.bulkWrite(operations);
            console.log("Hoàn tất nạp dữ liệu!");
        } else {
            console.log("Không có dữ liệu nào để nạp.");
        }

        console.log(`\n--- TÓM TẮT ---`);
        console.log(`Tổng số sản phẩm đã xử lý: ${products.length}`);
        console.log(`Tổng số mệnh đề đã tạo: ${totalPropositions}`);
        
    } catch (e) {
        console.error("Đã xảy ra lỗi trong quá trình nạp dữ liệu:", e);
    } finally {
        // 3. Sử dụng hàm closeDB của bạn
        console.log("Đang đóng kết nối MongoDB...");
        await closeDB();
    }
}

// Chạy hàm main
main();