const $ = s => document.querySelector(s);
const chatEl = $('#chat');
const inputEl = $('#input');
const statusEl = $('#status');
const settings = $('#settings');

const DEFAULTS = {
  ollamaUrl: localStorage.getItem('negan_ollama_url') || 'http://127.0.0.1:11434',
  model: localStorage.getItem('negan_model') || 'negan-rp',
  temperature: Number(localStorage.getItem('negan_temperature') || '0.85'),
  numCtx: Number(localStorage.getItem('negan_num_ctx') || '8192'),
  sceneState: localStorage.getItem('negan_scene_state') || window.INITIAL_SCENE_STATE || ''
};

let messages = JSON.parse(localStorage.getItem('negan_intimo_history') || 'null') || [
  { role: 'user', content: window.INITIAL_USER_TURN }
];

function cleanModelText(text=''){
  let out = String(text);
  out = out.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');
  out = out.replace(/^[\s\S]*?<\/think>\s*/i, '');
  return out.trim();
}

messages = messages.map(m => m.role === 'assistant' ? {...m, content: cleanModelText(m.content)} : m);
localStorage.setItem('negan_intimo_history', JSON.stringify(messages));

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

function liveSystemPrompt(){
  const sceneState = localStorage.getItem('negan_scene_state') || window.INITIAL_SCENE_STATE || '';
  return `${window.NEGAN_CONTEXT}

ESTADO FÍSICO/ESPACIAL ACTUAL — PRIORIDAD MÁXIMA
${sceneState}

REGLA: conserva esta geometría hasta que un mensaje del usuario o una acción de Negan la cambie explícitamente. No inventes que alguien está encima, debajo, sentado, tumbado o de pie si no consta aquí o en el historial.`;
}

async function askModel(extraMessages=[]){
  const base=(localStorage.getItem('negan_ollama_url') || 'http://127.0.0.1:11434').replace(/\/$/,'');
  const model=localStorage.getItem('negan_model') || 'negan-rp';
  const temperature=Number(localStorage.getItem('negan_temperature') || '0.85');
  const numCtx=Number(localStorage.getItem('negan_num_ctx') || '8192');

  setStatus('Negan está respondiendo…');

  let res;
  try {
    res = await fetch(base + '/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model,
        messages:[
          {role:'system', content: liveSystemPrompt()},
          ...messages,
          ...extraMessages
        ],
        stream:false,
        think:false,
        keep_alive:'30m',
        options:{
          temperature,
          top_p:0.9,
          repeat_penalty:1.08,
          num_ctx:numCtx,
          num_predict:700
        }
      })
    });
  } catch (e) {
    throw new Error(
      'No puedo conectar con Ollama. Comprueba que Ollama esté abierto, que la URL sea http://127.0.0.1:11434 y que hayas permitido a esta web acceder a la red local.'
    );
  }

  if(!res.ok){
    const txt=await res.text();
    throw new Error(txt || `Error ${res.status}`);
  }

  const data=await res.json();
  const cleaned=cleanModelText(data?.message?.content || '');
  if(!cleaned) throw new Error('La respuesta llegó vacía.');
  return cleaned;
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
    const body=`EXPORTACIÓN — ESCENA ÍNTIMA NEGAN & ODDI
Fecha de exportación: ${new Date().toLocaleString('es-ES')}

====================
RESUMEN PARA CANON
====================
${summary}

====================
TRANSCRIPCIÓN COMPLETA
====================
${transcript()}
`;
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
  localStorage.setItem('negan_ollama_url',$('#ollamaUrl').value.trim() || 'http://127.0.0.1:11434');
  localStorage.setItem('negan_model',$('#model').value.trim() || 'negan-rp');
  localStorage.setItem('negan_temperature',$('#temperature').value || '0.85');
  localStorage.setItem('negan_num_ctx',$('#numCtx').value || '8192');
  localStorage.setItem('negan_scene_state',$('#sceneState').value.trim());
};

inputEl.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}
});

$('#ollamaUrl').value=DEFAULTS.ollamaUrl;
$('#model').value=DEFAULTS.model;
$('#temperature').value=DEFAULTS.temperature;
$('#numCtx').value=DEFAULTS.numCtx;
$('#sceneState').value=DEFAULTS.sceneState;
render();
