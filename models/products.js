const mongoose = require('mongoose');

const compositionSchema = new mongoose.Schema({
    notes: { type: [String], required: true }, // Array of notes
    images: { type: [String], required: true }, // Array of image URLs
});

const productsSchema = new mongoose.Schema({
    img: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: mongoose.Types.Decimal128, required: true },
    content: { type: String, required: false },
    category: { type: String, enum: ['woman', 'man', 'unisex'], required: true },
    bestSellers: { type: Boolean, required: false },
    upperNotes: { type: compositionSchema, required: false }, // Upper notes
    heartNotes: { type: compositionSchema, required: false }, // Heart notes
    baseNotes: { type: compositionSchema, required: false }, // Base notes
    compositionDescription: { type: String, required: false },
    date: { type: Date, default: Date.now }
});

const Products = mongoose.model('Products', productsSchema);
module.exports = Products;