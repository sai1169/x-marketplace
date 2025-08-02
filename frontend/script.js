// fetch items from the backend
fetch("https://x-marketplace-backend.onrender.com/items")
  .then(response => response.json())
  .then(items => {
    const container = document.getElementById("items-container");

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
  })
  .catch(error => {
    console.error("❌ Failed to fetch items:", error);
  });
// handle form submission
document.getElementById("item-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const newItem = {
    title: document.getElementById("title").value,
    price: document.getElementById("price").value,
    contact: document.getElementById("contact").value,
  };

fetch("https://x-marketplace-backend.onrender.com/items" {
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