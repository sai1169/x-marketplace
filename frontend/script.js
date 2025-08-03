let allItems = [];

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

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.classList.toggle('active', newTheme === 'dark');
  }
});

// Notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Enhanced input validation with real-time feedback
function validateInput(input, validator, errorElement, errorMessage) {
  const isValid = validator(input.value.trim());
  input.classList.toggle('error', !isValid);
  errorElement.classList.toggle('show', !isValid);
  if (!isValid) {
    errorElement.textContent = errorMessage;
  }
  return isValid;
}

function setupValidation() {
  const title = document.getElementById('title');
  const price = document.getElementById('price');
  const contact = document.getElementById('contact');
  const category = document.getElementById('category');
  const image = document.getElementById('image');

  // Title validation
  title.addEventListener('input', () => {
    clearTimeout(title.debounceTimer);
    title.debounceTimer = setTimeout(() => {
      validateInput(
        title,
        value => value.length >= 3,
        document.getElementById('titleError'),
        'Item name must be at least 3 characters long'
      );
    }, 300);
  });

  title.addEventListener('blur', () => {
    validateInput(
      title,
      value => value.length >= 3,
      document.getElementById('titleError'),
      'Item name must be at least 3 characters long'
    );
  });

  // Price validation
  price.addEventListener('input', () => {
    clearTimeout(price.debounceTimer);
    price.debounceTimer = setTimeout(() => {
      validateInput(
        price,
        value => !isNaN(value) && parseFloat(value) >= 0,
        document.getElementById('priceError'),
        'Please enter a valid price (0 or higher)'
      );
    }, 300);
  });

  price.addEventListener('blur', () => {
    validateInput(
      price,
      value => !isNaN(value) && parseFloat(value) >= 0,
      document.getElementById('priceError'),
      'Please enter a valid price (0 or higher)'
    );
  });

  // Contact validation
  contact.addEventListener('input', () => {
    clearTimeout(contact.debounceTimer);
    contact.debounceTimer = setTimeout(() => {
      validateInput(
        contact,
        value => /^\d{10}$/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        document.getElementById('contactError'),
        'Please enter a valid 10-digit phone number or email address'
      );
    }, 500);
  });

  contact.addEventListener('blur', () => {
    validateInput(
      contact,
      value => /^\d{10}$/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      document.getElementById('contactError'),
      'Please enter a valid 10-digit phone number or email address'
    );
  });

  // Category validation
  category.addEventListener('change', () => {
    validateInput(
      category,
      value => value !== '',
      document.getElementById('categoryError'),
      'Please select a category'
    );
  });

  // Image validation
  image.addEventListener('change', () => {
    validateInput(
      image,
      () => image.files.length > 0,
      document.getElementById('imageError'),
      'Please select an image file'
    );
  });
}

// Initialize validation on page load
document.addEventListener('DOMContentLoaded', setupValidation);

// Fetch and render items with enhanced error handling
fetch("https://x-marketplace.onrender.com/items")
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    allItems = Array.isArray(data) ? data : [];
    renderItems(allItems);
  })
  .catch(err => {
    console.error("❌ Fetch error:", err);
    document.getElementById("items-container").innerHTML = `
      <div class="empty-state">
        <h3>Unable to load items</h3>
        <p>Please check your internet connection and try again.</p>
      </div>
    `;
    showNotification("Failed to load items. Please refresh the page.", "error");
  });

// Enhanced item rendering with better image handling
function renderItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  if (!items || !items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No items found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    
    const priceClass = (item.price == 0 || item.price.toString().toLowerCase().includes("free")) ? "free" : "";
    const priceText = (item.price == 0 || item.price.toString().toLowerCase().includes("free")) ? "Free" : `₹${item.price}`;
    
    card.innerHTML = `
      ${item.imageUrl ? `
        <div class="item-image-container">
          <img src="${item.imageUrl}" alt="${item.title}" class="item-image" loading="lazy" />
        </div>
      ` : ""}
      <div class="item-content">
        <div class="item-category">${item.category || "Other"}</div>
        <h3 class="item-title">${item.title}</h3>
        <div class="item-price ${priceClass}">${priceText}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn">Contact Seller</a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Enhanced contact formatting
function formatContact(contact) {
  const trimmedContact = contact.trim();
  
  // Check if it's a 10-digit phone number
  if (/^\d{10}$/.test(trimmedContact)) {
    return `https://wa.me/91${trimmedContact}`;
  }
  
  // Check if it's an email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
    return `mailto:${trimmedContact}`;
  }
  
  // Fallback to mailto if format is unclear
  return `mailto:${trimmedContact}`;
}

// Enhanced filter functions with active state management
function updateActiveFilter(clickedButton) {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  if (clickedButton) {
    clickedButton.classList.add("active");
  }
}

function showAll() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  renderItems(allItems);
}

function showFree() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  const freeItems = allItems.filter(item => 
    item.price == 0 || 
    item.price.toString().toLowerCase().includes("free")
  );
  renderItems(freeItems);
}

function filterByCategory() {
  const value = document.getElementById("categoryFilter").value;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  
  if (value) {
    const filteredItems = allItems.filter(item => 
      item.category && item.category.toLowerCase() === value.toLowerCase()
    );
    renderItems(filteredItems);
  } else {
    renderItems(allItems);
    document.querySelector(".filter-btn").classList.add("active");
  }
}

// Enhanced search with debouncing
let searchTimeout;
function searchItems() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    
    if (!query) {
      renderItems(allItems);
      return;
    }
    
    const filteredItems = allItems.filter(item =>
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
    
    renderItems(filteredItems);
  }, 300);
}

// Enhanced form submission with better validation and feedback
document.getElementById("item-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title");
  const price = document.getElementById("price");
  const contact = document.getElementById("contact");
  const category = document.getElementById("category");
  const image = document.getElementById("image");
  const submitBtn = document.querySelector(".submit-btn");

  // Validate all fields
  const titleValid = validateInput(
    title,
    value => value.trim().length >= 3,
    document.getElementById('titleError'),
    'Item name must be at least 3 characters long'
  );

  const priceValid = validateInput(
    price,
    value => !isNaN(value) && parseFloat(value) >= 0,
    document.getElementById('priceError'),
    'Please enter a valid price (0 or higher)'
  );

  const contactValid = validateInput(
    contact,
    value => /^\d{10}$/.test(value.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    document.getElementById('contactError'),
    'Please enter a valid 10-digit phone number or email address'
  );

  const categoryValid = validateInput(
    category,
    value => value !== '',
    document.getElementById('categoryError'),
    'Please select a category'
  );

  const imageValid = validateInput(
    image,
    () => image.files.length > 0,
    document.getElementById('imageError'),
    'Please select an image file'
  );

  if (!titleValid || !priceValid || !contactValid || !categoryValid || !imageValid) {
    showNotification("Please fix the errors above", "error");
    return;
  }

  // Disable submit button and show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <div style="width: 20px; height: 20px; border: 2px solid transparent; border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    Uploading...
  `;

  const formData = new FormData();
  formData.append("title", title.value.trim());
  formData.append("price", price.value == 0 ? "Free" : `₹${price.value}`);
  formData.append("contact", contact.value.trim());
  formData.append("category", category.value);
  formData.append("image", image.files[0]);

  try {
    const response = await fetch("https://x-marketplace.onrender.com/items", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    showNotification("✅ Item uploaded successfully!", "success");
    
    // Reset form
    document.getElementById("item-form").reset();
    document.getElementById("preview").style.display = "none";
    document.querySelector(".file-input-display").innerHTML = `
      <div class="file-input-icon">📷</div>
      <div class="file-input-text">Click to upload image</div>
    `;
    
    // Clear validation states
    document.querySelectorAll(".form-input, .form-select").forEach(input => {
      input.classList.remove("error");
    });
    document.querySelectorAll(".error-message").forEach(error => {
      error.classList.remove("show");
    });
    
    // Refresh items list
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (err) {
    console.error("Upload error:", err);
    showNotification("❌ Upload failed. Please try again.", "error");
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>🚀</span> List Item`;
  }
});

// Enhanced image preview with better UX
function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("preview");
  const fileInputDisplay = document.querySelector(".file-input-display");
  
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size must be less than 5MB", "error");
      event.target.value = "";
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification("Please select a valid image file", "error");
      event.target.value = "";
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      
      // Update file input display
      fileInputDisplay.innerHTML = `
        <div class="file-input-icon">✅</div>
        <div class="file-input-text">Image selected: ${file.name}</div>
      `;
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = "none";
    fileInputDisplay.innerHTML = `
      <div class="file-input-icon">📷</div>
      <div class="file-input-text">Click to upload image</div>
    `;
  }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
  // Escape key to clear search
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value) {
      searchInput.value = '';
      searchItems();
      searchInput.blur();
    }
  }
  
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});