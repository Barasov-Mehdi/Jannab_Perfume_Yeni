// routes/newArrivalsRouter.js
const express = require('express');
const router = express.Router();
const Products = require('../models/products');

// Yeni eklenen ürünleri getir
router.get('/', async (req, res) => {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7); // 7 gün önceyi hesapla
        const newProducts = await Products.find({ date: { $gte: weekAgo } });
        res.json(newProducts);
    } catch (err) {
        console.error('Error fetching new products', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;