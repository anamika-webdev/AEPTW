// backend/src/routes/permits.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/permits/my-supervisor-permits - Get permits created by logged-in supervisor
router.get('/my-supervisor-permits', async (req, res) => {
  try {
    const userId = req.user.id; // From auth token
    
    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE p.created_by_user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    console.error('Error fetching supervisor permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permits',
      error: error.message
    });
  }
});

// GET /api/permits - Get all permits
router.get('/', async (req, res) => {
  try {
    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        u.full_name as created_by_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permits',
      error: error.message
    });
  }
});

// POST /api/permits - Create new permit
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      site_id,
      permit_type,
      work_location,
      work_description,
      start_time,
      end_time,
      receiver_name,
      receiver_contact,
      vendor_id,
      hazard_ids,
      ppe_ids,
      team_members,
      control_measures,
      other_hazards,
      checklist_responses
    } = req.body;
    
    const userId = req.user.id;
    
    // Insert permit
    const [permitResult] = await connection.query(`
      INSERT INTO permits (
        site_id, created_by_user_id, vendor_id, permit_type,
        work_location, work_description, start_time, end_time,
        receiver_name, receiver_contact, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')
    `, [
      site_id, userId, vendor_id || null, permit_type,
      work_location, work_description, start_time, end_time,
      receiver_name, receiver_contact
    ]);
    
    const permitId = permitResult.insertId;
    
    // Insert hazards
    if (hazard_ids && hazard_ids.length > 0) {
      const hazardValues = hazard_ids.map(id => [permitId, id]);
      await connection.query(
        'INSERT INTO permit_hazards (permit_id, hazard_id) VALUES ?',
        [hazardValues]
      );
    }
    
    // Insert PPE
    if (ppe_ids && ppe_ids.length > 0) {
      const ppeValues = ppe_ids.map(id => [permitId, id]);
      await connection.query(
        'INSERT INTO permit_ppe (permit_id, ppe_id) VALUES ?',
        [ppeValues]
      );
    }
    
    // Insert team members
    if (team_members && team_members.length > 0) {
      const teamValues = team_members.map(member => [
        permitId,
        member.worker_name,
        member.worker_role,
        member.badge_id || null,
        member.company_name || null,
        member.phone || null,
        member.email || null,
        true // is_qualified
      ]);
      await connection.query(`
        INSERT INTO permit_team_members (
          permit_id, worker_name, worker_role, badge_id,
          company_name, phone, email, is_qualified
        ) VALUES ?
      `, [teamValues]);
    }
    
    // Insert control measures
    if (control_measures) {
      await connection.query(
        'INSERT INTO permit_control_measures (permit_id, control_measure) VALUES (?, ?)',
        [permitId, control_measures]
      );
    }
    
    // Insert checklist responses
    if (checklist_responses && checklist_responses.length > 0) {
      const checklistValues = checklist_responses.map(response => [
        permitId,
        response.question_id,
        response.response,
        response.remarks || null
      ]);
      await connection.query(`
        INSERT INTO permit_checklist_responses (
          permit_id, question_id, response, remarks
        ) VALUES ?
      `, [checklistValues]);
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: {
        permit_id: permitId
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;