let allItems = [];

// ✅ Fetch items from the backend
fetch("https://x-marketplace.onrender.com/items")
  .then(response => response.json())
  .then(items => {
    allItems = items;
    renderItems(allItems);
  })
  .catch(error => {
    console.error("❌ Failed to fetch items:", error);
  });

// ✅ Render items to the page
function renderItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = ""; // clear previous cards

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      ${item.imageUrl ? `<img src="${item.imageUrl}" class="item-image" alt="${item.title}"/>` : ''}
      <h3>${item.title}</h3>
      <p>Category: ${item.category}</p>
      <p>Price: ${item.price}</p>
      <a href="${item.contact}" target="_blank">Contact Seller</a>
    `;
    container.appendChild(card);
  });
}

// ✅ Handle form submission
document.getElementById("item-form").addEventListener("submit", function (e) {
  e.preventDefault();

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
      alert("✅ Item uploaded!");
      window.location.reload();
    })
    .catch(err => {
      console.error("❌ Upload failed:", err);
      alert("Upload failed.");
    });
});

// ✅ Filter: Show all items
function showAll() {
  renderItems(allItems);
}

// ✅ Filter: Show only free items
function showFree() {
  const freeItems = allItems.filter(item =>
    item.price.toLowerCase().includes("free")
  );
  renderItems(freeItems);
}

// ✅ Filter: Show items under ₹200
function showUnder200() {
  const filtered = allItems.filter(item => {
    const num = parseInt(item.price.replace(/[^0-9]/g, ""));
    return !isNaN(num) && num <= 200;
  });
  renderItems(filtered);
}

// ✅ Filter by search input
function searchItems() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allItems.filter(item =>
    item.title.toLowerCase().includes(query)
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
// image preview
function previewImage(event) {
  const preview = document.getElementById("preview");
  preview.src = URL.createObjectURL(event.target.files[0]);
  preview.style.display = "block";
}