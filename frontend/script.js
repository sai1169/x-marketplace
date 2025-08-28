let allItems = [], currentModalImages = [], currentModalIndex = 0, isLoading = true, searchTimeout;
let itemIdToDelete = null; 
let itemRecaptchaWidgetId;
let reportRecaptchaWidgetId;

const API_SECRET_KEY = "S3cr3t_Ap1_K3y_F0r_X_M4rk3tpl4c3"; 

// --- reCAPTCHA Functions ---
function renderRecaptchas() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const recaptchaOptions = {
        'sitekey': '6LeV7rQrAAAAAG8MlhVS23bGvrG7Qq0W7oJhg9jY',
        'theme': currentTheme,
    };

    const itemRecaptchaContainer = document.getElementById('g-recaptcha-item');
    if (itemRecaptchaContainer) {
        itemRecaptchaContainer.innerHTML = ''; 
        itemRecaptchaWidgetId = grecaptcha.render('g-recaptcha-item', {
            ...recaptchaOptions,
            'callback': () => document.getElementById('submitItemBtn').disabled = false,
            'expired-callback': () => document.getElementById('submitItemBtn').disabled = true
        });
    }

    const reportRecaptchaContainer = document.getElementById('g-recaptcha-report');
    if (reportRecaptchaContainer) {
        reportRecaptchaContainer.innerHTML = '';
        reportRecaptchaWidgetId = grecaptcha.render('g-recaptcha-report', {
            ...recaptchaOptions,
            'callback': () => document.getElementById('submitReportBtn').disabled = false,
            'expired-callback': () => document.getElementById('submitReportBtn').disabled = true
        });
    }
}

function onloadRecaptchaCallback() {
    renderRecaptchas();
}

// --- Notification system ---
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

// --- Form and UI Logic ---
function handleCategoryChange() {
  const category = document.getElementById('category').value;
  const apronFields = document.getElementById('apronFields');
  const isApron = category === 'Aprons';
  apronFields.style.display = isApron ? 'grid' : 'none';
  document.getElementById('apronSize').required = isApron;
  document.getElementById('apronColor').required = isApron;
}

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
      validateInput(element, validator, document.getElementById(`${id}Error`), message);
    });
  });
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  document.getElementById('searchClear').style.display = 'none';
  sortItems();
  searchInput.focus();
}

function searchItems() {
  const searchInput = document.getElementById('searchInput');
  document.getElementById('searchClear').style.display = searchInput.value.trim() ? 'block' : 'none';
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => sortItems(), 300);
}

// --- Data Loading and Rendering ---
function createSkeletonCard() {
  return `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-category"></div><div class="skeleton-title"></div><div class="skeleton-description"></div><div class="skeleton-price"></div><div class="skeleton-button"></div></div></div>`;
}

function showSkeletonLoaders() {
  const container = document.getElementById("items-container");
  container.innerHTML = Array(6).fill(createSkeletonCard()).join('');
}

function loadItems() {
  showSkeletonLoaders();
  updateItemsCount('Loading...');
  
  fetch("https://x-marketplace.onrender.com/items", {
    headers: { 'x-api-secret-key': API_SECRET_KEY }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(data => {
      isLoading = false;
      allItems = Array.isArray(data) ? data.map(item => ({ ...item, timestamp: item.timestamp || Date.now() })) : [];
      sortItems();
    })
    .catch(err => {
      isLoading = false;
      console.error('Error loading items:', err);
      document.getElementById("items-container").innerHTML = `<div class="empty-state"><h3>Unable to load items</h3><p>Please check your internet connection and try again.</p><button onclick="loadItems()" class="contact-btn" style="max-width: 200px; margin: 16px auto 0;">🔄 Retry</button></div>`;
      updateItemsCount('Error');
    });
}

function renderItems(items) {
  const container = document.getElementById("items-container");
  updateItemsCount(items.length);

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h3>🔍 No items found</h3><p>Try adjusting your search terms or filters.</p></div>`;
    return;
  }

  container.innerHTML = items.map((item, index) => {
    const price = item.price == 0 || item.price.toString().toLowerCase().includes("free") ? "Free" : `₹${item.price}`;
    const isNew = (Date.now() - (item.timestamp || 0)) < 24 * 60 * 60 * 1000;
    
    let apronDetails = '';
    if (item.category === 'Aprons' && (item.apronSize || item.apronColor)) {
      apronDetails = `<div class="apron-details">${item.apronSize ? `<span class="apron-detail">Size: ${item.apronSize}</span>` : ''}${item.apronColor ? `<span class="apron-detail">Color: ${item.apronColor}</span>` : ''}</div>`;
    }
    
    return `<div class="item-card" style="animation-delay: ${index * 0.05}s">
      ${isNew ? '<div class="new-badge">NEW</div>' : ''}
      <div class="card-actions-top">
        <button class="report-btn" onclick="openReportModal('${item._id}')" aria-label="Report Item">⚠️</button>
        <button class="delete-btn" onclick="openDeleteModal('${item._id}')" aria-label="Delete Item">🗑️</button>
      </div>
      <div class="image-wrapper" onclick="openImageModal('${item.title}', ${JSON.stringify(item.images).replace(/"/g, '&quot;')})">
        <img src="${item.images[0]}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        ${item.categoryDescription ? `<p class="category-description">${item.categoryDescription}</p>` : ''}
        ${apronDetails}
        <div class="price ${price === 'Free' ? 'free' : ''}">${price}</div>
        <a href="${/^\d{10}$/.test(item.contact.trim()) ? `https://wa.me/91${item.contact.trim()}` : `mailto:${item.contact.trim()}`}" target="_blank" class="contact-btn" rel="noopener noreferrer">💬 Contact Seller</a>
      </div>
    </div>`;
  }).join('');
}

// --- Sorting and Filtering ---
function sortItems() {
  const sortValue = document.getElementById('sortSelect').value;
  let sortedItems = [...allItems];
  
  if (sortValue === 'newest') sortedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  else if (sortValue === 'oldest') sortedItems.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  else if (sortValue === 'price-low') sortedItems.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  else if (sortValue === 'price-high') sortedItems.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  
  const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
  let filteredItems = sortedItems.filter(item => 
    !searchQuery || 
    item.title?.toLowerCase().includes(searchQuery) ||
    item.category?.toLowerCase().includes(searchQuery) ||
    item.categoryDescription?.toLowerCase().includes(searchQuery)
  );
  
  renderItems(filteredItems);
}

// --- Utility and Event Handlers ---
function updateItemsCount(count) {
  const itemsCount = document.getElementById('itemsCount');
  itemsCount.textContent = typeof count === 'string' ? count : `${count} item${count !== 1 ? 's' : ''}`;
}

function scrollToAddItem() {
  document.getElementById('add-item').scrollIntoView({ behavior: 'smooth' });
}

// --- Main Initializer ---
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', initialTheme);
  themeToggle.classList.toggle('active', initialTheme === 'dark');

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.classList.toggle('active', newTheme === 'dark');
    
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        renderRecaptchas();
    }
  });

  loadItems();
  setupValidation();
  document.getElementById('searchInput').addEventListener('input', searchItems);
  document.getElementById('floatingAddBtn').addEventListener('click', scrollToAddItem);
});
