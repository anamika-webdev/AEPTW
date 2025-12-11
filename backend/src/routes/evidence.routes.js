// backend/src/routes/evidence.routes.js

const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/uploads/evidence
 * @desc    Upload evidence files with metadata
 * @access  Private
 */
router.post(
    '/uploads/evidence',
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
    evidenceController.getPermitEvidences
);

/**
 * @route   GET /api/uploads/evidence/:id
 * @desc    Get single evidence by ID
 * @access  Private
 */
router.get(
    '/uploads/evidence/:id',
    evidenceController.getEvidenceById
);

/**
 * @route   PUT /api/uploads/evidence/:id
 * @desc    Update evidence metadata (category, description)
 * @access  Private
 */
router.put(
    '/uploads/evidence/:id',
    evidenceController.updateEvidence
);

/**
 * @route   DELETE /api/uploads/evidence/:id
 * @desc    Delete evidence
 * @access  Private
 */
router.delete(
    '/uploads/evidence/:id',
    evidenceController.deleteEvidence
);

/**
 * @route   GET /api/uploads/evidence/category/:category
 * @desc    Get evidences by category (with optional permit_id filter)
 * @access  Private
 */
router.get(
    '/uploads/evidence/category/:category',
    evidenceController.getEvidencesByCategory
);

/**
 * @route   GET /api/permits/:id/evidences/stats
 * @desc    Get evidence statistics for a permit
 * @access  Private
 */
router.get(
    '/permits/:id/evidences/stats',
    evidenceController.getEvidenceStats
);

module.exports = router;