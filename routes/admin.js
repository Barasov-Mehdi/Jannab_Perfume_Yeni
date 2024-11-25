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

router.post('/add', upload.fields([{ name: 'img', maxCount: 1 },
{ name: 'upperNoteImages', multiple: false },
{ name: 'heartNoteImages', multiple: false },
{ name: 'baseNoteImages', multiple: false }]),
    async (req, res) => {
        try {
            const {
                name,
                price,
                discount,
                content,
                category,
                upperNotes, // This should be an array of notes
                heartNotes, // This should be an array of notes
                baseNotes, // This should be an array of notes
                compositionDescription,
                bestSellers
            } = req.body;

            // Handle arrays of notes
            const upperNotesArray = Array.isArray(upperNotes) ? upperNotes : [upperNotes];
            const heartNotesArray = Array.isArray(heartNotes) ? heartNotes : [heartNotes];
            const baseNotesArray = Array.isArray(baseNotes) ? baseNotes : [baseNotes];

            // Upload main product image to Cloudinary
            const imgResult = await cloudinary.uploader.upload(req.files['img'][0].path);

            // Upload images for each note type to Cloudinary
            const upperNoteImageUrls = await Promise.all(
                req.files['upperNoteImages'].map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path);
                    return result.secure_url;
                })
            );

            const heartNoteImageUrls = await Promise.all(
                req.files['heartNoteImages'].map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path);
                    return result.secure_url;
                })
            );

            const baseNoteImageUrls = await Promise.all(
                req.files['baseNoteImages'].map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path);
                    return result.secure_url;
                })
            );

            // Create a new product instance with the provided data
            const newProduct = new Products({
                img: imgResult.secure_url,
                name,
                price: mongoose.Types.Decimal128.fromString(price), // Price in Decimal128 format
                discount: mongoose.Types.Decimal128.fromString(discount || '0'), // Discount (if any)
                content,
                category,
                upperNotes: { notes: upperNotesArray, images: upperNoteImageUrls },
                heartNotes: { notes: heartNotesArray, images: heartNoteImageUrls },
                baseNotes: { notes: baseNotesArray, images: baseNoteImageUrls },
                compositionDescription,
                bestSellers: bestSellers ? true : false,
            });

            // Save the product to the database
            await newProduct.save();

            // Redirect to the add product page after success
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

module.exports = router;