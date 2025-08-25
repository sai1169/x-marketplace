// Admin panel script

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const masterKeyInput = document.getElementById('master-key');
const loginError = document.getElementById('login-error');
const itemsTableBody = document.getElementById('items-table-body');
const reportsTableBody = document.getElementById('reports-table-body');

// Edit Modal Elements
const editItemModal = document.getElementById('editItemModal');
const editItemForm = document.getElementById('edit-item-form');
const editItemId = document.getElementById('edit-item-id');
const editTitle = document.getElementById('edit-title');
const editPrice = document.getElementById('edit-price');
const editCategory = document.getElementById('edit-category');

const API_URL = 'https://x-marketplace.onrender.com';

// --- Authentication ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = masterKeyInput.value.trim();
    loginError.classList.remove('show');

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ masterKey: key })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // If login is successful
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        sessionStorage.setItem('adminKey', key); // Store key for the session to authenticate other requests
        loadAdminData();

    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.add('show');
    }
});


// Check for session key on page load
document.addEventListener('DOMContentLoaded', () => {
    // Note: The master key is not stored here anymore. We just check if a session is active.
    if (sessionStorage.getItem('adminKey')) {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadAdminData();
    }
});


// --- Data Loading ---
async function loadAdminData() {
    await loadAllItems();
    await loadAllReports();
}

async function loadAllItems() {
    try {
        const response = await fetch(`${API_URL}/items`);
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
        const response = await fetch(`${API_URL}/reports`, {
            headers: { 'x-master-key': sessionStorage.getItem('adminKey') }
        });
        if (!response.ok) throw new Error('Failed to fetch reports');
        const reports = await response.json();
        renderReportsTable(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        reportsTableBody.innerHTML = `<tr><td colspan="3">Error loading reports.</td></tr>`;
    }
}


// --- Rendering ---
function renderItemsTable(items) {
    if (!items.length) {
        itemsTableBody.innerHTML = `<tr><td colspan="6">No items found.</td></tr>`;
        return;
    }
    itemsTableBody.innerHTML = items.map(item => `
        <tr>
            <td><img src="${item.images[0]}" alt="${item.title}" class="table-item-img"></td>
            <td>${item.title}</td>
            <td>${item.price}</td>
            <td>${item.category}</td>
            <td>${item.contact}</td>
            <td class="action-buttons">
                <button class="edit-btn" onclick="openEditModal('${item._id}', '${item.title}', '${item.price}', '${item.category}')">Edit</button>
                <button class="delete-btn-admin" onclick="deleteItem('${item._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderReportsTable(reports) {
    if (!reports.length) {
        reportsTableBody.innerHTML = `<tr><td colspan="3">No reports found.</td></tr>`;
        return;
    }
    reportsTableBody.innerHTML = reports.map(report => `
        <tr>
            <td>${report.message}</td>
            <td>${report.itemId || 'N/A'}</td>
            <td>${new Date(report.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
}


// --- Admin Actions ---
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action is permanent.')) return;

    try {
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteKey: sessionStorage.getItem('adminKey') })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete item');
        }

        alert('Item deleted successfully!');
        loadAllItems(); // Refresh the list
    } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error: ${error.message}`);
    }
}

// --- Edit Modal Logic ---
function openEditModal(id, title, price, category) {
    editItemId.value = id;
    editTitle.value = title;
    editPrice.value = price;
    editCategory.value = category;
    editItemModal.classList.add('show');
}

function closeEditModal() {
    editItemModal.classList.remove('show');
}

editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = editItemId.value;
    const updatedData = {
        title: editTitle.value,
        price: editPrice.value,
        category: editCategory.value,
    };

    try {
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-master-key': sessionStorage.getItem('adminKey')
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update item');
        }

        alert('Item updated successfully!');
        closeEditModal();
        loadAllItems(); // Refresh the list
    } catch (error) {
        console.error('Error updating item:', error);
        alert(`Error: ${error.message}`);
    }
});

// Close modal on outside click
window.onclick = function(event) {
    if (event.target == editItemModal) {
        closeEditModal();
    }
}
