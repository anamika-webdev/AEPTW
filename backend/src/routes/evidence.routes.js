// backend/src/routes/evidence.routes.js

const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// REMOVED: Global authentication middleware to prevent 401s on non-matching routes (like missing static files)
// router.use(authenticateToken);

/**
 * @route   POST /api/uploads/evidence
 * @desc    Upload evidence files with metadata
 * @access  Private
 */
router.post(
    '/uploads/evidence',
    authenticateToken,
    evidenceController.upload.array('evidences', 10),
    evidenceController.uploadEvidence
);

/**
 * @route   GET /api/permits/:id/evidences
 * @desc    Get all evidences for a specific permit
 * @access  Private
 */
router.get(
    '/permits/:id/evidences',
    authenticateToken,
    evidenceController.getPermitEvidences
);

/**
 * @route   GET /api/uploads/evidence/:id
 * @desc    Get single evidence by ID
 * @access  Private
 */
router.get(
    '/uploads/evidence/:id',
    authenticateToken,
    evidenceController.getEvidenceById
);

/**
 * @route   PUT /api/uploads/evidence/:id
 * @desc    Update evidence metadata (category, description)
 * @access  Private
 */
router.put(
    '/uploads/evidence/:id',
    authenticateToken,
    evidenceController.updateEvidence
);

/**
 * @route   DELETE /api/uploads/evidence/:id
 * @desc    Delete evidence
 * @access  Private
 */
router.delete(
    '/uploads/evidence/:id',
    authenticateToken,
    evidenceController.deleteEvidence
);

/**
 * @route   GET /api/uploads/evidence/category/:category
 * @desc    Get evidences by category (with optional permit_id filter)
 * @access  Private
 */
router.get(
    '/uploads/evidence/category/:category',
    authenticateToken,
    evidenceController.getEvidencesByCategory
);

/**
 * @route   GET /api/permits/:id/evidences/stats
 * @desc    Get evidence statistics for a permit
 * @access  Private
 */
router.get(
    '/permits/:id/evidences/stats',
    authenticateToken,
    evidenceController.getEvidenceStats
);

module.exports = router;