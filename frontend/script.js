document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#itemForm");
  const categoryInput = document.querySelector("#category");
  const sizeGroup = document.querySelector("#sizeGroup");
  const colorGroup = document.querySelector("#colorGroup");
  const sizeInput = document.querySelector("#size");
  const colorInput = document.querySelector("#color");

  const fileInput = document.querySelector("#images");
  const previewContainer = document.querySelector("#imagePreview");
  const notification = document.querySelector("#notification");

  // 🧠 Show/hide fields based on category
  categoryInput.addEventListener("change", () => {
    const selected = categoryInput.value.toLowerCase();
    if (selected === "aprons") {
      sizeGroup.style.display = "block";
      colorGroup.style.display = "block";
    } else {
      sizeGroup.style.display = "none";
      colorGroup.style.display = "none";
      sizeInput.value = "";
      colorInput.value = "";
    }
  });

  // 🖼️ Image preview
  fileInput.addEventListener("change", () => {
    previewContainer.innerHTML = "";
    [...fileInput.files].forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const div = document.createElement("div");
        div.className = "image-preview";
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <button type="button" class="image-preview-remove" data-index="${index}">&times;</button>
        `;
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // 🧽 Remove selected image preview
  previewContainer.addEventListener("click", e => {
    if (e.target.classList.contains("image-preview-remove")) {
      const index = parseInt(e.target.dataset.index);
      const files = [...fileInput.files];
      files.splice(index, 1);
      const dataTransfer = new DataTransfer();
      files.forEach(f => dataTransfer.items.add(f));
      fileInput.files = dataTransfer.files;
      e.target.parentElement.remove();
    }
  });

  // 📤 Form submit
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const title = document.querySelector("#title").value.trim();
    const price = document.querySelector("#price").value.trim();
    const contact = document.querySelector("#contact").value.trim();
    const category = categoryInput.value;
    const size = sizeInput.value.trim();
    const color = colorInput.value.trim();
    const files = fileInput.files;

    // ✅ Validate apron-specific fields
    if (category.toLowerCase() === "aprons" && (!size || !color)) {
      showNotification("Please select both size and color for aprons", "error");
      return;
    }

    if (files.length === 0) {
      showNotification("Please upload at least one image", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("contact", contact);
    formData.append("category", category);
    formData.append("timestamp", Date.now());
    if (category.toLowerCase() === "aprons") {
      formData.append("title", `${title} (${size}, ${color})`);
    }
    [...files].forEach(file => formData.append("images", file));

    try {
      const res = await fetch("https://x-marketplace.onrender.com/items", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();

      showNotification("Item uploaded successfully!", "success");
      form.reset();
      previewContainer.innerHTML = "";
      sizeGroup.style.display = "none";
      colorGroup.style.display = "none";
    } catch (err) {
      console.error("Upload error:", err);
      showNotification("Failed to upload item", "error");
    }
  });

  // 🔔 Notification helper
  function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }
});