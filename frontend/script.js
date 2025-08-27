let allItems = [], currentModalImages = [], currentModalIndex = 0, isLoading = true, searchTimeout;
let itemIdToDelete = null; 

// Notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<span style="font-size: 16px;">${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.contains(notification) && document.body.removeChild(notification), 300);
  }, 4000);
}

// Category change handler
function handleCategoryChange() {
  const category = document.getElementById('category').value;
  const apronFields = document.getElementById('apronFields');
  const apronSize = document.getElementById('apronSize');
  const apronColor = document.getElementById('apronColor');
  
  const isApron = category === 'Aprons';
  apronFields.style.display = isApron ? 'grid' : 'none';
  apronSize.required = apronColor.required = isApron;
  if (!isApron) apronSize.value = apronColor.value = '';
}

// Validation
function validateInput(input, validator, errorElement, errorMessage) {
  const isValid = validator(input.value.trim());
  input.classList.toggle('error', !isValid);
  errorElement.classList.toggle('show', !isValid);
  if (!isValid) errorElement.textContent = errorMessage;
  return isValid;
}

function setupValidation() {
  const validationRules = [
    ['title', v => v.length >= 3, 'Item name must be at least 3 characters'],
    ['price', v => !isNaN(v) && parseFloat(v) >= 0, 'Enter a valid price (0 or greater)'],
    ['contact', v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid 10-digit phone number or email'],
    ['category', v => v !== '', 'Please select a category'],
    ['deleteKey', v => v.length >= 6, 'Delete key must be at least 6 characters']
  ];

  validationRules.forEach(([id, validator, message]) => {
    const element = document.getElementById(id);
    element.addEventListener('input', () => {
      clearTimeout(element.debounceTimer);
      element.debounceTimer = setTimeout(() => {
        validateInput(element, validator, document.getElementById(`${id}Error`), message);
      }, 300);
    });
  });

  document.getElementById('category').addEventListener('change', () => {
    validateInput(document.getElementById('category'), v => v !== '', document.getElementById('categoryError'), 'Please select a category');
  });

  document.getElementById('image').addEventListener('change', () => {
    validateInput(document.getElementById('image'), () => document.getElementById('image').files.length > 0, document.getElementById('imageError'), 'Please select at least one image');
  });
}

// Search functionality
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  document.getElementById('searchClear').style.display = 'none';
  sortItems();
  searchInput.focus();
}

function searchItems() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim();
  
  document.getElementById('searchClear').style.display = query ? 'block' : 'none';
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => sortItems(), 300);
}

// Skeleton loader
function createSkeletonCard() {
  return `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-category"></div><div class="skeleton-title"></div><div class="skeleton-description"></div><div class="skeleton-price"></div><div class="skeleton-button"></div></div></div>`;
}

function showSkeletonLoaders() {
  const container = document.getElementById("items-container");
  container.innerHTML = Array(6).fill(createSkeletonCard()).join('');
}

// Helper functions
const isNewItem = timestamp => Date.now() - (timestamp || 0) < 24 * 60 * 60 * 1000;
const formatContact = contact => {
  const trimmed = contact.trim();
  if (/^\d{10}$/.test(trimmed)) return `https://wa.me/91${trimmed}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return `mailto:${trimmed}`;
};

// Item loading
function loadItems() {
  showSkeletonLoaders();
  updateItemsCount('Loading...');
  
  fetch("https://x-marketplace.onrender.com/items")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(data => {
      isLoading = false;
      allItems = Array.isArray(data) ? data.map(item => ({
        ...item,
        timestamp: item.timestamp || Date.now(),
        images: item.images || [item.imageUrl]
      })) : [];
      
      sortItemsByDate('newest');
      renderItems(allItems);
      updateItemsCount();
    })
    .catch(err => {
      isLoading = false;
      console.error('Error loading items:', err);
      document.getElementById("items-container").innerHTML = `
        <div class="empty-state">
          <h3>Unable to load items</h3>
          <p>Please check your internet connection and try again.</p>
          <button onclick="loadItems()" class="contact-btn" style="max-width: 200px; margin: 16px auto 0;">🔄 Retry</button>
        </div>`;
      updateItemsCount('Error loading');
      showNotification("Failed to load items. Please check your connection.", "error");
    });
}

// Item rendering
function renderItems(items) {
  const container = document.getElementById("items-container");
  
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h3>🔍 No items found</h3><p>Try adjusting your search terms or filters to find what you're looking for.</p></div>`;
    return;
  }

  container.innerHTML = items.map((item, index) => {
    const price = item.price == 0 || item.price.toString().toLowerCase().includes("free") ? "Free" : `₹${item.price}`;
    const isFree = price === "Free";
    const isHighPriced = !isFree && parseFloat(item.price) > 1000;
    const images = item.images || [item.imageUrl];
    const isNew = isNewItem(item.timestamp);
    
    let apronDetails = '';
    if (item.category === 'Aprons' && (item.apronSize || item.apronColor)) {
      apronDetails = `<div class="apron-details">${item.apronSize ? `<span class="apron-detail">Size: ${item.apronSize}</span>` : ''}${item.apronColor ? `<span class="apron-detail">Color: ${item.apronColor}</span>` : ''}</div>`;
    }
    
    const categoryDescriptionHtml = item.categoryDescription ? `<p class="category-description">${item.categoryDescription}</p>` : '';
    
    return `<div class="item-card" style="animation-delay: ${index * 0.1}s">
      ${isNew ? '<div class="new-badge">NEW</div>' : ''}
      <div class="card-actions-top">
        <button class="report-btn" onclick="openReportModal('${item._id}')" aria-label="Report Item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
        <button class="delete-btn" onclick="openDeleteModal('${item._id}')" aria-label="Delete Item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div class="image-wrapper" onclick="openImageModal('${item.title}', ${JSON.stringify(images).replace(/"/g, '&quot;')})">
        <img src="${images[0]}" alt="${item.title}" loading="lazy" />
        <div class="image-zoom-icon">🔍</div>
        <div class="image-hover-message">Click to view images</div>
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        ${categoryDescriptionHtml}
        ${apronDetails}
        <div class="price ${isFree ? 'free' : ''} ${isHighPriced ? 'high-priced' : ''}">${price}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn" rel="noopener noreferrer">💬 Contact Seller</a>
      </div>
    </div>`;
  }).join('');
  
  updateItemsCount(items.length);
}

// Sorting
function sortItems() {
  const sortValue = document.getElementById('sortSelect').value;
  let sortedItems = [...allItems];
  
  if (sortValue === 'newest') sortedItems = sortItemsByDate('newest');
  else if (sortValue === 'oldest') sortedItems = sortItemsByDate('oldest');
  else if (sortValue === 'price-low') sortedItems = sortItemsByPrice('low');
  else if (sortValue === 'price-high') sortedItems = sortItemsByPrice('high');
  
  const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const activeFilter = document.querySelector('.filter-btn.active')?.textContent || '';

  let filteredItems = sortedItems;

  if (searchQuery) {
    filteredItems = filteredItems.filter(item =>
      item.title?.toLowerCase().includes(searchQuery) ||
      item.category?.toLowerCase().includes(searchQuery) ||
      item.categoryDescription?.toLowerCase().includes(searchQuery)
    );
  }

  if (activeFilter === 'Free Items') {
    filteredItems = filteredItems.filter(item =>
      item.price == 0 || item.price.toString().toLowerCase().includes("free")
    );
  } else if (activeFilter === 'Project Stash') {
    filteredItems = filteredItems.filter(item =>
      item.category?.toLowerCase() === 'iot/project components'
    );
  } else if (activeFilter === 'Aprons') {
    filteredItems = filteredItems.filter(item =>
      item.category?.toLowerCase() === 'aprons'
    );
    const sizeSort = document.getElementById('apronSizeSort').value;
    const colorSort = document.getElementById('apronColorSort').value;
    
    if (sizeSort) filteredItems = filteredItems.filter(item => item.apronSize === sizeSort);
    if (colorSort) filteredItems = filteredItems.filter(item => item.apronColor === colorSort);
  }

  if (!activeFilter && categoryFilter) {
    filteredItems = filteredItems.filter(item =>
      item.category?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }
  
  renderItems(filteredItems);
}

function sortItemsByDate(direction) {
  return allItems.sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return direction === 'newest' ? timeB - timeA : timeA - timeB;
  });
}

function sortItemsByPrice(direction) {
  return allItems.sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    return direction === 'low' ? priceA - priceB : priceB - priceA;
  });
}

// Filtering
function updateActiveFilter(button) {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (button) button.classList.add("active");
  
  const apronSubSort = document.getElementById('apronSubSort');
  if (button?.id !== 'apronsFilterBtn') {
    apronSubSort.style.display = 'none';
  } else {
    apronSubSort.style.display = 'flex';
  }
}

function showAll() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  sortItems();
}

function showFree() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  sortItems();
}

function showProjectStash() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  sortItems();
}

function showAprons() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "Aprons";
  sortItems();
}

function filterByCategory() {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  document.getElementById('apronSubSort').style.display = 'none';
  sortItems();
}

// Utility functions
function updateItemsCount(count) {
  const itemsCount = document.getElementById('itemsCount');
  itemsCount.textContent = typeof count === 'string' ? count : `${count} item${count !== 1 ? 's' : ''}`;
}

function scrollToAddItem() {
  document.getElementById('add-item').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleFloatingButton() {
  const floatingBtn = document.getElementById('floatingAddBtn');
  const addItemSection = document.getElementById('add-item');
  const rect = addItemSection.getBoundingClientRect();
  
  floatingBtn.classList.toggle('show', rect.top > window.innerHeight || rect.bottom < 0);
}

// Image modal
function openImageModal(title, images) {
  const modal = document.getElementById('imageModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalThumbnails = document.getElementById('modalThumbnails');
  
  currentModalImages = Array.isArray(images) ? images : [images];
  currentModalIndex = 0;
  
  modalTitle.textContent = title;
  updateModalImage();
  
  if (currentModalImages.length > 1) {
    modalThumbnails.innerHTML = currentModalImages.map((img, index) => 
      `<img src="${img}" class="modal-thumbnail ${index === 0 ? 'active' : ''}" onclick="setModalImage(${index})" alt="Thumbnail ${index + 1}">`
    ).join('');
    modalThumbnails.style.display = 'flex';
  } else {
    modalThumbnails.style.display = 'none';
  }
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

function updateModalImage() {
  const modalImg = document.getElementById('modalImg');
  const modalCounter = document.getElementById('modalCounter');
  const thumbnails = document.querySelectorAll('.modal-thumbnail');
  
  modalImg.src = currentModalImages[currentModalIndex];
  modalCounter.textContent = `${currentModalIndex + 1} / ${currentModalImages.length}`;
  
  thumbnails.forEach((thumb, index) => thumb.classList.toggle('active', index === currentModalIndex));
  
  const prevBtn = document.querySelector('.modal-nav.prev');
  const nextBtn = document.querySelector('.modal-nav.next');
  
  if (currentModalImages.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  } else {
    if (prevBtn) prevBtn.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'flex';
  }
}

function previousImage() {
  currentModalIndex = (currentModalIndex - 1 + currentModalImages.length) % currentModalImages.length;
  updateModalImage();
}

function nextImage() {
  currentModalIndex = (currentModalIndex + 1) % currentModalImages.length;
  updateModalImage();
}

function setModalImage(index) {
  currentModalIndex = index;
  updateModalImage();
}

// Form submission
document.getElementById("item-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const elements = {
    title: document.getElementById("title"), price: document.getElementById("price"),
    contact: document.getElementById("contact"), category: document.getElementById("category"),
    categoryDescription: document.getElementById("categoryDescription"), image: document.getElementById("image"),
    apronSize: document.getElementById("apronSize"), apronColor: document.getElementById("apronColor"),
    deleteKey: document.getElementById("deleteKey")
  };

  const validations = [
    validateInput(elements.title, v => v.length >= 3, document.getElementById('titleError'), 'Item name must be at least 3 characters'),
    validateInput(elements.price, v => !isNaN(v) && parseFloat(v) >= 0, document.getElementById('priceError'), 'Enter a valid price'),
    validateInput(elements.contact, v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), document.getElementById('contactError'), 'Enter valid contact'),
    validateInput(elements.category, v => v !== '', document.getElementById('categoryError'), 'Please select a category'),
    validateInput(elements.image, () => elements.image.files.length > 0, document.getElementById('imageError'), 'Please select at least one image'),
    validateInput(elements.deleteKey, v => v.length >= 6, document.getElementById('deleteKeyError'), 'Delete key must be at least 6 characters')
  ];

  if (elements.category.value === 'Aprons') {
    validations.push(
      validateInput(elements.apronSize, v => v !== '', document.getElementById('apronSizeError'), 'Please select an apron size'),
      validateInput(elements.apronColor, v => v !== '', document.getElementById('apronColorError'), 'Please select an apron color')
    );
  }

  if (!validations.every(Boolean)) {
    showNotification("Please fix the form errors", "error");
    return;
  }

  for (let file of elements.image.files) {
    if (file.size > 5 * 1024 * 1024) { showNotification("Each image must be less than 5MB", "error"); return; }
    if (!file.type.startsWith('image/')) { showNotification("Only image files are allowed", "error"); return; }
  }

  const submitBtn = document.querySelector(".submit-btn");
  submitBtn.disabled = true;
  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML = `<div class="loader"></div> <span>Uploading...</span>`;

  const formData = new FormData();
  formData.append("title", elements.title.value.trim());
  formData.append("price", elements.price.value == 0 ? "Free" : elements.price.value);
  formData.append("contact", elements.contact.value.trim());
  formData.append("category", elements.category.value);
  formData.append("timestamp", Date.now());
  formData.append("deleteKey", elements.deleteKey.value.trim());

  if (elements.categoryDescription.value.trim()) formData.append("categoryDescription", elements.categoryDescription.value.trim());
  if (elements.category.value === 'Aprons') {
    formData.append("apronSize", elements.apronSize.value);
    formData.append("apronColor", elements.apronColor.value);
  }
  for (let i = 0; i < elements.image.files.length; i++) formData.append("images", elements.image.files[i]);

  try {
    const response = await fetch("https://x-marketplace.onrender.com/items", { method: "POST", body: formData });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    showNotification("✨ Item listed successfully!", "success");
    document.getElementById("item-form").reset();
    document.getElementById("image-preview-container").innerHTML = "";
    document.getElementById("apronFields").style.display = "none";
    document.querySelector(".file-input-display").innerHTML = `<div class="file-input-icon">📷</div><div class="file-input-text">Click to upload images</div><div class="file-input-subtext">Support multiple images</div>`;
    setTimeout(() => { loadItems(); document.getElementById('item-list').scrollIntoView({ behavior: 'smooth' }); }, 1500);
  } catch (err) {
    console.error("Upload error:", err);
    showNotification(`❌ Upload failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalContent;
  }
});

// Image preview
function previewImage(event) {
  const files = Array.from(event.target.files);
  const previewContainer = document.getElementById("image-preview-container");
  const fileInputDisplay = document.querySelector(".file-input-display");

  if (files.length === 0) {
    previewContainer.innerHTML = "";
    fileInputDisplay.innerHTML = `<div class="file-input-icon">📷</div><div class="file-input-text">Click to upload images</div><div class="file-input-subtext">Support multiple images</div>`;
    return;
  }
  for (let file of files) {
    if (file.size > 5 * 1024 * 1024) { showNotification("Each image must be less than 5MB", "error"); return; }
    if (!file.type.startsWith('image/')) { showNotification("Only image files are allowed", "error"); return; }
  }
  const fileText = files.length === 1 ? files[0].name : `${files.length} images selected`;
  fileInputDisplay.innerHTML = `<div class="file-input-icon">✅</div><div class="file-input-text">${fileText}</div><div class="file-input-subtext">Click to change selection</div>`;
  previewContainer.innerHTML = "";
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDiv = document.createElement("div");
      previewDiv.className = "image-preview";
      previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview ${index + 1}" /><button type="button" class="image-preview-remove" onclick="removePreviewImage(${index})" title="Remove image">×</button>`;
      previewContainer.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  });
}

function removePreviewImage(index) {
  const imageInput = document.getElementById("image");
  const files = Array.from(imageInput.files);
  const dt = new DataTransfer();
  files.forEach((file, i) => { if (i !== index) dt.items.add(file); });
  imageInput.files = dt.files;
  previewImage({ target: imageInput });
}

// Event listeners
window.addEventListener('scroll', handleFloatingButton);
window.addEventListener('resize', handleFloatingButton);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('imageModal').classList.contains('show')) closeModal();
    else if (document.getElementById('deleteModal').classList.contains('show')) closeDeleteModal();
    else if (document.getElementById('reportModal').classList.contains('show')) closeReportModal();
    else if (document.getElementById('searchInput').value) clearSearch();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('searchInput').focus(); }
  if (document.getElementById('imageModal').classList.contains('show')) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); previousImage(); } 
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
  }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.getElementById('imageModal').addEventListener('click', (e) => { if (e.target.id === 'imageModal') closeModal(); });

// Delete Modal Logic
function openDeleteModal(itemId) {
    itemIdToDelete = itemId;
    const modal = document.getElementById('deleteModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('deleteKeyInput').value = '';
    document.getElementById('deleteKeyModalError').classList.remove('show');
}

function closeDeleteModal() {
    itemIdToDelete = null;
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

document.getElementById('delete-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deleteKeyInput = document.getElementById('deleteKeyInput');
    const deleteKey = deleteKeyInput.value.trim();
    const errorElement = document.getElementById('deleteKeyModalError');

    if (deleteKey.length < 1) {
        errorElement.textContent = 'Please enter a delete key.';
        errorElement.classList.add('show');
        return;
    } else {
        errorElement.classList.remove('show');
    }

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = `<div class="loader"></div> <span>Deleting...</span>`;

    try {
        const response = await fetch(`https://x-marketplace.onrender.com/items/${itemIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteKey })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        showNotification("Item deleted successfully!", "success");
        closeDeleteModal();
        loadItems();
    } catch (err) {
        console.error("Deletion error:", err);
        errorElement.textContent = err.message || "Failed to delete item.";
        errorElement.classList.add('show');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = "Confirm Delete";
    }
});

document.getElementById('deleteModal').addEventListener('click', (e) => { if (e.target.id === 'deleteModal') closeDeleteModal(); });

// Report Modal Logic
function openReportModal(itemId) {
    const modal = document.getElementById('reportModal');
    const title = document.getElementById('reportModalTitle');
    const itemIdInput = document.getElementById('reportItemId');
    
    if (itemId) {
        title.textContent = 'Report Item';
        itemIdInput.value = itemId;
    } else {
        title.textContent = 'Report a Website Issue';
        itemIdInput.value = '';
    }
    
    document.getElementById('reportMessage').value = '';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = document.getElementById('reportItemId').value;
    const message = document.getElementById('reportMessage').value.trim();

    if (!message) {
        showNotification('Please enter a message for your report.', 'error');
        return;
    }

    const endpoint = itemId ? '/report-item' : '/report-issue';
    const body = itemId ? { itemId, message } : { message };

    try {
        const response = await fetch(`https://x-marketplace.onrender.com${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit report');
        }

        showNotification('✅ Report submitted successfully', 'success');
        closeReportModal();
    } catch (err) {
        console.error('Report submission error:', err);
        showNotification(`❌ Error: ${err.message}`, 'error');
    }
});

document.getElementById('reportModal').addEventListener('click', (e) => { if (e.target.id === 'reportModal') closeReportModal(); });


// Mobile pop-up hint logic
function showMobileHint() {
  const hint = document.getElementById('mobileHint');
  let popCount = 0;
  function popHint() {
    if (popCount < 2) {
      hint.classList.add('show');
      setTimeout(() => {
        hint.classList.remove('show');
        popCount++;
        if (popCount < 2) setTimeout(popHint, 5000);
      }, 5000);
    }
  }
  popHint();
}

// --- Main Initializer ---
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', initialTheme);
  themeToggle.classList.toggle('active', initialTheme === 'dark');

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.classList.toggle('active', newTheme === 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeToggle.classList.toggle('active', newTheme === 'dark');
    }
  });
  
  // UPDATED: Delete Key Hint Logic
  const deleteKeyInput = document.getElementById('deleteKey');
  const deleteKeyHint = document.getElementById('deleteKeyHint');

  if (deleteKeyInput && deleteKeyHint) {
      const originalHintText = deleteKeyHint.textContent;

      deleteKeyInput.addEventListener('focus', () => {
          deleteKeyHint.textContent = 'Make sure to remember this key!';
          deleteKeyHint.classList.add('focused');
      });

      deleteKeyInput.addEventListener('blur', () => {
          if (deleteKeyInput.value.trim() === '') {
              deleteKeyHint.textContent = originalHintText;
              deleteKeyHint.classList.remove('focused');
          }
      });
  }

  // Load initial content and setup listeners
  loadItems();
  setupValidation();
  document.getElementById('searchInput').addEventListener('input', searchItems);
  document.getElementById('sortSelect').value = 'newest';
  handleFloatingButton();
  if (window.innerWidth <= 600) showMobileHint();
});

// Error handling
window.addEventListener('error', (e) => {
  console.error('Unhandled error:', e.error);
  showNotification('Something went wrong. Please refresh the page.', 'error');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showNotification('Something went wrong. Please try again.', 'error');
});
