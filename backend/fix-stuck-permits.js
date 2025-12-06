const mysql = require('mysql2/promise');

async function fixStuckPermits() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Anam@14',
        database: 'amazon_eptw_db'
    });

    try {
        console.log('\n🔧 Finding and fixing stuck permits...\n');

        // Find permits where all required approvers have approved but status is still 'Initiated'
        const [permits] = await pool.query(`
      SELECT 
        id, 
        permit_serial, 
        status, 
        area_manager_id, 
        safety_officer_id, 
        site_leader_id, 
        area_manager_status, 
        safety_officer_status, 
        site_leader_status
      FROM permits 
      WHERE status = 'Initiated'
    `);

        let fixedCount = 0;

        for (const permit of permits) {
            let shouldBeApproved = true;

            // Check if all assigned approvers have approved
            if (permit.area_manager_id && permit.area_manager_status !== 'Approved') {
                shouldBeApproved = false;
            }
            if (permit.safety_officer_id && permit.safety_officer_status !== 'Approved') {
                shouldBeApproved = false;
            }
            if (permit.site_leader_id && permit.site_leader_status !== 'Approved') {
                shouldBeApproved = false;
            }

            if (shouldBeApproved) {
                console.log(`🔄 Fixing ${permit.permit_serial}:`);
                console.log(`   Area Manager: ${permit.area_manager_status || 'N/A'}`);
                console.log(`   Safety Officer: ${permit.safety_officer_status || 'N/A'}`);
                console.log(`   Site Leader: ${permit.site_leader_status || 'N/A'}`);

                const [result] = await pool.query(
                    `UPDATE permits SET status = 'Approved', updated_at = NOW() WHERE id = ?`,
                    [permit.id]
                );

                console.log(`   ✅ Updated status to 'Approved' (affected ${result.affectedRows} row)\n`);
                fixedCount++;
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} stuck permit(s)\n`);

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixStuckPermits();
