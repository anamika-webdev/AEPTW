// ============================================
// BACKEND API: Site Approvers Routes
// File: backend/src/routes/siteApprovers.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================
// GET /api/site-approvers - Get all sites with approvers (Admin only)
// ============================================
router.get('/', authorizeAdmin, async (req, res) => {
    try {
        console.log('📥 GET /api/site-approvers - Fetching all sites with approvers');

        const [sites] = await pool.query(`
      SELECT 
        s.id as site_id,
        s.name as site_name,
        s.site_code,
        s.location,
        s.address,
        s.city,
        s.state,
        sa.id as site_approver_id,
        sa.area_manager_id,
        am.full_name as area_manager_name,
        am.email as area_manager_email,
        sa.safety_officer_id,
        so.full_name as safety_officer_name,
        so.email as safety_officer_email,
        sa.site_leader_id,
        sl.full_name as site_leader_name,
        sl.email as site_leader_email,
        sa.created_at,
        sa.updated_at
      FROM sites s
      LEFT JOIN site_approvers sa ON s.id = sa.site_id
      LEFT JOIN users am ON sa.area_manager_id = am.id
      LEFT JOIN users so ON sa.safety_officer_id = so.id
      LEFT JOIN users sl ON sa.site_leader_id = sl.id
      WHERE s.is_active = TRUE
      ORDER BY s.name
    `);

        console.log(`✅ Found ${sites.length} sites`);

        res.json({
            success: true,
            count: sites.length,
            data: sites
        });
    } catch (error) {
        console.error('❌ Error fetching site approvers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching site approvers',
            error: error.message
        });
    }
});

// ============================================
// GET /api/site-approvers/:siteId - Get approvers for specific site
// ============================================
router.get('/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        console.log(`📥 GET /api/site-approvers/${siteId} - Fetching approvers for site`);

        const [result] = await pool.query(`
      SELECT 
        s.id as site_id,
        s.name as site_name,
        s.site_code,
        sa.area_manager_id,
        am.full_name as area_manager_name,
        am.email as area_manager_email,
        am.role as area_manager_role,
        sa.safety_officer_id,
        so.full_name as safety_officer_name,
        so.email as safety_officer_email,
        so.role as safety_officer_role,
        sa.site_leader_id,
        sl.full_name as site_leader_name,
        sl.email as site_leader_email,
        sl.role as site_leader_role
      FROM sites s
      LEFT JOIN site_approvers sa ON s.id = sa.site_id
      LEFT JOIN users am ON sa.area_manager_id = am.id
      LEFT JOIN users so ON sa.safety_officer_id = so.id
      LEFT JOIN users sl ON sa.site_leader_id = sl.id
      WHERE s.id = ?
    `, [siteId]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        console.log(`✅ Found approvers for site ${siteId}`);

        res.json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('❌ Error fetching approvers for site:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approvers',
            error: error.message
        });
    }
});

// ============================================
// POST /api/site-approvers - Create or update site approvers (Admin only)
// ============================================
router.post('/', authorizeAdmin, async (req, res) => {
    try {
        const { site_id, area_manager_id, safety_officer_id, site_leader_id } = req.body;

        console.log('📥 POST /api/site-approvers - Assigning approvers:', {
            site_id,
            area_manager_id,
            safety_officer_id,
            site_leader_id
        });

        // Validation
        if (!site_id) {
            return res.status(400).json({
                success: false,
                message: 'site_id is required'
            });
        }

        // Verify site exists
        const [site] = await pool.query('SELECT id FROM sites WHERE id = ?', [site_id]);
        if (site.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        // Verify approvers exist and have correct roles
        if (area_manager_id) {
            const [am] = await pool.query(
                'SELECT id FROM users WHERE id = ? AND role = ? AND is_active = TRUE',
                [area_manager_id, 'Approver_AreaManager']
            );
            if (am.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Area Manager ID or user is not an Area Manager'
                });
            }
        }

        if (safety_officer_id) {
            const [so] = await pool.query(
                'SELECT id FROM users WHERE id = ? AND role = ? AND is_active = TRUE',
                [safety_officer_id, 'Approver_Safety']
            );
            if (so.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Safety Officer ID or user is not a Safety Officer'
                });
            }
        }

        if (site_leader_id) {
            const [sl] = await pool.query(
                'SELECT id FROM users WHERE id = ? AND role = ? AND is_active = TRUE',
                [site_leader_id, 'Approver_SiteLeader']
            );
            if (sl.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Site Leader ID or user is not a Site Leader'
                });
            }
        }

        // Insert or update using ON DUPLICATE KEY UPDATE
        await pool.query(`
      INSERT INTO site_approvers (
        site_id,
        area_manager_id,
        safety_officer_id,
        site_leader_id
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        area_manager_id = VALUES(area_manager_id),
        safety_officer_id = VALUES(safety_officer_id),
        site_leader_id = VALUES(site_leader_id),
        updated_at = CURRENT_TIMESTAMP
    `, [
            site_id,
            area_manager_id || null,
            safety_officer_id || null,
            site_leader_id || null
        ]);

        console.log(`✅ Successfully assigned approvers to site ${site_id}`);

        // Fetch and return the updated data
        const [updated] = await pool.query(`
      SELECT 
        s.id as site_id,
        s.name as site_name,
        sa.area_manager_id,
        am.full_name as area_manager_name,
        sa.safety_officer_id,
        so.full_name as safety_officer_name,
        sa.site_leader_id,
        sl.full_name as site_leader_name
      FROM sites s
      LEFT JOIN site_approvers sa ON s.id = sa.site_id
      LEFT JOIN users am ON sa.area_manager_id = am.id
      LEFT JOIN users so ON sa.safety_officer_id = so.id
      LEFT JOIN users sl ON sa.site_leader_id = sl.id
      WHERE s.id = ?
    `, [site_id]);

        res.json({
            success: true,
            message: 'Site approvers assigned successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('❌ Error assigning site approvers:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning site approvers',
            error: error.message
        });
    }
});

// ============================================
// PUT /api/site-approvers/:siteId - Update site approvers (Admin only)
// ============================================
router.put('/:siteId', authorizeAdmin, async (req, res) => {
    try {
        const { siteId } = req.params;
        const { area_manager_id, safety_officer_id, site_leader_id } = req.body;

        console.log(`📥 PUT /api/site-approvers/${siteId} - Updating approvers`);

        // Same logic as POST, but using siteId from params
        await pool.query(`
      INSERT INTO site_approvers (
        site_id,
        area_manager_id,
        safety_officer_id,
        site_leader_id
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        area_manager_id = VALUES(area_manager_id),
        safety_officer_id = VALUES(safety_officer_id),
        site_leader_id = VALUES(site_leader_id),
        updated_at = CURRENT_TIMESTAMP
    `, [
            siteId,
            area_manager_id || null,
            safety_officer_id || null,
            site_leader_id || null
        ]);

        console.log(`✅ Updated approvers for site ${siteId}`);

        res.json({
            success: true,
            message: 'Site approvers updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating site approvers:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating site approvers',
            error: error.message
        });
    }
});

// ============================================
// DELETE /api/site-approvers/:siteId - Remove site approvers (Admin only)
// ============================================
router.delete('/:siteId', authorizeAdmin, async (req, res) => {
    try {
        const { siteId } = req.params;

        console.log(`📥 DELETE /api/site-approvers/${siteId} - Removing approvers`);

        const [result] = await pool.query(
            'DELETE FROM site_approvers WHERE site_id = ?',
            [siteId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No approvers found for this site'
            });
        }

        console.log(`✅ Removed approvers for site ${siteId}`);

        res.json({
            success: true,
            message: 'Site approvers removed successfully'
        });
    } catch (error) {
        console.error('❌ Error removing site approvers:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing site approvers',
            error: error.message
        });
    }
});

module.exports = router;

