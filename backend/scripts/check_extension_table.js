// backend/scripts/check_extension_table.js
// Diagnostic script to check permit_extensions table structure

const pool = require('../src/config/database');

async function checkExtensionTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔌 Connected to database...\n');

        // 1. Check if permit_extensions table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'permit_extensions'"
        );

        if (tables.length === 0) {
            console.log('❌ permit_extensions table does NOT exist!');
            console.log('You need to create this table first.\n');
            connection.release();
            return;
        }

        console.log('✅ permit_extensions table exists\n');

        // 2. Get all columns in the table
        const [columns] = await connection.query(
            "DESCRIBE permit_extensions"
        );

        console.log('📋 Current columns in permit_extensions table:');
        console.log('================================================');
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(30)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        console.log('');

        // 3. Check for required columns
        const requiredColumns = [
            'id',
            'permit_id',
            'requested_by_user_id',
            'requested_at',
            'original_end_time',
            'new_end_time',
            'reason',
            'status',
            'site_leader_id',
            'site_leader_status',
            'site_leader_approved_at',
            'site_leader_signature',
            'site_leader_remarks',
            'safety_officer_id',
            'safety_officer_status',
            'safety_officer_approved_at',
            'safety_officer_signature',
            'safety_officer_remarks'
        ];

        const existingColumns = columns.map(col => col.Field);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
            console.log('❌ MISSING COLUMNS:');
            console.log('==================');
            missingColumns.forEach(col => {
                console.log(`  - ${col}`);
            });
            console.log('');
            console.log('🔧 To fix this, run the following SQL:');
            console.log('');

            if (missingColumns.includes('site_leader_signature')) {
                console.log('ALTER TABLE permit_extensions ADD COLUMN site_leader_signature LONGTEXT NULL AFTER site_leader_approved_at;');
            }
            if (missingColumns.includes('site_leader_remarks')) {
                console.log('ALTER TABLE permit_extensions ADD COLUMN site_leader_remarks TEXT NULL AFTER site_leader_signature;');
            }
            if (missingColumns.includes('safety_officer_signature')) {
                console.log('ALTER TABLE permit_extensions ADD COLUMN safety_officer_signature LONGTEXT NULL AFTER safety_officer_approved_at;');
            }
            if (missingColumns.includes('safety_officer_remarks')) {
                console.log('ALTER TABLE permit_extensions ADD COLUMN safety_officer_remarks TEXT NULL AFTER safety_officer_signature;');
            }
            console.log('');
        } else {
            console.log('✅ All required columns exist!');
        }

        // 4. Check sample data
        const [extensions] = await connection.query(
            'SELECT * FROM permit_extensions LIMIT 1'
        );

        if (extensions.length > 0) {
            console.log('\n📊 Sample extension record:');
            console.log('===========================');
            console.log(JSON.stringify(extensions[0], null, 2));
        } else {
            console.log('\n⚠️  No extension records found in the table');
        }

        // 5. Check for extension ID 5 specifically
        const [ext5] = await connection.query(
            'SELECT * FROM permit_extensions WHERE id = 5'
        );

        if (ext5.length > 0) {
            console.log('\n📋 Extension ID 5 details:');
            console.log('==========================');
            console.log(JSON.stringify(ext5[0], null, 2));
        } else {
            console.log('\n⚠️  Extension ID 5 not found');
        }

        connection.release();

    } catch (error) {
        console.error('❌ Error checking table:', error.message);
        console.error('Stack:', error.stack);
        if (connection) connection.release();
    }
}

// Run the diagnostic
checkExtensionTable()
    .then(() => {
        console.log('\n✅ Diagnostic complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Diagnostic failed:', err);
        process.exit(1);
    });