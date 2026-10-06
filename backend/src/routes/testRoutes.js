const express = require('express');
const router = express.Router();

// @route   GET /api/test
// @desc    Test connection between frontend and backend
// @access  Public
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GreenKhata Backend Connected Successfully',
  });
});

module.exports = router;
