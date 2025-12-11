// backend/src/controllers/evidence.controller.js

const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for evidence uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/evidences');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `evidence-${uniqueSuffix}-${sanitizedFilename}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

/**
 * Upload evidence files with metadata
 * POST /api/uploads/evidence
 */
exports.uploadEvidence = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const files = req.files;
    if (!files || files.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { permit_id, evidences_data } = req.body;

    if (!permit_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Permit ID is required'
      });
    }

    // Parse metadata
    let metadata = [];
    try {
      metadata = JSON.parse(evidences_data);
    } catch (error) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid metadata format'
      });
    }

    const uploadedEvidences = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = metadata[i];

      // Construct file URL
      const fileUrl = `/uploads/evidences/${file.filename}`;

      // Insert into database
      const [result] = await connection.query(`
        INSERT INTO permit_evidences 
        (permit_id, file_path, category, description, timestamp, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        permit_id,
        fileUrl,
        data.category,
        data.description || '',
        data.timestamp,
        data.latitude,
        data.longitude
      ]);

      uploadedEvidences.push({
        id: result.insertId,
        file_path: fileUrl,
        file_name: file.filename,
        category: data.category,
        description: data.description,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: `${uploadedEvidences.length} evidence(s) uploaded successfully`,
      data: uploadedEvidences
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error uploading evidence:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload evidence'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all evidences for a permit
 * GET /api/permits/:id/evidences
 */
exports.getPermitEvidences = async (req, res) => {
  try {
    const permitId = req.params.id;

    const [evidences] = await pool.query(`
      SELECT 
        id,
        permit_id,
        file_path,
        category,
        description,
        timestamp,
        latitude,
        longitude,
        created_at
      FROM permit_evidences
      WHERE permit_id = ?
      ORDER BY timestamp DESC
    `, [permitId]);

    res.json({
      success: true,
      data: evidences
    });

  } catch (error) {
    console.error('Error fetching evidences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidences'
    });
  }
};

/**
 * Get single evidence by ID
 * GET /api/uploads/evidence/:id
 */
exports.getEvidenceById = async (req, res) => {
  try {
    const evidenceId = req.params.id;

    const [evidences] = await pool.query(`
      SELECT 
        id,
        permit_id,
        file_path,
        category,
        description,
        timestamp,
        latitude,
        longitude,
        created_at
      FROM permit_evidences
      WHERE id = ?
    `, [evidenceId]);

    if (evidences.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found'
      });
    }

    res.json({
      success: true,
      data: evidences[0]
    });

  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidence'
    });
  }
};

/**
 * Update evidence metadata
 * PUT /api/uploads/evidence/:id
 */
exports.updateEvidence = async (req, res) => {
  try {
    const evidenceId = req.params.id;
    const { category, description } = req.body;

    // Check if evidence exists
    const [existing] = await pool.query(
      'SELECT id FROM permit_evidences WHERE id = ?',
      [evidenceId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found'
      });
    }

    // Update evidence
    await pool.query(`
      UPDATE permit_evidences
      SET category = ?, description = ?
      WHERE id = ?
    `, [category, description, evidenceId]);

    res.json({
      success: true,
      message: 'Evidence updated successfully'
    });

  } catch (error) {
    console.error('Error updating evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update evidence'
    });
  }
};

/**
 * Delete evidence
 * DELETE /api/uploads/evidence/:id
 */
exports.deleteEvidence = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const evidenceId = req.params.id;

    // Get file path
    const [evidences] = await connection.query(
      'SELECT file_path FROM permit_evidences WHERE id = ?',
      [evidenceId]
    );

    if (evidences.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evidence not found'
      });
    }

    const filePath = evidences[0].file_path;
    const fullPath = path.join(__dirname, '../../', filePath);

    // Delete file from filesystem
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn('Could not delete file:', error);
      // Continue anyway - file might not exist
    }

    // Delete from database
    await connection.query(
      'DELETE FROM permit_evidences WHERE id = ?',
      [evidenceId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Evidence deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete evidence'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get evidences by category
 * GET /api/uploads/evidence/category/:category
 */
exports.getEvidencesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { permit_id } = req.query;

    let query = `
      SELECT 
        id,
        permit_id,
        file_path,
        category,
        description,
        timestamp,
        latitude,
        longitude,
        created_at
      FROM permit_evidences
      WHERE category = ?
    `;
    
    const params = [category];

    if (permit_id) {
      query += ' AND permit_id = ?';
      params.push(permit_id);
    }

    query += ' ORDER BY timestamp DESC';

    const [evidences] = await pool.query(query, params);

    res.json({
      success: true,
      data: evidences
    });

  } catch (error) {
    console.error('Error fetching evidences by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidences'
    });
  }
};

/**
 * Get evidence statistics for a permit
 * GET /api/permits/:id/evidences/stats
 */
exports.getEvidenceStats = async (req, res) => {
  try {
    const permitId = req.params.id;

    const [stats] = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM permit_evidences
      WHERE permit_id = ?
      GROUP BY category
    `, [permitId]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as total
      FROM permit_evidences
      WHERE permit_id = ?
    `, [permitId]);

    res.json({
      success: true,
      data: {
        total: total[0].total,
        by_category: stats
      }
    });

  } catch (error) {
    console.error('Error fetching evidence stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidence statistics'
    });
  }
};

module.exports = {
  upload,
  ...exports
};