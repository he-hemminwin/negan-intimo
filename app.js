const $ = s => document.querySelector(s);
const chatEl = $('#chat');
const inputEl = $('#input');
const statusEl = $('#status');
const settings = $('#settings');

const DEFAULTS = {
  workerUrl: localStorage.getItem('negan_worker_url') || '',
  model: localStorage.getItem('negan_model') || 'qwen/qwen3.6-27b',
  temperature: Number(localStorage.getItem('negan_temperature') || '0.85')
};

let messages = JSON.parse(localStorage.getItem('negan_intimo_history') || 'null') || [
  { role: 'user', content: window.INITIAL_USER_TURN }
];

function render(){
  chatEl.innerHTML='';
  for(const m of messages){
    const wrap=document.createElement('div');
    wrap.className=`msg ${m.role}`;
    const inner=document.createElement('div');
    const meta=document.createElement('div');
    meta.className='meta';
    meta.textContent=m.role==='user'?'Oddi':'Negan';
    const bubble=document.createElement('div');
    bubble.className='bubble';
    bubble.textContent=m.content;
    inner.append(meta,bubble); wrap.append(inner); chatEl.append(wrap);
  }
  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
}

function persist(){ localStorage.setItem('negan_intimo_history', JSON.stringify(messages)); }
function setStatus(t){ statusEl.textContent=t; }

async function askModel(extraMessages=[]){
  const url=(localStorage.getItem('negan_worker_url')||'').replace(/\/$/,'');
  if(!url){ settings.showModal(); throw new Error('Configura primero la URL del Worker.'); }
  const model=localStorage.getItem('negan_model')||'qwen/qwen3.6-27b';
  const temperature=Number(localStorage.getItem('negan_temperature')||'0.85');
  setStatus('Negan está respondiendo…');
  const res=await fetch(url+'/chat',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model, temperature,
      system: window.NEGAN_CONTEXT,
      messages:[...messages,...extraMessages]
    })
  });
  if(!res.ok){ const txt=await res.text(); throw new Error(txt||`Error ${res.status}`); }
  const data=await res.json();
  if(!data.text) throw new Error('La respuesta llegó vacía.');
  return data.text;
}

async function continueScene(){
  try{
    const text=await askModel();
    messages.push({role:'assistant',content:text}); persist(); render(); setStatus('');
  }catch(e){ setStatus(e.message); }
}

async function send(){
  const text=inputEl.value.trim(); if(!text) return;
  messages.push({role:'user',content:text}); inputEl.value=''; persist(); render();
  await continueScene();
}

function transcript(){
  return messages.map(m=>`${m.role==='user'?'ODDI':'NEGAN'}\n${m.content}`).join('\n\n---\n\n');
}

async function exportScene(){
  try{
    setStatus('Preparando resumen de canon…');
    const summaryPrompt={role:'user',content:`FUERA DE ROL. Resume exclusivamente los hechos ocurridos en esta conversación íntima para incorporarlos después al canon del proyecto. No escribas prosa erótica ni adornos: usa hechos neutrales y concretos. Separa: 1) acciones confirmadas de Negan, 2) acciones confirmadas de Oddi, 3) avances de relación/intimidad, 4) diálogos o revelaciones que cambien continuidad, 5) punto exacto de cierre, 6) cualquier límite o acuerdo nuevo. No atribuyas pensamientos a Oddi. No inventes nada.`};
    const summary=await askModel([summaryPrompt]);
    const body=`EXPORTACIÓN — ESCENA ÍNTIMA NEGAN & ODDI\nFecha de exportación: ${new Date().toLocaleString('es-ES')}\n\n====================\nRESUMEN PARA CANON\n====================\n${summary}\n\n====================\nTRANSCRIPCIÓN COMPLETA\n====================\n${transcript()}\n`;
    const blob=new Blob([body],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`NEGAN_ODDI_ESCENA_INTIMA_${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(a.href); setStatus('Archivo exportado.');
  }catch(e){ setStatus(e.message); }
}

$('#settingsBtn').onclick=()=>settings.showModal();
$('#continueBtn').onclick=continueScene;
$('#sendBtn').onclick=send;
$('#exportBtn').onclick=exportScene;
$('#saveSettings').onclick=()=>{
  localStorage.setItem('negan_worker_url',$('#workerUrl').value.trim());
  localStorage.setItem('negan_model',$('#model').value.trim()||'qwen/qwen3.6-27b');
  localStorage.setItem('negan_temperature',$('#temperature').value||'0.85');
};
inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});

$('#workerUrl').value=DEFAULTS.workerUrl; $('#model').value=DEFAULTS.model; $('#temperature').value=DEFAULTS.temperature;
render();
