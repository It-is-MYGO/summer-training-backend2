const Router = require('koa-router');
const favoriteController = require('../controllers/favoriteController');
const router = new Router({ prefix: '/api/favorites' });

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:id', favoriteController.removeFavorite);
router.put('/:id/alert', favoriteController.setAlertPrice);

module.exports = router;
