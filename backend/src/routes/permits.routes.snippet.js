// backend/src/routes/permits.routes.js (GET Closure Evidence)

// Add this route to permits.routes.js to handle fetching closure evidence
router.get('/:id/closure/evidence', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        console.log(`📸 GET /api/permits/${id}/closure/evidence`);

        const [evidence] = await connection.query(`
      SELECT 
        pce.id,
        pce.closure_id,
        pce.permit_id,
        pce.file_path,
        pce.category,
        pce.description,
        pce.timestamp,
        pce.latitude,
        pce.longitude,
        u.full_name as captured_by_name
      FROM permit_closure_evidence pce
      LEFT JOIN users u ON pce.captured_by_user_id = u.id
      WHERE pce.permit_id = ?
      ORDER BY pce.timestamp DESC
    `, [id]);

        console.log(`✅ Found ${evidence.length} closure evidence items`);

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('❌ Error fetching closure evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching closure evidence',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});
