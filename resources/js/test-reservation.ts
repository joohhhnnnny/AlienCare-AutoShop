/**
 * Reservation Modal Debug Tests
 * Tests API connection, inventory API, and data format
 */

const BASE_URL = 'http://localhost:8000';

function setResultContent(elementId: string, content: string): void {
    const resultDiv = document.getElementById(elementId);
    if (resultDiv) {
        resultDiv.innerHTML = content;
    }
}

export async function testAPIConnection(): Promise<void> {
    const resultDiv = 'api-health-result';
    setResultContent(resultDiv, 'Testing...');

    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();

        if (response.ok) {
            setResultContent(resultDiv, `<span class="success">✓ API Health Check Passed</span>\n${JSON.stringify(data, null, 2)}`);
        } else {
            setResultContent(resultDiv, `<span class="error">✗ API Health Check Failed</span>\nStatus: ${response.status}\n${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setResultContent(resultDiv, `<span class="error">✗ Connection Error</span>\n${errorMsg}`);
    }
}

export async function testInventoryAPI(): Promise<void> {
    const resultDiv = 'inventory-api-result';
    setResultContent(resultDiv, 'Testing...');

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

                setResultContent(resultDiv, `<span class="success">✓ Inventory API Working</span>
Items Found: ${inventoryItems.length}
Sample Items:
${itemList}

Full Response Structure:
${JSON.stringify(data, null, 2)}`);
            } else {
                throw new Error('Invalid response format');
            }
        } else {
            setResultContent(resultDiv, `<span class="error">✗ Inventory API Failed</span>\nStatus: ${response.status}\n${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setResultContent(resultDiv, `<span class="error">✗ Connection Error</span>\n${errorMsg}`);
    }
}

export async function testDataFormat(): Promise<void> {
    const resultDiv = 'data-format-result';
    setResultContent(resultDiv, 'Testing...');

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

            setResultContent(resultDiv, `<span class="success">✓ Data Format Analysis</span>
Original Response Type: ${typeof data}
data.data exists: ${!!data.data}
data.data.data exists: ${!!data.data?.data}
data.data.data is Array: ${Array.isArray(data.data?.data)}

Frontend Extraction Result:
- inventoryItems type: ${typeof inventoryItems}
- inventoryItems isArray: ${Array.isArray(inventoryItems)}
- inventoryItems length: ${inventoryItems.length}

Items for Dropdown:
${itemList}`);
        } else {
            setResultContent(resultDiv, `<span class="error">✗ Data Format Test Failed</span>\nStatus: ${response.status}`);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setResultContent(resultDiv, `<span class="error">✗ Connection Error</span>\n${errorMsg}`);
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
