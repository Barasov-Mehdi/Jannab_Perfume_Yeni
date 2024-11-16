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
            // Ürünün 1ml fiyatını al
            const unitPrice = product.price; // Burada, ürün fiyatının 1ml için olduğunu varsayıyoruz
            let discountRate = 0;

            // Eğer indirim varsa, oranı al
            if (product.discount) {
                discountRate = typeof product.discount === 'object' && product.discount.$numberDecimal
                    ? parseFloat(product.discount.$numberDecimal)
                    : parseFloat(product.discount);
            }

            // Hacimlerin listesi
            const volumes = [15, 30, 50];
            const originalPrices = {};
            const discountedPrices = {};

            volumes.forEach(volume => {
                const originalPrice = (unitPrice * volume).toFixed(2); // Orijinal fiyat hesapla

                // İndirimli fiyat hesapla, indirim oranını kullan
                const discountedPrice = (originalPrice * (1 - (discountRate / 100))).toFixed(2); // İndirimli fiyatı hesapla

                // Hesaplanan fiyatları ata
                originalPrices[volume] = originalPrice;
                discountedPrices[volume] = discountedPrice;
            });

            // Hesaplanan fiyatları ürüne ekle
            product.originalPrices = originalPrices;
            product.discountedPrices = discountedPrices;

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
    const searchQuery = req.query.q || '';
    try {
        const products = await Products.find({
            name: { $regex: searchQuery, $options: 'i' }
        });
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

router.get('/items', async (req, res) => {
    const { category, search } = req.query; // Kategori ve arama sorgusunu al

    let query = {};
    if (category) {
        query.category = category; // Kategoriye göre sorgu oluştur
    }
    if (search) {
        query.name = { $regex: search, $options: 'i' } // Arama sorgusu
    }

    try {
        const itemList = await Products.find(query); // Sorguya göre ürünleri bul
        res.json(itemList); // Bulunan ürünleri döndür
    } catch (error) {
        console.error('Ürünler alınırken bir hata oluştu:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/filter/:gender', async (req, res) => {
    const { gender } = req.params;

    try {
        const products = await Products.find({ category: gender });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/api/products', async (req, res) => {
    const limit = 2; // Her istekte dönecek ürün sayısı
    const skip = parseInt(req.query.skip) || 0; // Geçiş değerini al
    const excludeIds = req.query.excludeIds ? req.query.excludeIds.split(',').map(id => mongoose.Types.ObjectId(id)) : []; // ID'leri ObjectId formatına çevir

    try {
        // excludeIds içinde bulunan ürünleri hariç tut
        const products = await Products.find({ _id: { $nin: excludeIds } })
            .skip(skip)
            .limit(limit);

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;