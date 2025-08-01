// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate elements on scroll
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.step, .feature-card, .contact-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Contact Form Handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const subject = this.querySelector('input[type="text"]:nth-of-type(2)').value;
    const message = this.querySelector('textarea').value;
    
    // Basic validation
    if (!name || !email || !message) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Veuillez entrer une adresse email valide.');
        return;
    }
    
    // Simulate form submission
    const submitBtn = this.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Phone mockup animation
function animatePhoneMockup() {
    const phone = document.querySelector('.phone-mockup');
    if (phone) {
        phone.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) rotateY(-5deg)';
        });
        
        phone.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotateY(0deg)';
        });
    }
}

// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/\D/g, ''));
        const suffix = counter.textContent.replace(/\d/g, '');
        let current = 0;
        const increment = target / 100;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + suffix;
            }
        };
        
        // Start animation when element is visible
        const counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counterObserver.observe(counter);
    });
}

// Parallax effect for background elements
function parallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        const heroPattern = document.querySelector('.hero-pattern');
        if (heroPattern) {
            heroPattern.style.transform = `translateY(${rate}px)`;
        }
    });
}

// Initialize all animations
document.addEventListener('DOMContentLoaded', function() {
    animatePhoneMockup();
    animateCounters();
    parallaxEffect();
});

// Loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Feature cards hover effect
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-15px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Download button analytics (placeholder)
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Prevent default for demo
        e.preventDefault();
        
        const store = this.querySelector('.download-store').textContent;
        console.log(`Download clicked: ${store}`);
        
        // Show coming soon message for demo
        alert(`L'application sera bientôt disponible sur ${store} !`);
        
        // In production, you would track this event:
        // gtag('event', 'download_click', { store: store });
    });
});

// Social media links (placeholder)
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.textContent;
        alert(`Suivez-nous bientôt sur nos réseaux sociaux !`);
    });
});

// Add subtle animations to logo
const logoIcon = document.querySelector('.logo-icon');
if (logoIcon) {
    logoIcon.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(5deg)';
    });
    
    logoIcon.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
    });
}

// WhatsApp Business Floating Button
document.addEventListener('DOMContentLoaded', function() {
    const whatsappFloat = document.querySelector('#whatsapp-float');
    
    if (whatsappFloat) {
        // Debug: Ensure button is visible
        console.log('✅ WhatsApp button found and initializing...');
        whatsappFloat.style.display = 'block';
        whatsappFloat.style.visibility = 'visible';
        // WhatsApp Business phone number (replace with actual business number)
        const whatsappBusinessNumber = '+237622334455'; // Example Cameroon number
        
        whatsappFloat.addEventListener('click', function() {
            // Pre-filled message for customer support
            const message = encodeURIComponent(
                "Bonjour l'équipe Ezra Services! 👋\n\n" +
                "Je visite votre site web et j'aimerais en savoir plus sur vos services.\n\n" +
                "Pouvez-vous m'aider avec:\n" +
                "☑️ Informations sur les services disponibles\n" +
                "☑️ Prix et tarification\n" +
                "☑️ Comment télécharger l'application\n" +
                "☑️ Inscription comme prestataire\n\n" +
                "Merci! 🙏"
            );
            
            // Try to open WhatsApp app first, fallback to web
            const whatsappUrl = `https://wa.me/${whatsappBusinessNumber.replace(/[^\d]/g, '')}?text=${message}`;
            
            // Track click event
            console.log('WhatsApp Business contact initiated');
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            
            // Optional: Add analytics tracking
            // gtag('event', 'whatsapp_contact', {
            //     'event_category': 'customer_support',
            //     'event_label': 'floating_button'
            // });
        });

        // Show tooltip after a delay for first-time visitors
        setTimeout(() => {
            if (!localStorage.getItem('whatsapp_tooltip_seen')) {
                const tooltip = whatsappFloat.querySelector('.whatsapp-tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                    tooltip.style.transform = 'translateY(-50%) translateX(-5px)';
                    
                    // Hide after 3 seconds
                    setTimeout(() => {
                        tooltip.style.opacity = '0';
                        tooltip.style.visibility = 'hidden';
                        tooltip.style.transform = 'translateY(-50%)';
                        localStorage.setItem('whatsapp_tooltip_seen', 'true');
                    }, 3000);
                }
            }
        }, 2000);

        // Show tooltip on hover (as defined in CSS)
        whatsappFloat.addEventListener('mouseenter', function() {
            const tooltip = this.querySelector('.whatsapp-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
                tooltip.style.transform = 'translateY(-50%) translateX(-5px)';
            }
        });

        whatsappFloat.addEventListener('mouseleave', function() {
            const tooltip = this.querySelector('.whatsapp-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                tooltip.style.transform = 'translateY(-50%)';
            }
        });
    }
});

// Enhanced WhatsApp Integration for specific page sections
function initializeWhatsAppIntegration() {
    // Add WhatsApp contact options to specific sections
    const contactSection = document.querySelector('#contact');
    const heroSection = document.querySelector('#hero');
    
    // Add WhatsApp quick contact to hero section
    if (heroSection) {
        const heroButtons = heroSection.querySelector('.hero-buttons');
        if (heroButtons && !heroButtons.querySelector('.whatsapp-hero-btn')) {
            const whatsappHeroBtn = document.createElement('a');
            whatsappHeroBtn.className = 'btn-tertiary whatsapp-hero-btn';
            whatsappHeroBtn.innerHTML = '💬 Aide WhatsApp';
            whatsappHeroBtn.href = '#';
            whatsappHeroBtn.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector('#whatsapp-float').click();
            });
            heroButtons.appendChild(whatsappHeroBtn);
        }
    }
}

// Initialize WhatsApp integration when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeWhatsAppIntegration);