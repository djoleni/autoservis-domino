/* =========================================================
   Autoservis Domino Niš, ponašanje stranice
   Bez biblioteka. Sve što se menja često nalazi se odmah ispod.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     PODEŠAVANJA (menjaj ovde)
     Recenzije se dodaju direktno u index.html (sekcija Recenzije).
     --------------------------------------------------------- */
  const PHONE_DISPLAY = '063 191 4147';

  /* --------------------------------------------------------- */

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Mobilni meni ---------- */
  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- Radno vreme i status "otvoreno / zatvoreno" ---------- */
  const hoursList = $('[data-hours]');
  if (hoursList) {
    const DAYS_ACC = ['u nedelju', 'u ponedeljak', 'u utorak', 'u sredu', 'u četvrtak', 'u petak', 'u subotu'];
    const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

    // Pročitaj radno vreme iz HTML-a (data-open / data-close)
    const hours = {};
    $$('li', hoursList).forEach((li) => {
      const day = Number(li.dataset.day);
      const open = li.dataset.open, close = li.dataset.close;
      hours[day] = open && close ? { open, close, openMin: toMinutes(open), closeMin: toMinutes(close) } : null;
      const time = $('.time', li);
      if (time) time.textContent = hours[day] ? `${open}–${close}` : 'Zatvoreno';
    });

    // Trenutno vreme u Srbiji, bez obzira na to gde se nalazi posetilac
    const nowInSerbia = () => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Belgrade', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      const get = (type) => parts.find((p) => p.type === type).value;
      const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
      return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
    };

    const currentStatus = ({ day, minutes }) => {
      const today = hours[day];
      if (today && minutes >= today.openMin && minutes < today.closeMin) {
        return { open: true, text: `Otvoreno, radimo do ${today.close}` };
      }
      if (today && minutes < today.openMin) {
        return { open: false, text: `Zatvoreno, otvaramo danas u ${today.open}` };
      }
      for (let i = 1; i <= 7; i++) {
        const d = (day + i) % 7;
        if (hours[d]) {
          const when = i === 1 ? 'sutra' : DAYS_ACC[d];
          return { open: false, text: `Zatvoreno, otvaramo ${when} u ${hours[d].open}` };
        }
      }
      return { open: false, text: 'Zatvoreno' };
    };

    const render = () => {
      const now = nowInSerbia();
      const s = currentStatus(now);
      $$('[data-status]').forEach((el) => {
        el.textContent = s.text;
        el.dataset.state = s.open ? 'open' : 'closed';
      });
      $$('li', hoursList).forEach((li) => li.classList.toggle('is-today', Number(li.dataset.day) === now.day));
    };
    render();
    setInterval(render, 60 * 1000);
  }

  /* ---------- Provera marke ---------- */
  const brandInput = $('#brand-input');
  const brandResult = $('#brand-result');
  const brandItems = $$('#brand-wall li');
  if (brandInput && brandItems.length) {
    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

    brandInput.addEventListener('input', () => {
      const raw = brandInput.value.trim();
      const q = normalize(raw);
      const matches = [];

      brandItems.forEach((li) => {
        const hit = q !== '' && normalize(li.dataset.brand).includes(q);
        li.classList.toggle('is-match', hit);
        li.classList.toggle('is-dim', q !== '' && !hit);
        if (hit) matches.push(li.dataset.brand);
      });

      brandResult.textContent = '';
      if (q === '') return;

      if (matches.length === 1) {
        brandResult.textContent = `Da, servisiramo ${matches[0]}.`;
      } else if (matches.length > 1) {
        brandResult.textContent = `Na spisku: ${matches.slice(0, 4).join(', ')}${matches.length > 4 ? '…' : ''}`;
      } else {
        brandResult.append(`Ne vidimo „${raw}“ na spisku. Pozovite `);
        const a = document.createElement('a');
        a.href = 'tel:+381631914147';
        a.textContent = PHONE_DISPLAY;
        brandResult.append(a, ' i proverite.');
      }
    });
  }

  /* ---------- Galerija: pregled slika ---------- */
  const tiles = $$('.tile');
  const dialog = $('#lightbox');
  if (tiles.length && dialog && typeof dialog.showModal === 'function') {
    const img = $('#lb-img');
    const cap = $('#lb-cap');
    let index = 0;

    const show = (i) => {
      index = (i + tiles.length) % tiles.length;
      const t = tiles[index];
      img.src = t.dataset.full;
      img.alt = t.dataset.alt || t.dataset.caption || '';
      cap.textContent = t.dataset.caption || '';
    };

    tiles.forEach((t, i) => t.addEventListener('click', () => { show(i); dialog.showModal(); }));
    $('.lb-prev', dialog).addEventListener('click', () => show(index - 1));
    $('.lb-next', dialog).addEventListener('click', () => show(index + 1));
    $('.lb-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    dialog.addEventListener('click', (e) => {
      if (!e.target.closest('img, button, figcaption')) dialog.close();
    });
  } else {
    // Stariji pregledač bez <dialog>: slika se otvara u novom tabu
    tiles.forEach((t) => t.addEventListener('click', () => window.open(t.dataset.full, '_blank', 'noopener')));
  }

  /* ---------- Godina u podnožju ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
