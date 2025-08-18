let g = [],
    W = [],
    h = 0,
    I = !0,
    m, q = null;
const F = document.getElementById("themeToggle"),
    M = window.matchMedia("(prefers-color-scheme: dark)").matches,
    j = localStorage.getItem("theme") || (M ? "dark" : "light");
document.documentElement.setAttribute("data-theme", j), F.classList.toggle("active", "dark" === j), F.addEventListener("click", () => {
    const p = document.documentElement.getAttribute("data-theme"),
        c = "dark" === p ? "light" : "dark";
    F.style.transform = "rotate(180deg)", setTimeout(() => F.style.transform = "rotate(0deg)", 300), document.documentElement.setAttribute("data-theme", c), localStorage.setItem("theme", c), F.classList.toggle("active", "dark" === c)
}), window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", p => {
    if (!localStorage.getItem("theme")) {
        const c = p.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", c), F.classList.toggle("active", "dark" === c)
    }
});

function P(p, c = "success") {
    const r = document.createElement("div");
    r.className = `notification ${c}`, r.innerHTML = `<span style="font-size: 16px;">${"success"===c?"✅":"❌"}</span><span>${p}</span>`, document.body.appendChild(r), setTimeout(() => r.classList.add("show"), 100), setTimeout(() => {
        r.classList.remove("show"), setTimeout(() => document.body.contains(r) && document.body.removeChild(r), 300)
    }, 4e3)
}

function y() {
    const p = document.getElementById("category"),
        c = document.getElementById("apronFields"),
        r = document.getElementById("apronSize"),
        n = document.getElementById("apronColor"),
        o = "Aprons" === p.value;
    c.style.display = o ? "grid" : "none", r.required = n.required = o, o || (r.value = n.value = "")
}

function u(p, c, r, n) {
    const o = c(p.value.trim());
    return p.classList.toggle("error", !o), r.classList.toggle("show", !o), o || (r.textContent = n), o
}

function w() {
    const p = [
        ["title", c => 3 <= c.length, "Item name must be at least 3 characters"],
        ["price", c => !isNaN(c) && 0 <= parseFloat(c), "Enter a valid price (0 or greater)"],
        ["contact", c => /^\d{10}$/.test(c) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c), "Enter a valid 10-digit phone number or email"],
        ["category", c => "" !== c, "Please select a category"],
        ["deleteKey", c => 6 <= c.length, "Delete key must be at least 6 characters"]
    ];
    p.forEach(([c, r, n]) => {
        const o = document.getElementById(c);
        o.addEventListener("input", () => {
            clearTimeout(o.debounceTimer), o.debounceTimer = setTimeout(() => {
                u(o, r, document.getElementById(`${c}Error`), n)
            }, 300)
        })
    }), document.getElementById("category").addEventListener("change", () => {
        u(document.getElementById("category"), c => "" !== c, document.getElementById("categoryError"), "Please select a category")
    }), document.getElementById("image").addEventListener("change", () => {
        u(document.getElementById("image"), () => 0 < document.getElementById("image").files.length, document.getElementById("imageError"), "Please select at least one image")
    })
}

function z() {
    const p = document.getElementById("searchInput");
    p.value = "", document.getElementById("searchClear").style.display = "none", x(), p.focus()
}

function E() {
    const p = document.getElementById("searchInput").value.trim();
    document.getElementById("searchClear").style.display = p ? "block" : "none", clearTimeout(m), m = setTimeout(() => x(), 300)
}

function S() {
    return `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-category"></div><div class="skeleton-title"></div><div class="skeleton-description"></div><div class="skeleton-price"></div><div class="skeleton-button"></div></div></div>`
}

function B() {
    const p = document.getElementById("items-container");
    p.innerHTML = Array(6).fill(S()).join("")
}
const D = p => Date.now() - (p || 0) < 864e5,
    V = p => {
        const c = p.trim();
        return /^\d{10}$/.test(c) ? `https://wa.me/91${c}` : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) ? `mailto:${c}` : `mailto:${c}`
    };

function T() {
    B(), C("Loading..."), fetch("https://x-marketplace.onrender.com/items").then(p => {
        if (!p.ok) throw new Error(`HTTP error ${p.status}`);
        return p.json()
    }).then(p => {
        I = !1, g = Array.isArray(p) ? p.map(c => ({
            ...c,
            timestamp: c.timestamp || Date.now(),
            images: c.images || [c.imageUrl]
        })) : [], G("newest"), O(g), C()
    }).catch(p => {
        I = !1, console.error("Error loading items:", p), document.getElementById("items-container").innerHTML = `
        <div class="empty-state">
          <h3>Unable to load items</h3>
          <p>Please check your internet connection and try again.</p>
          <button onclick="loadItems()" class="contact-btn" style="max-width: 200px; margin: 16px auto 0;">🔄 Retry</button>
        </div>`, C("Error loading"), P("Failed to load items. Please check your connection.", "error")
    })
}

function O(p) {
    const c = document.getElementById("items-container");
    if (!p.length) return void(c.innerHTML = `<div class="empty-state"><h3>🔍 No items found</h3><p>Try adjusting your search terms or filters to find what you're looking for.</p></div>`);
    c.innerHTML = p.map((r, n) => {
        const o = 0 == r.price || r.price.toString().toLowerCase().includes("free") ? "Free" : `₹${r.price}`,
            e = "Free" === o,
            a = !e && 1e3 < parseFloat(r.price),
            s = r.images || [r.imageUrl],
            d = D(r.timestamp);
        let t = "";
        "Aprons" === r.category && (r.apronSize || r.apronColor) && (t = `<div class="apron-details">${r.apronSize?`<span class="apron-detail">Size: ${r.apronSize}</span>`:""}${r.apronColor?`<span class="apron-detail">Color: ${r.apronColor}</span>`:""}</div>`);
        const l = r.categoryDescription ? `<p class="category-description">${r.categoryDescription}</p>` : "";
        return `<div class="item-card" style="animation-delay: ${.1*n}s">\n      ${d?'<div class="new-badge">NEW</div>':''}\n      <button class="delete-btn" onclick="openDeleteModal('${r._id}')" aria-label="Delete Item">❌</button>\n      <div class="image-wrapper" onclick="openImageModal('${r.title}', ${JSON.stringify(s).replace(/"/g,"&quot;")})">\n        <img src="${s[0]}" alt="${r.title}" loading="lazy" />\n        <div class="image-zoom-icon">🔍</div>\n      </div>\n      <div class="item-card-content">\n        <div class="category">${r.category||"Other"}</div>\n        <h3>${r.title}</h3>\n        ${l}\n        ${t}\n        <div class="price ${e?"free":""} ${a?"high-priced":""}">${o}</div>\n        <a href="${V(r.contact)}" target="_blank" class="contact-btn" rel="noopener noreferrer">💬 Contact Seller</a>\n      </div>\n    </div>`
    }).join(""), C(p.length)
}

function x() {
    const p = document.getElementById("sortSelect").value;
    let c = [...g];
    "newest" === p ? c = G("newest") : "oldest" === p ? c = G("oldest") : "price-low" === p ? c = H("low") : "price-high" === p && (c = H("high"));
    const r = document.getElementById("searchInput").value.toLowerCase().trim(),
        n = document.getElementById("categoryFilter").value,
        o = document.querySelector(".filter-btn.active")?.textContent || "";
    let e = c;
    r && (e = e.filter(a => a.title?.toLowerCase().includes(r) || a.category?.toLowerCase().includes(r) || a.categoryDescription?.toLowerCase().includes(r))), n && (e = e.filter(a => a.category?.toLowerCase() === n.toLowerCase())), "Free Items" === o && (e = e.filter(a => 0 == a.price || a.price.toString().toLowerCase().includes("free"))), O(e)
}

function G(p) {
    return g.sort((c, r) => {
        const n = c.timestamp || 0,
            o = r.timestamp || 0;
        return "newest" === p ? o - n : n - o
    })
}

function H(p) {
    return g.sort((c, r) => {
        const n = parseFloat(c.price) || 0,
            o = parseFloat(r.price) || 0;
        return "low" === p ? n - o : o - n
    })
}

function L(p) {
    document.querySelectorAll(".filter-btn").forEach(c => c.classList.remove("active")), p && p.classList.add("active")
}

function U() {
    L(event.target), document.getElementById("categoryFilter").value = "", x()
}

function A() {
    L(event.target), document.getElementById("categoryFilter").value = "", x()
}

function N() {
    document.querySelectorAll(".filter-btn").forEach(p => p.classList.remove("active")), x()
}

function C(p) {
    const c = document.getElementById("itemsCount");
    c.textContent = "string" == typeof p ? p : `${p} item${1!==p?"s":""}`
}

function K() {
    document.getElementById("add-item").scrollIntoView({
        behavior: "smooth",
        block: "start"
    })
}

function R() {
    const p = document.getElementById("floatingAddBtn"),
        c = document.getElementById("add-item"),
        r = c.getBoundingClientRect();
    p.classList.toggle("show", r.top > window.innerHeight || r.bottom < 0)
}

function X(p, c) {
    const r = document.getElementById("imageModal"),
        n = document.getElementById("modalTitle"),
        o = document.getElementById("modalThumbnails");
    W = Array.isArray(c) ? c : [c], h = 0, n.textContent = p, Y(), 1 < W.length ? (o.innerHTML = W.map((e, a) => `<img src="${e}" class="modal-thumbnail ${0===a?"active":""}" onclick="setModalImage(${a})" alt="Thumbnail ${a+1}">`).join(""), o.style.display = "flex") : o.style.display = "none", r.classList.add("show"), r.style.display = "flex", document.body.style.overflow = "hidden"
}

function Z() {
    const p = document.getElementById("imageModal");
    p.classList.remove("show"), setTimeout(() => {
        p.style.display = "none", document.body.style.overflow = "auto"
    }, 300)
}

function Y() {
    const p = document.getElementById("modalImg"),
        c = document.getElementById("modalCounter"),
        r = document.querySelectorAll(".modal-thumbnail");
    p.src = W[h], c.textContent = `${h+1} / ${W.length}`, r.forEach((n, o) => {
        n.classList.toggle("active", o === h)
    });
    const n = document.querySelector(".modal-nav.prev"),
        o = document.querySelector(".modal-nav.next");
    1 >= W.length ? (n && (n.style.display = "none"), o && (o.style.display = "none")) : (n && (n.style.display = "flex"), o && (o.style.display = "flex"))
}

function _() {
    0 < h && (h--, Y())
}

function $() {
    h < W.length - 1 && (h++, Y())
}

function J(p) {
    h = p, Y()
}
document.getElementById("item-form").addEventListener("submit", async p => {
    p.preventDefault();
    const c = {
            title: document.getElementById("title"),
            price: document.getElementById("price"),
            contact: document.getElementById("contact"),
            category: document.getElementById("category"),
            categoryDescription: document.getElementById("categoryDescription"),
            image: document.getElementById("image"),
            apronSize: document.getElementById("apronSize"),
            apronColor: document.getElementById("apronColor"),
            deleteKey: document.getElementById("deleteKey")
        },
        r = [u(c.title, t => 3 <= t.length, document.getElementById("titleError"), "Item name must be at least 3 characters"), u(c.price, t => !isNaN(t) && 0 <= parseFloat(t), document.getElementById("priceError"), "Enter a valid price (0 or greater)"), u(c.contact, t => /^\d{10}$/.test(t) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t), document.getElementById("contactError"), "Enter a valid 10-digit phone number or email"), u(c.category, t => "" !== t, document.getElementById("categoryError"), "Please select a category"), u(c.image, () => 0 < c.image.files.length, document.getElementById("imageError"), "Please select at least one image"), u(c.deleteKey, t => 6 <= t.length, document.getElementById("deleteKeyError"), "Delete key must be at least 6 characters")];
    if ("Aprons" === c.category.value && (r.push(u(c.apronSize, t => "" !== t, document.getElementById("apronSizeError"), "Please select an apron size")), r.push(u(c.apronColor, t => "" !== t, document.getElementById("apronColorError"), "Please select an apron color"))), !r.every(Boolean)) return void P("Please fix the form errors before submitting", "error");
    for (let t of c.image.files) {
        if (5242880 < t.size) return void P("Each image must be less than 5MB", "error");
        if (!t.type.startsWith("image/")) return void P("Only image files are allowed", "error")
    }
    const n = document.querySelector(".submit-btn");
    n.disabled = !0;
    const o = n.innerHTML,
        e = new FormData;
    e.append("title", c.title.value.trim()), e.append("price", 0 == c.price.value ? "Free" : c.price.value), e.append("contact", c.contact.value.trim()), e.append("category", c.category.value), e.append("timestamp", Date.now()), e.append("deleteKey", c.deleteKey.value.trim()), c.categoryDescription.value.trim() && e.append("categoryDescription", c.categoryDescription.value.trim()), "Aprons" === c.category.value && (e.append("apronSize", c.apronSize.value), e.append("apronColor", c.apronColor.value));
    for (let t = 0; t < c.image.files.length; t++) e.append("images", c.image.files[t]);
    try {
        const t = await fetch("https://x-marketplace.onrender.com/items", {
            method: "POST",
            body: e
        });
        if (!t.ok) {
            const l = await t.json().catch(() => ({}));
            throw new Error(l.message || `HTTP error ${t.status}`)
        }
        P("✨ Item listed successfully! It will appear shortly.", "success"), document.getElementById("item-form").reset(), document.getElementById("imagePreviewContainer").innerHTML = "", document.getElementById("apronFields").style.display = "none", document.querySelector(".file-input-display").innerHTML = `\n      <div class="file-input-icon">📷</div>\n      <div class="file-input-text">Click to upload images</div>\n      <div class="file-input-subtext">Support multiple images</div>\n    `, setTimeout(() => {
            T(), document.getElementById("item-list").scrollIntoView({
                behavior: "smooth"
            })
        }, 1500)
    } catch (t) {
        console.error("Upload error:", t), P(`❌ Upload failed: ${t.message}`, "error")
    } finally {
        n.disabled = !1, n.innerHTML = o
    }
});

function k(p) {
    const c = Array.from(p.target.files),
        r = document.getElementById("imagePreviewContainer"),
        n = document.querySelector(".file-input-display");
    if (0 === c.length) return r.innerHTML = "", void(n.innerHTML = `\n      <div class="file-input-icon">📷</div>\n      <div class="file-input-text">Click to upload images</div>\n      <div class="file-input-subtext">Support multiple images</div>\n    `);
    for (let o of c) {
        if (5242880 < o.size) return void P("Each image must be less than 5MB", "error");
        if (!o.type.startsWith("image/")) return void P("Only image files are allowed", "error")
    }
    const o = 1 === c.length ? c[0].name : `${c.length} images selected`;
    r.innerHTML = "", n.innerHTML = `<div class="file-input-icon">✅</div><div class="file-input-text">${o}</div><div class="file-input-subtext">Click to change selection</div>`, c.forEach((e, a) => {
        const s = new FileReader;
        s.onload = t => {
            const d = document.createElement("div");
            d.className = "image-preview", d.innerHTML = `\n        <img src="${t.target.result}" alt="Preview ${a+1}" />\n        <button type="button" class="image-preview-remove" onclick="removePreviewImage(${a})" title="Remove image">×</button>\n      `, r.appendChild(d)
        }, s.readAsDataURL(e)
    })
}

function O(p) {
    const c = document.getElementById("image"),
        r = Array.from(c.files),
        n = new DataTransfer;
    r.forEach((o, e) => {
        e !== p && n.items.add(o)
    }), c.files = n.files, k({
        target: c
    })
}
window.addEventListener("scroll", R), window.addEventListener("resize", R), document.addEventListener("keydown", p => {
    if ("Escape" === p.key) {
        const c = document.getElementById("imageModal");
        if (c.classList.contains("show")) return void Z();
        const r = document.getElementById("deleteModal");
        if (r.classList.contains("show")) return void U_();
        const n = document.getElementById("searchInput");
        n.value && z()
    }
    if ((p.ctrlKey || p.metaKey) && "k" === p.key && (p.preventDefault(), document.getElementById("searchInput").focus()), document.getElementById("imageModal").classList.contains("show")) {
        if ("ArrowLeft" === p.key) return p.preventDefault(), void _();
        "ArrowRight" === p.key && (p.preventDefault(), $())
    }
}), document.querySelectorAll('a[href^="#"]').forEach(p => {
    p.addEventListener("click", c => {
        c.preventDefault();
        const r = document.querySelector(p.getAttribute("href"));
        r && r.scrollIntoView({
            behavior: "smooth",
            block: "start"
        })
    })
}), document.getElementById("imageModal").addEventListener("click", p => {
    "imageModal" === p.target.id && Z()
});

function U_(p) {
    q = p;
    const c = document.getElementById("deleteModal");
    c.classList.add("show"), c.style.display = "flex", document.body.style.overflow = "hidden", document.getElementById("deleteKeyInput").value = "", document.getElementById("deleteKeyModalError").classList.remove("show")
}

function B_() {
    q = null;
    const p = document.getElementById("deleteModal");
    p.classList.remove("show"), setTimeout(() => {
        p.style.display = "none", document.body.style.overflow = "auto"
    }, 300)
}
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    const p = document.getElementById("deleteKeyInput"),
        c = p.value.trim(),
        r = document.getElementById("deleteKeyModalError");
    if (6 > c.length) return r.textContent = "Key must be at least 6 characters.", void r.classList.add("show");
    r.classList.remove("show");
    const n = document.getElementById("confirmDeleteBtn");
    n.disabled = !0;
    const o = n.innerHTML;
    n.innerHTML = `<div class="loader"></div> <span>Deleting...</span>`;
    try {
        const e = await fetch(`https://x-marketplace.onrender.com/items/${q}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                deleteKey: c
            })
        });
        if (!e.ok) {
            const a = await e.json().catch(() => ({}));
            throw new Error(a.error || `HTTP error ${e.status}`)
        }
        P("Item deleted successfully!", "success"), B_(), T()
    } catch (e) {
        console.error("Deletion error:", e), r.textContent = e.message || "Failed to delete item.", r.classList.add("show")
    } finally {
        n.disabled = !1, n.innerHTML = o
    }
}), document.getElementById("deleteModal").addEventListener("click", p => {
    "deleteModal" === p.target.id && B_()
}), document.addEventListener("DOMContentLoaded", () => {
    T(), w(), document.getElementById("searchInput").addEventListener("input", E), document.getElementById("sortSelect").value = "newest", R()
});
const a = {
        root: null,
        rootMargin: "50px",
        threshold: .1
    },
    s = new IntersectionObserver(p => {
        p.forEach(c => {
            if (c.isIntersecting) {
                const r = c.target;
                r.dataset.src && (r.src = r.dataset.src, r.removeAttribute("data-src"), s.unobserve(r))
            }
        })
    }, a);
window.addEventListener("error", p => {
    console.error("Unhandled error:", p.error), P("Something went wrong. Please refresh the page.", "error")
}), window.addEventListener("unhandledrejection", p => {
    console.error("Unhandled promise rejection:", p.reason), P("Something went wrong. Please try again.", "error")
});
