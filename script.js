// ===============================
// Parallax Scrolling Effect
// ===============================
function parallaxScroll() {
    const scrolled = window.pageYOffset;

    // Parallax for background shapes
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        const speed = 0.1 + (index * 0.05);
        const yPos = -(scrolled * speed);
        shape.style.transform = `translateY(${yPos}px)`;
    });

    // Parallax for additional layers
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    parallaxLayers.forEach(layer => {
        const speed = layer.getAttribute('data-speed') || 0.5;
        const yPos = -(scrolled * speed);
        layer.style.transform = `translateY(${yPos}px)`;
    });

    // Parallax for hero section
    const heroImage = document.querySelector('.hero-image');
    if (heroImage && scrolled < window.innerHeight) {
        const parallax = scrolled * 0.5;
        heroImage.style.transform = `translateY(${parallax}px)`;
    }
}

// Use requestAnimationFrame for smooth parallax
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            parallaxScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// ===============================
// Smooth Scroll for Navigation Links
// ===============================
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

// ===============================
// Scroll Reveal Animation
// ===============================
function reveal() {
    const reveals = document.querySelectorAll('.about-card, .timeline-item, .skill-category, .reference-card, .contact-card');

    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('reveal', 'active');
        }
    });
}

window.addEventListener('scroll', reveal);
reveal(); // Call once on load

// ===============================
// Navbar Background on Scroll
// ===============================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 10px 30px rgba(210, 105, 30, 0.2)';
    } else {
        navbar.style.boxShadow = '0 5px 15px rgba(210, 105, 30, 0.15)';
    }

    lastScroll = currentScroll;
});

// ===============================
// Active Navigation Link Highlighting
// ===============================
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href').substring(1) === current) {
            link.style.color = 'var(--primary)';
        }
    });
});

// ===============================
// Physics-Based Rope/String Cursor Effect
// ===============================
if (window.innerWidth > 768) {
    class RopePoint {
        constructor(x, y, isFixed = false) {
            this.x = x;
            this.y = y;
            this.oldX = x;
            this.oldY = y;
            this.isFixed = isFixed;
            this.radius = 3;
        }

        update() {
            if (this.isFixed) return;

            const velocityX = this.x - this.oldX;
            const velocityY = this.y - this.oldY;

            this.oldX = this.x;
            this.oldY = this.y;

            // Apply velocity with damping
            this.x += velocityX * 0.97;
            this.y += velocityY * 0.97;

            // Apply gravity (medium strength for medium length string)
            this.y += 0.6;
        }

        constrain(maxX, maxY) {
            if (this.x < 0) this.x = 0;
            if (this.x > maxX) this.x = maxX;
            if (this.y < 0) this.y = 0;
            if (this.y > maxY) this.y = maxY;
        }
    }

    class Rope {
        constructor(x, y, segments = 20, segmentLength = 15) {
            this.points = [];
            this.segmentLength = segmentLength;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');

            // Setup canvas
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 9999;
            `;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            document.body.appendChild(this.canvas);

            // Create rope points
            for (let i = 0; i < segments; i++) {
                const point = new RopePoint(
                    x,
                    y + i * segmentLength,
                    i === 0 // First point is fixed to cursor
                );
                this.points.push(point);
            }

            this.mouseX = x;
            this.mouseY = y;
            this.lastMouseMoveTime = Date.now();
        }

        updateMousePosition(x, y) {
            this.mouseX = x;
            this.mouseY = y;
            this.lastMouseMoveTime = Date.now();
        }

        update() {
            // Update first point to follow cursor
            this.points[0].x = this.mouseX;
            this.points[0].y = this.mouseY;

            // Update all points
            for (let point of this.points) {
                point.update();
                point.constrain(this.canvas.width, this.canvas.height);
            }

            // Apply distance constraints (Verlet integration)
            for (let i = 0; i < 3; i++) { // Multiple iterations for stability
                for (let j = 0; j < this.points.length - 1; j++) {
                    const p1 = this.points[j];
                    const p2 = this.points[j + 1];

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const difference = this.segmentLength - distance;
                    const percent = difference / distance / 2;

                    const offsetX = dx * percent;
                    const offsetY = dy * percent;

                    if (!p1.isFixed) {
                        p1.x -= offsetX;
                        p1.y -= offsetY;
                    }
                    if (!p2.isFixed) {
                        p2.x += offsetX;
                        p2.y += offsetY;
                    }
                }
            }
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw rope segments
            this.ctx.strokeStyle = '#D2691E';
            this.ctx.lineWidth = 2.5;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Create gradient for rope
            const gradient = this.ctx.createLinearGradient(
                this.points[0].x,
                this.points[0].y,
                this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y
            );
            gradient.addColorStop(0, '#D2691E');
            gradient.addColorStop(0.5, '#8B4513');
            gradient.addColorStop(1, '#654321');

            this.ctx.strokeStyle = gradient;
            this.ctx.shadowColor = 'rgba(210, 105, 30, 0.4)';
            this.ctx.shadowBlur = 8;

            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);

            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            this.ctx.stroke();

            // Draw decorative beads along the string
            this.ctx.shadowBlur = 5;
            for (let i = 0; i < this.points.length; i += 4) {
                const point = this.points[i];
                const beadSize = i === this.points.length - 1 ? 5 : 3.5;
                const beadGradient = this.ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, beadSize
                );
                beadGradient.addColorStop(0, '#E8833A');
                beadGradient.addColorStop(0.6, '#D2691E');
                beadGradient.addColorStop(1, '#8B4513');

                this.ctx.fillStyle = beadGradient;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, beadSize, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw larger end bead/weight
            this.ctx.shadowBlur = 7;
            const lastPoint = this.points[this.points.length - 1];
            const endBeadGradient = this.ctx.createRadialGradient(
                lastPoint.x, lastPoint.y, 0,
                lastPoint.x, lastPoint.y, 6
            );
            endBeadGradient.addColorStop(0, '#E8833A');
            endBeadGradient.addColorStop(0.5, '#D2691E');
            endBeadGradient.addColorStop(1, '#8B4513');

            this.ctx.fillStyle = endBeadGradient;
            this.ctx.beginPath();
            this.ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    // Initialize rope - medium length, about half the original
    const rope = new Rope(window.innerWidth / 2, 100, 12, 10);

    // Update mouse position
    window.addEventListener('mousemove', (e) => {
        rope.updateMousePosition(e.clientX, e.clientY);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        rope.resize();
    });

    // Animation loop
    function animateRope() {
        rope.update();
        rope.draw();
        requestAnimationFrame(animateRope);
    }

    animateRope();
}

// ===============================
// Typewriter Effect for Hero Title
// ===============================
function typeWriter() {
    const subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;

    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.opacity = '1';
    let i = 0;

    function type() {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
            setTimeout(type, 50);
        }
    }

    setTimeout(type, 1000);
}

// Uncomment to enable typewriter effect
// window.addEventListener('load', typeWriter);

// ===============================
// Skill Tags Interaction
// ===============================
const skillTags = document.querySelectorAll('.skill-tag');

skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) rotate(3deg)';
    });

    tag.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) rotate(0deg)';
    });
});

// ===============================
// Timeline Items Animation Enhancement
// ===============================
const timelineItems = document.querySelectorAll('.timeline-item');

const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }, index * 200);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

timelineItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-50px)';
    item.style.transition = 'all 0.6s ease';
    observer.observe(item);
});

// ===============================
// About Cards Stagger Animation
// ===============================
const aboutCards = document.querySelectorAll('.about-card');

aboutCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.2}s`;
});

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

aboutCards.forEach(card => cardObserver.observe(card));

// ===============================
// Contact Cards Hover Effect
// ===============================
const contactCards = document.querySelectorAll('.contact-card');

contactCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        const icon = this.querySelector('.contact-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
            icon.style.transition = 'transform 0.3s ease';
        }
    });

    card.addEventListener('mouseleave', function() {
        const icon = this.querySelector('.contact-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// ===============================
// Loading Animation
// ===============================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ===============================
// Button Ripple Effect
// ===============================
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            left: ${x}px;
            top: ${y}px;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===============================
// Scroll Progress Indicator
// ===============================
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #D2691E, #8B4513);
    z-index: 10000;
    transition: width 0.1s ease;
    border-radius: 0 10px 10px 0;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
});

// ===============================
// Console Easter Egg
// ===============================
console.log('%c👋 Hello there!', 'color: #D2691E; font-size: 24px; font-weight: bold;');
console.log('%cLooking to get in touch? Email me at henokhailu37@gmail.com', 'color: #8B4513; font-size: 14px;');
console.log('%c✨ This portfolio was built with HTML, CSS, and vanilla JavaScript', 'color: #CD853F; font-size: 12px;');
