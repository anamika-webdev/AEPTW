const express = require('express');
const router = express.Router();
const uploadsController = require('../controllers/uploads.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication
router.use(authenticateToken);

// POST /api/uploads/swms
router.post('/swms', uploadsController.swmsMiddleware, uploadsController.uploadSWMS);

// POST /api/uploads/signature
router.post('/signature', uploadsController.signatureMiddleware, uploadsController.uploadSignature);

module.exports = router;
