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
    testDiv.className = 'border rounded-md p-3 space-y-2 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
    
    const title = document.createElement('h3');
    title.className = 'font-semibold text-lg';
    title.textContent = name;
    
    const message = document.createElement('p');
    message.className = 'text-sm text-muted-foreground';
    message.textContent = `Testing ${url}...`;
    
    testDiv.appendChild(title);
    testDiv.appendChild(message);
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
            testDiv.className = 'border rounded-md p-3 space-y-2 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
            
            title.textContent = `✅ ${name}`;
            title.className = 'font-semibold text-lg text-green-700 dark:text-green-300';
            
            const statusEl = document.createElement('p');
            statusEl.className = 'text-sm font-medium';
            statusEl.innerHTML = `<span class="font-bold">Status:</span> ${response.status} ${response.statusText}`;
            
            const responseLabel = document.createElement('p');
            responseLabel.className = 'text-sm font-medium';
            responseLabel.textContent = 'Response:';
            
            const responseData = document.createElement('pre');
            responseData.className = 'bg-background border border-border rounded p-2 text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words';
            responseData.textContent = JSON.stringify(data, null, 2);
            
            testDiv.appendChild(statusEl);
            testDiv.appendChild(responseLabel);
            testDiv.appendChild(responseData);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        testDiv.className = 'border rounded-md p-3 space-y-2 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
        
        title.textContent = `❌ ${name}`;
        title.className = 'font-semibold text-lg text-red-700 dark:text-red-300';
        
        const errorMsg = document.createElement('p');
        errorMsg.className = 'text-sm font-medium';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errorMsg.innerHTML = `<span class="font-bold">Error:</span> ${errorMessage}`;
        
        testDiv.appendChild(errorMsg);
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
