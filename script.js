document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-theme');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');
        });
    }

    // Set current year
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- Navbar Hide/Show on Scroll ---
    let lastScroll = 0;
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= 0) {
            navbar.classList.remove('hidden');
            return;
        }

        if (currentScroll > lastScroll && currentScroll > 100) {
            // scrolling down
            navbar.classList.add('hidden');
        } else {
            // scrolling up
            navbar.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    });

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');

    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');
            document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Intersection Observer for Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, observerOptions);

    // Observe Slabs (slide up)
    document.querySelectorAll('.anim-slab').forEach(el => {
        observer.observe(el);
    });

    // Observe Fades
    document.querySelectorAll('.anim-fade').forEach(el => {
        observer.observe(el);
    });

    // Observe Image/Block Reveals
    document.querySelectorAll('.anim-img-reveal').forEach(el => {
        observer.observe(el);
    });

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Close mobile menu if exists (not implemented in this simplified version but good practice)
            }
        });
    });
});

/* --- Interactive D3 Globe --- */
function initGlobe() {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = [width / 2, height / 2];

    // Colors matching the theme (will be dynamically computed per frame)
    let colors = {};

    // Client Cities (Longitude, Latitude)
    const cities = [
        { name: "Ireland", coords: [-8.2439, 53.4129] },
        { name: "London", coords: [-0.1278, 51.5074] },
        { name: "Belgium", coords: [4.4699, 50.5039] },
        { name: "Germany", coords: [10.4515, 51.1657] },
        { name: "India", coords: [78.9629, 20.5937] },
        { name: "USA", coords: [-95.7129, 37.0902] }
    ];

    // Setup Projection
    const projection = d3.geoOrthographic()
        .scale(195)
        .translate(center)
        .clipAngle(90)
        .precision(0.5);

    const path = d3.geoPath()
        .projection(projection)
        .context(context);

    // Initial Rotation
    // Load World Data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
        const land = topojson.feature(world, world.objects.countries);

        // Setup Drag Interaction
        const drag = d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded);

        d3.select(canvas).call(drag);

        let isDragging = false;
        let autoSpin = true;

        function dragStarted(event) {
            isDragging = true;
            autoSpin = false;
            canvas.style.cursor = 'grabbing';
        }

        function dragged(event) {
            const rotate = projection.rotate();
            // A sensitivity factor derived from scale makes the drag feel 1:1 mapped to the pointer
            const k = 75 / projection.scale();

            // event.dx is positive when dragging right -> rotate[0] (yaw) should increase
            // event.dy is positive when dragging down -> rotate[1] (pitch) should decrease to track perfectly
            projection.rotate([
                rotate[0] + event.dx * k,
                rotate[1] - event.dy * k,
                rotate[2]
            ]);
        }

        function dragEnded() {
            isDragging = false;
            canvas.style.cursor = 'grab';

            // Resume spin after a short delay of not touching
            setTimeout(() => { if (!isDragging) autoSpin = true; }, 3000);
        }

        // Animation Loop
        function render(time) {
            const isLight = document.body.classList.contains('light-theme');
            colors = {
                water: isLight ? '#f8fafc' : '#030508',
                land: isLight ? '#cbd5e1' : '#080b11',
                landStroke: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.04)',
                point: isLight ? '#0d9488' : '#d4b886'
            };
            const pingColor = isLight ? '13, 148, 136' : '212, 184, 134';
            const vignetteColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.85)';

            context.clearRect(0, 0, width, height);

            // Auto rotation
            if (autoSpin) {
                const rotate = projection.rotate();
                projection.rotate([rotate[0] + 0.2, rotate[1], rotate[2]]);
            }

            // Draw Water/Background (The sphere)
            context.beginPath();
            path({ type: "Sphere" });
            context.fillStyle = colors.water;
            context.fill();

            // Draw Land (Countries)
            context.beginPath();
            path(land);
            context.fillStyle = colors.land;
            context.fill();
            context.strokeStyle = colors.landStroke;
            context.lineWidth = 0.5;
            context.stroke();

            // Draw City Markers
            cities.forEach(city => {
                // Check if city is on the visible side of the globe
                const xy = projection(city.coords);
                if (xy) {
                    // Calculate "behind" logic. 
                    // geoOrthographic returns null if clipped out, but sometimes points near edge peek through.
                    // This creates a clean check.
                    const geoAngle = d3.geoDistance(city.coords, projection.invert(center));
                    if (geoAngle < Math.PI / 2) {

                        // Ambient Glow around the point
                        const glowGradient = context.createRadialGradient(xy[0], xy[1], 0, xy[0], xy[1], 15);
                        glowGradient.addColorStop(0, `rgba(${pingColor}, 0.5)`);
                        glowGradient.addColorStop(1, `rgba(${pingColor}, 0)`);

                        context.beginPath();
                        context.arc(xy[0], xy[1], 15, 0, 2 * Math.PI);
                        context.fillStyle = glowGradient;
                        context.fill();

                        // Draw point core
                        context.beginPath();
                        context.arc(xy[0], xy[1], 2, 0, 2 * Math.PI);
                        context.fillStyle = colors.point;
                        context.fill();

                        // Draw Ping (animation based on time)
                        const pulseSize = ((time % 2000) / 2000) * 15;
                        const pulseOpacity = 1 - ((time % 2000) / 2000);
                        context.beginPath();
                        context.arc(xy[0], xy[1], pulseSize, 0, 2 * Math.PI);
                        context.strokeStyle = `rgba(${pingColor}, ${pulseOpacity * 0.8})`;
                        context.lineWidth = 1;
                        context.stroke();

                        // Draw Label (optional, adds nice detail map-style)
                        context.fillStyle = `rgba(${pingColor}, 0.9)`;
                        context.font = isLight ? "600 10px Inter" : "10px Inter";
                        context.fillText(city.name, xy[0] + 6, xy[1] + 3);
                    }
                }
            });

            // Add inner shadow/vignette overlay for 3D feel
            const gradient = context.createRadialGradient(
                width / 2, height / 2, width / 2 * 0.7,
                width / 2, height / 2, width / 2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, vignetteColor);

            context.beginPath();
            path({ type: "Sphere" });
            context.fillStyle = gradient;
            context.fill();

            requestAnimationFrame(render);
        }

        // Start loop
        requestAnimationFrame(render);
    });
}



// Init after DOM load
document.addEventListener("DOMContentLoaded", function () {
    initGlobe();

    // Dynamically update FormSubmit redirect to work on localhost & live domain
    document.querySelectorAll('input[name="_next"]').forEach(input => {
        input.value = window.location.origin + '/thanks.html';
    });
});

// Application Modal Logic
function openApplicationModal(roleName) {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        document.getElementById('modalRoleTitle').innerText = 'Apply for ' + roleName;
        document.getElementById('modalRoleInput').value = roleName;
        document.getElementById('modalSubject').value = 'New Application: ' + roleName;
        modal.classList.add('active');
    }
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on click outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('applicationModal');
    if (e.target === modal) {
        closeApplicationModal();
    }
});
