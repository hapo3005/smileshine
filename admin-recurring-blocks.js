(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,minutesOf,dateShort,uid,escapeHTML,DAY_NAMES}=A;

  const labels={once:'Einmalig',range:'Zeitraum',daily:'Täglich',weekdays:'Montag–Freitag',weekly:'Wöchentlich'};

  function injectStyles(){
    if(document.getElementById('recurringBlockStyles'))return;
    const style=document.createElement('style');style.id='recurringBlockStyles';
    style.textContent=`
      .block-form select,.series-dialog select{width:100%;height:48px;border:1px solid var(--line);border-radius:12px;background:#fffaf8;color:var(--ink);padding:0 12px;outline:none}
      .block-date-range{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .recurring-block-fields{display:grid;grid-template-columns:1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:#fffaf8}
      .recurring-block-fields[hidden]{display:none}
      .recurring-block-note{font-size:10px;line-height:1.5;color:var(--muted);margin:-2px 0 0}
      .block-item.is-series{background:#fffaf8;border-radius:12px;padding:12px;margin-top:7px;align-items:center}
      .block-item .series-pill{display:inline-flex;margin-top:5px;padding:3px 7px;border-radius:999px;background:var(--rose-soft);color:var(--rose-deep);font-size:9px;font-weight:700}
      .series-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .series-actions button{width:auto;min-width:34px;height:34px;border:1px solid var(--line);border-radius:10px;background:#fffaf8;color:var(--ink);padding:0 10px;cursor:pointer;font-size:10px;font-weight:700}
      .series-actions button:hover{border-color:#d8c1bb;background:#fff}
      .series-actions .series-delete{color:var(--danger);font-size:16px;padding:0;min-width:34px}
      .series-dialog{border:0;padding:0;background:transparent;max-width:min(620px,calc(100vw - 28px));width:100%}
      .series-dialog::backdrop{background:rgba(35,29,27,.36);backdrop-filter:blur(4px)}
      .series-dialog-card{background:var(--panel);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);overflow:hidden}
      .series-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:22px 24px 16px;border-bottom:1px solid var(--line)}
      .series-dialog-head h3{font:25px/1.15 "Marcellus",serif;margin:4px 0 0;font-weight:400}
      .series-dialog-close{width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#fffaf8;cursor:pointer;font-size:20px}
      .series-dialog-body{padding:20px 24px;display:grid;gap:14px}
      .series-dialog-body label{display:grid;gap:7px;font-size:11px;font-weight:700;color:var(--muted)}
      .series-dialog-body input{height:48px;border:1px solid var(--line);border-radius:12px;background:#fffaf8;padding:0 12px;color:var(--ink)}
      .series-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .series-dialog-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 24px 22px}
      .series-exception-list{display:grid;gap:7px;margin-top:3px}
      .series-exception-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid var(--line);border-radius:11px;background:#fffaf8}
      .series-exception-item span{font-size:10px;color:var(--muted)}
      .series-exception-item button{border:0;background:transparent;color:var(--rose-deep);font-size:10px;font-weight:700;cursor:pointer}
      .series-empty-exceptions{font-size:10px;color:var(--muted);padding:5px 0}
      @media(max-width:720px){.block-date-range,.series-form-row{grid-template-columns:1fr}.recurring-block-fields{padding:10px}.series-actions{justify-content:flex-start;margin-top:8px}.block-item.is-series{display:block}}
    `;
    document.head.appendChild(style);
  }

  function setDefaultEnd(form,force=false){
    const start=form.elements.date?.value||isoDate(addDays(new Date(),1));
    const d=new Date(`${start}T12:00:00`);d.setMonth(d.getMonth()+3);
    if(form.elements.repeatEnd&&(force||!form.elements.repeatEnd.value))form.elements.repeatEnd.value=isoDate(d);
  }

  function ensureDateRange(form){
    const start=form.elements.date?.value||isoDate(addDays(new Date(),1));
    if(form.elements.repeatEnd){
      form.elements.repeatEnd.min=start;
      if(!form.elements.repeatEnd.value||form.elements.repeatEnd.value<start)form.elements.repeatEnd.value=start;
    }
  }

  function updateRecurrenceHint(form){
    const mode=form.elements.repeat?.value||'once',fields=$('.recurring-block-fields',form),note=$('.recurring-block-note',form);
    if(fields)fields.hidden=mode==='once';
    ensureDateRange(form);
    if(mode!=='once'&&form.elements.repeatEnd?.value===form.elements.date?.value)setDefaultEnd(form,true);
    if(!note)return;
    if(mode==='daily')note.textContent='Die Uhrzeit wird an jedem Kalendertag innerhalb des Datumszeitraums gesperrt.';
    else if(mode==='weekdays')note.textContent='Die Uhrzeit wird innerhalb des Datumszeitraums automatisch montags bis freitags gesperrt.';
    else if(mode==='weekly'){
      const date=form.elements.date?.value;
      const day=date?new Date(`${date}T12:00:00`).getDay():1;
      note.textContent=`Die Uhrzeit wird innerhalb des Datumszeitraums jede Woche am ${DAY_NAMES[day]} gesperrt.`;
    }else note.textContent='';
  }

  function extendForm(){
    const form=$('#blockForm');if(!form||form.dataset.recurringReady)return;
    form.dataset.recurringReady='true';injectStyles();
    const dateLabel=form.querySelector('label');
    if(dateLabel){
      const span=$('span',dateLabel);if(span)span.textContent='Datum von';
      const range=document.createElement('div');range.className='block-date-range';
      const endLabel=document.createElement('label');endLabel.innerHTML='<span>Datum bis</span><input type="date" name="repeatEnd" required>';
      dateLabel.before(range);range.append(dateLabel,endLabel);
    }
    const repeat=document.createElement('label');
    repeat.innerHTML='<span>Wiederholung</span><select name="repeat"><option value="once">Einmalig</option><option value="weekdays">Montag–Freitag</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option></select>';
    const fields=document.createElement('div');fields.className='recurring-block-fields';fields.hidden=true;
    fields.innerHTML='<p class="recurring-block-note"></p>';
    $('.block-date-range',form)?.after(repeat,fields);
    const timeRow=$('.form-row',form);if(timeRow){const spans=$$('label > span',timeRow);if(spans[0])spans[0].textContent='Uhrzeit von';if(spans[1])spans[1].textContent='Uhrzeit bis'}
    ensureDateRange(form);
    form.elements.repeat.addEventListener('change',()=>updateRecurrenceHint(form));
    form.elements.date.addEventListener('change',()=>{ensureDateRange(form);if(form.elements.repeat.value==='weekly')updateRecurrenceHint(form)});
    form.elements.repeatEnd.addEventListener('change',()=>{if(form.elements.repeatEnd.value<form.elements.date.value)form.elements.repeatEnd.value=form.elements.date.value});
    form.addEventListener('submit',event=>handleRecurringSubmit(event,form),true);
  }

  function includeDate(date,mode,startDate){
    const day=date.getDay();
    if(mode==='range'||mode==='daily')return true;
    if(mode==='weekdays')return day>=1&&day<=5;
    if(mode==='weekly')return day===startDate.getDay();
    return false;
  }

  function ensureSeriesMeta(){
    A.db.blockSeries=A.db.blockSeries||[];
    const groups=new Map();
    (A.db.blocked||[]).forEach(b=>{if(!b.seriesId)return;if(!groups.has(b.seriesId))groups.set(b.seriesId,[]);groups.get(b.seriesId).push(b)});
    groups.forEach((items,id)=>{
      if(A.db.blockSeries.some(s=>s.id===id))return;
      items.sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
      const first=items[0];
      A.db.blockSeries.push({id,label:first.label,mode:first.seriesMode||'weekly',startDate:first.seriesStart||first.date,endDate:first.seriesEnd||items[items.length-1].date,start:first.start,end:first.end,exceptions:[]});
    });
  }

  function occursOn(meta,dateValue){
    if(!meta||!dateValue||dateValue<meta.startDate||dateValue>meta.endDate)return false;
    return includeDate(new Date(`${dateValue}T12:00:00`),meta.mode,new Date(`${meta.startDate}T12:00:00`));
  }

  function generateSeries(meta){
    A.db.blocked=A.db.blocked||[];
    A.db.blocked=A.db.blocked.filter(b=>b.seriesId!==meta.id);
    const exceptions=new Set(meta.exceptions||[]),startDate=new Date(`${meta.startDate}T12:00:00`),endDate=new Date(`${meta.endDate}T12:00:00`),items=[];
    for(let d=new Date(startDate);d<=endDate;d=addDays(d,1)){
      const date=isoDate(d);if(!includeDate(d,meta.mode,startDate)||exceptions.has(date))continue;
      items.push({id:uid('block'),date,start:meta.start,end:meta.end,label:meta.label,seriesId:meta.id,seriesMode:meta.mode,seriesStart:meta.startDate,seriesEnd:meta.endDate});
    }
    A.db.blocked.push(...items);return items;
  }

  function validateSeriesValues(values){
    if(!values.endDate)return 'Bitte ein Enddatum wählen.';
    if(minutesOf(values.end)<=minutesOf(values.start))return '„Uhrzeit bis“ muss nach „Uhrzeit von“ liegen.';
    if(values.endDate<values.startDate)return '„Datum bis“ muss am oder nach „Datum von“ liegen.';
    const max=addDays(new Date(`${values.startDate}T12:00:00`),730);
    if(new Date(`${values.endDate}T12:00:00`)>max)return 'Sperrzeiträume können maximal zwei Jahre im Voraus angelegt werden.';
    return '';
  }

  function resetBlockForm(form){
    form.reset();
    const date=isoDate(addDays(new Date(),1));form.elements.date.value=date;form.elements.repeatEnd.value=date;
    form.elements.start.value='12:00';form.elements.end.value='13:00';form.elements.repeat.value='once';updateRecurrenceHint(form);
  }

  function handleRecurringSubmit(event,form){
    const selectedMode=form.elements.repeat?.value||'once';
    event.preventDefault();event.stopImmediatePropagation();
    if(!form.reportValidity())return;
    const startDate=form.elements.date.value,endDate=form.elements.repeatEnd.value;
    const values={mode:selectedMode,startDate,endDate,start:form.elements.start.value,end:form.elements.end.value,label:String(form.elements.label.value||'Gesperrt').trim()};
    const error=validateSeriesValues(values);if(error)return A.toast(error);

    if(selectedMode==='once'&&startDate===endDate){
      A.db.blocked=A.db.blocked||[];
      A.db.blocked.push({id:uid('block'),date:startDate,start:values.start,end:values.end,label:values.label});
      A.addActivity('setting',`${values.label}: Zeit am ${dateShort(startDate)} von ${values.start}–${values.end} Uhr blockiert.`);
      resetBlockForm(form);A.save('Zeit wurde blockiert.');return;
    }

    const mode=selectedMode==='once'?'range':selectedMode;
    const meta={id:uid('series'),...values,mode,exceptions:[]};ensureSeriesMeta();A.db.blockSeries.push(meta);
    const items=generateSeries(meta);if(!items.length){A.db.blockSeries=A.db.blockSeries.filter(s=>s.id!==meta.id);return A.toast('Für diesen Zeitraum wurden keine passenden Tage gefunden.')}
    A.addActivity('setting',`${meta.label}: ${labels[mode]} · ${dateShort(meta.startDate)} bis ${dateShort(meta.endDate)} · ${meta.start}–${meta.end} Uhr blockiert.`);
    resetBlockForm(form);
    A.save(mode==='range'?`${items.length} Tage als Zeitraum blockiert.`:`${items.length} wiederkehrende Sperrzeiten gespeichert.`);
  }

  function cadence(meta){
    if(meta.mode==='weekly'){
      const day=new Date(`${meta.startDate}T12:00:00`).getDay();return `Jeden ${DAY_NAMES[day]}`;
    }
    return labels[meta.mode]||'Wiederkehrend';
  }

  function seriesDescription(meta){return `${cadence(meta)} · ${meta.start}–${meta.end} Uhr · ${dateShort(meta.startDate)} bis ${dateShort(meta.endDate)}`}

  function ensureDialogs(){
    if(!$('#seriesEditDialog')){
      const dialog=document.createElement('dialog');dialog.id='seriesEditDialog';dialog.className='series-dialog';
      dialog.innerHTML=`<form class="series-dialog-card" id="seriesEditForm"><div class="series-dialog-head"><div><span class="panel-kicker">Sperrzeit</span><h3>Zeitraum bearbeiten</h3></div><button type="button" class="series-dialog-close" data-close-series-dialog>×</button></div><div class="series-dialog-body"><label><span>Grund</span><input name="label" required></label><label><span>Wiederholung</span><select name="mode"><option value="range">Zeitraum · jeden Tag</option><option value="weekdays">Montag–Freitag</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option></select></label><div class="series-form-row"><label><span>Datum von</span><input type="date" name="startDate" required></label><label><span>Datum bis</span><input type="date" name="endDate" required></label></div><div class="series-form-row"><label><span>Uhrzeit von</span><input type="time" name="start" required></label><label><span>Uhrzeit bis</span><input type="time" name="end" required></label></div><p class="recurring-block-note">Bereits angelegte Ausnahmen bleiben beim Bearbeiten erhalten, sofern sie noch in den neuen Zeitraum passen.</p></div><div class="series-dialog-actions"><button type="button" class="soft-button" data-close-series-dialog>Abbrechen</button><button type="submit" class="primary-action">Zeitraum speichern</button></div></form>`;
      document.body.appendChild(dialog);
    }
    if(!$('#seriesExceptionDialog')){
      const dialog=document.createElement('dialog');dialog.id='seriesExceptionDialog';dialog.className='series-dialog';
      dialog.innerHTML=`<form class="series-dialog-card" id="seriesExceptionForm"><div class="series-dialog-head"><div><span class="panel-kicker">Ausnahme</span><h3>Einzelnen Tag freigeben</h3></div><button type="button" class="series-dialog-close" data-close-series-dialog>×</button></div><div class="series-dialog-body"><p class="muted" id="seriesExceptionCopy"></p><label><span>Datum der Ausnahme</span><input type="date" name="date" required></label><div><span class="panel-kicker">Bereits ausgenommen</span><div class="series-exception-list" id="seriesExceptionList"></div></div></div><div class="series-dialog-actions"><button type="button" class="soft-button" data-close-series-dialog>Abbrechen</button><button type="submit" class="primary-action">Diesen Tag freigeben</button></div></form>`;
      document.body.appendChild(dialog);
    }
  }

  function getMeta(id){ensureSeriesMeta();return A.db.blockSeries.find(s=>s.id===id)}
  function closeDialogs(){$$('.series-dialog').forEach(d=>{if(d.open)d.close()})}

  function openEdit(id){
    ensureDialogs();const meta=getMeta(id),dialog=$('#seriesEditDialog'),form=$('#seriesEditForm');if(!meta||!dialog||!form)return;
    form.dataset.seriesId=id;form.elements.label.value=meta.label;form.elements.mode.value=meta.mode;form.elements.startDate.value=meta.startDate;form.elements.endDate.value=meta.endDate;form.elements.start.value=meta.start;form.elements.end.value=meta.end;dialog.showModal();
  }

  function renderExceptionList(meta){
    const root=$('#seriesExceptionList');if(!root)return;const list=[...(meta.exceptions||[])].sort();
    root.innerHTML=list.length?list.map(date=>`<div class="series-exception-item"><span>${dateShort(date)}</span><button type="button" data-restore-series-date="${date}">Wieder sperren</button></div>`).join(''):'<div class="series-empty-exceptions">Noch keine Ausnahmen hinterlegt.</div>';
  }

  function nextOccurrence(meta){
    const today=isoDate(new Date()),start=today>meta.startDate?today:meta.startDate;
    for(let d=new Date(`${start}T12:00:00`),end=new Date(`${meta.endDate}T12:00:00`);d<=end;d=addDays(d,1)){const date=isoDate(d);if(occursOn(meta,date)&&!(meta.exceptions||[]).includes(date))return date}return meta.startDate;
  }

  function openException(id){
    ensureDialogs();const meta=getMeta(id),dialog=$('#seriesExceptionDialog'),form=$('#seriesExceptionForm');if(!meta||!dialog||!form)return;
    form.dataset.seriesId=id;form.elements.date.min=meta.startDate;form.elements.date.max=meta.endDate;form.elements.date.value=nextOccurrence(meta);$('#seriesExceptionCopy').textContent=`${meta.label} · ${seriesDescription(meta)}. Das gewählte Datum wird nur aus diesem Zeitraum herausgenommen.`;renderExceptionList(meta);dialog.showModal();
  }

  function saveEdit(form){
    const meta=getMeta(form.dataset.seriesId);if(!meta)return;
    const values={label:String(form.elements.label.value||'Gesperrt').trim(),mode:form.elements.mode.value,startDate:form.elements.startDate.value,endDate:form.elements.endDate.value,start:form.elements.start.value,end:form.elements.end.value};
    const error=validateSeriesValues(values);if(error)return A.toast(error);
    Object.assign(meta,values);meta.exceptions=(meta.exceptions||[]).filter(date=>date>=meta.startDate&&date<=meta.endDate&&occursOn(meta,date));
    const items=generateSeries(meta);A.addActivity('setting',`${meta.label}: Sperrzeitraum bearbeitet.`);closeDialogs();A.save(`Zeitraum aktualisiert · ${items.length} Sperrzeiten aktiv.`);
  }

  function saveException(form){
    const meta=getMeta(form.dataset.seriesId),date=form.elements.date.value;if(!meta||!date)return;
    if(!occursOn(meta,date))return A.toast('Dieses Datum gehört nicht zum gewählten Zeitraum.');
    meta.exceptions=meta.exceptions||[];if(meta.exceptions.includes(date))return A.toast('Dieser Tag ist bereits ausgenommen.');
    meta.exceptions.push(date);A.db.blocked=A.db.blocked.filter(b=>!(b.seriesId===meta.id&&b.date===date));
    A.addActivity('setting',`${meta.label}: ${dateShort(date)} aus dem Zeitraum ausgenommen.`);renderExceptionList(meta);A.save(`${dateShort(date)} ist für Buchungen wieder freigegeben.`);form.elements.date.value=nextOccurrence(meta);
  }

  function restoreException(seriesId,date){
    const meta=getMeta(seriesId);if(!meta)return;meta.exceptions=(meta.exceptions||[]).filter(x=>x!==date);generateSeries(meta);renderExceptionList(meta);A.addActivity('setting',`${meta.label}: Ausnahme am ${dateShort(date)} aufgehoben.`);A.save(`${dateShort(date)} ist wieder gesperrt.`);
  }

  function renderGroupedBlockList(){
    const root=$('#blockList');if(!root)return;ensureSeriesMeta();
    const today=isoDate(new Date()),single=(A.db.blocked||[]).filter(b=>!b.seriesId&&b.date>=today),rows=[];
    A.db.blockSeries.filter(meta=>meta.endDate>=today).forEach(meta=>{
      const count=(A.db.blocked||[]).filter(b=>b.seriesId===meta.id&&b.date>=today).length,exceptions=(meta.exceptions||[]).filter(d=>d>=today).length;
      rows.push({sort:`${meta.startDate}${meta.start}`,html:`<div class="block-item is-series"><div><strong>${escapeHTML(meta.label)}</strong><small>${escapeHTML(seriesDescription(meta))}</small><span class="series-pill">${count} kommende Sperren${exceptions?` · ${exceptions} Ausnahme${exceptions===1?'':'n'}`:''}</span></div><div class="series-actions"><button type="button" data-edit-series="${meta.id}">Bearbeiten</button><button type="button" data-except-series="${meta.id}">Ausnahme</button><button class="series-delete" type="button" data-remove-series="${meta.id}" aria-label="Zeitraum löschen">×</button></div></div>`})
    });
    single.sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).forEach(b=>rows.push({sort:`${b.date}${b.start}`,html:`<div class="block-item"><div><strong>${escapeHTML(b.label)}</strong><small>${dateShort(b.date)} · ${b.start}–${b.end} Uhr</small></div><button type="button" data-remove-one-block="${b.id}" aria-label="Sperrzeit löschen">×</button></div>`}));
    rows.sort((a,b)=>a.sort.localeCompare(b.sort));root.innerHTML=rows.length?rows.map(r=>r.html).join(''):'<div class="empty-state">Keine kommenden Sperrzeiten.</div>';
  }

  function bindActions(){
    document.addEventListener('click',event=>{
      const edit=event.target.closest('[data-edit-series]');if(edit){event.preventDefault();openEdit(edit.dataset.editSeries);return}
      const except=event.target.closest('[data-except-series]');if(except){event.preventDefault();openException(except.dataset.exceptSeries);return}
      const restore=event.target.closest('[data-restore-series-date]');if(restore){event.preventDefault();restoreException($('#seriesExceptionForm')?.dataset.seriesId,restore.dataset.restoreSeriesDate);return}
      const close=event.target.closest('[data-close-series-dialog]');if(close){event.preventDefault();closeDialogs();return}
      const seriesBtn=event.target.closest('[data-remove-series]');
      if(seriesBtn){event.preventDefault();const id=seriesBtn.dataset.removeSeries,meta=getMeta(id),count=(A.db.blocked||[]).filter(b=>b.seriesId===id).length;if(!meta||!confirm(`Den kompletten Sperrzeitraum „${meta.label}“ mit ${count} aktiven Sperrzeiten löschen?`))return;A.db.blocked=A.db.blocked.filter(b=>b.seriesId!==id);A.db.blockSeries=A.db.blockSeries.filter(s=>s.id!==id);A.save('Sperrzeitraum gelöscht.');return}
      const oneBtn=event.target.closest('[data-remove-one-block]');
      if(oneBtn){event.preventDefault();A.db.blocked=A.db.blocked.filter(b=>b.id!==oneBtn.dataset.removeOneBlock);A.save('Sperrzeit entfernt.')}
    });
    $('#seriesEditForm')?.addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.reportValidity())saveEdit(event.currentTarget)});
    $('#seriesExceptionForm')?.addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.reportValidity())saveException(event.currentTarget)});
    $$('.series-dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialogs()}));
  }

  function initRecurringBlocks(){
    if(A.recurringBlocksReady)return;A.recurringBlocksReady=true;
    injectStyles();ensureSeriesMeta();extendForm();ensureDialogs();bindActions();
    const baseRenderAll=A.renderAll;A.renderAll=()=>{baseRenderAll?.();extendForm();ensureSeriesMeta();renderGroupedBlockList()};
    const baseRenderBlocks=A.renderBlocks;A.renderBlocks=()=>{baseRenderBlocks?.();ensureSeriesMeta();renderGroupedBlockList()};
    renderGroupedBlockList();
  }

  Object.assign(A,{initRecurringBlocks,renderGroupedBlockList});
})();