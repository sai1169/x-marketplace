let allItems = [];

// Theme toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");
  const isDark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark", isDark);
  toggle.checked = isDark;

  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
});

// Fetch and render
fetch("https://x-marketplace.onrender.com/items")
  .then(res => res.json())
  .then(data => {
    allItems = data;
    renderItems(allItems);
  })
  .catch(err => {
    console.error("❌ Fetch error:", err);
    document.getElementById("items-container").innerHTML = `<div class="empty-state"><h3>Unable to load items</h3></div>`;
  });

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
      ${item.imageUrl ? `<div class="img-wrapper"><img src="${item.imageUrl}" alt="${item.title}" /></div>` : ""}
      <div class="item-card-content">
        <div class="category">${item.category || "Other"}</div>
        <h3>${item.title}</h3>
        <div class="price">${item.price == 0 ? "Free" : item.price}</div>
        <a href="${formatContact(item.contact)}" target="_blank" class="contact-btn">Contact Seller</a>
      </div>
    `;
    container.appendChild(card);
  });
}

function formatContact(contact) {
  if (/^\d{10}$/.test(contact)) return `https://wa.me/91${contact}`;
  return `mailto:${contact}`;
}

// Filters
function showAll() {
  updateActiveFilter(event.target);
  renderItems(allItems);
}
function showFree() {
  updateActiveFilter(event.target);
  renderItems(allItems.filter(i => i.price == 0 || i.price.toLowerCase?.().includes("free")));
}
function filterByCategory() {
  const value = document.getElementById("categoryFilter").value;
  renderItems(value ? allItems.filter(i => i.category?.toLowerCase() === value.toLowerCase()) : allItems);
}
function searchItems() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  renderItems(allItems.filter(i =>
    i.title?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)
  ));
}
function updateActiveFilter(btn) {
  document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");
}

// Form Submit
document.getElementById("item-form").addEventListener("submit", e => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const price = +document.getElementById("price").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").files[0];

  if (!/^\d{10}$/.test(contact) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    alert("Enter valid 10-digit phone number or email.");
    return;
  }

  if (isNaN(price) || price < 0) {
    alert("Enter a valid price (0 for Free).");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("price", price == 0 ? "Free" : `₹${price}`);
  formData.append("contact", contact);
  formData.append("category", category);
  formData.append("image", image);

  fetch("https://x-marketplace.onrender.com/items", {
    method: "POST",
    body: formData,
  })
    .then(res => res.json())
    .then(() => {
      alert("✅ Item uploaded!");
      document.getElementById("item-form").reset();
      document.getElementById("preview").style.display = "none";
      window.location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("❌ Upload failed.");
    });
});

// Image preview
function previewImage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById("preview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
}