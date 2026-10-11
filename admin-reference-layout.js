(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const $=s=>document.querySelector(s);
  let monthOffset=0;
  const iso=d=>A.isoDate(d);
  function renderReferenceCalendar(){
    const root=$('#referenceMiniMonth');if(!root||!A.db)return;
    const cursor=new Date(A.calendarCursor);
    const month=new Date(cursor.getFullYear(),cursor.getMonth()+monthOffset,1,12);
    const title=$('#referenceMonthTitle');
    if(title)title.textContent=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(month);
    const offset=(month.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    const headers=['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>'<span>'+d+'</span>').join('');
    const cells=Array.from({length:42},(_,i)=>{
      const day=i-offset+1;
      if(day<1||day>days)return '<button type="button" disabled aria-hidden="true"></button>';
      const d=new Date(month.getFullYear(),month.getMonth(),day,12),date=iso(d);
      return '<button type="button" data-reference-date="'+date+'" aria-label="'+date+'" '+(date===iso(cursor)?'aria-current="date"':'')+' data-today="'+(date===iso(new Date()))+'">'+day+'</button>';
    }).join('');
    root.innerHTML='<div class="reference-mini-grid">'+headers+cells+'</div>';
    const date=iso(cursor),apps=A.activeAppointments().filter(a=>a.date===date);
    const blocks=(A.db.blocked||[]).filter(b=>b.date===date);
    const open=A.db.workingHours?.[cursor.getDay()]?.enabled;
    const summary=$('#referenceDaySummary');
    if(summary){
      summary.innerHTML=[
        [apps.length,'Termine','Für den ausgewählten Tag'],
        [blocks.length,'Sperrzeiten',blocks.length?'Im Kalender berücksichtigt':'Keine Sperrzeit eingetragen'],
        [open?'Ja':'Nein',open?'Studio geöffnet':'Studio geschlossen',open?'Nach deinen Arbeitszeiten':'Keine reguläre Öffnungszeit']
      ].map(x=>'<div class="reference-summary-item"><span class="reference-summary-number">'+x[0]+'</span><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div></div>').join('');
    }
  }
  function initReferenceLayout(){
    const start=A.calendarCursor||new Date();
    const onToday=iso(start)===iso(new Date());
    const working=A.db?.workingHours?.[start.getDay()];
    const hasSpecial=A.activeAppointments?.().some(a=>a.date===iso(start)&&a.specialOpening);
    if(onToday&&!working?.enabled&&!hasSpecial){
      for(let days=1;days<=7;days++){
        const next=new Date(start);next.setDate(next.getDate()+days);next.setHours(12,0,0,0);
        if(A.db?.workingHours?.[next.getDay()]?.enabled){A.calendarCursor=next;A.renderCalendar?.();break}
      }
    }
    A.registerRenderHook?.('reference-calendar-summary',renderReferenceCalendar,45);
    A.registerViewHook?.('reference-calendar-summary',name=>{if(name==='calendar')renderReferenceCalendar()},45);
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-reference-new]')){
        event.preventDefault();
        A.openModal?.({date:iso(A.calendarCursor)});
        return;
      }
      const date=event.target.closest('[data-reference-date]');
      if(date){const [year,month,day]=date.dataset.referenceDate.split('-').map(Number);monthOffset=0;A.calendarCursor=new Date(year,month-1,day,12);A.calendarMode='day';A.renderCalendar();A.refreshCalendarWorkspace?.();renderReferenceCalendar();return}
      if(event.target.closest('[data-reference-next-month]')){monthOffset=(monthOffset+1)%12;renderReferenceCalendar()}
    });
    renderReferenceCalendar();
  }
  Object.assign(A,{initReferenceLayout});
})();