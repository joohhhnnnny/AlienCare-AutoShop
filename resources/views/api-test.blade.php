<!DOCTYPE html>
<html>
<head>
    <title>Laravel API Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .pending { background-color: #fff3cd; border-color: #ffeaa7; }
        button { margin: 5px; padding: 10px 15px; }
        pre { background: #f4f4f4; padding: 10px; max-height: 200px; overflow: auto; }
    </style>
</head>
<body>
    <h1>Laravel API Integration Test</h1>
    <p>This page tests the Laravel API endpoints to verify the backend is working correctly.</p>

    <button onclick="runAllTests()">Run All Tests</button>
    <button onclick="clearResults()">Clear Results</button>

    <div id="results"></div>

    <script>
        const API_BASE = window.location.origin + '/api';

        async function testEndpoint(name, url, method = 'GET', body = null) {
            const resultDiv = document.getElementById('results');
            const testDiv = document.createElement('div');
            testDiv.className = 'test-result pending';
            testDiv.innerHTML = `<h3>${name}</h3><p>Testing ${url}...</p>`;
            resultDiv.appendChild(testDiv);

            try {
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                };

                // Add CSRF token for non-GET requests
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken && method !== 'GET') {
                    options.headers['X-CSRF-TOKEN'] = csrfToken;
                }

                if (body) {
                    options.body = JSON.stringify(body);
                }

                const response = await fetch(url, options);
                const data = await response.json();

                if (response.ok) {
                    testDiv.className = 'test-result success';
                    testDiv.innerHTML = `
                        <h3>✅ ${name}</h3>
                        <p><strong>Status:</strong> ${response.status} ${response.statusText}</p>
                        <p><strong>Response:</strong></p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                testDiv.className = 'test-result error';
                testDiv.innerHTML = `
                    <h3>❌ ${name}</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                `;
            }
        }

        async function runAllTests() {
            clearResults();

            // Test 1: Health Check
            await testEndpoint('Health Check', `${API_BASE}/health`);

            // Test 2: Inventory List
            await testEndpoint('Inventory List', `${API_BASE}/inventory?per_page=5`);

            // Test 3: Dashboard Analytics
            await testEndpoint('Dashboard Analytics', `${API_BASE}/reports/analytics/dashboard`);

            // Test 4: Low Stock Alerts
            await testEndpoint('Low Stock Alerts', `${API_BASE}/inventory/alerts/low-stock`);

            // Test 5: Reservations
            await testEndpoint('Reservations List', `${API_BASE}/reservations?per_page=5`);

            // Test 6: Stock Transactions
            await testEndpoint('Stock Transactions', `${API_BASE}/transactions?per_page=5`);
        }

        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }

        // Auto-run tests when page loads
        window.onload = runAllTests;
    </script>
</body>
</html>
