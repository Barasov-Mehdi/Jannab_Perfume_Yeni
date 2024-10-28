const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    img: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: mongoose.Types.Decimal128, required: true },
    content: { type: String, required: false },
    category: { type: String, enum: ['woman', 'man', 'unisex'], required: true },
    bestSellers: { type: Boolean, required: false },
    composition: { type: [String], required: false },
    compositionImages: { type: [String], required: false }, // Kompozisyon resimleri için dizi
    compositionDescription: { type: String, required: false },
    date: { type: Date, default: Date.now }
});

const Products = mongoose.model('Products', productsSchema);
module.exports = Products;