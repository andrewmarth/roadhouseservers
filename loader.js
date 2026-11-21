// Loading screen animation: the text cycles through theater phrases while
// the icon morphs from one drawing into the next. Every icon is a set of strokes; each stroke is sampled
// into the same number of points, and the points glide to the matching stroke of the next icon.
(function () {
    const STEPS = [
        { text: 'Popping the popcorn...', icon: ['M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4', 'M10 22 9 8', 'M14 22l1-14', 'M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1z'] },
        { text: 'Dimming the lights...', icon: ['M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'] },
        { text: 'Rolling the trailers...', icon: ['M3 3h18v18H3z', 'M7 3v18', 'M17 3v18', 'M3 12h18', 'M3 7.5h4', 'M3 16.5h4', 'M17 7.5h4', 'M17 16.5h4'] },
        { text: 'Pouring the drinks...', icon: ['M6 8l1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8', 'M5 8h14', 'M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0', 'M12 8l1-6h2'] },
        { text: 'Setting the tables...', icon: ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7'] },
        { text: 'Firing the orders...', icon: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z'] },
        { text: 'Cueing the movie...', icon: ['M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z', 'M6.2 5.3l3.1 3.9', 'M12.4 3.4l3.1 4', 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'] },
    ];
    const POINTS = 80;
    const HOLD = 1300;   // ms each phrase stays up
    const MORPH = 650;   // ms for one icon to turn into the next

    const loader = document.querySelector('.page-loader');
    if (!loader) return;
    const svg = loader.querySelector('.loader-icon');
    const label = loader.querySelector('.page-loader-text');
    const badge = loader.querySelector('.loader-badge');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';

    // Sample every stroke of every icon into POINTS points (measured in a hidden SVG)
    const probe = document.createElementNS(NS, 'svg');
    probe.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden');
    document.body.append(probe);
    const sample = d => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        probe.append(p);
        const len = p.getTotalLength();
        const pts = [];
        for (let i = 0; i < POINTS; i++) {
            const pt = p.getPointAtLength(len * i / (POINTS - 1));
            pts.push([pt.x, pt.y]);
        }
        p.remove();
        return pts;
    };
    const icons = STEPS.map(s => s.icon.map(sample));
    probe.remove();
    const MAX = Math.max(...icons.map(i => i.length));

    const paths = Array.from({ length: MAX }, () => {
        const p = document.createElementNS(NS, 'path');
        svg.append(p);
        return p;
    });

    const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    const centroid = pts => pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length], [0, 0]);
    const isClosed = pts => dist2(pts[0], pts[pts.length - 1]) < 0.25;
    const cost = (a, b) => a.reduce((sum, p, i) => sum + dist2(p, b[i]), 0);

    // Line the target stroke up with the source so points travel the shortest way
    // (closed shapes can start anywhere along their outline; any stroke can run backwards)
    function align(from, to) {
        const options = [to, to.slice().reverse()];
        if (isClosed(to)) {
            const ring = to.slice(0, -1);
            for (const dir of [ring, ring.slice().reverse()]) {
                for (let k = 0; k < ring.length; k += 2) {
                    const r = dir.slice(k).concat(dir.slice(0, k));
                    options.push(r.concat([r[0]]));
                }
            }
        }
        let best = options[0], bestCost = Infinity;
        options.forEach(o => { const c = cost(from, o); if (c < bestCost) { bestCost = c; best = o; } });
        return best;
    }
    const nearestPoint = (strokes, target) => {
        let best = strokes[0][0], bestD = Infinity;
        strokes.forEach(s => s.forEach(p => { const d = dist2(p, target); if (d < bestD) { bestD = d; best = p; } }));
        return best;
    };

    // Pair up the strokes of two icons; extra strokes grow out of (or shrink into) the nearest point of the other icon
    function plan(a, b) {
        const pairs = [];
        const left = b.map((s, i) => i);
        a.forEach(sa => {
            if (!left.length) {
                const point = nearestPoint(b, centroid(sa));
                pairs.push([sa, sa.map(() => point)]);
                return;
            }
            const ca = centroid(sa);
            left.sort((i, j) => dist2(ca, centroid(b[i])) - dist2(ca, centroid(b[j])));
            const sb = b[left.shift()];
            pairs.push([sa, align(sa, sb)]);
        });
        left.forEach(i => {
            const point = nearestPoint(a, centroid(b[i]));
            pairs.push([b[i].map(() => point), b[i]]);
        });
        return pairs;
    }

    const toD = pts => 'M' + pts.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L');
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function draw(pairs, t) {
        paths.forEach((p, i) => {
            const pair = pairs[i];
            if (!pair) { p.setAttribute('d', ''); return; }
            p.setAttribute('d', toD(pair[0].map((q, j) => [q[0] + (pair[1][j][0] - q[0]) * t, q[1] + (pair[1][j][1] - q[1]) * t])));
        });
    }

    let index = 0;
    draw(icons[0].map(s => [s, s]), 1);
    label.textContent = STEPS[0].text;
    const running = () => document.body.classList.contains('is-checking');

    function next() {
        if (!running()) return;
        const from = icons[index];
        index = (index + 1) % STEPS.length;
        const to = icons[index];

        // Text slides out, then the new phrase slides in halfway through the morph
        label.classList.add('is-leaving');
        setTimeout(() => {
            label.textContent = STEPS[index].text;
            label.classList.remove('is-leaving');
            label.classList.remove('is-entering');
            void label.offsetWidth;
            label.classList.add('is-entering');
        }, reduceMotion ? 0 : MORPH * 0.45);

        if (reduceMotion) {
            draw(to.map(s => [s, s]), 1);
        } else {
            const pairs = plan(from, to);
            badge.classList.remove('is-morphing');
            void badge.offsetWidth; // restart the badge's pop animation
            badge.classList.add('is-morphing');
            const start = performance.now();
            (function frame(now) {
                const t = Math.min(1, (now - start) / MORPH);
                draw(pairs, ease(t));
                if (t < 1 && running()) requestAnimationFrame(frame);
            })(start);
        }
        setTimeout(next, HOLD);
    }
    // The first phrase has been on screen since the page appeared (its text is in the HTML), and each new
    // phrase only lands partway into its morph, so start the first change early enough to match the rest
    setTimeout(next, Math.max(0, HOLD - MORPH * 0.45 - performance.now()));
})();
