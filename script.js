import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Counter animation for statistics
    animateStatistics();
    
    // Browser mockup content interaction
    initBrowserMockup();
    
    // Smooth scrolling for navigation links
    initSmoothScrolling();
    
    // Form submission handler
    initContactForm();
    
    // Mobile navigation toggle (for responsive design)
    initMobileNav();
    
    // Add download button handlers
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'https://github.com/heyaryx/safesphere';
        });
    });
});

function animateStatistics() {
    const statElements = document.querySelectorAll('.stat-number');
    
    statElements.forEach(stat => {
        const target = parseInt(config.stats[stat.id]); // Use values from config
        let currentValue = 0;
        const duration = 2000; // 2 seconds
        const isPercentage = stat.id === 'screen-time';
        
        const startTime = Date.now();
        
        function updateCounter() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            currentValue = Math.floor(target * progress);
            
            if (isPercentage) {
                stat.textContent = `${currentValue}%`;
            } else {
                stat.textContent = currentValue.toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }
        
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                requestAnimationFrame(updateCounter);
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        
        observer.observe(stat);
    });
}

function initBrowserMockup() {
    const browserContent = document.querySelector('.browser-content');
    
    if (!browserContent) return;
    
    // Simulate content filtering
    setInterval(() => {
        const contentItems = browserContent.querySelectorAll('.content-item');
        const randomIndex = Math.floor(Math.random() * contentItems.length);
        
        // Remove previous blocked status
        contentItems.forEach(item => {
            if (item.classList.contains('blocked')) {
                item.classList.remove('blocked');
                const overlay = item.querySelector('.blocked-overlay');
                if (overlay) overlay.remove();
            }
        });
        
        // Add blocked status to random item
        const selectedItem = contentItems[randomIndex];
        selectedItem.classList.add('blocked');
        
        const blockedOverlay = document.createElement('div');
        blockedOverlay.className = 'blocked-overlay';
        
        // Create SVG icon
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "shield-icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "30");
        svg.setAttribute("height", "30");
        
        const path1 = document.createElementNS(svgNS, "path");
        path1.setAttribute("d", "M10 2 L3 5 L3 11 C3 14.5 5.5 17.5 10 19 C14.5 17.5 17 14.5 17 11 L17 5 L10 2 Z");
        path1.setAttribute("fill", "#4CAF50");
        
        const path2 = document.createElementNS(svgNS, "path");
        path2.setAttribute("d", "M7 10 L9 12 L13 8");
        path2.setAttribute("stroke", "#fff");
        path2.setAttribute("stroke-width", "2");
        path2.setAttribute("stroke-linecap", "round");
        path2.setAttribute("stroke-linejoin", "round");
        path2.setAttribute("fill", "none");
        
        svg.appendChild(path1);
        svg.appendChild(path2);
        
        const span = document.createElement('span');
        span.textContent = 'Content Filtered';
        
        blockedOverlay.appendChild(svg);
        blockedOverlay.appendChild(span);
        
        selectedItem.appendChild(blockedOverlay);
    }, 3000);
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simple validation
        const inputs = contactForm.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'var(--danger-color)';
            } else {
                input.style.borderColor = '#E0E0E0';
            }
        });
        
        if (isValid) {
            // Simulate form submission
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                alert('Thanks for your message! We will get back to you soon.');
                inputs.forEach(input => input.value = '');
                submitButton.textContent = 'Send Message';
                submitButton.disabled = false;
            }, 1500);
        }
    });
}

function initMobileNav() {
    // This would typically handle a mobile menu toggle
    // For this landing page, we're keeping it simple
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Add scroll-based header style changes
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
}