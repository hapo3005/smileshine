(() => {
  "use strict";
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,minutesOf,timeOf,escapeHTML,SHORT_DAYS}=A;
  let installed=false;

  function ensureStyles(){
    if(document.querySelector("link[data-calendar-workspace-style]"))return;
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="admin-calendar-workspace.css?v=20260922-calendar-workspace1";
    link.dataset.calendarWorkspaceStyle="true";
    document.head.appendChild(link);
  }

  function startOfWeek(date){
    const d=new Date(date),offset=(d.getDay()+6)%7;
    d.setDate(d.getDate()-offset);d.setHours(12,0,0,0);return d;
  }

  function workingHours(date){
    const d=new Date(date+"T12:00:00");
    return A.db.workingHours?.[d.getDay()]||{enabled:false,start:"09:00",end:"18:00"};
  }

  function statusLabel(status){
    return A.STATUS_LABELS?.[status]||status||"Offen";
  }

  function money(value){
    return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(value||0));
  }

  function financials(a){
    if(A.appointmentFinancials)return A.appointmentFinancials(a);
    const service=A.db.services.find(s=>s.name===a.service);
    const finalPrice=Number(a.finalPrice??a.listPrice??service?.price??0),paid=Number(a.paidAmount||0);
    return {finalPrice,paid,open:Math.max(0,finalPrice-paid),status:finalPrice===0||paid>=finalPrice?"paid":paid>0?"partial":"open"};
  }

  function paymentText(a){
    const f=financials(a);
    if(f.status==="paid")return "Bezahlt";
    if(f.status==="partial")return money(f.open)+" offen";
    return f.finalPrice>0?money(f.open)+" offen":"Ohne Preis";
  }

  function isPast(date,mins){
    const today=isoDate(new Date());
    if(date<today)return true;
    if(date>today)return false;
    const now=new Date();return mins<now.getHours()*60+now.getMinutes();
  }

  function freeTimes(date,duration){
    duration=Number(duration||30);
    const hours=workingHours(date);if(!hours?.enabled)return [];
    const interval=Math.max(15,Number(A.db.slotInterval||30)),result=[];
    for(let m=minutesOf(hours.start);m+duration<=minutesOf(hours.end);m+=interval){
      if(isPast(date,m))continue;
      const t=timeOf(m);
      if(A.isSlotFree(date,t,duration))result.push(t);
    }
    return result;
  }

  function bookedText(minutes){
    minutes=Number(minutes||0);if(!minutes)return "0 min";
    const hours=Math.floor(minutes/60),rest=minutes%60;
    return (hours?hours+" h ":"")+(rest?rest+" min":"");
  }

  function ensureUI(){
    ensureStyles();
    const view=$('.view[data-view-panel="calendar"]');if(!view)return;
    const heading=$(".view-heading",view),panel=$(".calendar-panel",view),stack=$(".calendar-control-stack",heading);
    const copy=$(".muted",heading);
    if(copy)copy.textContent="Dein Arbeitstag auf einen Blick: freie Zeiten, Termine und Sperrzeiten – direkt bearbeitbar.";

    if(stack&&!$("[data-calendar-workspace-new]",stack)){
      const add=document.createElement("button");
      add.type="button";add.className="calendar-workspace-add primary-action";add.dataset.calendarWorkspaceNew="true";
      add.innerHTML="<span>＋</span> Termin";
      stack.appendChild(add);
    }

    const head=$(".calendar-date-head",panel);
    const legend=$(".calendar-legend",head);
    if(legend)legend.innerHTML='<span><i class="legend-booking"></i> Termin</span><span><i class="legend-block"></i> Gesperrt</span><span class="calendar-legend-free"><i></i> Frei</span>';

    if(panel&&!$("#calendarWorkspaceSummary",panel)){
      const summary=document.createElement("div");
      summary.id="calendarWorkspaceSummary";summary.className="calendar-workspace-summary";
      head?.after(summary);
    }
  }

  function cardsHTML(cards,note){
    return '<div class="calendar-workspace-cards">'+cards.map(card =>
      '<div class="calendar-workspace-card"><span>'+escapeHTML(card.label)+'</span><strong>'+escapeHTML(String(card.value))+'</strong><small>'+escapeHTML(card.meta||"")+'</small></div>'
    ).join("")+'</div><div class="calendar-workspace-note">'+note+"</div>";
  }

  function updateSummary(){
    const root=$("#calendarWorkspaceSummary");if(!root)return;
    const mode=A.calendarMode||"day",cursor=new Date(A.calendarCursor),today=isoDate(new Date());

    if(mode==="day"){
      const date=isoDate(cursor),apps=A.activeAppointments().filter(a=>a.date===date),hours=workingHours(date);
      const booked=apps.reduce((sum,a)=>sum+Number(a.duration||0),0);
      const capacity=hours.enabled?Math.max(0,minutesOf(hours.end)-minutesOf(hours.start)):0;
      const next=freeTimes(date,30)[0]||"";
      root.innerHTML=cardsHTML([
        {label:"Termine",value:apps.length,meta:"an diesem Tag"},
        {label:"Noch offen",value:apps.filter(a=>a.status==="pending").length,meta:"Bestätigungen ausstehend"},
        {label:"Gebuchte Zeit",value:bookedText(booked),meta:capacity?Math.round(booked/capacity*100)+" % des Arbeitstags":"kein Arbeitstag"},
        {label:"Nächste freie Zeit",value:next?next+" Uhr":"–",meta:next?"abhängig von der Leistung":hours.enabled?hours.start+"–"+hours.end+" Uhr":"geschlossen"}
      ],'<strong>Tipp:</strong> Freie Zeit direkt anklicken, um dort einen Termin einzutragen.');
      return;
    }

    let start,end;
    if(mode==="week"){start=startOfWeek(cursor);end=addDays(start,6)}
    else{start=new Date(cursor.getFullYear(),cursor.getMonth(),1,12);end=new Date(cursor.getFullYear(),cursor.getMonth()+1,0,12)}
    const from=isoDate(start),to=isoDate(end),apps=A.activeAppointments().filter(a=>a.date>=from&&a.date<=to);
    const booked=apps.reduce((sum,a)=>sum+Number(a.duration||0),0);
    const next=[...apps].filter(a=>a.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
    const nextLabel=next?(mode==="week"?SHORT_DAYS[new Date(next.date+"T12:00:00").getDay()]+" · "+next.time:new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit"}).format(new Date(next.date+"T12:00:00"))+" · "+next.time):"–";
    root.innerHTML=cardsHTML([
      {label:"Termine",value:apps.length,meta:mode==="week"?"in dieser Woche":"in diesem Monat"},
      {label:"Noch offen",value:apps.filter(a=>a.status==="pending").length,meta:"Bestätigungen ausstehend"},
      {label:"Gebuchte Zeit",value:bookedText(booked),meta:"Behandlungszeit"},
      {label:"Nächster Termin",value:nextLabel,meta:next?next.customerName:"keine kommende Buchung"}
    ],mode==="week"?'<strong>Woche:</strong> Termin anklicken zum Bearbeiten. Datum anklicken für die Tagesansicht.':'<strong>Monat:</strong> Termin direkt öffnen oder auf ein Datum wechseln.');
  }

  function decorateDay(){
    const root=$("#daySchedule");if(!root||A.calendarMode!=="day")return;
    const date=isoDate(A.calendarCursor),hours=workingHours(date);

    root.querySelectorAll(".calendar-free-quick,.calendar-now-marker").forEach(el=>el.remove());

    if(!hours.enabled){
      const empty=$(".empty-state",root);
      if(empty){
        empty.classList.add("calendar-workspace-closed");
        empty.innerHTML='<span>Heute geschlossen</span><strong>Für diesen Tag sind keine Öffnungszeiten hinterlegt.</strong><p>Arbeitszeiten kannst du unter „Verfügbarkeit“ anpassen.</p><button type="button" class="soft-button" data-calendar-open-availability>Verfügbarkeit öffnen</button>';
      }
      return;
    }

    $$(".schedule-event.booking",root).forEach(el=>{
      const a=A.db.appointments.find(item=>item.id===el.dataset.appointmentId);if(!a)return;
      el.classList.add("calendar-workspace-event","status-"+(a.status||"pending"));
      let tags=$(".calendar-event-tags",el);
      if(!tags){tags=document.createElement("span");tags.className="calendar-event-tags";el.appendChild(tags)}
      tags.innerHTML="<i>"+escapeHTML(statusLabel(a.status))+"</i><em>"+escapeHTML(paymentText(a))+"</em>";
    });

    const interval=Math.max(15,Number(A.db.slotInterval||30));
    $$(".schedule-row",root).forEach(row=>{
      const label=$(".schedule-time",row)?.textContent?.trim(),lane=$(".schedule-lane",row);if(!label||!lane)return;
      const hourStart=minutesOf(label);
      [0,30].forEach(offset=>{
        if(offset&&interval>30)return;
        const mins=hourStart+offset;
        if(mins<minutesOf(hours.start)||mins+30>minutesOf(hours.end)||isPast(date,mins))return;
        const time=timeOf(mins);if(!A.isSlotFree(date,time,30))return;
        const button=document.createElement("button");
        button.type="button";button.className="calendar-free-quick";button.dataset.calendarQuickDate=date;button.dataset.calendarQuickTime=time;
        button.style.top=(offset/60*58+2)+"px";button.style.height=Math.max(24,interval/60*58-4)+"px";
        button.innerHTML="<span>＋ Termin</span>";
        button.setAttribute("aria-label","Termin um "+time+" Uhr eintragen");
        lane.appendChild(button);
      });
    });

    if(date===isoDate(new Date())){
      const now=new Date(),hour=String(now.getHours()).padStart(2,"0")+":00";
      const row=$$(".schedule-row",root).find(item=>$(".schedule-time",item)?.textContent?.trim()===hour);
      const lane=row?$(".schedule-lane",row):null;
      if(lane){
        const marker=document.createElement("div");marker.className="calendar-now-marker";marker.style.top=(now.getMinutes()/60*58)+"px";
        marker.innerHTML="<span>jetzt</span>";lane.appendChild(marker);
      }
    }
  }

  function decorateWeek(){
    const root=$("#daySchedule");if(!root||A.calendarMode!=="week")return;
    $$(".appointment-chip[data-appointment-id]",root).forEach(chip=>{
      const a=A.db.appointments.find(item=>item.id===chip.dataset.appointmentId);if(!a)return;
      chip.classList.add("status-"+(a.status||"pending"));
      let meta=$(".calendar-chip-workspace-meta",chip);
      if(!meta){meta=document.createElement("small");meta.className="calendar-chip-workspace-meta";chip.appendChild(meta)}
      meta.textContent=statusLabel(a.status)+" · "+paymentText(a);
    });
    $$(".week-day-column[data-calendar-date]",root).forEach(col=>{
      if($(".calendar-week-workspace-foot",col))return;
      const date=col.dataset.calendarDate,next=freeTimes(date,30)[0],apps=A.activeAppointments().filter(a=>a.date===date);
      const foot=document.createElement("div");foot.className="calendar-week-workspace-foot";
      foot.innerHTML="<span>"+apps.length+" Termin"+(apps.length===1?"":"e")+"</span><strong>"+(next?"frei ab "+next:"")+"</strong>";
      col.appendChild(foot);
    });
  }

  function decorateMonth(){
    const root=$("#daySchedule");if(!root||A.calendarMode!=="month")return;
    $$(".month-event[data-appointment-id]",root).forEach(event=>{
      const a=A.db.appointments.find(item=>item.id===event.dataset.appointmentId);if(!a)return;
      event.classList.add("status-"+(a.status||"pending"));
      if(!event.querySelector(".calendar-month-dot")){
        const dot=document.createElement("i");dot.className="calendar-month-dot";event.prepend(dot);
      }
    });
  }

  function decorate(){
    ensureUI();updateSummary();
    if(A.calendarMode==="week")decorateWeek();
    else if(A.calendarMode==="month")decorateMonth();
    else decorateDay();
  }

  function openNew(date,time){
    const hours=workingHours(date),chosen=time||freeTimes(date,30)[0]||hours.start||"09:00";
    A.openModal?.({date,time:chosen});
  }

  function install(){
    if(installed)return;installed=true;ensureUI();

    const originalRenderAll=A.renderAll;
    A.renderAll=()=>{originalRenderAll();requestAnimationFrame(decorate)};

    const originalShowView=A.showView;
    A.showView=name=>{originalShowView(name);if(name==="calendar")requestAnimationFrame(decorate)};

    document.addEventListener("click",event=>{
      const quick=event.target.closest("[data-calendar-quick-date]");
      if(quick){event.preventDefault();event.stopPropagation();openNew(quick.dataset.calendarQuickDate,quick.dataset.calendarQuickTime);return}

      if(event.target.closest("[data-calendar-workspace-new]")){
        event.preventDefault();openNew(isoDate(A.calendarCursor));return;
      }

      if(event.target.closest("[data-calendar-open-availability]")){
        event.preventDefault();A.showView?.("availability");return;
      }

      if(event.target.closest("[data-calendar-mode],#prevDay,#nextDay,#calendarToday,[data-calendar-date]")){
        requestAnimationFrame(()=>requestAnimationFrame(decorate));
      }
    });

    decorate();
  }

  const baseInit=A.initCalendarViews;
  if(baseInit){
    A.initCalendarViews=()=>{baseInit();install()};
  }else{
    install();
  }

  Object.assign(A,{refreshCalendarWorkspace:decorate});
})();