// Simple interactive elements and smooth scrolling logic
document.addEventListener('DOMContentLoaded', () => {

    // Header scroll effect
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Account for fixed header height
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple Intersection Observer for scroll animations
    const animatedElements = document.querySelectorAll('.change-card, .learn-list li, .bonus-card, .intro-image-wrapper img, .audience-image-wrapper img');

    // Add initial styles for animation
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // --- Bonus Lock Logic ---
    const bonusCards = document.querySelectorAll('.bonus-card');
    const hasJoinedCommunity = localStorage.getItem('joinedCommunity') === 'true';

    bonusCards.forEach(card => {
        if (!hasJoinedCommunity) {
            card.classList.add('locked');
            card.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Please register and join the WhatsApp community to unlock the bonus tools.');
            });
        } else {
            card.classList.remove('locked');
        }
    });

    // --- Live Stats Logic ---
    async function fetchStats() {
        try {
            const google_script_url = 'https://script.google.com/macros/s/AKfycbwosdU9Gb7l10bRlCVaZ1diuM_U7nECnJQMk9HvyLVX2wvyuryzMMljp87O2-wgf0Dizw/exec';

            // Fetch the count from your App Script (requires doGet function)
            const response = await fetch(google_script_url);

            // If Google App Script returns HTML error (doGet not found), response.ok is actually true but it's not JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                document.getElementById('stats-registered').innerText = data.totalRegistered || 0;
                document.getElementById('stats-community').innerText = data.totalRegistered || 0;
            } else {
                throw new Error("App Script did not return JSON. Did you deploy doGet as a NEW version?");
            }
        } catch (error) {
            console.warn('Google Script doGet not ready yet:', error.message);
            // Fallback to the count currently in your sheet so it doesn't show 0
            document.getElementById('stats-registered').innerText = '1';
            document.getElementById('stats-community').innerText = '1';
        }
    }
    fetchStats();

    // --- Registration Form Submission ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerText = 'Registering...';

            try {
                const google_script_url = 'https://script.google.com/macros/s/AKfycbzqw13Vkxui4FPICJzHjwV_BW7kdGWSHl4tF69XugCF306h3SflzDk-cEF71Q4IbOCi/exec';

                // We send with no-cors to avoid CORS preflight issues if the App Script doesn't handle OPTIONS
                // Content-Type must be text/plain so the browser doesn't block the request
                await fetch(google_script_url, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ name, email, phone })
                });

                // Increment the local count to show the user it was recorded
                const statsEl = document.getElementById('stats-registered');
                if (statsEl) {
                    let currentCount = parseInt(statsEl.innerText) || 0;
                    statsEl.innerText = currentCount + 1;
                }

                // Open thank you page in a new tab
                window.open('thankyou.html', '_blank');

                // Reset button state on original page
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit Registration';
                closeRegisterModal();
                registerForm.reset();
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit Registration';
            }
        });
    }
});

// --- Modal Global Functions ---
window.openRegisterModal = function () {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
};

window.closeRegisterModal = function () {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Close modal when clicking outside content
window.addEventListener('click', (e) => {
    const modal = document.getElementById('registerModal');
    if (e.target === modal) {
        closeRegisterModal();
    }
});
