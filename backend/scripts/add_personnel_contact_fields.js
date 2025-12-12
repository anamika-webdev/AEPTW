// backend/scripts/add_personnel_contact_fields.js
// Add contact fields for personnel in permits table

const pool = require('../src/config/database');

async function addPersonnelContactFields() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔌 Connected to database...\n');

        console.log('📝 Adding personnel contact fields to permits table...\n');

        // Check existing columns
        const [columns] = await connection.query("DESCRIBE permits");
        const existingColumns = columns.map(col => col.Field);

        const fieldsToAdd = [
            // Common fields (all permits)
            { name: 'supervisor_contact', type: 'VARCHAR(20)', after: 'supervisor_name' },
            { name: 'first_aider_name', type: 'VARCHAR(255)', after: 'supervisor_contact' },
            { name: 'first_aider_contact', type: 'VARCHAR(20)', after: 'first_aider_name' },
            { name: 'aed_certified_person_name', type: 'VARCHAR(255)', after: 'first_aider_contact' },
            { name: 'aed_certified_person_contact', type: 'VARCHAR(20)', after: 'aed_certified_person_name' },

            // Confined Space specific
            { name: 'entrant_contact', type: 'VARCHAR(20)', after: 'entrant_name' },
            { name: 'attendant_contact', type: 'VARCHAR(20)', after: 'attendant_name' },
            { name: 'standby_person_contact', type: 'VARCHAR(20)', after: 'standby_person_name' },

            // Hot Work specific
            { name: 'fire_watcher_name', type: 'VARCHAR(255)', after: 'aed_certified_person_contact' },
            { name: 'fire_watcher_contact', type: 'VARCHAR(20)', after: 'fire_watcher_name' },
            { name: 'fire_fighter_available', type: 'BOOLEAN', after: 'fire_watcher_contact' },
            { name: 'fire_fighter_name', type: 'VARCHAR(255)', after: 'fire_fighter_available' },
            { name: 'fire_fighter_contact', type: 'VARCHAR(20)', after: 'fire_fighter_name' }
        ];

        for (const field of fieldsToAdd) {
            if (!existingColumns.includes(field.name)) {
                try {
                    await connection.query(
                        `ALTER TABLE permits ADD COLUMN ${field.name} ${field.type} NULL AFTER ${field.after}`
                    );
                    console.log(`✅ Added column: ${field.name}`);
                } catch (err) {
                    console.log(`⚠️  Could not add ${field.name}: ${err.message}`);
                }
            } else {
                console.log(`ℹ️  Column already exists: ${field.name}`);
            }
        }

        console.log('\n✅ All personnel contact fields added successfully!');
        connection.release();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        if (connection) connection.release();
        process.exit(1);
    }
}

// Run the script
addPersonnelContactFields()
    .then(() => {
        console.log('\n✅ Migration complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    });
