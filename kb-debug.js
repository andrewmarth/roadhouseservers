// Temporary (loaded only with ?kbdebug=1): records how the Show Times sheet follows the phone's keyboard, to find what
// makes it jitter. Every keyboard / viewport event, and on every frame while the sheet is open: how long the frame took,
// where the sheet's top is, the form's height and the keyboard state keyboard-fit.js set. "Copy Log" in the sheet's
// header copies it all.
const t0 = performance.now();
const log = [];
const ms = () => Math.round(performance.now() - t0);
const add = (...parts) => { log.push(ms() + ' ' + parts.filter(Boolean).join(' ')); if (log.length > 2000) log.shift(); };
const vv = window.visualViewport;
const vk = navigator.virtualKeyboard;
const probe = () => document.querySelector('div[aria-hidden][style*="keyboard-inset-height"]');
const probeH = () => { const p = probe(); return p ? Math.round(p.getBoundingClientRect().height) : 'none'; };

add('start', 'ih=' + innerHeight, 'iw=' + innerWidth, 'dpr=' + devicePixelRatio, 'vk=' + !!vk,
    'standalone=' + matchMedia('(display-mode: standalone)').matches, navigator.userAgent);
if (vk) vk.addEventListener('geometrychange', () => {
    const r = vk.boundingRect;
    add('vk-geometry', 'y=' + Math.round(r.y), 'h=' + Math.round(r.height), 'overlays=' + vk.overlaysContent, 'probe=' + probeH());
    requestAnimationFrame(() => add('vk-geometry+1frame', 'probe=' + probeH()));
});
if (vv) {
    vv.addEventListener('resize', () => add('vv-resize', 'h=' + Math.round(vv.height), 'top=' + Math.round(vv.offsetTop), 'ih=' + innerHeight));
    vv.addEventListener('scroll', () => add('vv-scroll', 'top=' + Math.round(vv.offsetTop), 'h=' + Math.round(vv.height)));
}
window.addEventListener('resize', () => add('window-resize', 'ih=' + innerHeight));
const what = el => (el && (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName)) || '?';
document.addEventListener('pointerdown', e => add('pointerdown', what(e.target)), true);
document.addEventListener('click', e => add('click', what(e.target)), true);
document.addEventListener('focusin', e => add('focusin', what(e.target)));
document.addEventListener('focusout', e => add('focusout', what(e.target)));

// Every frame while the sheet is open
let last = 0, prev = '';
function frame(ts) {
    const d = document.querySelector('dialog.rh-dialog[open]');
    if (d) {
        const dt = Math.round(ts - last);
        const top = Math.round(d.getBoundingClientRect().top);
        const form = d.querySelector('.sheet-form');
        const h = form ? Math.round(form.getBoundingClientRect().height) : 0;
        const kb = (d.classList.contains('is-keyboard') ? 'up' : 'down') + ' lift=' + (d.style.getPropertyValue('--kb-lift') || '-')
            + ' visible=' + (d.style.getPropertyValue('--kb-visible') || '-');
        const now = 'top=' + top + ' h=' + h + ' ' + kb;
        if (now !== prev || dt > 24) add('frame', 'dt=' + dt, now);
        prev = now;
        addButton(d);
    }
    last = ts;
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// The Copy Log button, in the open sheet's header (the page behind a modal sheet can't be tapped)
function addButton(d) {
    const head = d.querySelector('.dialog-head');
    if (!head || head.querySelector('[data-kb-copy]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.kbCopy = '';
    b.textContent = 'Copy Log';
    b.style.cssText = 'margin-left:auto;margin-right:8px;padding:6px 12px;border-radius:999px;border:1px solid #c79048;background:none;color:#c79048;font:inherit;font-size:0.85rem';
    b.addEventListener('click', async () => {
        const text = log.join('\n');
        try { await navigator.clipboard.writeText(text); b.textContent = 'Copied ' + log.length + ' lines'; }
        catch (e) { b.textContent = 'Copy failed'; console.log(text); }
    });
    head.insertBefore(b, head.querySelector('.close-btn'));
}
