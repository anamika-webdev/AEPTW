// ============================================================================
// TEST SCRIPT - Run this in your backend folder to test the route file
// ============================================================================
// Save this as: backend/test-route-file.js
// Run with: node test-route-file.js

console.log('🧪 Testing workerTrainingEvidence.routes.js file...\n');

try {
    // Try to require the file
    const workerTrainingEvidenceRoutes = require('./src/routes/workerTrainingEvidence.routes');

    console.log('✅ File loaded successfully!');
    console.log('   Type:', typeof workerTrainingEvidenceRoutes);
    console.log('   Is Function:', typeof workerTrainingEvidenceRoutes === 'function');

    if (typeof workerTrainingEvidenceRoutes === 'function') {
        console.log('\n✅ Module exports a valid Express router');
    } else {
        console.log('\n❌ Module does NOT export a valid Express router');
        console.log('   Exported value:', workerTrainingEvidenceRoutes);
    }

} catch (error) {
    console.log('❌ ERROR loading file:');
    console.log('   Message:', error.message);
    console.log('   Stack:', error.stack);

    if (error.message.includes('Cannot find module')) {
        console.log('\n💡 FIX: Check that the file exists at:');
        console.log('   backend/src/routes/workerTrainingEvidence.routes.js');
    } else if (error.message.includes('authenticateToken')) {
        console.log('\n💡 FIX: Check the require path for authenticateToken');
        console.log('   Current: require("../middleware/auth")');
        console.log('   Try: require("../middleware/auth.middleware")');
    } else {
        console.log('\n💡 FIX: There\'s a syntax error in the route file');
        console.log('   Check the error message above for details');
    }
}

console.log('\n📋 Next steps:');
console.log('1. If file loaded successfully, the problem is in server.js route registration');
console.log('2. If file has errors, fix the errors shown above');
console.log('3. After fixing, restart your backend server');