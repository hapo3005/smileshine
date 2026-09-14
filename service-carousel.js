(() => {
  'use strict';

  const root=document.querySelector('#behandlungen');
  if(!root)return;

  const getGap=track=>parseFloat(getComputedStyle(track).columnGap||getComputedStyle(track).gap||0)||0;
  const cardStep=track=>{
    const card=track.querySelector('.public-service-card');
    return card?card.getBoundingClientRect().width+getGap(track):track.clientWidth;
  };

  function enhance(group){
    if(group.dataset.carouselReady==='1')return;
    const head=group.querySelector('.public-service-group-head');
    const track=group.querySelector('.public-service-cards');
    if(!head||!track)return;

    group.dataset.carouselReady='1';
    track.setAttribute('tabindex','0');
    track.setAttribute('role','region');
    track.setAttribute('aria-label',`${head.querySelector('span')?.textContent||'Leistungen'} – Carousel`);

    const controls=document.createElement('div');
    controls.className='service-carousel-controls';
    controls.innerHTML=`
      <span class="service-carousel-position" aria-live="polite"></span>
      <button class="service-carousel-button prev" type="button" aria-label="Vorherige Leistungen">←</button>
      <button class="service-carousel-button next" type="button" aria-label="Weitere Leistungen">→</button>`;
    head.appendChild(controls);

    const prev=controls.querySelector('.prev');
    const next=controls.querySelector('.next');
    const position=controls.querySelector('.service-carousel-position');

    const update=()=>{
      const cards=[...track.querySelectorAll('.public-service-card')];
      const max=Math.max(0,track.scrollWidth-track.clientWidth);
      const step=Math.max(1,cardStep(track));
      const current=Math.min(cards.length,Math.max(1,Math.round(track.scrollLeft/step)+1));
      position.textContent=`${current} / ${cards.length}`;
      prev.disabled=track.scrollLeft<=3;
      next.disabled=track.scrollLeft>=max-3;
      group.classList.toggle('is-scrollable',max>3);
    };

    prev.addEventListener('click',()=>track.scrollBy({left:-cardStep(track),behavior:'smooth'}));
    next.addEventListener('click',()=>track.scrollBy({left:cardStep(track),behavior:'smooth'}));
    track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
    track.addEventListener('keydown',event=>{
      if(event.key==='ArrowRight'){event.preventDefault();next.click()}
      if(event.key==='ArrowLeft'){event.preventDefault();prev.click()}
    });
    window.addEventListener('resize',update,{passive:true});
    requestAnimationFrame(update);
  }

  function enhanceAll(){root.querySelectorAll('.public-service-group').forEach(enhance)}
  enhanceAll();

  const observer=new MutationObserver(()=>requestAnimationFrame(enhanceAll));
  observer.observe(root,{childList:true,subtree:true});
})();