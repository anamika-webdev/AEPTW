const mysql = require('mysql2/promise');

async function checkPermitStatus() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Anam@14',
        database: 'amazon_eptw_db'
    });

    try {
        const [rows] = await pool.query(`
      SELECT 
        id, 
        permit_serial, 
        status, 
        area_manager_id, 
        safety_officer_id, 
        site_leader_id, 
        area_manager_status, 
        safety_officer_status, 
        site_leader_status,
        created_by_user_id
      FROM permits 
      WHERE created_by_user_id = 17 
        AND status IN ('Initiated', 'Approved') 
      ORDER BY id DESC 
      LIMIT 10
    `);

        console.log('\n📊 Permits for User 17 (Initiated & Approved):');
        console.log('='.repeat(120));

        rows.forEach(row => {
            console.log(`\nID: ${row.id} | Serial: ${row.permit_serial} | Status: ${row.status}`);
            console.log(`  Area Manager: ${row.area_manager_id ? `ID ${row.area_manager_id} - ${row.area_manager_status}` : 'Not assigned'}`);
            console.log(`  Safety Officer: ${row.safety_officer_id ? `ID ${row.safety_officer_id} - ${row.safety_officer_status}` : 'Not assigned'}`);
            console.log(`  Site Leader: ${row.site_leader_id ? `ID ${row.site_leader_id} - ${row.site_leader_status}` : 'Not assigned'}`);

            // Check if should be approved
            let shouldBeApproved = true;
            if (row.area_manager_id && row.area_manager_status !== 'Approved') shouldBeApproved = false;
            if (row.safety_officer_id && row.safety_officer_status !== 'Approved') shouldBeApproved = false;
            if (row.site_leader_id && row.site_leader_status !== 'Approved') shouldBeApproved = false;

            if (shouldBeApproved && row.status === 'Initiated') {
                console.log(`  ⚠️  ISSUE: All approvers approved but status is still 'Initiated'!`);
            } else if (shouldBeApproved && row.status === 'Approved') {
                console.log(`  ✅ Correctly marked as Approved`);
            } else {
                console.log(`  ⏳ Waiting for approvals`);
            }
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPermitStatus();
