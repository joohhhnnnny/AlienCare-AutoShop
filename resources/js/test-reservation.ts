/**
 * Reservation Modal Debug Tests
 * Tests API connection, inventory API, and data format using Tailwind CSS
 */

const BASE_URL = 'http://localhost:8000';

function createResultContent(content: string, status: 'success' | 'error' | 'pending' = 'pending'): string {
    const statusClassMap = {
        success: 'text-green-700 dark:text-green-300',
        error: 'text-red-700 dark:text-red-300',
        pending: 'text-yellow-700 dark:text-yellow-300'
    };
    
    return `<div class="${statusClassMap[status]}"><pre class="whitespace-pre-wrap break-words">${content}</pre></div>`;
}

async function testAPIConnection(): Promise<void> {
    const resultDiv = document.getElementById('api-health-result');
    if (!resultDiv) return;
    
    resultDiv.textContent = 'Testing...';

    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();

        if (response.ok) {
            resultDiv.innerHTML = createResultContent(`✓ API Health Check Passed\n\n${JSON.stringify(data, null, 2)}`, 'success');
        } else {
            resultDiv.innerHTML = createResultContent(`✗ API Health Check Failed\nStatus: ${response.status}\n\n${JSON.stringify(data, null, 2)}`, 'error');
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        resultDiv.innerHTML = createResultContent(`✗ Connection Error\n${errorMsg}`, 'error');
    }
}

async function testInventoryAPI(): Promise<void> {
    const resultDiv = document.getElementById('inventory-api-result');
    if (!resultDiv) return;
    
    resultDiv.textContent = 'Testing...';

    try {
        const response = await fetch(`${BASE_URL}/api/inventory`);
        const data = await response.json();

        if (response.ok) {
            const inventoryItems: unknown[] = data.data?.data || [];
            if (Array.isArray(inventoryItems)) {
                const itemList = inventoryItems
                    .slice(0, 3)
                    .map((item: unknown) => {
                        const typedItem = item as { item_id: string; item_name: string; stock: number };
                        return `- ${typedItem.item_id}: ${typedItem.item_name} (Stock: ${typedItem.stock})`;
                    })
                    .join('\n');

                const content = `✓ Inventory API Working
Items Found: ${inventoryItems.length}
Sample Items:
${itemList}

Full Response Structure:
${JSON.stringify(data, null, 2)}`;
                
                resultDiv.innerHTML = createResultContent(content, 'success');
            } else {
                throw new Error('Invalid response format');
            }
        } else {
            resultDiv.innerHTML = createResultContent(`✗ Inventory API Failed\nStatus: ${response.status}\n\n${JSON.stringify(data, null, 2)}`, 'error');
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        resultDiv.innerHTML = createResultContent(`✗ Connection Error\n${errorMsg}`, 'error');
    }
}

async function testDataFormat(): Promise<void> {
    const resultDiv = document.getElementById('data-format-result');
    if (!resultDiv) return;
    
    resultDiv.textContent = 'Testing...';

    try {
        const response = await fetch(`${BASE_URL}/api/inventory`);
        const data = await response.json();

        if (response.ok) {
            // Simulate the frontend data extraction
            const inventoryItems: unknown[] = Array.isArray(data?.data?.data) ? data.data.data : [];

            const itemList = inventoryItems
                .map((item: unknown, index: number) => {
                    const typedItem = item as { item_id: string; item_name: string; stock: number };
                    return `${index}: ${typedItem.item_id} - ${typedItem.item_name} (Stock: ${typedItem.stock})`;
                })
                .join('\n');

            const content = `✓ Data Format Analysis
Original Response Type: ${typeof data}
data.data exists: ${!!data.data}
data.data.data exists: ${!!data.data?.data}
data.data.data is Array: ${Array.isArray(data.data?.data)}

Frontend Extraction Result:
- inventoryItems type: ${typeof inventoryItems}
- inventoryItems isArray: ${Array.isArray(inventoryItems)}
- inventoryItems length: ${inventoryItems.length}

Items for Dropdown:
${itemList}`;
            
            resultDiv.innerHTML = createResultContent(content, 'success');
        } else {
            resultDiv.innerHTML = createResultContent(`✗ Data Format Test Failed\nStatus: ${response.status}`, 'error');
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        resultDiv.innerHTML = createResultContent(`✗ Connection Error\n${errorMsg}`, 'error');
    }
}

// Attach event listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachEventListeners);
} else {
    attachEventListeners();
}

function attachEventListeners(): void {
    const apiButton = document.querySelector('[data-test="api-connection"]');
    const inventoryButton = document.querySelector('[data-test="inventory-api"]');
    const dataFormatButton = document.querySelector('[data-test="data-format"]');

    if (apiButton) {
        apiButton.addEventListener('click', testAPIConnection);
    }
    if (inventoryButton) {
        inventoryButton.addEventListener('click', testInventoryAPI);
    }
    if (dataFormatButton) {
        dataFormatButton.addEventListener('click', testDataFormat);
    }
}
