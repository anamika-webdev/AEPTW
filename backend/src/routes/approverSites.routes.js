// ============================================
// BACKEND API: Approver Site Assignment Routes
// File: backend/src/routes/approverSites.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================
// GET /api/approvers/:approverId/sites - Get sites assigned to an approver
// ============================================
router.get('/:approverId/sites', authorizeAdmin, async (req, res) => {
    try {
        const { approverId } = req.params;
        console.log(`📥 GET /api/approvers/${approverId}/sites`);

        // Get approver info first
        const [approver] = await pool.query(
            'SELECT id, role FROM users WHERE id = ? AND role LIKE "Approver%"',
            [approverId]
        );

        if (approver.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Approver not found'
            });
        }

        const approverRole = approver[0].role;
        let roleColumn = '';

        // Determine which column to check based on role
        switch (approverRole) {
            case 'Approver_AreaManager':
                roleColumn = 'area_manager_id';
                break;
            case 'Approver_Safety':
                roleColumn = 'safety_officer_id';
                break;
            case 'Approver_SiteLeader':
                roleColumn = 'site_leader_id';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid approver role'
                });
        }

        // Get all sites where this approver is assigned
        const [sites] = await pool.query(`
            SELECT 
                s.id as site_id,
                s.name as site_name,
                s.site_code,
                s.location,
                s.address
            FROM sites s
            INNER JOIN site_approvers sa ON s.id = sa.site_id
            WHERE sa.${roleColumn} = ?
            ORDER BY s.name
        `, [approverId]);

        console.log(`✅ Found ${sites.length} sites for approver ${approverId}`);

        res.json({
            success: true,
            data: sites
        });
    } catch (error) {
        console.error('❌ Error fetching approver sites:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approver sites',
            error: error.message
        });
    }
});

// ============================================
// POST /api/approvers/:approverId/assign-sites - Assign sites to an approver
// ============================================
router.post('/:approverId/assign-sites', authorizeAdmin, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { approverId } = req.params;
        const { site_ids, approver_role } = req.body;

        console.log(`📥 POST /api/approvers/${approverId}/assign-sites`, {
            site_ids,
            approver_role
        });

        await connection.beginTransaction();

        // Validate approver exists
        const [approver] = await connection.query(
            'SELECT id, role FROM users WHERE id = ? AND is_active = TRUE',
            [approverId]
        );

        if (approver.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Approver not found'
            });
        }

        // Determine column based on role
        let roleColumn = '';
        switch (approver_role) {
            case 'Approver_AreaManager':
                roleColumn = 'area_manager_id';
                break;
            case 'Approver_Safety':
                roleColumn = 'safety_officer_id';
                break;
            case 'Approver_SiteLeader':
                roleColumn = 'site_leader_id';
                break;
            default:
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid approver role'
                });
        }

        // First, remove this approver from all sites
        await connection.query(`
            UPDATE site_approvers 
            SET ${roleColumn} = NULL 
            WHERE ${roleColumn} = ?
        `, [approverId]);

        console.log(`✅ Removed approver ${approverId} from all previous sites`);

        // If site_ids is not empty, assign to new sites
        if (site_ids && site_ids.length > 0) {
            for (const siteId of site_ids) {
                // Check if site_approvers record exists for this site
                const [existing] = await connection.query(
                    'SELECT id FROM site_approvers WHERE site_id = ?',
                    [siteId]
                );

                if (existing.length > 0) {
                    // Update existing record
                    await connection.query(`
                        UPDATE site_approvers 
                        SET ${roleColumn} = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE site_id = ?
                    `, [approverId, siteId]);
                } else {
                    // Create new record
                    await connection.query(`
                        INSERT INTO site_approvers (
                            site_id,
                            ${roleColumn}
                        ) VALUES (?, ?)
                    `, [siteId, approverId]);
                }
            }

            console.log(`✅ Assigned approver ${approverId} to ${site_ids.length} sites`);
        }

        await connection.commit();

        res.json({
            success: true,
            message: `Sites assigned successfully to approver ${approverId}`,
            assigned_sites: site_ids.length
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error assigning sites to approver:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning sites to approver',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// ============================================
// GET /api/sites/:siteId/approvers - Get all approvers for a site (useful for display)
// ============================================
router.get('/sites/:siteId/approvers', async (req, res) => {
    try {
        const { siteId } = req.params;
        console.log(`📥 GET /api/sites/${siteId}/approvers`);

        const [approvers] = await pool.query(`
            SELECT 
                sa.area_manager_id,
                am.full_name as area_manager_name,
                am.email as area_manager_email,
                sa.safety_officer_id,
                so.full_name as safety_officer_name,
                so.email as safety_officer_email,
                sa.site_leader_id,
                sl.full_name as site_leader_name,
                sl.email as site_leader_email
            FROM site_approvers sa
            LEFT JOIN users am ON sa.area_manager_id = am.id
            LEFT JOIN users so ON sa.safety_officer_id = so.id
            LEFT JOIN users sl ON sa.site_leader_id = sl.id
            WHERE sa.site_id = ?
        `, [siteId]);

        res.json({
            success: true,
            data: approvers[0] || null
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

module.exports = router;