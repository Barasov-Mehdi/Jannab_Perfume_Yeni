const express = require('express');
const router = express.Router();
const path = require('path');
const Products = require('../models/products');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Dosyanın yükleneceği klasör
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); // Dosya uzantısını al
        const randomName = Date.now() + '-' + Math.round(Math.random() * 1000) + ext; // Rastgele bir isim oluştur
        cb(null, randomName); // Dosya adını ayarla
    }
});

const upload = multer({ storage: storage });

// Ürün ekleme formunu render etme
router.get('/add', (req, res) => {
    res.render('admin/add');
});

// Ürün ekleme işlemi
router.post('/add', upload.fields([{ name: 'img', maxCount: 1 }, { name: 'compositionImages' }]), async (req, res) => {
    try {
        const { name, price, content, category, composition, compositionDescription, bestSellers } = req.body;
        const compositions = Array.isArray(composition) ? composition : [composition];
        
        const imgResult = await cloudinary.uploader.upload(req.files['img'][0].path);
        const compositionImageUrls = await Promise.all(
            req.files['compositionImages'].map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path);
                return result.secure_url;
            })
        );

        const newProduct = new Products({
            img: imgResult.secure_url,
            name,
            price: mongoose.Types.Decimal128.fromString(price),
            content,
            category,
            composition: compositions,
            compositionImages: compositionImageUrls,
            compositionDescription,
            bestSellers: bestSellers ? true : false
        });

        await newProduct.save();
        res.redirect('/admin/add');
    } catch (err) {
        console.error('Öğe eklenirken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// Ürün silme formunu render etme
router.get('/remove', async (req, res) => {
    try {
        const products = await Products.find(); // Tüm ürünleri çek
        res.render('admin/remove', { products }); // Silme sayfasını render et
    } catch (err) {
        console.error('Ürünleri alırken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// Ürün silme işlemi
router.post('/remove', async (req, res) => {
    try {
        const { productId } = req.body;
        console.log('Silinecek Ürün ID:', productId); // Debug için log ekleyin
        if (!productId) {
            return res.status(400).send('Hiçbir ürün seçilmedi.');
        }
        await Products.findByIdAndDelete(productId);
        res.redirect('/admin/remove');
    } catch (err) {
        console.error('Ürün silinirken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

module.exports = router;