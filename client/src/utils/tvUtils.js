/**
 * Utility functions for Android TV optimization
 */

// Configure focus navigation for TV remote
export const setupTVNavigation = () => {
  // Add data-nav-* attributes to make navigation more predictable
  const setupSpatialNavigation = () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Add navigation attributes
    focusableElements.forEach((el, index) => {
      el.setAttribute('data-nav-index', index.toString());
      
      // Set initial focus on the first element
      if (index === 0) {
        setTimeout(() => {
          el.focus();
        }, 100);
      }
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      const currentElement = document.activeElement;
      const currentIndex = parseInt(currentElement.getAttribute('data-nav-index') || '-1');
      
      if (currentIndex === -1) return;
      
      let nextIndex;
      
      // Handle arrow keys
      switch (e.key) {
        case 'ArrowUp':
          nextIndex = currentIndex - 1;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex + 1;
          break;
        default:
          return;
      }
      
      // Find the next element to focus
      if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        e.preventDefault();
        focusableElements[nextIndex].focus();
      }
    });
  };
  
  // Call setup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSpatialNavigation);
  } else {
    setupSpatialNavigation();
  }
};

// Lazy load images and videos
export const lazyLoadMedia = () => {
  // Use Intersection Observer to load media only when visible
  if ('IntersectionObserver' in window) {
    const mediaElements = document.querySelectorAll('img[data-src], video[data-src]');
    
    const loadMedia = (element) => {
      const src = element.getAttribute('data-src');
      if (!src) return;
      
      if (element.tagName === 'IMG') {
        element.src = src;
      } else if (element.tagName === 'VIDEO') {
        element.src = src;
        // Preload video but don't play until visible
        element.load();
      }
      
      element.removeAttribute('data-src');
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMedia(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px', // Load when within 100px of viewport
      threshold: 0.1
    });
    
    mediaElements.forEach((element) => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers without Intersection Observer
    const mediaElements = document.querySelectorAll('img[data-src], video[data-src]');
    mediaElements.forEach((element) => {
      const src = element.getAttribute('data-src');
      if (!src) return;
      
      if (element.tagName === 'IMG') {
        element.src = src;
      } else if (element.tagName === 'VIDEO') {
        element.src = src;
        element.load();
      }
      
      element.removeAttribute('data-src');
    });
  }
};

// Prevent screen saver by simulating activity
export const preventScreenSaver = () => {
  // Create a hidden video element that plays silently
  const video = document.createElement('video');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('width', '1');
  video.setAttribute('height', '1');
  video.style.position = 'absolute';
  video.style.opacity = '0.01';
  document.body.appendChild(video);

  // Create a canvas with minimal activity
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', '1');
  canvas.setAttribute('height', '1');
  canvas.style.position = 'absolute';
  canvas.style.opacity = '0.01';
  document.body.appendChild(canvas);

  // Draw something different to the canvas periodically
  const ctx = canvas.getContext('2d');
  let i = 0;
  setInterval(() => {
    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#000001';
    ctx.fillRect(0, 0, 1, 1);
    i++;
  }, 30000); // Every 30 seconds
}; 