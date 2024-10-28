// routes/bestSellersRouter.js
const express = require('express');
const Products = require('../models/products');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const bestSellers = await Products.find({ bestSellers: true });
        res.json(bestSellers); // AJAX isteğine JSON formatında veri döndür
    } catch (err) {
        console.error('Error fetching best sellers', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
