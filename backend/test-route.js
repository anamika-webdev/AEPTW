// Quick test to verify the training evidence route is accessible
const axios = require('axios');

async function testRoute() {
    try {
        // Get a token first (you'll need to replace with actual credentials)
        console.log('🔐 Attempting to login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            login_id: 'admin',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');

        // Test the training evidence route
        console.log('\n📸 Testing GET /api/training-evidence/permit/108...');
        const response = await axios.get('http://localhost:5000/api/training-evidence/permit/108', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Route is accessible!');
        console.log('Response:', response.data);

    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
        console.error('Full error:', error.message);
    }
}

testRoute();
