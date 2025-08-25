// This script is loaded ONLY AFTER successful authentication.
// It assumes a JWT token is available in sessionStorage.

// --- DOM Element References ---
const itemsTableBody = document.getElementById('items-table-body');
const reportsTableBody = document.getElementById('reports-table-body');
const editItemModal = document.getElementById('editItemModal');
const editItemForm = document.getElementById('edit-item-form');
const editItemId = document.getElementById('edit-item-id');
const editTitle = document.getElementById('edit-title');
const editPrice = document.getElementById('edit-price');
const editCategory = document.getElementById('edit-category');

const API_URL = 'https://x-marketplace.onrender.com';

// --- Helper for Authenticated Fetch ---
async function fetchWithAuth(url, options = {}) {
    const token = sessionStorage.getItem('adminToken');
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    // Include the master key for endpoints that still use it
    if (options.useMasterKey) {
        headers['x-master-key'] = sessionStorage.getItem('adminKey'); 
    }
    
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        // If unauthorized, clear session and reload to show login page
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminKey');
        alert('Your session has expired. Please log in again.');
        window.location.reload();
        throw new Error('Session expired');
    }
    return response;
}


// --- Data Loading ---
async function loadAllItems() {
    try {
        const response = await fetch(`${API_URL}/items`); // This is a public route
        if (!response.ok) throw new Error('Failed to fetch items');
        const items = await response.json();
        renderItemsTable(items);
    } catch (error) {
        console.error('Error loading items:', error);
        itemsTableBody.innerHTML = `<tr><td colspan="6">Error loading items.</td></tr>`;
    }
}

async function loadAllReports() {
    try {
        const response = await fetchWithAuth(`${API_URL}/reports`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        const reports = await response.json();
        renderReportsTable(reports);
    } catch (error) {
        if (error.message !== 'Session expired') {
            console.error('Error loading reports:', error);
            reportsTableBody.innerHTML = `<tr><td colspan="3">Error loading reports.</td></tr>`;
        }
    }
}

// --- Rendering ---
function renderItemsTable(items) { /* ... existing code ... */ }
function renderReportsTable(reports) { /* ... existing code ... */ }

// --- Admin Actions ---
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action is permanent.')) return;

    try {
        const response = await fetchWithAuth(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteKey: sessionStorage.getItem('adminKey') }), // Still using deleteKey logic which checks master key
            useMasterKey: true // Indicate that this endpoint needs the master key header
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete item');
        }
        alert('Item deleted successfully!');
        loadAllItems();
    } catch (error) {
        if (error.message !== 'Session expired') {
            console.error('Error deleting item:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

// --- Edit Modal Logic ---
function openEditModal(id, title, price, category) { /* ... existing code ... */ }
function closeEditModal() { /* ... existing code ... */ }

editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = editItemId.value;
    const updatedData = {
        title: editTitle.value,
        price: editPrice.value,
        category: editCategory.value,
    };
    try {
        const response = await fetchWithAuth(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update item');
        }
        alert('Item updated successfully!');
        closeEditModal();
        loadAllItems();
    } catch (error) {
        if (error.message !== 'Session expired') {
            console.error('Error updating item:', error);
            alert(`Error: ${error.message}`);
        }
    }
});

// Make functions globally available
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.deleteItem = deleteItem;

// --- Initializer ---
function initAdminPanel() {
    loadAllItems();
    loadAllReports();
}

initAdminPanel();
