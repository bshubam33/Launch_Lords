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
    let rotation = [20, -20, 0];
    projection.rotate(rotation);

    // Load World Data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
        const land = topojson.feature(world, world.objects.countries);

        // Setup Drag Interaction
        const drag = d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded);

        d3.select(canvas).call(drag);

        let v0, r0, q0;
        let isDragging = false;
        let autoSpin = true;
        let spinTime = 0;

        function dragStarted(event) {
            isDragging = true;
            autoSpin = false;
            v0 = versor.cartesian(projection.invert([event.x, event.y]));
            r0 = projection.rotate();
            q0 = versor(r0);
            canvas.style.cursor = 'grabbing';
        }

        function dragged(event) {
            const v1 = versor.cartesian(projection.rotate(r0).invert([event.x, event.y]));
            const q1 = versor.multiply(q0, versor.delta(v0, v1));
            const r1 = versor.rotation(q1);
            projection.rotate(r1);
        }

        function dragEnded() {
            isDragging = false;
            canvas.style.cursor = 'grab';

            // Resume spin after delay
            setTimeout(() => { if (!isDragging) autoSpin = true; }, 3000);
        }

        // Animation Loop
        function render(time) {
            const isLight = document.body.classList.contains('light-theme');
            colors = {
                water: isLight ? '#f8fafc' : '#05070a',
                land: isLight ? '#e2e8f0' : '#0a1520',
                landStroke: isLight ? '#cbd5e1' : '#112233',
                point: isLight ? '#0d9488' : '#d4b886'
            };
            const pingColor = isLight ? '13, 148, 136' : '212, 184, 134';
            const vignetteColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.8)';

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
                        // Draw point
                        context.beginPath();
                        context.arc(xy[0], xy[1], 3, 0, 2 * Math.PI);
                        context.fillStyle = colors.point;
                        context.fill();

                        // Draw Ping (animation based on time)
                        const pulseSize = ((time % 2000) / 2000) * 15;
                        const pulseOpacity = 1 - ((time % 2000) / 2000);
                        context.beginPath();
                        context.arc(xy[0], xy[1], pulseSize, 0, 2 * Math.PI);
                        context.strokeStyle = `rgba(${pingColor}, ${pulseOpacity})`;
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

// Very minimal Versor implementation for smooth quaternion D3 dragging
const versor = (function () {
    const acos = Math.acos, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, atan2 = Math.atan2;
    function v(e) { const n = e[0] * Math.PI / 180, t = e[1] * Math.PI / 180, r = e[2] * Math.PI / 180, o = cos(n / 2), a = cos(t / 2), c = cos(r / 2), i = sin(n / 2), s = sin(t / 2), u = sin(r / 2); return [o * a * c + i * s * u, i * a * c - o * s * u, o * s * c + i * a * u, o * a * u - i * s * c] }
    v.cartesian = function (e) { const n = e[0] * Math.PI / 180, t = e[1] * Math.PI / 180, r = cos(t); return [r * cos(n), r * sin(n), sin(t)] };
    v.rotation = function (e) { const n = e[0], t = e[1], r = e[2], o = e[3], a = 2 * (n * t + r * o), c = n * n - t * t - r * r + o * o, i = 2 * (t * o - n * r), s = 2 * (n * o + t * r), u = n * n + t * t - r * r - o * o; return [Math.atan2(a, c) * 180 / Math.PI, Math.asin(Math.max(-1, Math.min(1, i))) * 180 / Math.PI, Math.atan2(s, u) * 180 / Math.PI] };
    v.multiply = function (e, n) { const t = e[0], r = e[1], o = e[2], a = e[3], c = n[0], i = n[1], s = n[2], u = n[3]; return [t * c - r * i - o * s - a * u, t * i + r * c + o * u - a * s, t * s - r * u + o * c + a * i, t * u + r * s - o * i + a * c] };
    v.delta = function (e, n) { const t = function (e, n) { return e[0] * n[0] + e[1] * n[1] + e[2] * n[2] }(e, n), r = function (e, n) { return [e[1] * n[2] - e[2] * n[1], e[2] * n[0] - e[0] * n[2], e[0] * n[1] - e[1] * n[0]] }(e, n), o = acos(Math.max(-1, Math.min(1, t))), a = sin(o); return a ? [cos(o / 2), r[0] * sin(o / 2) / a, r[1] * sin(o / 2) / a, r[2] * sin(o / 2) / a] : [1, 0, 0, 0] };
    return v;
})();

// Init after DOM load
document.addEventListener("DOMContentLoaded", function () {
    initGlobe();
});
