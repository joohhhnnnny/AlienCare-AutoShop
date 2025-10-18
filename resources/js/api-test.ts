/**
 * API Test Utilities
 * Handles endpoint testing and result display
 */

const API_BASE = window.location.origin + '/api';

interface TestResult {
    name: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    details?: unknown;
}

async function testEndpoint(
    name: string,
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body: unknown = null
): Promise<void> {
    const resultDiv = document.getElementById('results');
    if (!resultDiv) return;

    const testDiv = document.createElement('div');
    testDiv.className = 'test-result pending';
    testDiv.innerHTML = `<h3>${name}</h3><p>Testing ${url}...</p>`;
    resultDiv.appendChild(testDiv);

    try {
        const options: RequestInit = {
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
            (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = csrfToken;
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        testDiv.innerHTML = `
            <h3>❌ ${name}</h3>
            <p><strong>Error:</strong> ${errorMessage}</p>
        `;
    }
}

async function runAllTests(): Promise<void> {
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

function clearResults(): void {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
    }
}

// Initialize event listeners
function initializeEventListeners(): void {
    const runButton = document.getElementById('runAllTests');
    const clearButton = document.getElementById('clearResults');

    if (runButton) {
        runButton.addEventListener('click', runAllTests);
    }
    if (clearButton) {
        clearButton.addEventListener('click', clearResults);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        runAllTests();
    });
} else {
    initializeEventListeners();
    runAllTests();
}
