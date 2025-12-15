// backend/src/routes/workerTrainingEvidence.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Configure multer for training evidence uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/training_evidence');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'training-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
        }
    }
});

/**
 * Upload training evidence for a team member
 * POST /api/worker-training-evidence
 */
router.post(
    '/',
    authenticateToken,
    upload.array('training_evidence', 10), // Max 10 files
    async (req, res) => {
        console.log('✅ POST /worker-training-evidence handler reached!');
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const { team_member_id, permit_id } = req.body;

            if (!team_member_id || !permit_id) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'team_member_id and permit_id are required'
                });
            }

            if (!req.files || req.files.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            const evidenceRecords = [];

            for (const file of req.files) {
                const filePath = `/uploads/training_evidence/${file.filename}`;

                const [result] = await connection.query(
                    `INSERT INTO worker_training_evidence 
                    (team_member_id, permit_id, file_path, file_name) 
                    VALUES (?, ?, ?, ?)`,
                    [team_member_id, permit_id, filePath, file.originalname]
                );

                evidenceRecords.push({
                    id: result.insertId,
                    team_member_id,
                    permit_id,
                    file_path: filePath,
                    file_name: file.originalname
                });
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Training evidence uploaded successfully',
                data: evidenceRecords
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error uploading training evidence:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload training evidence',
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }
);

/**
 * Get training evidence for a team member
 * GET /api/worker-training-evidence/team-member/:teamMemberId
 */
router.get('/team-member/:teamMemberId', authenticateToken, async (req, res) => {
    try {
        const { teamMemberId } = req.params;

        const [evidence] = await pool.query(
            `SELECT * FROM worker_training_evidence 
            WHERE team_member_id = ? 
            ORDER BY uploaded_at DESC`,
            [teamMemberId]
        );

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Error fetching training evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training evidence',
            error: error.message
        });
    }
});

/**
 * Get all training evidence for a permit
 * GET /api/worker-training-evidence/permit/:permitId
 */
router.get('/permit/:permitId', authenticateToken, async (req, res) => {
    try {
        const { permitId } = req.params;

        const [evidence] = await pool.query(
            `SELECT 
                wte.*,
                ptm.worker_name,
                ptm.worker_role
            FROM worker_training_evidence wte
            JOIN permit_team_members ptm ON wte.team_member_id = ptm.id
            WHERE wte.permit_id = ?
            ORDER BY ptm.worker_name, wte.uploaded_at DESC`,
            [permitId]
        );

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Error fetching permit training evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training evidence',
            error: error.message
        });
    }
});

/**
 * Delete training evidence
 * DELETE /api/worker-training-evidence/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get file path before deleting
        const [evidence] = await pool.query(
            'SELECT file_path FROM worker_training_evidence WHERE id = ?',
            [id]
        );

        if (evidence.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Training evidence not found'
            });
        }

        // Delete from database
        await pool.query('DELETE FROM worker_training_evidence WHERE id = ?', [id]);

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../..', evidence[0].file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'Training evidence deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting training evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete training evidence',
            error: error.message
        });
    }
});

module.exports = router;
