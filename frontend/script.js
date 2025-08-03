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

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.classList.toggle('active', newTheme === 'dark');
  }
});

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
      validateInput(price, v => !isNaN(v) && parseFloat(v) >= 0, document.getElementById('priceError'), 'Enter a valid price');
    }, 300);
  });

  contact.addEventListener('input', () => {
    clearTimeout(contact.debounceTimer);
    contact.debounceTimer = setTimeout(() => {
      validateInput(contact, v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), document.getElementById('contactError'), 'Enter a valid phone or email');
    }, 300);
  });

  category.addEventListener('change', () => {
    validateInput(category, v => v !== '', document.getElementById('categoryError'), 'Select a category');
  });

  image.addEventListener('change', () => {
    validateInput(image, () => image.files.length > 0, document.getElementById('imageError'), 'Select an image');
  });
}

document.addEventListener('DOMContentLoaded', setupValidation);

// Format contact
function formatContact(contact) {
  const trimmed = contact.trim();
  if (/^\d{10}$/.test(trimmed)) return `https://wa.me/91${trimmed}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return `mailto:${trimmed}`;
}

fetch("https://x-marketplace.onrender.com/items")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  })
  .then(data => {
    allItems = Array.isArray(data) ? data : [];
    renderItems(allItems);
  })
  .catch(err => {
    document.getElementById("items-container").innerHTML = `
      <div class="empty-state">
        <h3>Unable to load items</h3>
        <p>Please check your internet connection and try again.</p>
      </div>`;
    showNotification("Failed to load items.", "error");
  });

function renderItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No items found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>`;
    return;
  }

  items.forEach(item => {
    const price = item.price == 0 || item.price.toString().toLowerCase().includes("free") ? "Free" : `₹${item.price}`;
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="image-wrapper">
        <img src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        <div class="price">${price}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn" rel="noopener noreferrer">
          💬 Contact Seller
        </a>
      </div>`;
    container.appendChild(card);
  });
}

function updateActiveFilter(button) {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (button) button.classList.add("active");
}

function showAll() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  renderItems(allItems);
}

function showFree() {
  updateActiveFilter(event.target);
  document.getElementById("categoryFilter").value = "";
  renderItems(allItems.filter(item => item.price == 0 || item.price.toString().toLowerCase().includes("free")));
}

function filterByCategory() {
  const value = document.getElementById("categoryFilter").value;
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  renderItems(value ? allItems.filter(item => item.category?.toLowerCase() === value.toLowerCase()) : allItems);
}

let searchTimeout;
function searchItems() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    renderItems(query ? allItems.filter(item =>
      item.title?.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query)
    ) : allItems);
  }, 300);
}

document.getElementById("item-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title");
  const price = document.getElementById("price");
  const contact = document.getElementById("contact");
  const category = document.getElementById("category");
  const image = document.getElementById("image");
  const submitBtn = document.querySelector(".submit-btn");

  if (
    !validateInput(title, v => v.length >= 3, document.getElementById('titleError'), 'Too short') ||
    !validateInput(price, v => !isNaN(v) && parseFloat(v) >= 0, document.getElementById('priceError'), 'Invalid') ||
    !validateInput(contact, v => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), document.getElementById('contactError'), 'Invalid') ||
    !validateInput(category, v => v !== '', document.getElementById('categoryError'), 'Choose one') ||
    !validateInput(image, () => image.files.length > 0, document.getElementById('imageError'), 'Add one')
  ) return showNotification("Fix form errors", "error");

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<div class="loader"></div> Uploading...`;

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

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    showNotification("✅ Item uploaded successfully!", "success");
    document.getElementById("item-form").reset();
    document.getElementById("preview").style.display = "none";
    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    console.error("Upload error:", err);
    showNotification("❌ Upload failed.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>🚀</span> List Item`;
  }
});

function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("preview");
  const fileInputDisplay = document.querySelector(".file-input-display");

  if (file) {
    if (file.size > 5 * 1024 * 1024) return showNotification("Image < 5MB", "error");
    if (!file.type.startsWith('image/')) return showNotification("Only images", "error");

    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
      fileInputDisplay.innerHTML = `<div class="file-input-icon">✅</div><div class="file-input-text">${file.name}</div>`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = "none";
  }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value) {
      searchInput.value = '';
      searchItems();
      searchInput.blur();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

function openModal(imageUrl) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  modal.style.display = "block";
  modalImg.src = imageUrl;
}

function closeModal() {
  document.getElementById("imageModal").style.display = "none";
}

// Attach click handler after items are rendered
function renderItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h3>No items found</h3></div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="image-wrapper">
        <img src="${item.imageUrl}" alt="${item.title}" onclick="openModal('${item.imageUrl}')" />
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        <div class="price">${item.price == 0 ? 'Free' : `₹${item.price}`}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn">💬 Contact Seller</a>
      </div>
    `;
    container.appendChild(card);
  });
}