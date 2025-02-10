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

// bu zordu
// Ürün ekleme ve Cloudinary'ye yükleme işleminde kalite ayarı
router.post('/add', upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'upperNoteImages', multiple: true },
    { name: 'heartNoteImages', multiple: true },
    { name: 'baseNoteImages', multiple: true }
]), async (req, res) => {
    try {
        const {
            name,
            price,
            discount,
            content,
            category,
            upperNotes,
            heartNotes,
            baseNotes,
            compositionDescription,
            bestSellers
        } = req.body;

        // Handle arrays of notes
        const upperNotesArray = Array.isArray(upperNotes) ? upperNotes : [upperNotes].filter(Boolean);
        const heartNotesArray = Array.isArray(heartNotes) ? heartNotes : [heartNotes].filter(Boolean);
        const baseNotesArray = Array.isArray(baseNotes) ? baseNotes : [baseNotes].filter(Boolean);

        // Upload main product image to Cloudinary with quality setting
        const imgResult = await cloudinary.uploader.upload(req.files['img'][0].path, {
            quality: 'auto:low' // Kaliteyi otomatik olarak düşük ayarlayın
        });

        // Upper note images
        const upperNoteImageUrls = req.files['upperNoteImages'] ? await Promise.all(
            req.files['upperNoteImages'].map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                    quality: 'auto:low'
                });
                return result.secure_url;
            })
        ) : [];

        // Heart note images
        const heartNoteImageUrls = req.files['heartNoteImages'] ? await Promise.all(
            req.files['heartNoteImages'].map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                    quality: 'auto:low'
                });
                return result.secure_url;
            })
        ) : [];

        // Base note images
        const baseNoteImageUrls = req.files['baseNoteImages'] ? await Promise.all(
            req.files['baseNoteImages'].map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                    quality: 'auto:low'
                });
                return result.secure_url;
            })
        ) : [];

        const newProduct = new Products({
            img: imgResult.secure_url,
            name,
            price: mongoose.Types.Decimal128.fromString(price),
            discount: mongoose.Types.Decimal128.fromString(discount || '0'),
            content,
            category,
            upperNotes: { notes: upperNotesArray, images: upperNoteImageUrls },
            heartNotes: { notes: heartNotesArray, images: heartNoteImageUrls },
            baseNotes: { notes: baseNotesArray, images: baseNoteImageUrls },
            compositionDescription,
            bestSellers: bestSellers ? true : false,
        });

        await newProduct.save();
        res.redirect('/admin/add');
    } catch (err) {
        console.error('Öğe eklenirken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

router.get('/products', async (req, res) => {
    try {
        const discountedProducts = await Products.find({ discount: { $gt: 0 } });
        const allProducts = await Products.find();

        res.render('products', { discountedProducts, allProducts });
    } catch (err) {
        console.error('Ürünleri alırken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// Route to display all products
router.get('/list-products', async (req, res) => {
    try {
        const products = await Products.find();
        res.render('admin/list-products', { products });
    } catch (err) {
        console.error('Ürünleri alırken hata oluştu', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// İndirim uygulama işlemi
router.post('/apply-discount', async (req, res) => {
    try {
        // Gelen `req.body` verisinde `discount_` ile başlayan anahtarları işliyoruz.
        const updates = Object.keys(req.body)
            .filter(key => key.startsWith('discount_'))
            .map(async key => {
                const productId = key.split('_')[1]; // Anahtardan ürün ID'sini alıyoruz.
                let discount = req.body[key];

                // İndirim değerinin boş veya geçersiz olmadığını kontrol ediyoruz.
                if (discount === "" || isNaN(discount)) {
                    console.log(`Ürün ID ${productId} için geçersiz indirim oranı atlandı.`);
                    return; // Bu ürünü atla
                }

                // İndirim oranının 0-100 arasında olduğunu kontrol ediyoruz.
                discount = parseFloat(discount);
                if (discount < 0 || discount > 100) {
                    throw new Error('Geçersiz indirim oranı. Lütfen 0 ile 100 arasında bir değer girin.');
                }

                // Ürünü bul ve indirim değerini güncelle
                const product = await Products.findById(productId);
                if (product) {
                    product.discount = mongoose.Types.Decimal128.fromString(discount.toFixed(2)); // Ondalık format sağlanıyor
                    product.isDiscounted = discount > 0; // Güncelleniyor
                    await product.save();
                }
            });

        // Tüm güncellemelerin tamamlanmasını bekliyoruz.
        await Promise.all(updates);
        res.redirect('/admin/list-products');
    } catch (err) {
        console.error('İndirim uygulanırken hata oluştu:', err);
        res.status(500).send(err.message || 'İç Sunucu Hatası');
    }
});

router.get('/discounted-products', async (req, res) => {
    try {
        const discountedProducts = await Products.find({ isDiscounted: true });
        res.json(discountedProducts); // Respond with the filtered products
    } catch (err) {
        res.status(500).json({ message: 'Error fetching discounted products' });
    }
});

// Route to get new arrivals
router.get('/new-arrivals', async (req, res) => {
    try {
        const newProducts = await Products.find().sort({ date: -1 }).limit(10); // Modify limit as necessary
        res.json(newProducts);
    } catch (err) {
        console.error('Error fetching new products:', err);
        res.status(500).json({ message: 'Error fetching new products' });
    }
});

// Route to get best sellers
router.get('/best-sellers', async (req, res) => {
    try {
        const bestSellers = await Products.find({ bestSellers: true });
        res.json(bestSellers);
    } catch (err) {
        console.error('Error fetching best sellers:', err);
        res.status(500).json({ message: 'Error fetching best sellers' });
    }
});

router.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Route to display all products
router.get('/products', async (req, res) => {
    try {
        const products = await Products.find();
        res.render('products', { products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Internal Server Error');
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

// Ürün arama rotası
router.get('/search', async (req, res) => {
    const searchQuery = req.query.q || '';
    try {
        const products = await Products.find({
            name: { $regex: searchQuery, $options: 'i' }
        });
        res.render('search', { products });
    } catch (err) {
        console.error('Ürün arama hatası:', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// Ürün düzenleme sayfası
router.get('/edit/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Products.findById(productId);
        if (!product) return res.status(404).send('Ürün bulunamadı');

        res.render('editProduct', { product });
    } catch (err) {
        console.error('Ürün bilgileri alınırken hata:', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

// Ürün düzenleme sayfası (Değişiklik yok)
router.put('/edit/:id', upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'upperNoteImages', maxCount: 5 },
    { name: 'heartNoteImages', maxCount: 5 },
    { name: 'baseNoteImages', maxCount: 5 }
]), async (req, res) => {
    const productId = req.params.id;

    try {
        const {
            name,
            price,
            discount,
            category,
            bestSellers,
            upperNotes = [],
            heartNotes = [],
            baseNotes = [],
            compositionDescription,
        } = req.body;


        const product = await Products.findById(productId); // Önce mevcut ürünü al

        if (!product) return res.status(404).send('Ürün bulunamadı');

        const updatedProductData = {
            name,
            price: mongoose.Types.Decimal128.fromString(price),
            discount: mongoose.Types.Decimal128.fromString(discount || '0'),
            category,
            bestSellers: bestSellers ? true : false,
            compositionDescription,
        };

        // Notlar ve resimleri güncelleme fonksiyonu
        const updateNotesAndImages = async (noteType, notesArray, imageFiles) => {
            const updatedNotes = { notes: Array.isArray(notesArray) ? notesArray : [notesArray] };

            if (product[noteType] && product[noteType].images) {
                updatedNotes.images = [...product[noteType].images]; // Önce mevcut resimleri kopyala
            } else {
                updatedNotes.images = [];
            }

            if (imageFiles && imageFiles.length > 0) {
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const uploadResult = await cloudinary.uploader.upload(file.path);
                    if (updatedNotes.images[i]) {
                        updatedNotes.images[i] = uploadResult.secure_url; // Aynı indexteki resmi değiştir
                    } else {
                        updatedNotes.images.push(uploadResult.secure_url); // Yeni resim ekle
                    }
                }
            }
            return updatedNotes;
        };

        updatedProductData.upperNotes = await updateNotesAndImages('upperNotes', upperNotes, req.files['upperNoteImages']);
        updatedProductData.heartNotes = await updateNotesAndImages('heartNotes', heartNotes, req.files['heartNoteImages']);
        updatedProductData.baseNotes = await updateNotesAndImages('baseNotes', baseNotes, req.files['baseNoteImages']);


        // Ana resim yükleme (Değişiklik yok)
        if (req.files['img']) {
            const imgResult = await cloudinary.uploader.upload(req.files['img'][0].path);
            updatedProductData.img = imgResult.secure_url;
        }

        const updatedProduct = await Products.findByIdAndUpdate(productId, updatedProductData, { new: true });

        if (!updatedProduct) return res.status(404).send('Ürün bulunamadı');

        res.redirect('/admin/search');
    } catch (err) {
        console.error('Ürün güncellenirken hata:', err);
        res.status(500).send('İç Sunucu Hatası');
    }
});

module.exports = router;
// <!-- zor yeni budu  -->