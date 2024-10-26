const express = require('express');
const mongoose = require('mongoose');
const Products = require('../models/products');
const router = express.Router();

// Ürün detay sayfası
router.get('/:id', async (req, res) => {
    const productId = req.params.id; // URL'den ID alınıyor
    try {
        // ID geçerli mi?
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Geçersiz ürün ID');
        }

        const product = await Products.findById(productId); // Ürünü bulmaya çalış
        if (product) {
            res.render('productDetails', { product }); // Ürünü render et
        } else {
            res.status(404).send('Ürün bulunamadı'); // Ürün bulunamazsa hata mesajı
        }
    } catch (err) {
        console.error('Ürün detayları alınırken hata', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

router.get('/search', async (req, res) => {
    const searchQuery = req.query.search || '';
    try {
        const products = await Products.find({ name: { $regex: searchQuery, $options: 'i' } }); // Case insensitive arama
        res.json(products);
    } catch (err) {
        console.error('Error searching products', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/products', async (req, res) => {
    const { search } = req.query;

    try {
        // Öncelikle tam eşleşen ürünleri bul
        const exactMatches = await Product.find({ name: search });

        // Tam eşleşme bulamazsak, isimlerinde arama yap
        const partialMatches = await Product.find({ name: { $regex: search, $options: 'i' } });

        // Tam eşleşenleri, eşleşen ürünlerden çıkararak yalnızca parçalı eşleşmeleri al
        const filteredPartialMatches = partialMatches.filter(product => !exactMatches.some(exact => exact._id.equals(product._id)));

        // Tam ve parçalı eşleşmeleri birleştir
        const products = [...exactMatches, ...filteredPartialMatches];

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;