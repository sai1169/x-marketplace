// This script now loads immediately with admin.html and handles its own auth flow.

(function() {
    // --- DOM Element References ---
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const masterKeyInput = document.getElementById('master-key');
    const loginError = document.getElementById('login-error');
    
    const itemsTableBody = document.getElementById('items-table-body');
    const reportsTableBody = document.getElementById('reports-table-body');
    const editItemModal = document.getElementById('editItemModal');
    const editItemForm = document.getElementById('edit-item-form');
    const editItemId = document.getElementById('edit-item-id');
    const editTitle = document.getElementById('edit-title');
    const editPrice = document.getElementById('edit-price');
    const editCategory = document.getElementById('edit-category');
    const editCategoryDescription = document.getElementById('edit-category-description');


    const API_URL = 'https://x-marketplace.onrender.com';
    const API_SECRET_KEY = "S3cr3t_Ap1_K3y_F0r_X_M4rk3tpl4c3";

    // --- Authentication Check ---
    // This function runs on page load to decide whether to show login or the dashboard.
    function checkAuth() {
        const adminKey = sessionStorage.getItem('adminKey');
        if (adminKey) {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            initAdminPanel(); // Initialize the dashboard if logged in
        } else {
            loginSection.style.display = 'block';
            adminDashboard.style.display = 'none';
        }
    }

    // --- Login Logic ---
    // Handles the login form submission.
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
            if (!response.ok) throw new Error(data.message || 'Login failed');

            sessionStorage.setItem('adminKey', key);
            checkAuth(); // Re-run auth check to show the dashboard

        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.add('show');
        }
    });

    // --- Data Loading ---
    async function loadAllItems() {
        try {
            const response = await fetch(`${API_URL}/items`, {
                headers: { 'x-api-secret-key': API_SECRET_KEY }
            });
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
        if (!items || !items.length) {
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
                    <button class="edit-btn" onclick="openEditModal('${item._id}', '${item.title}', '${item.price}', '${item.category}', '${item.categoryDescription || ''}')">Edit</button>
                    <button class="delete-btn-admin" onclick="deleteItem('${item._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function renderReportsTable(reports) {
        if (!reports || !reports.length) {
            reportsTableBody.innerHTML = `<tr><td colspan="3">No reports found.</td></tr>`;
            return;
        }
        reportsTableBody.innerHTML = reports.map(report => {
            const reportContent = report.item
                ? `<div class="report-item-info"><img src="${report.item.images[0]}" alt="${report.item.title}" class="table-item-img"><span>${report.item.title}</span></div>`
                : '<span class="website-report">Website Issue Report</span>';
            return `<tr><td>${report.message}</td><td>${reportContent}</td><td>${new Date(report.timestamp).toLocaleString()}</td></tr>`;
        }).join('');
    }

    // --- Admin Actions ---
    window.deleteItem = async function(itemId) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const response = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-master-key': sessionStorage.getItem('adminKey') 
                },
                body: JSON.stringify({ deleteKey: sessionStorage.getItem('adminKey') })
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete');
            alert('Item deleted!');
            loadAllItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // --- Edit Modal Logic ---
    window.openEditModal = function(id, title, price, category, categoryDescription) {
        editItemId.value = id;
        editTitle.value = title;
        editPrice.value = price;
        editCategory.value = category;
        editCategoryDescription.value = categoryDescription;
        editItemModal.classList.add('show');
    }

    window.closeEditModal = function() {
        editItemModal.classList.remove('show');
    }

    editItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemId = editItemId.value;
        const updatedData = { 
            title: editTitle.value, 
            price: editPrice.value, 
            category: editCategory.value,
            categoryDescription: editCategoryDescription.value 
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
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update');
            alert('Item updated!');
            closeEditModal();
            loadAllItems();
        } catch (error) {
            console.error('Error updating item:', error);
            alert(`Error: ${error.message}`);
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target == editItemModal) closeEditModal();
    });
    
    // --- Initializer ---
    function initAdminPanel() {
        loadAllItems();
        loadAllReports();
    }

    // --- SCRIPT START ---
    // Run the authentication check when the script is first loaded.
    document.addEventListener('DOMContentLoaded', checkAuth);
})();
