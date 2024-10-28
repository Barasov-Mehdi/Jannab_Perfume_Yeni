
const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');

// Geri bildirimleri listele
router.get('/admin/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }); // En son gönderilenler önce gelsin
    res.render('adminFeedback', { feedbacks }); // adminFeedback.ejs dosyasına göndereceğiz
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/feedbacks/delete/:id', async (req, res) => {
    try {
      const feedbackId = req.params.id;
      await Feedback.findByIdAndDelete(feedbackId);
      // Silme işleminden sonra geri bildirim sayfasına yönlendir
      res.redirect('/admin/feedbacks');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = router;