const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
     res.redirect('about');
});

module.exports = router;