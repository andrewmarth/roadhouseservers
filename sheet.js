// The pop-up look (a centered card on computers, a sheet that slides up from the bottom on phones) and the page lock
// while one is open. The page's own colors (:root in index.html) are used.
import { fitSheetToKeyboard } from '/keyboard-fit.js';

const CSS = `
.sheet {
    margin: auto; width: calc(100% - 40px); max-width: 640px; padding: 0;
    border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
    background: var(--panel); color: var(--text); overflow: visible;
}
.sheet::backdrop { background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
.sheet[open] { animation: sheetDialogIn 0.4s var(--ease); }
.sheet[open]::backdrop { animation: sheetFadeIn 0.3s ease; }
@keyframes sheetDialogIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes sheetFadeIn { from { opacity: 0; } to { opacity: 1; } }
.sheet .sheet-form { display: flex; flex-direction: column; max-height: calc(100vh - 48px); max-height: calc(100dvh - 48px); }
.sheet .dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px; padding: 24px 28px 0 28px; }
.sheet .dialog-head h2 { font-size: 1.9rem; line-height: 1.1; }
.sheet .close-btn {
    flex: 0 0 auto; width: 40px; height: 40px; margin: -4px -6px 0 0;
    display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: 50%; background: var(--raised); color: var(--text); cursor: pointer;
}
.sheet .close-btn svg { width: 18px; height: 18px; }
.sheet .muted { color: var(--muted); font-size: 0.95rem; padding: 0 28px; margin-bottom: 12px; }
.sheet .dialog-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px 28px 8px 28px; border-top: 1px solid var(--line); }
.sheet .dialog-foot { padding: 14px 28px 22px 28px; border-top: 1px solid var(--line); background: var(--bg); border-radius: 0 0 18px 18px; }
.sheet .form-message { min-height: 1.4em; margin: 12px 4px 0 4px; font-size: 0.92rem; font-weight: bold; color: var(--red); }
.sheet .form-message:empty { min-height: 0; margin: 0; }
.sheet .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.sheet .btn:disabled { opacity: 0.65; cursor: wait; transform: none; }
.sheet .ie-remove { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border: none; border-radius: 999px; background: none; cursor: pointer; font-family: inherit; font-size: 0.8rem; font-weight: bold; letter-spacing: 0; text-transform: none; color: var(--red); }
.sheet .ie-remove svg { width: 15px; height: 15px; }
@media (hover: hover) { .sheet .ie-remove:hover { background: rgba(237, 34, 39, 0.12); } }
.sheet .ie-add-entry { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; border: 2px dashed var(--line-strong); border-radius: 12px; background: none; cursor: pointer; font-family: 'Oswald', sans-serif; font-size: 1rem; letter-spacing: 1px; text-transform: uppercase; color: var(--gold); }
.sheet .ie-add-entry svg { width: 17px; height: 17px; }
.sheet .ie-add-entry[hidden] { display: none; }
@media (hover: hover) { .sheet .ie-add-entry:hover { border-color: var(--gold); } }
.sheet .field label { display: block; font-size: 0.9rem; font-weight: bold; margin: 0 0 8px 4px; }
.sheet .field input, .sheet .field select {
    width: 100%; min-height: 52px; padding: 12px 18px;
    border: 1px solid var(--line-strong); border-radius: 10px; background-color: var(--bg);
    font-family: inherit; font-size: 1.05rem; color: var(--text);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.sheet .field select {
    padding-right: 40px; appearance: none; -webkit-appearance: none;
    background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a7afb2' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center / 16px;
}
.sheet .field input:focus, .sheet .field select:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(199, 144, 72, 0.3); }
.sheet .is-invalid { border-color: var(--red) !important; box-shadow: 0 0 0 3px rgba(237, 34, 39, 0.25) !important; }

/* Phones: slides up from the bottom */
@media (max-width: 600px) {
    .sheet { width: 100%; max-width: none; margin: auto 0 0 0; border-radius: 18px 18px 0 0; border-bottom: none; }
    .sheet[open] { animation: sheetUp 0.42s var(--ease); }
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: none; } }
    .sheet .sheet-form { max-height: 92vh; max-height: 92dvh; }
    .sheet .dialog-head { padding: 22px 20px 0 20px; }
    .sheet .muted { padding: 0 20px; }
    .sheet .dialog-scroll { padding: 4px 20px 8px 20px; }
    .sheet .dialog-foot { padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 16px) 20px; border-radius: 0; }
    .sheet .form-actions { flex-direction: column-reverse; }
    .sheet .form-actions .btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
    .sheet[open], .sheet[open]::backdrop { animation: none; }
}
`;

export function ensureDialogStyles() {
    if (document.getElementById('sheet-css')) return;
    const style = document.createElement('style');
    style.id = 'sheet-css';
    style.textContent = CSS;
    document.head.appendChild(style);
}

// While a pop-up is open, phones would still scroll the page behind it (overflow: hidden isn't enough on iOS), so the
// page is pinned where it is until the pop-up closes, then put back at the same spot. It also keeps the pop-up above the
// phone's on-screen keyboard (/keyboard-fit.js).
export function lockPageScroll(dialog) {
    fitSheetToKeyboard(dialog);
    const y = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const saved = { overflow: html.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right };
    html.style.overflow = 'hidden';
    Object.assign(body.style, { position: 'fixed', top: -y + 'px', left: '0', right: '0' });
    dialog.addEventListener('close', () => {
        html.style.overflow = saved.overflow;
        Object.assign(body.style, { position: saved.position, top: saved.top, left: saved.left, right: saved.right });
        window.scrollTo({ top: y, behavior: 'instant' });
    }, { once: true });
}
