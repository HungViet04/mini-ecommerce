/**
 * Address Routes
 * Routes for user address management
 */
const express = require('express');
const router = express.Router();

const { addressController } = require('../controllers');
const { authenticate } = require('../middlewares');

router.use(authenticate);

router.get('/', addressController.getMyAddresses);
router.post('/', addressController.create);
router.patch('/:id', addressController.update);
router.delete('/:id', addressController.remove);
router.post('/:id/default', addressController.setDefault);

module.exports = router;
