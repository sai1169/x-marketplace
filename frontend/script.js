let allItems = [];

// Fetch items from the backend
fetch("https://x-marketplace.onrender.com/items")
  .then(response => response.json())
  .then(items => {
    allItems = items;
    renderItems(allItems);
  })
  .catch(error => {
    console.error("❌ Failed to fetch items:", error);
    document.getElementById("items-container").innerHTML = `
      <div class="empty-state">
        <h3>Unable to load items</h3>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  });

// Render items to the page
function renderItems(items) {
  const container = document.getElementById("items-container");
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No items found</h3>
        <p>Try adjusting your search or filters, or be the first to add an item!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" loading="lazy"/>` : ''}
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        <div class="price">${item.price}</div>
        <a href="${item.contact}" target="_blank" class="contact-btn" rel="noopener noreferrer">
          💬 Contact Seller
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Handle form submission
document.getElementById("item-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '⏳ Uploading...';
  submitBtn.disabled = true;

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("contact", document.getElementById("contact").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("image", document.getElementById("image").files[0]);

  fetch("https://x-marketplace.onrender.com/items", {
    method: "POST",
    body: formData,
  })
    .then(res => res.json())
    .then(data => {
      alert("✅ Item uploaded successfully!");
      document.getElementById("item-form").reset();
      document.getElementById("preview").style.display = "none";
      window.location.reload();
    })
    .catch(err => {
      console.error("❌ Upload failed:", err);
      alert("❌ Upload failed. Please try again.");
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
});

// Filter functions
function showAll() {
  updateActiveFilter(event.target);
  renderItems(allItems);
}

function showFree() {
  updateActiveFilter(event.target);
  const freeItems = allItems.filter(item =>
    item.price.toLowerCase().includes("free")
  );
  renderItems(freeItems);
}

function showUnder200() {
  updateActiveFilter(event.target);
  const filtered = allItems.filter(item => {
    const num = parseInt(item.price.replace(/[^0-9]/g, ""));
    return !isNaN(num) && num <= 200;
  });
  renderItems(filtered);
}

function searchItems() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allItems.filter(item =>
    item.title.toLowerCase().includes(query) ||
    (item.category && item.category.toLowerCase().includes(query))
  );
  renderItems(filtered);
}

function filterByCategory() {
  const selected = document.getElementById("categoryFilter").value;
  if (!selected) {
    renderItems(allItems);
    return;
  }

  const filtered = allItems.filter(item =>
    item.category && item.category.toLowerCase() === selected.toLowerCase()
  );
  renderItems(filtered);
}

function updateActiveFilter(activeButton) {
  // Remove active class from all filter buttons
  document.querySelectorAll('#filters button').forEach(btn => 
    btn.classList.remove('active')
  );
  // Add active class to clicked button
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

function previewImage(event) {
  const preview = document.getElementById("preview");
  const file = event.target.files[0];
  
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
}

// Add smooth scroll behavior for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});