
const http = require('http');
const fs = require('fs');

const logFile = 'rbac-results.txt';
fs.writeFileSync(logFile, '');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function login(email, password) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const req = http.request('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    const cookies = res.headers['set-cookie'] || [];
                    const accessToken = json.accessToken;
                    resolve({ status: res.statusCode, data: json, cookies, accessToken });
                } catch (e) {
                    reject(new Error(`Failed to parse login response: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function testPath(path, token, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req = http.request(`http://localhost:3000${path}`, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, path });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    log('🚀 Starting RBAC Verification Tests...');

    // 1. Admin Login
    log('Testing Admin Login (admin@example.com)...');
    const adminLogin = await login('admin@example.com', 'Admin@123');
    if (adminLogin.status === 200) {
        log('✅ Admin Login Successful');
    } else {
        log(`❌ Admin Login Failed: ${adminLogin.status}`);
        return;
    }

    // 2. Test User Login
    log('Testing Regular User Login (testuser@example.com)...');
    const userLogin = await login('testuser@example.com', 'User@123');
    if (userLogin.status === 200) {
        log('✅ Regular User Login Successful');
    } else {
        log(`❌ Regular User Login Failed: ${userLogin.status}`);
        return;
    }

    log('\n--- Path Authorization Matrix ---\n');

    const tests = [
        { path: '/api/secure/profile', roles: ['Admin', 'User'], expected: [200, 200] },
        { path: '/api/secure/admin-only', roles: ['Admin', 'User'], expected: [200, 403] },
        { path: '/api/admin/users', roles: ['Admin', 'User'], expected: [200, 401] }, // Middleware redirects /admin to /login, which for API is often 401 or redirect
        { path: '/api/admin/roles', roles: ['Admin', 'User'], expected: [200, 401] },
        { path: '/api/admin/audit-events', roles: ['Admin', 'User'], expected: [200, 401] }
    ];

    for (const test of tests) {
        log(`Testing Path: ${test.path}`);

        // Admin check
        try {
            const adminRes = await testPath(test.path, adminLogin.accessToken);
            const adminOk = adminRes.status === test.expected[0];
            log(`  Admin: Status ${adminRes.status} ${adminOk ? '✅' : '❌'}`);
        } catch (e) {
            log(`  Admin: ERROR ${e.message}`);
        }

        // User check
        try {
            const userRes = await testPath(test.path, userLogin.accessToken);
            const userOk = userRes.status === test.expected[1] || userRes.status === 302 || userRes.status === 307; // Redirects are also success for blocking
            log(`  User:  Status ${userRes.status} ${userOk ? '✅' : '❌'}`);
        } catch (e) {
            log(`  User:  ERROR ${e.message}`);
        }
    }

    log('\n--- Verification Summary ---');
    log('Tests completed.');
}

runTests().catch(console.error);
