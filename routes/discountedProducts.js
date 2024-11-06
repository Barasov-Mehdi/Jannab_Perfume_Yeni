const express = require('express');
const router = express.Router();
const Product = require('../models/products');

// Route to get discounted products
router.get('/', async (req, res) => {
    try {
        const discountedProducts = await Product.find({ discount: { $gt: 0 } }); // Fetch products with discounts
        res.json(discountedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;