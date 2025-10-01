// Debug script to test inventory API
console.log('Testing inventory API...');

const testData = {
    item_id: "DEBUG001",
    item_name: "Debug Test Item",
    description: "Test item for debugging",
    category: "Test",
    stock: 5,
    reorder_level: 2,
    unit_price: 10.99,
    supplier: "Test Supplier",
    location: "Test Location"
};

console.log('Sending data:', testData);

fetch('/api/inventory', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(testData)
})
.then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    return response.json();
})
.then(data => {
    console.log('Response data:', data);
})
.catch(error => {
    console.error('Error:', error);
});
