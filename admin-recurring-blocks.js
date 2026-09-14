(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,minutesOf,dateShort,uid,escapeHTML,DAY_NAMES}=A;

  const labels={once:'Einmalig',daily:'Täglich',weekdays:'Montag–Freitag',weekly:'Wöchentlich'};

  function injectStyles(){
    if(document.getElementById('recurringBlockStyles'))return;
    const style=document.createElement('style');style.id='recurringBlockStyles';
    style.textContent=`
      .block-form select{width:100%;height:48px;border:1px solid var(--line);border-radius:12px;background:#fffaf8;color:var(--ink);padding:0 12px;outline:none}
      .recurring-block-fields{display:grid;grid-template-columns:1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:#fffaf8}
      .recurring-block-fields[hidden]{display:none}
      .recurring-block-note{font-size:10px;line-height:1.5;color:var(--muted);margin:-2px 0 0}
      .block-item.is-series{background:#fffaf8;border-radius:12px;padding-left:12px;padding-right:8px;margin-top:7px}
      .block-item .series-pill{display:inline-flex;margin-top:5px;padding:3px 7px;border-radius:999px;background:var(--rose-soft);color:var(--rose-deep);font-size:9px;font-weight:700}
      @media(max-width:720px){.recurring-block-fields{padding:10px}}
    `;
    document.head.appendChild(style);
  }

  function setDefaultEnd(form){
    const start=form.elements.date?.value||isoDate(addDays(new Date(),1));
    const d=new Date(`${start}T12:00:00`);d.setMonth(d.getMonth()+3);
    if(form.elements.repeatEnd&&!form.elements.repeatEnd.value)form.elements.repeatEnd.value=isoDate(d);
  }

  function updateRecurrenceHint(form){
    const mode=form.elements.repeat?.value||'once',fields=$('.recurring-block-fields',form),note=$('.recurring-block-note',form);
    if(fields)fields.hidden=mode==='once';
    if(mode!=='once')setDefaultEnd(form);
    if(!note)return;
    if(mode==='daily')note.textContent='Die Zeit wird an jedem Kalendertag gesperrt.';
    else if(mode==='weekdays')note.textContent='Die Zeit wird automatisch montags bis freitags gesperrt.';
    else if(mode==='weekly'){
      const date=form.elements.date?.value;
      const day=date?new Date(`${date}T12:00:00`).getDay():1;
      note.textContent=`Die Zeit wird jede Woche am ${DAY_NAMES[day]} gesperrt.`;
    }else note.textContent='';
  }

  function extendForm(){
    const form=$('#blockForm');if(!form||form.dataset.recurringReady)return;
    form.dataset.recurringReady='true';injectStyles();
    const dateLabel=form.querySelector('label');
    const repeat=document.createElement('label');
    repeat.innerHTML='<span>Wiederholung</span><select name="repeat"><option value="once">Einmalig</option><option value="weekdays">Montag–Freitag</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option></select>';
    const fields=document.createElement('div');fields.className='recurring-block-fields';fields.hidden=true;
    fields.innerHTML='<label><span>Bis einschließlich</span><input type="date" name="repeatEnd"></label><p class="recurring-block-note"></p>';
    dateLabel?.after(repeat,fields);
    form.elements.repeat.addEventListener('change',()=>updateRecurrenceHint(form));
    form.elements.date.addEventListener('change',()=>{if(form.elements.repeat.value==='weekly')updateRecurrenceHint(form);if(form.elements.repeat.value!=='once'){form.elements.repeatEnd.value='';setDefaultEnd(form)}});
    form.addEventListener('submit',event=>handleRecurringSubmit(event,form),true);
  }

  function includeDate(date,mode,startDate){
    const day=date.getDay();
    if(mode==='daily')return true;
    if(mode==='weekdays')return day>=1&&day<=5;
    if(mode==='weekly')return day===startDate.getDay();
    return false;
  }

  function handleRecurringSubmit(event,form){
    const mode=form.elements.repeat?.value||'once';if(mode==='once')return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!form.reportValidity())return;
    const startValue=form.elements.date.value,endValue=form.elements.repeatEnd.value,startTime=form.elements.start.value,endTime=form.elements.end.value,label=String(form.elements.label.value||'Gesperrt').trim();
    if(!endValue)return A.toast('Bitte ein Enddatum für die Wiederholung wählen.');
    if(minutesOf(endTime)<=minutesOf(startTime))return A.toast('„Bis“ muss nach „Von“ liegen.');
    if(endValue<startValue)return A.toast('Das Enddatum muss nach dem Startdatum liegen.');
    const startDate=new Date(`${startValue}T12:00:00`),endDate=new Date(`${endValue}T12:00:00`),max=addDays(startDate,730);
    if(endDate>max)return A.toast('Wiederholungen können maximal zwei Jahre im Voraus angelegt werden.');
    const seriesId=uid('series'),items=[];
    for(let d=new Date(startDate);d<=endDate;d=addDays(d,1)){
      if(!includeDate(d,mode,startDate))continue;
      items.push({id:uid('block'),date:isoDate(d),start:startTime,end:endTime,label,seriesId,seriesMode:mode,seriesStart:startValue,seriesEnd:endValue});
    }
    if(!items.length)return A.toast('Für diesen Zeitraum wurden keine passenden Tage gefunden.');
    A.db.blocked=A.db.blocked||[];A.db.blocked.push(...items);
    A.addActivity('setting',`${label}: ${labels[mode]} ${startTime}–${endTime} Uhr bis ${dateShort(endValue)} blockiert.`);
    form.reset();form.elements.date.value=isoDate(addDays(new Date(),1));form.elements.start.value='12:00';form.elements.end.value='13:00';form.elements.repeat.value='once';form.elements.repeatEnd.value='';updateRecurrenceHint(form);
    A.save(`${items.length} wiederkehrende Sperrzeiten gespeichert.`);
  }

  function seriesDescription(items){
    const first=items[0],mode=first.seriesMode||'weekly';
    let cadence=labels[mode]||'Wiederkehrend';
    if(mode==='weekly'){
      const day=new Date(`${first.seriesStart||first.date}T12:00:00`).getDay();cadence=`Jeden ${DAY_NAMES[day]}`;
    }
    return `${cadence} · ${first.start}–${first.end} Uhr · bis ${dateShort(first.seriesEnd||items[items.length-1].date)}`;
  }

  function renderGroupedBlockList(){
    const root=$('#blockList');if(!root)return;
    const today=isoDate(new Date()),future=(A.db.blocked||[]).filter(b=>b.date>=today),groups=new Map(),single=[];
    future.forEach(b=>{if(b.seriesId){if(!groups.has(b.seriesId))groups.set(b.seriesId,[]);groups.get(b.seriesId).push(b)}else single.push(b)});
    const rows=[];
    groups.forEach((items,seriesId)=>{items.sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));const first=items[0];rows.push({sort:`${first.date}${first.start}`,html:`<div class="block-item is-series"><div><strong>${escapeHTML(first.label)}</strong><small>${escapeHTML(seriesDescription(items))}</small><span class="series-pill">${items.length} Termine · Serie</span></div><button type="button" data-remove-series="${seriesId}" aria-label="Serie löschen">×</button></div>`})});
    single.sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).forEach(b=>rows.push({sort:`${b.date}${b.start}`,html:`<div class="block-item"><div><strong>${escapeHTML(b.label)}</strong><small>${dateShort(b.date)} · ${b.start}–${b.end} Uhr</small></div><button type="button" data-remove-one-block="${b.id}" aria-label="Sperrzeit löschen">×</button></div>`}));
    rows.sort((a,b)=>a.sort.localeCompare(b.sort));root.innerHTML=rows.length?rows.map(r=>r.html).join(''):'<div class="empty-state">Keine kommenden Sperrzeiten.</div>';
  }

  function bindDeletion(){
    document.addEventListener('click',event=>{
      const seriesBtn=event.target.closest('[data-remove-series]');
      if(seriesBtn){event.preventDefault();const id=seriesBtn.dataset.removeSeries,count=(A.db.blocked||[]).filter(b=>b.seriesId===id).length;if(!confirm(`Diese komplette Serie mit ${count} Sperrzeiten löschen?`))return;A.db.blocked=A.db.blocked.filter(b=>b.seriesId!==id);A.save('Wiederkehrende Sperrzeit gelöscht.');return}
      const oneBtn=event.target.closest('[data-remove-one-block]');
      if(oneBtn){event.preventDefault();A.db.blocked=A.db.blocked.filter(b=>b.id!==oneBtn.dataset.removeOneBlock);A.save('Sperrzeit entfernt.')}
    });
  }

  function initRecurringBlocks(){
    if(A.recurringBlocksReady)return;A.recurringBlocksReady=true;
    extendForm();bindDeletion();
    const baseRenderAll=A.renderAll;A.renderAll=()=>{baseRenderAll?.();extendForm();renderGroupedBlockList()};
    const baseRenderBlocks=A.renderBlocks;A.renderBlocks=()=>{baseRenderBlocks?.();renderGroupedBlockList()};
    renderGroupedBlockList();
  }

  Object.assign(A,{initRecurringBlocks,renderGroupedBlockList});
})();