const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommend.controller');

router.get('/user/:userId', recommendController.recommendForUser);

module.exports = router;
