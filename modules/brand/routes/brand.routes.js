const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

router.get('/paged', brandController.paged);
router.get('/', brandController.list);
router.get('/:id', brandController.get);
router.post('/', brandController.create);
router.put('/:id', brandController.update);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;