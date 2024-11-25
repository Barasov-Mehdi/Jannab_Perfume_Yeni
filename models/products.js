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
    discount: { type: mongoose.Types.Decimal128, required: false, default: 0 }, // İndirim oranı
    isDiscounted: { type: Boolean, required: true, default: false }, // İndirimde olup olmadığını belirtir
    category: { type: String, enum: ['woman', 'man', 'unisex'], required: true },
    bestSellers: { type: Boolean, required: false },
    upperNotes: { type: compositionSchema, required: false }, // Upper notes
    heartNotes: { type: compositionSchema, required: false }, // Heart notes
    baseNotes: { type: compositionSchema, required: false }, // Base notes
    compositionDescription: { type: String, required: false },
    date: { type: Date, default: Date.now }
});

// İndirimli fiyat hesaplama metodu
productsSchema.methods.getDiscountedPrice = function () {
    const originalPrice = parseFloat(this.price);
    const discount = parseFloat(this.discount);

    if (discount > 0) {
        return (originalPrice - (originalPrice * discount / 100)).toFixed(2);
    }
    return originalPrice.toFixed(2);
};

// Ürün kaydedilirken indirim durumu güncellenmeli
productsSchema.pre('save', function(next) {
    this.isDiscounted = parseFloat(this.discount) > 0; // Discount 0'dan büyükse isDiscounted true olur
    next();
});

const Products = mongoose.model('Products', productsSchema);
module.exports = Products;