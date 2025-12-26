// Simulate the getApprovalFields logic from approvals.routes.js
const getApprovalFields = (userRole) => {
    const roleMap = {
        'Approver_AreaManager': { roleName: 'Area Manager' },
        'Approver_Safety': { roleName: 'Safety Officer' },
        'Approver_SiteLeader': { roleName: 'Site Leader' }
    };

    const userRoles = (userRole || '').split(',');

    for (const key of Object.keys(roleMap)) {
        if (userRoles.some(r => r.trim() === key)) {
            return roleMap[key];
        }
    }

    return null;
};

// Test Cases
const tests = [
    { role: 'Approver_Safety', expected: 'Safety Officer' },
    { role: 'Admin,Approver_Safety', expected: 'Safety Officer' },
    { role: 'Approver_Safety, Admin', expected: 'Safety Officer' }, // spaces
    { role: 'Worker, Approver_SiteLeader', expected: 'Site Leader' },
    { role: 'Admin', expected: null },
    { role: 'Approver_AreaManager,Approver_Safety', expected: 'Area Manager' }, // First match wins
];

console.log('Running Tests per updated logic...');

tests.forEach(test => {
    const result = getApprovalFields(test.role);
    const resultName = result ? result.roleName : null;
    const status = resultName === test.expected ? '✅ PASS' : `❌ FAIL (Got: ${resultName})`;
    console.log(`Role: "${test.role}" -> Expected: ${test.expected} -> ${status}`);
});
