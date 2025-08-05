// ====================================
// MOBILE-OPTIMIZED X-MARKETPLACE SCRIPT
// ====================================

// Global Variables
let allItems = [];
let currentModalImages = [];
let currentModalIndex = 0;
let isLoading = false;
let searchTimeout;
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

// ====================================
// THEME MANAGEMENT
// ====================================

class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    this.setTheme(initialTheme);
    this.bindEvents();
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateToggleStates(theme === 'dark');
  }

  updateToggleStates(isDark) {
    const toggles = document.querySelectorAll('.theme-toggle, #bottomThemeToggle');
    toggles.forEach(toggle => {
      toggle.classList.toggle('active', isDark);
    });

    // Update mobile theme icon
    const mobileIcon = document.querySelector('.theme-icon-mobile');
    if (mobileIcon) {
      mobileIcon.textContent = isDark ? '☀️' : '🌙';
    }
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  bindEvents() {
    // Header theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggle());
    }

    // Bottom nav theme toggle
    const bottomThemeToggle = document.getElementById('bottomThemeToggle');
    if (bottomThemeToggle) {
      bottomThemeToggle.addEventListener('click', () => this.toggle());
    }

    // System theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// ====================================
// TOAST NOTIFICATIONS
// ====================================

class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
    this.toasts = [];
  }

  show(message, type = 'info', duration = 4000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(toast);
    }, duration);

    // Add haptic feedback
    if (navigator.vibrate) {
      const pattern = type === 'error' ? [100, 50, 100] : [50];
      navigator.vibrate(pattern);
    }

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <p class="toast-message">${message}</p>
      </div>
    `;

    // Add swipe to dismiss
    this.addSwipeToast(toast);

    return toast;
  }

  addSwipeToast(toast) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    toast.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      toast.style.transition = 'none';
    });

    toast.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX - startX;
      toast.style.transform = `translateX(${currentX}px)`;
      toast.style.opacity = Math.max(0.3, 1 - Math.abs(currentX) / 200);
    });

    toast.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      toast.style.transition = '';
      
      if (Math.abs(currentX) > 100) {
        this.dismiss(toast);
      } else {
        toast.style.transform = '';
        toast.style.opacity = '';
      }
    });
  }

  dismiss(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  clear() {
    this.toasts.forEach(toast => this.dismiss(toast));
  }
}

// ====================================
// NAVIGATION MANAGER
// ====================================

class NavigationManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindMenuToggle();
    this.bindNavigation();
    this.bindScrollEffects();
  }

  bindMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('open');
      });
    }
  }

  bindNavigation() {
    // Header nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          this.scrollToSection(target);
          this.closeMenu();
        }
      });
    });

    // Bottom nav items
    document.querySelectorAll('.bottom-nav-item[href]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(item.getAttribute('href'));
        if (target) {
          this.scrollToSection(target);
          this.updateBottomNavState(item);
        }
      });
    });
  }

  scrollToSection(target) {
    const headerHeight = document.querySelector('.header').offsetHeight;
    const targetTop = target.offsetTop - headerHeight - 20;
    
    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });
  }

  closeMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (menuToggle && nav) {
      menuToggle.classList.remove('active');
      nav.classList.remove('open');
    }
  }

  updateBottomNavState(activeItem) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    activeItem.classList.add('active');
  }

  bindScrollEffects() {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateOnScroll = () => {
      const scrollY = window.scrollY;
      const header = document.querySelector('.header');
      const fab = document.getElementById('fab');
      const addItemSection = document.getElementById('add-item');

      // Header effects
      if (scrollY > 100) {
        header.style.transform = scrollY > lastScrollY ? 'translateY(-100%)' : 'translateY(0)';
      } else {
        header.style.transform = 'translateY(0)';
      }

      // FAB visibility
      if (fab && addItemSection) {
        const rect = addItemSection.getBoundingClientRect();
        const shouldShow = rect.top > window.innerHeight || rect.bottom < 0;
        fab.style.display = shouldShow ? 'flex' : 'none';
        fab.classList.toggle('show', shouldShow);
      }

      // Update active nav based on scroll position
      this.updateActiveNavOnScroll(scrollY);

      lastScrollY = scrollY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    });
  }

  updateActiveNavOnScroll(scrollY) {
    const sections = ['item-list', 'add-item'];
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    let currentSection = 'browse';
    
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerHeight + 100 && rect.bottom > headerHeight + 100) {
          currentSection = sectionId === 'item-list' ? 'browse' : 'sell';
        }
      }
    });

    // Update bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const section = item.dataset.section;
      item.classList.toggle('active', section === currentSection);
    });
  }
}

// ====================================
// SEARCH MANAGER
// ====================================

class SearchManager {
  constructor(itemManager) {
    this.itemManager = itemManager;
    this.suggestions = ['Books', 'Aprons', 'Notes', 'Tools', 'Lab Items'];
    this.init();
  }

  init() {
    this.bindSearchInput();
    this.bindSuggestions();
    this.bindFilters();
  }

  bindSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        searchClear.style.display = query ? 'block' : 'none';
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(query);
        }, 300);
      });

      // Clear search
      if (searchClear) {
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          searchClear.style.display = 'none';
          this.performSearch('');
          searchInput.focus();
        });
      }
    }
  }

  bindSuggestions() {
    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        const query = item.textContent.replace(/^[^\s]+ /, ''); // Remove emoji
        searchInput.value = query;
        this.performSearch(query);
        
        // Add haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      });
    });
  }

  bindFilters() {
    // Quick filters
    document.querySelectorAll('.quick-filter').forEach(filter => {
      filter.addEventListener('click', () => {
        document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        this.applyFilters();
      });
    });

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
        this.applyFilters();
      });
    }

    // Sort filter
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.applyFilters();
      });
    }
  }

  performSearch(query) {
    this.applyFilters(query);
  }

  applyFilters(searchQuery = null) {
    const query = searchQuery !== null ? searchQuery : document.getElementById('searchInput').value.toLowerCase().trim();
    const activeQuickFilter = document.querySelector('.quick-filter.active')?.dataset.filter || 'all';
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortValue = document.getElementById('sortSelect').value;

    let filteredItems = [...allItems];

    // Apply search query
    if (query) {
      filteredItems = filteredItems.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.categoryDescription?.toLowerCase().includes(query)
      );
    }

    // Apply quick filters
    if (activeQuickFilter === 'free') {
      filteredItems = filteredItems.filter(item => 
        item.price == 0 || item.price.toString().toLowerCase().includes('free')
      );
    } else if (activeQuickFilter === 'new') {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      filteredItems = filteredItems.filter(item => 
        (item.timestamp || 0) > oneDayAgo
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filteredItems = filteredItems.filter(item => 
        item.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply sorting
    filteredItems = this.sortItems(filteredItems, sortValue);

    // Render results
    this.itemManager.renderItems(filteredItems);
    this.updateResultsCount(filteredItems.length);
  }

  sortItems(items, sortValue) {
    switch (sortValue) {
      case 'newest':
        return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      case 'oldest':
        return items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      case 'price-low':
        return items.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      case 'price-high':
        return items.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
      default:
        return items;
    }
  }

  updateResultsCount(count) {
    const itemsCount = document.getElementById('itemsCount');
    if (itemsCount) {
      itemsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
  }
}

// ====================================
// ITEM MANAGER
// ====================================

class ItemManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.init();
  }

  init() {
    this.loadItems();
    this.bindFAB();
  }

  async loadItems() {
    try {
      this.showLoading(true);
      this.showSkeletonLoaders();
      
      const response = await fetch('https://x-marketplace.onrender.com/items');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      allItems = Array.isArray(data) ? data.map(item => ({
        ...item,
        timestamp: item.timestamp || Date.now(),
        images: item.images || [item.imageUrl]
      })) : [];
      
      this.renderItems(allItems);
      
    } catch (error) {
      console.error('Error loading items:', error);
      this.showErrorState();
      this.toastManager.show('Failed to load items. Please check your connection.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showSkeletonLoaders() {
    const container = document.getElementById('items-container');
    if (!container) return;

    container.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-card';
      skeleton.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-category"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-price"></div>
          <div class="skeleton-button"></div>
        </div>
      `;
      container.appendChild(skeleton);
    }
  }

  renderItems(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    container.innerHTML = '';

    if (!items.length) {
      this.showEmptyState();
      return;
    }

    items.forEach((item, index) => {
      const card = this.createItemCard(item, index);
      container.appendChild(card);
    });

    this.updateItemsCount(items.length);
  }

  createItemCard(item, index) {
    const price = item.price == 0 || item.price.toString().toLowerCase().includes('free') 
      ? 'Free' 
      : `₹${item.price}`;
    const isFree = price === 'Free';
    const isHighPriced = !isFree && parseFloat(item.price) > 1000;
    const images = item.images || [item.imageUrl];
    const primaryImage = images[0];
    const isNew = this.isNewItem(item.timestamp);

    // Build additional details
    let apronDetails = '';
    if (item.category === 'Aprons' && (item.apronSize || item.apronColor)) {
      apronDetails = `
        <div class="apron-details">
          ${item.apronSize ? `<span class="apron-detail">Size: ${item.apronSize}</span>` : ''}
          ${item.apronColor ? `<span class="apron-detail">Color: ${item.apronColor}</span>` : ''}
        </div>
      `;
    }

    let categoryDescription = '';
    if (item.categoryDescription) {
      categoryDescription = `<p class="category-description">${item.categoryDescription}</p>`;
    }

    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      ${isNew ? '<div class="new-badge">NEW</div>' : ''}
      <div class="image-wrapper">
        <img src="${primaryImage}" alt="${item.title}" loading="lazy" />
        <div class="image-zoom-icon">🔍</div>
      </div>
      <div class="item-card-content">
        <div class="category">${item.category || 'Other'}</div>
        <h3>${item.title}</h3>
        ${categoryDescription}
        ${apronDetails}
        <div class="price ${isFree ? 'free' : ''} ${isHighPriced ? 'high-priced' : ''}">${price}</div>
        <a href="${this.formatContact(item.contact)}" target="_blank" class="contact-btn" rel="noopener noreferrer">
          💬 Contact Seller
        </a>
      </div>
    `;

    // Add image modal trigger
    const imageWrapper = card.querySelector('.image-wrapper');
    imageWrapper.addEventListener('click', () => {
      this.openImageModal(item.title, images);
    });

    // Add card interactions
    this.addCardInteractions(card);

    return card;
  }

  addCardInteractions(card) {
    // Add touch feedback
    card.addEventListener('touchstart', () => {
      card.style.transform = 'scale(0.98)';
    });

    card.addEventListener('touchend', () => {
      card.style.transform = '';
    });

    card.addEventListener('touchcancel', () => {
      card.style.transform = '';
    });
  }

  isNewItem(timestamp) {
    const now = Date.now();
    const itemTime = timestamp || 0;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return (now - itemTime) < oneDayInMs;
  }

  formatContact(contact) {
    const trimmed = contact.trim();
    if (/^\d{10}$/.test(trimmed)) {
      return `https://wa.me/91${trimmed}`;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return `mailto:${trimmed}`;
    }
    return `mailto:${trimmed}`;
  }

  showEmptyState() {
    const container = document.getElementById('items-container');
    container.innerHTML = `
      <div class="empty-state">
        <h3>🔍 No items found</h3>
        <p>Try adjusting your search terms or filters to find what you're looking for.</p>
      </div>
    `;
  }

  showErrorState() {
    const container = document.getElementById('items-container');
    container.innerHTML = `
      <div class="empty-state">
        <h3>😕 Something went wrong</h3>
        <p>Unable to load items. Please check your connection and try again.</p>
        <button onclick="itemManager.loadItems()" class="contact-btn" style="max-width: 200px; margin: 16px auto 0;">
          🔄 Retry
        </button>
      </div>
    `;
  }

  updateItemsCount(count) {
    const itemsCount = document.getElementById('itemsCount');
    if (itemsCount) {
      itemsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.toggle('show', show);
    }
  }

  bindFAB() {
    const fab = document.getElementById('fab');
    if (fab) {
      fab.addEventListener('click', () => {
        const addItemSection = document.getElementById('add-item');
        if (addItemSection) {
          addItemSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    }
  }

  openImageModal(title, images) {
    const modal = new ImageModal();
    modal.open(title, images);
  }
}

// ====================================
// IMAGE MODAL
// ====================================

class ImageModal {
  constructor() {
    this.modal = document.getElementById('imageModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalImg = document.getElementById('modalImg');
    this.modalCounter = document.getElementById('modalCounter');
    this.modalThumbnails = document.getElementById('modalThumbnails');
    this.modalClose = document.getElementById('modalClose');
    this.modalPrev = document.getElementById('modalPrev');
    this.modalNext = document.getElementById('modalNext');
    
    this.images = [];
    this.currentIndex = 0;
    
    this.bindEvents();
  }

  bindEvents() {
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.close());
    }

    if (this.modalPrev) {
      this.modalPrev.addEventListener('click', () => this.previousImage());
    }

    if (this.modalNext) {
      this.modalNext.addEventListener('click', () => this.nextImage());
    }

    // Close on backdrop click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('modal-backdrop')) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.modal?.classList.contains('show')) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
      }
    });

    // Touch gestures
    this.addTouchGestures();
  }

  addTouchGestures() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;

    const imageContainer = this.modal?.querySelector('.modal-image-container');
    if (!imageContainer) return;

    imageContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    });

    imageContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX - startX;
      currentY = e.touches[0].clientY - startY;
      
      // Prevent scrolling when swiping horizontally
      if (Math.abs(currentX) > Math.abs(currentY)) {
        e.preventDefault();
      }
    });

    imageContainer.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Determine swipe direction
      if (Math.abs(currentX) > 50 && Math.abs(currentX) > Math.abs(currentY)) {
        if (currentX > 0) {
          this.previousImage();
        } else {
          this.nextImage();
        }
      }
      
      // Reset
      currentX = 0;
      currentY = 0;
    });
  }

  open(title, images) {
    this.images = Array.isArray(images) ? images : [images];
    this.currentIndex = 0;
    
    if (this.modalTitle) {
      this.modalTitle.textContent = title;
    }
    
    this.updateImage();
    this.createThumbnails();
    
    if (this.modal) {
      this.modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  updateImage() {
    if (this.modalImg && this.images[this.currentIndex]) {
      this.modalImg.src = this.images[this.currentIndex];
    }
    
    if (this.modalCounter) {
      this.modalCounter.textContent = `${this.currentIndex + 1} of ${this.images.length}`;
    }
    
    // Update navigation buttons
    if (this.modalPrev) {
      this.modalPrev.style.display = this.images.length > 1 ? 'flex' : 'none';
    }
    
    if (this.modalNext) {
      this.modalNext.style.display = this.images.length > 1 ? 'flex' : 'none';
    }
    
    // Update thumbnails
    this.updateThumbnails();
  }

  createThumbnails() {
    if (!this.modalThumbnails || this.images.length <= 1) {
      if (this.modalThumbnails) {
        this.modalThumbnails.style.display = 'none';
      }
      return;
    }
    
    this.modalThumbnails.style.display = 'flex';
    this.modalThumbnails.innerHTML = '';
    
    this.images.forEach((image, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = image;
      thumbnail.className = `modal-thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.alt = `Thumbnail ${index + 1}`;
      thumbnail.addEventListener('click', () => {
        this.currentIndex = index;
        this.updateImage();
      });
      this.modalThumbnails.appendChild(thumbnail);
    });
  }

  updateThumbnails() {
    const thumbnails = this.modalThumbnails?.querySelectorAll('.modal-thumbnail');
    thumbnails?.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentIndex);
    });
  }

  previousImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateImage();
    }
  }

  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.updateImage();
    }
  }
}

// ====================================
// FORM MANAGER
// ====================================

class FormManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.form = document.getElementById('item-form');
    this.isSubmitting = false;
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupValidation();
    this.bindFormEvents();
    this.bindFileUpload();
    this.bindCategoryChange();
  }

  setupValidation() {
    const fields = [
      { id: 'title', validator: (v) => v.length >= 3, message: 'Item name must be at least 3 characters' },
      { id: 'price', validator: (v) => !isNaN(v) && parseFloat(v) >= 0, message: 'Enter a valid price (0 or greater)' },
      { id: 'contact', validator: (v) => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Enter a valid 10-digit phone number or email' },
      { id: 'category', validator: (v) => v !== '', message: 'Please select a category' }
    ];

    fields.forEach(field => {
      const input = document.getElementById(field.id);
      const errorElement = document.getElementById(`${field.id}Error`);
      
      if (input && errorElement) {
        const validateField = () => {
          const isValid = field.validator(input.value.trim());
          input.classList.toggle('error', !isValid);
          errorElement.classList.toggle('show', !isValid);
          if (!isValid) {
            errorElement.textContent = field.message;
          }
          return isValid;
        };

        // Real-time validation with debouncing
        let timeout;
        input.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(validateField, 300);
        });

        input.addEventListener('blur', validateField);
      }
    });
  }

  bindFormEvents() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Character counter for description
    const description = document.getElementById('categoryDescription');
    const counter = document.getElementById('descriptionCount');
    
    if (description && counter) {
      description.addEventListener('input', () => {
        counter.textContent = description.value.length;
      });
    }
  }

  bindFileUpload() {
    const fileInput = document.getElementById('image');
    const uploadArea = fileInput?.closest('.file-upload-area');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if (!fileInput || !uploadArea || !previewContainer) return;

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files);
    });
  }

  handleFileSelect(files) {
    const fileArray = Array.from(files);
    const validFiles = [];

    // Validate files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        this.toastManager.show('Only image files are allowed', 'error');
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.toastManager.show('Each image must be less than 5MB', 'error');
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      this.createImagePreviews(validFiles);
      this.updateFileInput(validFiles);
    }
  }

  createImagePreviews(files) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}" />
          <button type="button" class="image-preview-remove" data-index="${index}">×</button>
        `;
        previewContainer.appendChild(preview);

        // Bind remove button
        const removeBtn = preview.querySelector('.image-preview-remove');
        removeBtn.addEventListener('click', () => {
          this.removePreviewImage(index);
        });
      };
      reader.readAsDataURL(file);
    });

    // Update upload area text
    const uploadTitle = document.querySelector('.upload-title');
    if (uploadTitle) {
      uploadTitle.textContent = `${files.length} image${files.length !== 1 ? 's' : ''} selected`;
    }
  }

  updateFileInput(files) {
    const fileInput = document.getElementById('image');
    if (!fileInput) return;

    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
  }

  removePreviewImage(indexToRemove) {
    const fileInput = document.getElementById('image');
    if (!fileInput) return;

    const files = Array.from(fileInput.files);
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    
    if (newFiles.length > 0) {
      this.createImagePreviews(newFiles);
      this.updateFileInput(newFiles);
    } else {
      // Reset if no files left
      const previewContainer = document.getElementById('imagePreviewContainer');
      if (previewContainer) {
        previewContainer.innerHTML = '';
      }
      
      const uploadTitle = document.querySelector('.upload-title');
      if (uploadTitle) {
        uploadTitle.textContent = 'Tap to add photos';
      }
      
      fileInput.value = '';
    }
  }

  bindCategoryChange() {
    const categorySelect = document.getElementById('category');
    const apronFields = document.getElementById('apronFields');
    const apronSize = document.getElementById('apronSize');
    const apronColor = document.getElementById('apronColor');

    if (!categorySelect || !apronFields) return;

    categorySelect.addEventListener('change', () => {
      const isApron = categorySelect.value === 'Aprons';
      
      apronFields.style.display = isApron ? 'block' : 'none';
      
      if (apronSize && apronColor) {
        apronSize.required = isApron;
        apronColor.required = isApron;
        
        if (!isApron) {
          apronSize.value = '';
          apronColor.value = '';
        }
      }
    });
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    // Validate all fields
    if (!this.validateForm()) {
      this.toastManager.show('Please fix the form errors before submitting', 'error');
      return;
    }

    this.isSubmitting = true;
    const submitBtn = this.form.querySelector('.submit-btn');
    const originalContent = submitBtn.innerHTML;
    
    // Update button state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
      </div>
      <span>Uploading...</span>
    `;

    try {
      const formData = this.buildFormData();
      const response = await fetch('https://x-marketplace.onrender.com/items', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      this.toastManager.show('✨ Item listed successfully! It will appear shortly.', 'success');
      this.resetForm();
      
      // Reload items and scroll to list
      setTimeout(() => {
        if (window.itemManager) {
          window.itemManager.loadItems();
        }
        
        const itemList = document.getElementById('item-list');
        if (itemList) {
          itemList.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      this.toastManager.show(`❌ Upload failed: ${error.message}`, 'error');
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  validateForm() {
    const requiredFields = ['title', 'price', 'contact', 'category', 'image'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      const errorElement = document.getElementById(`${fieldId}Error`);
      
      if (!field) return;

      let fieldValid = true;
      let errorMessage = '';

      switch (fieldId) {
        case 'title':
          fieldValid = field.value.trim().length >= 3;
          errorMessage = 'Item name must be at least 3 characters';
          break;
        case 'price':
          fieldValid = !isNaN(field.value) && parseFloat(field.value) >= 0;
          errorMessage = 'Enter a valid price (0 or greater)';
          break;
        case 'contact':
          const contact = field.value.trim();
          fieldValid = /^\d{10}$/.test(contact) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
          errorMessage = 'Enter a valid 10-digit phone number or email';
          break;
        case 'category':
          fieldValid = field.value !== '';
          errorMessage = 'Please select a category';
          break;
        case 'image':
          fieldValid = field.files.length > 0;
          errorMessage = 'Please select at least one image';
          break;
      }

      if (!fieldValid) {
        isValid = false;
        field.classList.add('error');
        if (errorElement) {
          errorElement.classList.add('show');
          errorElement.textContent = errorMessage;
        }
      } else {
        field.classList.remove('error');
        if (errorElement) {
          errorElement.classList.remove('show');
        }
      }
    });

    // Additional validation for apron fields if category is Aprons
    const category = document.getElementById('category');
    if (category && category.value === 'Aprons') {
      const apronSize = document.getElementById('apronSize');
      const apronColor = document.getElementById('apronColor');
      
      [apronSize, apronColor].forEach(field => {
        if (field && !field.value) {
          isValid = false;
          field.classList.add('error');
          const errorElement = document.getElementById(`${field.id}Error`);
          if (errorElement) {
            errorElement.classList.add('show');
            errorElement.textContent = `Please select an ${field.id.replace('apron', '').toLowerCase()}`;
          }
        }
      });
    }

    return isValid;
  }

  buildFormData() {
    const formData = new FormData();
    
    // Basic fields
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('price', document.getElementById('price').value == 0 ? 'Free' : document.getElementById('price').value);
    formData.append('contact', document.getElementById('contact').value.trim());
    formData.append('category', document.getElementById('category').value);
    formData.append('timestamp', Date.now());

    // Optional description
    const description = document.getElementById('categoryDescription').value.trim();
    if (description) {
      formData.append('categoryDescription', description);
    }

    // Apron-specific fields
    const category = document.getElementById('category').value;
    if (category === 'Aprons') {
      const apronSize = document.getElementById('apronSize').value;
      const apronColor = document.getElementById('apronColor').value;
      if (apronSize) formData.append('apronSize', apronSize);
      if (apronColor) formData.append('apronColor', apronColor);
    }

    // Images
    const imageInput = document.getElementById('image');
    for (let i = 0; i < imageInput.files.length; i++) {
      formData.append('images', imageInput.files[i]);
    }

    return formData;
  }

  resetForm() {
    this.form.reset();
    
    // Clear image previews
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      previewContainer.innerHTML = '';
    }

    // Reset upload area text
    const uploadTitle = document.querySelector('.upload-title');
    if (uploadTitle) {
      uploadTitle.textContent = 'Tap to add photos';
    }

    // Hide apron fields
    const apronFields = document.getElementById('apronFields');
    if (apronFields) {
      apronFields.style.display = 'none';
    }

    // Clear error states
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message.show').forEach(el => el.classList.remove('show'));

    // Reset character counter
    const counter = document.getElementById('descriptionCount');
    if (counter) {
      counter.textContent = '0';
    }
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Touch feedback helper
function addTouchFeedback(element, scale = 0.95) {
  if (!element) return;

  element.addEventListener('touchstart', () => {
    element.style.transform = `scale(${scale})`;
    element.style.transition = 'transform 0.1s ease';
  });

  element.addEventListener('touchend', () => {
    element.style.transform = '';
  });

  element.addEventListener('touchcancel', () => {
    element.style.transform = '';
  });
}

// Format phone number for display
function formatPhoneNumber(phone) {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

// Check if device supports touch
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

// Get device type
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// ====================================
// PERFORMANCE OPTIMIZATIONS
// ====================================

// Intersection Observer for lazy loading
const createIntersectionObserver = () => {
  const options = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, options);
};

// Image loading optimization
function optimizeImageLoading() {
  const images = document.querySelectorAll('img[data-src]');
  const observer = createIntersectionObserver();
  
  images.forEach(img => observer.observe(img));
}

// ====================================
// ERROR HANDLING
// ====================================

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  if (window.toastManager) {
    window.toastManager.show('Something went wrong. Please refresh the page.', 'error');
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  if (window.toastManager) {
    window.toastManager.show('Something went wrong. Please try again.', 'error');
  }
});

// Network status monitoring
function setupNetworkMonitoring() {
  const updateOnlineStatus = () => {
    if (window.toastManager) {
      if (navigator.onLine) {
        window.toastManager.show('🌐 Back online!', 'success', 2000);
      } else {
        window.toastManager.show('📡 You appear to be offline', 'warning', 5000);
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// ====================================
// KEYBOARD SHORTCUTS
// ====================================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Ctrl/Cmd + S to focus on sell section
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const addItemSection = document.getElementById('add-item');
      if (addItemSection) {
        addItemSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Escape to clear search or close modals
    if (e.key === 'Escape') {
      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        if (window.searchManager) {
          window.searchManager.performSearch('');
        }
      }
    }
  });
}

// ====================================
// ACCESSIBILITY IMPROVEMENTS
// ====================================

function setupAccessibility() {
  // Add skip link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--color-primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add main content ID
  const main = document.querySelector('.main');
  if (main) {
    main.id = 'main-content';
    main.setAttribute('tabindex', '-1');
  }

  // Improve form labels
  document.querySelectorAll('input, select, textarea').forEach(field => {
    if (!field.id) return;
    
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (!label) {
      // Create implicit label relationship
      const explicitLabel = document.querySelector(`label`);
      if (explicitLabel && explicitLabel.textContent.includes(field.placeholder)) {
        explicitLabel.setAttribute('for', field.id);
      }
    }
  });

  // Add ARIA labels where missing
  document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
    if (!button.textContent.trim()) {
      // Try to infer purpose from class or context
      if (button.classList.contains('theme-toggle')) {
        button.setAttribute('aria-label', 'Toggle dark mode');
      } else if (button.classList.contains('menu-toggle')) {
        button.setAttribute('aria-label', 'Toggle navigation menu');
      } else if (button.classList.contains('search-clear')) {
        button.setAttribute('aria-label', 'Clear search');
      }
    }
  });
}

// ====================================
// PWA FEATURES (OPTIONAL)
// ====================================

function setupPWAFeatures() {
  // Register service worker if available
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed:', registrationError);
        });
    });
  }

  // Add to home screen prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button (if you want to add one)
    const installButton = document.getElementById('installButton');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
          }
          deferredPrompt = null;
        });
      });
    }
  });
}

// ====================================
// INITIALIZATION
// ====================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize core managers
  window.themeManager = new ThemeManager();
  window.toastManager = new ToastManager();
  window.navigationManager = new NavigationManager();
  window.itemManager = new ItemManager(window.toastManager);
  window.searchManager = new SearchManager(window.itemManager);
  window.formManager = new FormManager(window.toastManager);

  // Initialize modal
  window.imageModal = new ImageModal();

  // Setup additional features
  setupKeyboardShortcuts();
  setupAccessibility();
  setupNetworkMonitoring();
  setupPWAFeatures();
  
  // Optimize performance
  optimizeImageLoading();
  
  // Add touch feedback to interactive elements
  document.querySelectorAll('.contact-btn, .submit-btn, .quick-filter, .suggestion-item').forEach(el => {
    addTouchFeedback(el);
  });

  // Performance monitoring
  if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
      });
    });
    
    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  // Log initialization complete
  console.log('🚀 X-Marketplace initialized successfully!');
  
  // Show welcome message for first-time users
  if (!localStorage.getItem('hasVisited')) {
    setTimeout(() => {
      window.toastManager.show('👋 Welcome to X-Marketplace! Find great deals from fellow students.', 'info', 6000);
      localStorage.setItem('hasVisited', 'true');
    }, 1000);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Refresh data when user returns to tab
    if (window.itemManager && !isLoading) {
      console.log('Page became visible - refreshing data');
      // Optional: reload items if user has been away for a while
      const lastLoad = localStorage.getItem('lastItemLoad');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (!lastLoad || parseInt(lastLoad) < fiveMinutesAgo) {
        window.itemManager.loadItems();
        localStorage.setItem('lastItemLoad', Date.now());
      }
    }
  }
});

// Export for global access (useful for debugging)
window.XMarketplace = {
  themeManager: () => window.themeManager,
  toastManager: () => window.toastManager,
  navigationManager: () => window.navigationManager,
  itemManager: () => window.itemManager,
  searchManager: () => window.searchManager,
  formManager: () => window.formManager,
  version: '2.0.0',
  debug: () => {
    console.log('🔍 Debug Info:', {
      allItems: allItems.length,
      currentTheme: document.documentElement.getAttribute('data-theme'),
      deviceType: getDeviceType(),
      isOnline: navigator.onLine,
      touchSupport: isTouchDevice()
    });
  }
};