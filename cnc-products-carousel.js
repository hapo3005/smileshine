(() => {
  'use strict';

  const products = [
    {
      name: 'aesthetic world Clearing Foam',
      size: '50 ml',
      category: 'Reinigung',
      description: 'Sanfter Reinigungsschaum für Make-up und Alltagsschmutz – gründlich, ohne die Haut unnötig auszutrocknen.',
      image: 'https://shop.cnc-cosmetic.de/media/e1/d4/f9/1752582541/ac757d7728904503c4160f249f47c2dc.jpg?ts=1752582541'
    },
    {
      name: 'aesthetic world Facial Tonic',
      size: '200 ml',
      category: 'Tonic',
      description: 'Alkoholfreies Gesichtstonic mit Aloe Vera, Hyaluronsäure und Panthenol für ein frisches, geklärtes Hautgefühl.',
      image: 'https://shop.cnc-cosmetic.de/media/29/6b/4e/1752582641/b258d9424c8efcac1cd344d8396082b0.jpg?ts=1752582641'
    },
    {
      name: 'aesthetic world Hyaluron Forte Serum',
      size: '30 ml',
      category: 'Serum',
      description: 'Hochkonzentriertes Hyaluronserum für intensive Feuchtigkeit und einen sichtbar frischeren, aufgepolsterten Look.',
      image: 'https://shop.cnc-cosmetic.de/media/d0/b3/45/1752582944/7418d586e18a0c0eaf3b308831c46eec.jpg?ts=1752582944'
    },
    {
      name: 'classic Hyaluron Creme',
      size: '50 ml',
      category: 'Feuchtigkeit',
      description: 'Leichte Hyaluron-Pflege für jeden Tag – spendet Feuchtigkeit und unterstützt ein entspanntes, strahlendes Hautbild.',
      image: 'https://shop.cnc-cosmetic.de/media/48/a3/88/1753793107/0384840ddb52334cf655a3e0dce20006.jpg?ts=1753793107'
    },
    {
      name: 'PREMIUM EYE CREAM',
      size: '15 ml',
      category: 'Augenpflege',
      description: 'Intensive Premium-Pflege für die empfindliche Augenpartie mit Feuchtigkeit und glättendem Pflegefokus.',
      image: 'https://shop.cnc-cosmetic.de/media/b5/21/f5/1745929985/bc43f3a8a91b764dbfd27b075cdaa6b9.jpg?ts=1745929985'
    },
    {
      name: 'aesthetic world Anti-Aging UV Protect SPF 50',
      size: '30 ml',
      category: 'UV-Schutz',
      description: 'Leichter Gesichtsschutz mit SPF 50, Hyaluron und Ectoin – ideal als täglicher Abschluss der Pflegeroutine.',
      image: 'https://shop.cnc-cosmetic.de/media/c1/7e/7e/1752582952/991a126fc5c9c0e9b1875be4a288f95d.jpg?ts=1752582952'
    },
    {
      name: 'SUN Lipcare SPF 30',
      size: '4,6 g',
      category: 'Lippenpflege',
      description: 'Pflegender Lippenstift mit SPF 30 für trockene, spröde Lippen – besonders passend rund um Lippenpflege und PMU.',
      image: 'https://shop.cnc-cosmetic.de/media/73/c9/1f/1742990972/904e42c39b1a771e972b58497c7db8a5.jpg?ts=1742990972'
    },
    {
      name: 'edition 4.0',
      size: '50 ml',
      category: 'Premium Anti-Aging',
      description: 'Next-Generation Gesichtspflege mit Lift-&-Repair-Fokus, Hyaluronsäure und regenerationsorientierter Pflegeformel.',
      image: 'https://shop.cnc-cosmetic.de/media/37/79/e8/1768321649/6e3583a86a3b85e6a696bbc48f10bff6.jpg?ts=1768321649'
    }
  ];

  function injectStyles() {
    if (document.getElementById('cncCarouselStyles')) return;
    const style = document.createElement('style');
    style.id = 'cncCarouselStyles';
    style.textContent = `
      .cnc-boutique{overflow:hidden}
      .cnc-boutique .boutique-heading{margin-bottom:34px}
      .cnc-boutique .shop-status{background:rgba(255,255,255,.56)}
      .cnc-carousel-shell{position:relative;margin-top:14px}
      .cnc-carousel-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}
      .cnc-carousel-note{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:10px}
      .cnc-carousel-note::before{content:"";width:7px;height:7px;border-radius:50%;background:#a67e6d;box-shadow:0 0 0 5px rgba(166,126,109,.09)}
      .cnc-carousel-controls{display:flex;align-items:center;gap:8px}
      .cnc-carousel-count{min-width:72px;text-align:center;font-size:9px;font-weight:700;letter-spacing:.08em;color:var(--muted)}
      .cnc-carousel-button{width:44px;height:44px;border:1px solid var(--line);border-radius:50%;background:rgba(255,255,255,.64);color:var(--ink);font-size:19px;cursor:pointer;transition:.2s ease;box-shadow:var(--shadow-sm)}
      .cnc-carousel-button:hover:not(:disabled){transform:translateY(-2px);background:#fff;border-color:rgba(118,87,76,.24)}
      .cnc-carousel-button:disabled{opacity:.28;cursor:default;box-shadow:none}
      .cnc-product-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:5px 2px 22px;scrollbar-width:none;overscroll-behavior-x:contain}
      .cnc-product-track::-webkit-scrollbar{display:none}
      .cnc-product-card{flex:0 0 clamp(268px,24vw,352px);scroll-snap-align:start;display:flex;flex-direction:column;min-height:550px;overflow:hidden;border:1px solid rgba(77,67,61,.09);border-radius:8px 27px 8px 27px;background:rgba(255,255,255,.58);box-shadow:var(--shadow-sm);transition:.3s cubic-bezier(.2,.7,.2,1)}
      .cnc-product-card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
      .cnc-product-visual{position:relative;height:320px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#f8f5f1,#eee7e1);overflow:hidden;border-bottom:1px solid rgba(77,67,61,.07)}
      .cnc-product-visual::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 26% 18%,rgba(255,255,255,.8),transparent 28%)}
      .cnc-product-visual img{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;padding:24px 28px;mix-blend-mode:multiply}
      .cnc-product-badge{position:absolute;z-index:3;top:17px;left:17px;padding:7px 10px;border-radius:999px;background:rgba(250,248,245,.82);border:1px solid rgba(255,255,255,.9);backdrop-filter:blur(12px);font-size:8px;font-weight:750;letter-spacing:.13em;text-transform:uppercase;color:#625c57}
      .cnc-image-fallback{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;color:#8f827a}
      .cnc-image-fallback span{font-family:var(--serif);font-size:52px;letter-spacing:.08em}
      .cnc-image-fallback small{font-size:9px;text-transform:uppercase;letter-spacing:.16em}
      .cnc-product-copy{display:flex;flex-direction:column;flex:1;padding:25px 24px 25px}
      .cnc-product-meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;color:var(--accent-dark);font-size:8px;font-weight:750;letter-spacing:.13em;text-transform:uppercase}
      .cnc-product-copy h3{margin:0 0 12px;font-family:var(--serif);font-size:27px;line-height:1.14;font-weight:400;letter-spacing:-.02em}
      .cnc-product-copy p{margin:0;color:var(--muted);font-size:11px;line-height:1.72}
      .cnc-product-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:auto;padding-top:20px;border-top:1px solid var(--line)}
      .cnc-product-footer span{font-size:8px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;color:#857d77}
      .cnc-product-link{font-size:9px;font-weight:750;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
      .cnc-product-link:hover{color:var(--accent-dark)}
      .cnc-boutique-footer{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:4px;border-radius:22px;overflow:hidden;background:rgba(255,255,255,.42)}
      .cnc-boutique-footer>div{display:flex;gap:16px;padding:23px 26px;align-items:flex-start}
      .cnc-boutique-footer>div+div{border-left:1px solid var(--line)}
      .cnc-boutique-footer p{margin:0;color:var(--muted);font-size:11px}
      .cnc-boutique-footer strong{color:var(--ink)}
      .cnc-boutique-number{font-size:8px;font-weight:750;letter-spacing:.14em;color:var(--accent-dark)}
      @media(max-width:900px){
        .cnc-product-card{flex-basis:min(76vw,340px)}
        .cnc-carousel-toolbar{align-items:flex-end}
      }
      @media(max-width:620px){
        .cnc-boutique .boutique-heading{margin-bottom:26px}
        .cnc-carousel-toolbar{align-items:center}
        .cnc-carousel-note{max-width:190px;line-height:1.45}
        .cnc-carousel-count{display:none}
        .cnc-carousel-button{width:40px;height:40px}
        .cnc-product-card{flex-basis:84vw;min-height:520px}
        .cnc-product-visual{height:286px}
        .cnc-boutique-footer{grid-template-columns:1fr}
        .cnc-boutique-footer>div+div{border-left:0;border-top:1px solid var(--line)}
      }
    `;
    document.head.appendChild(style);
  }

  function productCard(product, index) {
    return `
      <article class="cnc-product-card" data-cnc-product="${index}">
        <div class="cnc-product-visual">
          <span class="cnc-product-badge">CNC Cosmetic</span>
          <img src="${product.image}" alt="${product.name}, ${product.size}" loading="lazy" decoding="async">
        </div>
        <div class="cnc-product-copy">
          <div class="cnc-product-meta"><span>${product.category}</span><span>${product.size}</span></div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="cnc-product-footer">
            <span>Studio Selection</span>
            <a class="cnc-product-link" href="#kontakt" aria-label="${product.name} im Studio anfragen">Im Studio anfragen →</a>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const section = document.getElementById('shop');
    if (!section) return;
    injectStyles();
    section.classList.add('cnc-boutique');
    section.innerHTML = `
      <div class="section-heading split boutique-heading">
        <div>
          <p class="eyebrow">Smile &amp; Shine Boutique · CNC Cosmetic</p>
          <h2>Pflege, die Birgit im Studio empfehlen kann.</h2>
        </div>
        <div class="boutique-intro">
          <p>Acht ausgewählte CNC Cosmetic Produkte für Reinigung, Feuchtigkeit, Augen, Lippen, UV-Schutz und anspruchsvolle Pflege. Aktuell kannst du sie im Studio anfragen – der Online-Shop ist als nächster Ausbauschritt vorbereitet.</p>
          <span class="shop-status">CNC Cosmetic · Studio-Auswahl</span>
        </div>
      </div>
      <div class="cnc-carousel-shell" aria-label="CNC Cosmetic Produktauswahl">
        <div class="cnc-carousel-toolbar">
          <div class="cnc-carousel-note">Mit Original-Produktbildern von CNC Cosmetic</div>
          <div class="cnc-carousel-controls">
            <button class="cnc-carousel-button" type="button" data-cnc-prev aria-label="Vorherige Produkte">←</button>
            <span class="cnc-carousel-count" data-cnc-count>1–3 / ${products.length}</span>
            <button class="cnc-carousel-button" type="button" data-cnc-next aria-label="Weitere Produkte">→</button>
          </div>
        </div>
        <div class="cnc-product-track" data-cnc-track tabindex="0">
          ${products.map(productCard).join('')}
        </div>
      </div>
      <div class="cnc-boutique-footer glass-panel">
        <div><span class="cnc-boutique-number">01</span><p><strong>Im Studio:</strong> persönliche Produktempfehlung passend zu Haut, Behandlung und Pflegeroutine.</p></div>
        <div><span class="cnc-boutique-number">02</span><p><strong>Als Nächstes:</strong> Preise, Bestand, Warenkorb, Online-Zahlung und Versand direkt über Smile &amp; Shine.</p></div>
      </div>`;

    const track = section.querySelector('[data-cnc-track]');
    const prev = section.querySelector('[data-cnc-prev]');
    const next = section.querySelector('[data-cnc-next]');
    const count = section.querySelector('[data-cnc-count]');
    if (!track || !prev || !next) return;

    section.querySelectorAll('.cnc-product-visual img').forEach(img => {
      img.addEventListener('error', () => {
        const visual = img.parentElement;
        img.remove();
        if (visual && !visual.querySelector('.cnc-image-fallback')) {
          visual.insertAdjacentHTML('beforeend', '<div class="cnc-image-fallback"><span>CNC</span><small>Produktbild</small></div>');
        }
      }, { once: true });
    });

    const cards = [...track.querySelectorAll('.cnc-product-card')];
    const step = () => {
      const first = cards[0];
      if (!first) return 320;
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      return first.getBoundingClientRect().width + gap;
    };
    const visibleCount = () => Math.max(1, Math.floor((track.clientWidth + 8) / step()));
    const currentIndex = () => Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step())));
    const update = () => {
      const start = currentIndex();
      const visible = visibleCount();
      const end = Math.min(products.length, start + visible);
      prev.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
      if (count) count.textContent = `${start + 1}–${end} / ${products.length}`;
    };
    const move = direction => track.scrollBy({ left: direction * step(), behavior: 'smooth' });
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();