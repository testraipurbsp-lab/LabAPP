/* ==========================================================================
   icons.js — self-hosted inline SVG icon set (Lucide/Feather-style paths).
   Replaces the external Font Awesome CDN so icons never fail to render,
   regardless of network/CDN availability. Every icon used in the app is
   defined once here and reused everywhere via VLAB.icon(name).
   ========================================================================== */
(function(){
  const ICONS = {
    flask: '<path d="M9 2v6.5L4.5 17a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 8.5V2"/><path d="M9 2h6"/><path d="M7.5 14h9"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
    stethoscope: '<path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 15a4 4 0 1 0 8 0v-3"/><circle cx="19" cy="8" r="2"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    wallet: '<path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M18 13h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/>',
    'pie-chart': '<path d="M21.2 15.3A10 10 0 1 1 8.7 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    menu: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    users: '<circle cx="9" cy="8" r="3.3"/><path d="M2.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16.5 5.2a3.3 3.3 0 0 1 0 6.4"/><path d="M21.5 20.5c0-2.8-1.9-5.1-4.5-5.9"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5Z"/>',
    'chevrons-left': '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M6 17v4h12v-4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-3.9"/><path d="M8.6 13.5l6.8 3.9"/>',
    link: '<path d="M9 15l6-6"/><path d="M13 5.5l1-1a4 4 0 1 1 5.5 5.5l-2 2"/><path d="M11 18.5l-1 1a4 4 0 1 1-5.5-5.5l2-2"/>',
    trash: '<path d="M4 7h16"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    save: '<path d="M18 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2Z"/><path d="M7 4v5h8V4"/><path d="M7 14h10v6H7z"/>',
    camera: '<path d="M4 8a2 2 0 0 1 2-2h1.2l1.1-1.8A2 2 0 0 1 10 3.3h4a2 2 0 0 1 1.7.9L16.8 6H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9.5"/><path d="m8 12.5 2.5 2.5L16 9.5"/>',
    'x-circle': '<circle cx="12" cy="12" r="9.5"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>',
    'alert-triangle': '<path d="M10.3 3.9 1.9 18a1.7 1.7 0 0 0 1.5 2.6h17.2a1.7 1.7 0 0 0 1.5-2.6L13.7 3.9a1.7 1.7 0 0 0-3.4 0Z"/><path d="M12 9v4.5"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
    phone: '<path d="M4.5 3h3.4l1.7 4.6L7.7 9.4a12 12 0 0 0 6.9 6.9l1.8-1.9L21 16v3.5a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3 4.6 1.5 1.5 0 0 1 4.5 3Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    paperclip: '<path d="M21 12.5 12.4 21a5 5 0 1 1-7-7L14 5.4a3.3 3.3 0 1 1 4.7 4.7L10 18.7a1.7 1.7 0 1 1-2.4-2.4L15 9"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.7"/><path d="m21 15-5-5-11 11"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 20 3"/><path d="M16.5 7.5 19 5"/><path d="M19 10.5 21.5 8"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    loader: '<path d="M12 3v3"/><path d="M12 18v3"/><path d="m5.6 5.6 2 2"/><path d="m16.4 16.4 2 2"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 18.4 2-2"/><path d="m16.4 7.6 2-2"/>',
    'arrow-up': '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    'dollar-sign': '<path d="M12 2v20"/><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.4-5 3.4c0 4.4 10 2.1 10 6.5 0 2-2.2 3.6-5 3.6s-5-1.6-5-3.5"/>',
    hourglass: '<path d="M6 3h12"/><path d="M6 21h12"/><path d="M7 3c0 5 4 6.5 5 8-1 1.5-5 3-5 8"/><path d="M17 3c0 5-4 6.5-5 8 1 1.5 5 3 5 8"/>',
    'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/><path d="M8 3v3"/><path d="M16 3v3"/>',
    calculator: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M8 6.5h8"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15v4"/><path d="M8 19h.01"/><path d="M12 19h.01"/>',
    tag: '<path d="M20 12.6 12.6 20a2 2 0 0 1-2.8 0L3 13.2V4a1 1 0 0 1 1-1h9.2a2 2 0 0 1 1.4.6l5.4 5.4a2 2 0 0 1 0 2.8Z"/><path d="M7.5 7.5h.01"/>',
    list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>',
    smartphone: '<rect x="6" y="2.5" width="12" height="19" rx="2.2"/><path d="M11 18h2"/>',
    'credit-card': '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18"/><path d="M12 9v12"/><path d="M12 9C9.5 9 8 7.5 8 5.8 8 4.3 9 3.3 10.2 3.3 11.6 3.3 12 5.5 12 9Z"/><path d="M12 9c2.5 0 4-1.5 4-3.2 0-1.5-1-2.5-2.2-2.5C12.4 3.3 12 5.5 12 9Z"/>',
    inbox: '<path d="M4 4h16l3 8v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6Z"/><path d="M1 12h6l2 3h6l2-3h6"/>',
    receipt: '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6"/><path d="M9 12h6"/>',
  };

  function icon(name, cls){
    const svgInner = ICONS[name] || ICONS.info;
    return `<svg class="icon${cls?' '+cls:''}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svgInner}</svg>`;
  }

  function hydrate(root){
    (root||document).querySelectorAll('[data-icon]').forEach(el=>{
      const name = el.getAttribute('data-icon');
      const cls = el.getAttribute('data-icon-class') || '';
      el.outerHTML = icon(name, cls);
    });
  }

  window.Icons = { icon, hydrate };

  document.addEventListener('DOMContentLoaded', ()=> hydrate(document));
})();