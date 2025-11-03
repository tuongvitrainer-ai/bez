// ========================================
// BEZ A.I. WEBSITE - INTERACTIVE FEATURES
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🤖 Bez A.I. Website Loaded Successfully! ', 'background: #3B82F6; color: white; padding: 10px; font-size: 16px; font-weight: bold;');

  // Initialize all features
  initFormValidation();
  initAlertSystem();
  initSmoothScroll();
  initNavHighlight();
  initCardAnimations();
  initParticleEffect();
  initButtonEffects();
});

// ========================================
// FORM VALIDATION
// ========================================
function initFormValidation() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[required], textarea[required]');

    // Real-time validation
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          validateField(input);
        }
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        showNotification('Please fill in all required fields correctly', 'error');
      }
    });
  });
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';

  if (!value) {
    isValid = false;
    errorMessage = 'This field is required';
  } else if (field.type === 'email' && !isValidEmail(value)) {
    isValid = false;
    errorMessage = 'Please enter a valid email address';
  } else if (field.type === 'password' && value.length < 6) {
    isValid = false;
    errorMessage = 'Password must be at least 6 characters';
  }

  if (!isValid) {
    field.style.borderColor = '#EF4444';
    field.classList.add('error');
    showFieldError(field, errorMessage);
  } else {
    field.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    field.classList.remove('error');
    removeFieldError(field);
  }

  return isValid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(field, message) {
  removeFieldError(field);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.color = '#FCA5A5';
  errorDiv.style.fontSize = '0.85rem';
  errorDiv.style.marginTop = '5px';
  errorDiv.textContent = message;
  field.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// ========================================
// ALERT SYSTEM
// ========================================
function initAlertSystem() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.minWidth = '300px';

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ========================================
// NAVIGATION HIGHLIGHT
// ========================================
function initNavHighlight() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath) {
      link.style.background = 'rgba(59, 130, 246, 0.2)';
      link.style.color = '#60A5FA';
    }
  });
}

// ========================================
// CARD ANIMATIONS
// ========================================
function initCardAnimations() {
  const cards = document.querySelectorAll('.feature-card, .dashboard-card');

  cards.forEach((card, index) => {
    // Staggered animation on load
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';

    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);

    // 3D tilt effect on hover
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// ========================================
// PARTICLE EFFECT
// ========================================
function initParticleEffect() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Create canvas for particles
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = '0.3';
  hero.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;

  const particles = [];
  const particleCount = 50;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }

    draw() {
      ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 100)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });

    requestAnimationFrame(animate);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  });
}

// ========================================
// BUTTON EFFECTS
// ========================================
function initButtonEffects() {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();

      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// AJAX request helper
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Debounce function for performance
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

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export utilities
window.bezUtils = {
  fetchData,
  debounce,
  throttle,
  showNotification
};

// Log version
console.log('%cBez A.I. v1.0.0', 'color: #60A5FA; font-weight: bold;');
