const express = require('express');
const router = express.Router();
const uploadsController = require('../controllers/uploads.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to specific upload routes
// router.use(authenticateToken); // REMOVED global auth to prevent 401 on missing static files

// POST /api/uploads/swms
router.post('/swms', authenticateToken, uploadsController.swmsMiddleware, uploadsController.uploadSWMS);

// POST /api/uploads/signature
router.post('/signature', authenticateToken, uploadsController.signatureMiddleware, uploadsController.uploadSignature);

module.exports = router;
