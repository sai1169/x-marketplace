// This script is loaded ONLY AFTER successful authentication.
// It assumes 'adminKey' is available in sessionStorage.

(function() {
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
    // ADDED: Secret key for API authentication, matching the main script
    const API_SECRET_KEY = "S3cr3t_Ap1_K3y_F0r_X_M4rk3tpl4c3";

    // --- Data Loading ---
    async function loadAllItems() {
        try {
            // FIXED: This fetch call now uses the 'x-api-secret-key' header for authentication,
            // which is required by the /items endpoint on your server.
            const response = await fetch(`${API_URL}/items`, {
                headers: { 'x-api-secret-key': API_SECRET_KEY }
            });
            if (!response.ok) {
                // This error will be thrown if the server returns a 403 or other non-2xx status
                throw new Error('Failed to fetch items');
            }
            const items = await response.json();
            renderItemsTable(items);
        } catch (error) {
            console.error('Error loading items:', error);
            itemsTableBody.innerHTML = `<tr><td colspan="6">Error loading items. Please check the console.</td></tr>`;
        }
    }

    async function loadAllReports() {
        try {
            // This endpoint correctly uses the master key and remains unchanged.
            const response = await fetch(`${API_URL}/reports`, {
                headers: { 'x-master-key': sessionStorage.getItem('adminKey') }
            });
            if (!response.ok) throw new Error('Failed to fetch reports');
            const reports = await response.json();
            renderReportsTable(reports);
        } catch (error)
        {
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
                    <button class="edit-btn" onclick="openEditModal('${item._id}', '${item.title}', '${item.price}', '${item.category}')">Edit</button>
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

            return `
                <tr>
                    <td>${report.message}</td>
                    <td>${reportContent}</td>
                    <td>${new Date(report.timestamp).toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    }

    // --- Admin Actions ---
    async function deleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this item? This action is permanent.')) return;

        try {
            // FIXED: The delete endpoint also requires authentication. Added the secret key header.
            const response = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-secret-key': API_SECRET_KEY 
                },
                body: JSON.stringify({ deleteKey: sessionStorage.getItem('adminKey') })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete item');
            }
            alert('Item deleted successfully!');
            loadAllItems();
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
            // This endpoint correctly uses the master key and remains unchanged.
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
            loadAllItems();
        } catch (error) {
            console.error('Error updating item:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Make functions globally available so onclick attributes can find them
    window.openEditModal = openEditModal;
    window.closeEditModal = closeEditModal;
    window.deleteItem = deleteItem;

    // Close modal on outside click
    window.addEventListener('click', function(event) {
        if (event.target == editItemModal) {
            closeEditModal();
        }
    });

    // --- Initializer ---
    function initAdminPanel() {
        loadAllItems();
        loadAllReports();
    }

    initAdminPanel();
})();
