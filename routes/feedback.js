const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');

// Geri bildirim formu sayfası
router.get('/feedback', (req, res) => {
  const successMessage = req.query.success ? "Mesaj Gönderildi" : "";
  res.render('feedback', { successMessage });
});

// Geri bildirim gönderme
router.post('/feedback', async (req, res) => {
  const { name, phone, email, message } = req.body;
  
  try {
    const feedback = new Feedback({ name, phone, email, message });
    await feedback.save();
    // Başarılı bir geri bildirimden sonra ana sayfaya yönlendiriyoruz
    res.redirect('/api/feedback'); // Başarı mesajı için query parametre ekliyoruz
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;