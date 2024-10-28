const bodyParser = require('body-parser');
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Products = require('./models/products');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'sasFile')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const homeRouter = require('./routes/home');
const aboutRouter = require('./routes/about');
const adminRouter = require('./routes/admin');
const errRouter = require('./routes/err');
const productsRouter = require('./routes/productsRouter'); // Tam yol burada// Ürün route'unu dahil et
const feedbackRouter = require('./routes/feedback'); // Geri bildirim routes'unu dahil ediyoruz
// app.js
const bestSellersRouter = require('./routes/bestSellersRouter');
// app.js
const newArrivalsRouter = require('./routes/newArrivalsRouter');

// Register yeni ürünler rotası
app.use('/api/new-arrivals', newArrivalsRouter);
app.use('/bestsellers', bestSellersRouter); // /bestsellers rotasını bestSellersRouter ile eşleştir

app.use('/api', feedbackRouter); // /api altındaki tüm istekler için feedbackRouter kullan
app.use('/products', productsRouter); // /products altındaki tüm istekler için productsRouter kullan
app.use('/home', homeRouter);
app.use('/about', aboutRouter);
app.use('/admin', adminRouter);
app.use('/err', errRouter);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {});
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();

app.get('/', async (req, res) => {
  try {
    const products = await Products.find();
    res.render('home', { products });
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

// Ürün arama işlemi
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q;
  
  try {
    // İsme göre ürün arama
    const products = await Products.find({ name: { $regex: query, $options: 'i' } });
    res.json(products);
  } catch (err) {
    console.error('Error searching products', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/api/products', async (req, res) => {
  try {
    const products = await Products.find();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).send('Internal Server Error');
  }
});


app.use('*', (req, res) => {
  res.status(404).redirect('/err');
});

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});