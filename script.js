const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'×':'☰'});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}));
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();

const bookingState={service:'',duration:'',date:'',dateLabel:'',time:'',customer:null};
const panels=[...document.querySelectorAll('.booking-panel')];
const progress=[...document.querySelectorAll('.progress-step')];
const serviceButtons=[...document.querySelectorAll('.service-option')];
const dateScroller=document.querySelector('#dateScroller');
const timeSlots=document.querySelector('#timeSlots');
const selectedDateLabel=document.querySelector('#selectedDateLabel');
const form=document.querySelector('#bookingForm');

function setStep(step){
  panels.forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===step));
  progress.forEach((p,i)=>{p.classList.toggle('active',i+1===step);p.classList.toggle('done',i+1<step)});
  document.querySelector('#booking')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function updateSummary(){
  const values={summaryService:bookingState.service||'Noch nicht gewählt',summaryDuration:bookingState.duration?`${bookingState.duration} Min.`:'–',summaryDate:bookingState.dateLabel||'–',summaryTime:bookingState.time||'–'};
  Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value});
}
function formatDate(date){return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long'}).format(date)}
function buildDates(){
  if(!dateScroller)return;
  dateScroller.innerHTML='';
  const weekdays=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const months=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const start=new Date();
  for(let offset=1;offset<=10;offset++){
    const d=new Date(start);d.setDate(start.getDate()+offset);
    if(d.getDay()===0)continue;
    const btn=document.createElement('button');btn.type='button';btn.className='date-option';btn.dataset.iso=d.toISOString().slice(0,10);btn.dataset.label=formatDate(d);
    btn.innerHTML=`<small>${weekdays[d.getDay()]}</small><strong>${String(d.getDate()).padStart(2,'0')}</strong><span>${months[d.getMonth()]}</span>`;
    btn.addEventListener('click',()=>selectDate(btn));dateScroller.appendChild(btn);
    if(dateScroller.children.length>=7)break;
  }
}
function selectDate(btn){
  document.querySelectorAll('.date-option').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
  bookingState.date=btn.dataset.iso;bookingState.dateLabel=btn.dataset.label;bookingState.time='';
  if(selectedDateLabel)selectedDateLabel.textContent=bookingState.dateLabel;
  updateSummary();buildTimes();
}
function buildTimes(){
  if(!timeSlots)return;
  const slots=['09:00','10:30','12:00','14:00','15:30','17:00'];
  timeSlots.innerHTML='';
  slots.forEach(time=>{const btn=document.createElement('button');btn.type='button';btn.className='time-slot';btn.textContent=time;btn.addEventListener('click',()=>{document.querySelectorAll('.time-slot').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');bookingState.time=time;updateSummary();setTimeout(()=>setStep(3),180)});timeSlots.appendChild(btn)});
}
serviceButtons.forEach(btn=>btn.addEventListener('click',()=>{
  serviceButtons.forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
  bookingState.service=btn.dataset.service;bookingState.duration=btn.dataset.duration;bookingState.date='';bookingState.dateLabel='';bookingState.time='';
  updateSummary();buildDates();if(timeSlots)timeSlots.innerHTML='<div class="time-placeholder">Bitte zuerst ein Datum auswählen.</div>';if(selectedDateLabel)selectedDateLabel.textContent='Datum auswählen';setTimeout(()=>setStep(2),180);
}));

document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>setStep(Number(btn.dataset.back))));
if(form){form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form);bookingState.customer={firstName:data.get('firstName'),lastName:data.get('lastName'),email:data.get('email'),phone:data.get('phone')};
  document.getElementById('confirmService').textContent=bookingState.service;
  document.getElementById('confirmDate').textContent=`${bookingState.dateLabel} · ${bookingState.time} Uhr · ca. ${bookingState.duration} Min.`;
  document.getElementById('confirmCustomer').textContent=`${bookingState.customer.firstName} ${bookingState.customer.lastName} · ${bookingState.customer.email}`;
  setStep(4);
})}
updateSummary();