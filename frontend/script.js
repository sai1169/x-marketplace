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
      <h3>${item.title}</h3>
      <p>Price: ${item.price}</p>
      <a href="${item.contact}" target="_blank">Contact Seller</a>
    `;
    container.appendChild(card);
  });
}

// ✅ Handle form submission
document.getElementById("item-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const newItem = {
    title: document.getElementById("title").value,
    price: document.getElementById("price").value,
    contact: document.getElementById("contact").value,
    category: document.getElementById("category").value
  };

  fetch("https://x-marketplace.onrender.com/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newItem),
  })
    .then(response => response.json())
    .then(data => {
      alert("✅ Item added successfully!");
      window.location.reload(); // refresh to show new item
    })
    .catch(error => {
      console.error("❌ Failed to add item:", error);
      alert("Failed to add item. Try again.");
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