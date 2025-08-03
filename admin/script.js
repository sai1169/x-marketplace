// admin/script.js

// Fetch and display all items
async function loadItems() {
  const container = document.getElementById("admin-items");
  container.innerHTML = "Loading...";

  try {
    const response = await fetch("https://x-marketplace.onrender.com/items");
    const items = await response.json();

    if (!items.length) {
      container.innerHTML = "<p>No items found.</p>";
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="admin-item">
        <h3>${item.title}</h3>
        <p>Price: ${item.price}</p>
        <p>Contact: ${item.contact}</p>
        <p>Category: ${item.category}</p>
        <div class="admin-images">
          ${(item.images || []).map(img => `<img src="${img}" />`).join('')}
        </div>
        <p>Uploaded: ${new Date(item.timestamp).toLocaleString()}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "<p>Error loading items</p>";
    console.error(err);
  }
}

window.addEventListener("DOMContentLoaded", loadItems);
