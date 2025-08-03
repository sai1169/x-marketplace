let allItems = [];
let currentModalImages = [];
let currentModalIndex = 0;
let isLoading = true;

// Theme management with system preference detection
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

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

// Enhanced notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icon = type === 'success' ? '✅' : '❌';
  notification.innerHTML = `
    <span style="font-size: 16px;">${icon}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Enhanced validation with debouncing
function validateInput(input, validator, errorElement, errorMessage) {
  const isValid = validator(input.value.trim());
  input.classList.toggle('error', !isValid);
  errorElement.classList.toggle('show', !isValid);
  if (!isValid) errorElement.textContent = errorMessage;
  return isValid;
}

function setupValidation() {
  const title = document.getElementById('title');
  const price = document.getElementById('price');
  const contact = document.getElementById('contact');
  const category = document.getElementById('category');
  const image = document.getElementById('image');

  title.addEventListener('input', () => {
    clearTimeout(title.debounceTimer);
    title.debounceTimer = setTimeout(() => {
      validateInput(title, v => v.length >= 3, document.getElementById('titleError'), 'Item name must be at least 3 characters');
    }, 300);
  });

  price.addEventListener('input', () => {
    clearTimeout(price.debounceTimer);
    price.debounceTimer = setTimeout(() => {
      validateInput(price, v => !isNaN(v) && parseFloat(v) >= 0, document.getElementById('priceError'), 'Enter a valid price (0 or greater)');
    }, 300);
  });

  contact.addEventListener('input', () => {
    clearTimeout(contact.debounceTimer);
    contact.debounceTimer = setTimeout(() => {
      validateInput(contact, v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), document.getElementById('contactError'), 'Enter a valid 10-digit phone number or email');
    }, 300);
  });

  category.addEventListener('change', () => {
    validateInput(category, v => v !== '', document.getElementById('categoryError'), 'Please select a category');
  });

  image.addEventListener('change', () => {
    validateInput(image, () => image.files.length > 0, document.getElementById('imageError'), 'Please select at least one image');
  });
}

document.addEventListener('DOMContentLoaded', setupValidation);

// Enhanced search functionality
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchItems();
  searchInput.focus();
}

// Skeleton loader generation
function createSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-category"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-price"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `;
}

function showSkeletonLoaders() {
  const container = document.getElementById("items-container");
  const skeletonCount = 6; // Show 6 skeleton cards
  container.innerHTML = '';
  
  for (let i = 0; i < skeletonCount; i++) {
    container.innerHTML += createSkeletonCard();
  }
}

// Enhanced item loading
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
        images: item.images || [item.imageUrl] // Support multiple images
      })) : [];
      
      // Sort by newest first by default
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
          <button onclick="loadItems()" class="contact-btn" style="max-width: 200px; margin: 16px auto 0;">
            🔄 Retry
          </button>
        </div>`;
      updateItemsCount('Error loading');
      showNotification("Failed to load items. Please check your connection.", "error");
    });
}

// Enhanced item rendering
function renderItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>🔍 No items found</h3>
        <p>Try adjusting your search terms or filters to find what you're looking for.</p>
      </div>`;
    return;
  }

  items.forEach((item, index) => {
    const price = item.price == 0 || item.price.toString().toLowerCase().includes("free") ? "Free" : `₹${item.price}`;
    const isFree = price === "Free";
    const images = item.images || [item.imageUrl];
    const primaryImage = images[0];
    
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="image-wrapper" onclick="openImageModal('${item.title}', ${JSON.stringify(images).replace(/"/g, '&quot;')})">
        <img src="${primaryImage}" alt="${item.title}" loading="lazy" />
        <div class="image-zoom-icon">🔍</div>
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        <div class="price ${isFree ? 'free' : ''}">${price}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn" rel="noopener noreferrer">
          💬 Contact Seller
        </a>
      </div>`;
    
    // Add staggered animation
    card.style.animationDelay = `${index * 0.1}s`;
    container.appendChild(card);
  });
  
  updateItemsCount(items.length);
}

// Enhanced sorting functionality
function sortItems() {
  const sortValue = document.getElementById('sortSelect').value;
  let sortedItems = [...allItems];
  
  switch (sortValue) {
    case 'newest':
      sortedItems = sortItemsByDate('newest');
      break;
    case 'oldest':
      sortedItems = sortItemsByDate('oldest');
      break;
    case 'price-low':
      sortedItems = sortItemsByPrice('low');
      break;
    case 'price-high':
      sortedItems = sortItemsByPrice('high');
      break;
  }
  
  // Apply current filters to sorted items
  const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const activeFilter = document.querySelector('.filter-btn.active').textContent;
  
  let filteredItems = sortedItems;
  
  if (searchQuery) {
    filteredItems = filteredItems.filter(item =>
      item.title?.toLowerCase().includes(searchQuery) || 
      item.category?.toLowerCase().includes(searchQuery)
    );
  }
  
  if (categoryFilter) {
    filteredItems = filteredItems.filter(item => 
      item.category?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }
  
  if (activeFilter === 'Free Items') {
    filteredItems = filteredItems.filter(item => 
      item.price == 0 || item.price.toString().toLowerCase().includes("free")
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

// Enhanced filtering
function updateActiveFilter(button) {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (button) button.classList.add("active");
}

function showAll() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  sortItems(); // Apply current sort
}

function showFree() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  sortItems(); // Apply current sort
}

function filterByCategory() {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  sortItems(); // Apply current sort
}

// Enhanced search with real-time updates
let searchTimeout;
function searchItems() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const query = searchInput.value.trim();
  
  // Show/hide clear button
  searchClear.style.display = query ? 'block' : 'none';
  
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    sortItems(); // This will apply search filter along with current sort
  }, 300);
}

// Items count update
function updateItemsCount(count) {
  const itemsCount = document.getElementById('itemsCount');
  if (typeof count === 'string') {
    itemsCount.textContent = count;
  } else {
    itemsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
}

// Format contact information
function formatContact(contact) {
  const trimmed = contact.trim();
  if (/^\d{10}$/.test(trimmed)) return `https://wa.me/91${trimmed}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return `mailto:${trimmed}`;
}

// Enhanced image modal functionality
function openImageModal(title, images) {
  const modal = document.getElementById('imageModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalImg = document.getElementById('modalImg');
  const modalCounter = document.getElementById('modalCounter');
  const modalThumbnails = document.getElementById('modalThumbnails');
  
  currentModalImages = Array.isArray(images) ? images : [images];
  currentModalIndex = 0;
  
  modalTitle.textContent = title;
  updateModalImage();
  
  // Create thumbnails if multiple images
  if (currentModalImages.length > 1) {
    modalThumbnails.innerHTML = currentModalImages.map((img, index) => 
      `<img src="${img}" class="modal-thumbnail ${index === 0 ? 'active' : ''}" onclick="setModalImage(${index})" alt="Thumbnail ${index + 1}">`
    ).join('');
    modalThumbnails.style.display = 'flex';
  } else {
    modalThumbnails.style.display = 'none';
  }
  
  modal.classList.add('show');
  modal.style.display = 'flex';
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }, 300);
}

function updateModalImage() {
  const modalImg = document.getElementById('modalImg');
  const modalCounter = document.getElementById('modalCounter');
  const thumbnails = document.querySelectorAll('.modal-thumbnail');
  
  modalImg.src = currentModalImages[currentModalIndex];
  modalCounter.textContent = `${currentModalIndex + 1} / ${currentModalImages.length}`;
  
  // Update active thumbnail
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentModalIndex);
  });
  
  // Show/hide navigation buttons
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
  if (currentModalIndex > 0) {
    currentModalIndex--;
    updateModalImage();
  }
}

function nextImage() {
  if (currentModalIndex < currentModalImages.length - 1) {
    currentModalIndex++;
    updateModalImage();
  }
}

function setModalImage(index) {
  currentModalIndex = index;
  updateModalImage();
}

// Enhanced form submission with multiple image support
document.getElementById("item-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title");
  const price = document.getElementById("price");
  const contact = document.getElementById("contact");
  const category = document.getElementById("category");
  const image = document.getElementById("image");
  const submitBtn = document.querySelector(".submit-btn");

  // Validate all fields
  const validations = [
    validateInput(title, v => v.length >= 3, document.getElementById('titleError'), 'Item name must be at least 3 characters'),
    validateInput(price, v => !isNaN(v) && parseFloat(v) >= 0, document.getElementById('priceError'), 'Enter a valid price (0 or greater)'),
    validateInput(contact, v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), document.getElementById('contactError'), 'Enter a valid 10-digit phone number or email'),
    validateInput(category, v => v !== '', document.getElementById('categoryError'), 'Please select a category'),
    validateInput(image, () => image.files.length > 0, document.getElementById('imageError'), 'Please select at least one image')
  ];

  if (!validations.every(Boolean)) {
    showNotification("Please fix the form errors before submitting", "error");
    return;
  }

  // Check file sizes
  for (let file of image.files) {
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Each image must be less than 5MB", "error");
      return;
    }
    if (!file.type.startsWith('image/')) {
      showNotification("Only image files are allowed", "error");
      return;
    }
  }

  // Update button state
  submitBtn.disabled = true;
  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML = `<div class="loader"></div> <span>Uploading...</span>`;

  const formData = new FormData();
  formData.append("title", title.value.trim());
  formData.append("price", price.value == 0 ? "Free" : `₹${price.value}`);
  formData.append("contact", contact.value.trim());
  formData.append("category", category.value);
  formData.append("timestamp", Date.now());

  // Add all selected images
  for (let i = 0; i < image.files.length; i++) {
    formData.append("images", image.files[i]);
  }

  try {
    const response = await fetch("https://x-marketplace.onrender.com/items", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    showNotification("✨ Item listed successfully! It will appear shortly.", "success");
    
    // Reset form
    document.getElementById("item-form").reset();
    document.getElementById("imagePreviewContainer").innerHTML = "";
    document.querySelector(".file-input-display").innerHTML = `
      <div class="file-input-icon">📷</div>
      <div class="file-input-text">Click to upload images</div>
      <div class="file-input-subtext">Support multiple images</div>
    `;
    
    // Reload items after a short delay
    setTimeout(() => {
      loadItems();
      // Scroll to items section
      document.getElementById('item-list').scrollIntoView({ behavior: 'smooth' });
    }, 1500);
    
  } catch (err) {
    console.error("Upload error:", err);
    showNotification(`❌ Upload failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalContent;
  }
});

// Enhanced image preview with multiple image support
function previewImage(event) {
  const files = Array.from(event.target.files);
  const previewContainer = document.getElementById("imagePreviewContainer");
  const fileInputDisplay = document.querySelector(".file-input-display");

  if (files.length === 0) {
    previewContainer.innerHTML = "";
    fileInputDisplay.innerHTML = `
      <div class="file-input-icon">📷</div>
      <div class="file-input-text">Click to upload images</div>
      <div class="file-input-subtext">Support multiple images</div>
    `;
    return;
  }

  // Validate files
  for (let file of files) {
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Each image must be less than 5MB", "error");
      return;
    }
    if (!file.type.startsWith('image/')) {
      showNotification("Only image files are allowed", "error");
      return;
    }
  }

  // Update file input display
  const fileText = files.length === 1 ? files[0].name : `${files.length} images selected`;
  fileInputDisplay.innerHTML = `
    <div class="file-input-icon">✅</div>
    <div class="file-input-text">${fileText}</div>
    <div class="file-input-subtext">Click to change selection</div>
  `;

  // Create previews
  previewContainer.innerHTML = "";
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDiv = document.createElement("div");
      previewDiv.className = "image-preview";
      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}" />
        <button type="button" class="image-preview-remove" onclick="removePreviewImage(${index})" title="Remove image">×</button>
      `;
      previewContainer.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  });
}

function removePreviewImage(index) {
  const imageInput = document.getElementById("image");
  const files = Array.from(imageInput.files);
  
  // Create new FileList without the removed file
  const dt = new DataTransfer();
  files.forEach((file, i) => {
    if (i !== index) dt.items.add(file);
  });
  
  imageInput.files = dt.files;
  
  // Trigger preview update
  previewImage({ target: imageInput });
}

// Keyboard shortcuts and accessibility
document.addEventListener('keydown', (e) => {
  // Escape key closes modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('imageModal');
    if (modal.classList.contains('show')) {
      closeModal();
      return;
    }
    
    // Clear search on Escape
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value) {
      clearSearch();
    }
  }
  
  // Ctrl/Cmd + K focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  
  // Arrow keys for modal navigation
  if (document.getElementById('imageModal').classList.contains('show')) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      previousImage();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextImage();
    }
  }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Click outside modal to close
document.getElementById('imageModal').addEventListener('click', (e) => {
  if (e.target.id === 'imageModal') {
    closeModal();
  }
});

// Enhanced loading on page load
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  
  // Add loading state to search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', searchItems);
  
  // Initialize sort dropdown
  document.getElementById('sortSelect').value = 'newest';
});

// Performance optimization: Intersection Observer for lazy loading
const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    }
  });
}, observerOptions);

// Service Worker registration for caching (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Error boundary for unhandled errors
window.addEventListener('error', (e) => {
  console.error('Unhandled error:', e.error);
  showNotification('Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showNotification('Something went wrong. Please try again.', 'error');
});

const category = document.getElementById('category');
const apronOptions = document.getElementById('apronOptions');

category.addEventListener('change', () => {
  if (category.value === 'Aprons') {
    apronOptions.style.display = 'block';
  } else {
    apronOptions.style.display = 'none';
  }
});

if (category.value === 'Aprons') {
  const apronSize = document.getElementById("apronSize");
  const apronColor = document.getElementById("apronColor");

  const sizeValid = validateInput(apronSize, v => v !== '', document.getElementById('apronSizeError'), 'Please select a size');
  const colorValid = validateInput(apronColor, v => v !== '', document.getElementById('apronColorError'), 'Please select a color');

  if (!sizeValid || !colorValid) {
    showNotification("Please fill size and color for aprons", "error");
    return;
  }

  formData.append("apronSize", apronSize.value);
  formData.append("apronColor", apronColor.value);
}