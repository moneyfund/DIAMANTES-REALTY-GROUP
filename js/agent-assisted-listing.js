import { auth, db, collection, doc, getDoc, getDocs, onSnapshot, query, where, serverTimestamp, onAuthStateChanged } from './firebase-services.js';
import { writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ALLOWED = new Set([
  'norvingarcia220@gmail.com','valop27@gmail.com','dra.nazarethbravo@gmail.com','diego.valdivia.52056@gmail.com',
  '27marvin@gmail.com','rubenn2121@gmail.com','dr.americamora@gmail.com','norlanflores3@gmail.com','amyblandon.as@gmail.com',
  'marccenarokarel@gmail.com','caguadamuzmoreno@gmail.com','agentenorvingarcia@gmail.com','valenzuela.ing120@gmail.com',
  'nazarethbravo.realestate@gmail.com','uh243384@gmail.com'
]);
const s = { user:null, agents:[], pending:null, ids:new Set(), unsub:null, observer:null };
const norm = (v='') => String(v||'').trim().toLowerCase();
const esc = (v='') => String(v??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function identity(id, data={}) {
  return {
    id:String(data.uid||data.userId||data.agentId||id||'').trim(), docId:id,
    email:norm(data.email||data.correo), name:String(data.name||data.nombre||data.displayName||data.email||'Agente DRG').trim(),
    phone:String(data.phone||data.telefono||data.tel||'').trim(), whatsapp:String(data.whatsapp||data.whatsApp||'').trim(),
    photo:String(data.photo||data.photoURL||data.photoUrl||data.profileImage||data.profilePhoto||data.avatar||'').trim()
  };
}
function enabled(data={}) {
  const status=norm(data.status||data.estado||data.accountStatus), email=norm(data.email||data.correo);
  return ALLOWED.has(email) && data.disabled!==true && data.enabled!==false && data.active!==false
    && !['disabled','inactive','inactivo','suspended','suspendido','blocked','bloqueado'].includes(status);
}
function selfAgent() {
  if (!s.user) return null;
  const email=norm(s.user.email);
  return s.agents.find(a=>a.id===s.user.uid)||s.agents.find(a=>a.email===email)||identity(s.user.uid,{
    uid:s.user.uid,email:s.user.email,name:document.getElementById('agentName')?.value||s.user.displayName,
    phone:document.getElementById('agentPhone')?.value,whatsapp:document.getElementById('agentWhatsapp')?.value,photo:s.user.photoURL
  });
}
function agentByKey(key='') { return s.agents.find(a=>a.id===key||a.docId===key||a.email===norm(key))||null; }
function setMessage(text,type='info') { const n=document.getElementById('dashboardMessage'); if(n){n.textContent=text;n.dataset.type=type;n.classList.toggle('hidden',!text);} }
function setLegacy(agent) { const n=document.getElementById('propertyAgentName'); if(n&&agent)n.value=agent.name; }

function injectUI() {
  if (document.getElementById('propertyListingAgent')) return;
  const legacy=document.getElementById('propertyAgentName'), label=legacy?.closest('label');
  if(!label) return;
  const style=document.createElement('style'); style.id='assistedListingStyles'; style.textContent=`
    .assisted-owner{padding:16px 18px;border:1px solid rgba(176,0,8,.14);border-radius:16px;background:linear-gradient(135deg,rgba(176,0,8,.045),#fff);box-shadow:0 8px 24px rgba(15,23,42,.045)}
    .assisted-owner__head{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}.assisted-owner__head strong{color:#111827}.assisted-owner__head span,.assisted-owner__msg{color:#667085;font-size:.82rem;line-height:1.45}.assisted-owner__badge{align-self:flex-start;padding:5px 9px;border:1px solid rgba(176,0,8,.13);border-radius:999px;color:#8f0007!important;background:#fff;font-weight:800;text-transform:uppercase;font-size:.68rem!important}.assisted-owner select{width:100%;margin-top:7px}.assisted-owner__msg{margin:9px 0 0}.assisted-owner__msg strong{color:#8f0007}.assisted-owner.is-locked{opacity:.84}.assisted-legacy{display:none!important}@media(max-width:720px){.assisted-owner__head{display:block}.assisted-owner__badge{display:inline-block;margin-top:7px}}
  `; document.head.appendChild(style);
  label.classList.add('assisted-legacy'); label.setAttribute('aria-hidden','true');
  const box=document.createElement('div'); box.id='assistedListingOwner'; box.className='assisted-owner form-span-2'; box.innerHTML=`
    <div class="assisted-owner__head"><div><strong>¿A nombre de qué agente se enlistará?</strong><br><span>Puedes cargarla para tu perfil o ayudar a otro agente habilitado.</span></div><span class="assisted-owner__badge">Asignación</span></div>
    <label>Agente propietario del listado<select id="propertyListingAgent" required disabled><option>Cargando agentes…</option></select></label>
    <p id="propertyListingAgentResult" class="assisted-owner__msg">Cargando perfiles autorizados…</p>`;
  label.before(box);
  box.querySelector('select').addEventListener('change',e=>{const a=agentByKey(e.target.value);if(a){setLegacy(a);describe(a,e.target.disabled);}});
}
function describe(agent,locked=false){
  const n=document.getElementById('propertyListingAgentResult'); if(!n||!agent)return;
  const me=selfAgent(), mine=me&&(agent.id===me.id||agent.email===me.email);
  n.innerHTML=locked?`Esta propiedad pertenece a <strong>${esc(agent.name)}</strong>. Al editarla se conserva ese agente.`
    :mine?'La propiedad quedará en <strong>Mis propiedades</strong> y se mostrará a tu nombre.'
    :`La propiedad quedará en el inventario de <strong>${esc(agent.name)}</strong>. Tu perfil solo quedará en la auditoría privada de administración.`;
}
function renderOptions(preferred=''){
  const sel=document.getElementById('propertyListingAgent'); if(!sel)return;
  const me=selfAgent(), chosen=agentByKey(preferred)||me||s.agents[0];
  sel.innerHTML=s.agents.map(a=>`<option value="${esc(a.id||a.docId||a.email)}">${me&&(a.id===me.id||a.email===me.email)?'Mi perfil — ':''}${esc(a.name)}${a.email?` · ${esc(a.email)}`:''}</option>`).join('');
  if(chosen){sel.value=chosen.id||chosen.docId||chosen.email;setLegacy(chosen);describe(chosen,sel.disabled);}
}
async function loadAgents(){
  const snap=await getDocs(collection(db,'agents')), map=new Map();
  snap.docs.forEach(d=>{const data=d.data();if(!enabled(data))return;const a=identity(d.id,data);if(a.id&&a.email)map.set(a.email,a);});
  const me=identity(s.user.uid,{uid:s.user.uid,email:s.user.email,name:document.getElementById('agentName')?.value||s.user.displayName,phone:document.getElementById('agentPhone')?.value,whatsapp:document.getElementById('agentWhatsapp')?.value,photo:s.user.photoURL});
  if(ALLOWED.has(me.email)) map.set(me.email,{...map.get(me.email),...me});
  s.agents=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es')); renderOptions();
}
function unlock(){const sel=document.getElementById('propertyListingAgent'),box=document.getElementById('assistedListingOwner'),me=selfAgent();if(!sel||!me)return;sel.disabled=false;box?.classList.remove('is-locked');renderOptions(me.id);sel.disabled=false;describe(me,false);}
function lock(agent){const sel=document.getElementById('propertyListingAgent'),box=document.getElementById('assistedListingOwner');if(!sel||!agent)return;renderOptions(agent.id);sel.disabled=true;box?.classList.add('is-locked');setLegacy(agent);describe(agent,true);}
function timeMs(v){return v?.toMillis?.()||((v?.seconds||0)*1000)||Date.parse(v)||0;}
function matches(p,id){const q=s.pending;if(!q||q.ids.has(id)||norm(p.createdBy)!==norm(s.user?.uid)||norm(p.title||p.titulo)!==q.title)return false;if(q.location&&norm(p.location||p.ubicacion)!==q.location)return false;if(q.price>0&&Number(p.price??p.precio??0)!==q.price)return false;const t=timeMs(p.createdAt||p.submittedAt);return !t||t>=q.started-5000;}
function scan(snapshot){const q=s.pending;if(!q||q.candidate||q.transferring)return;const found=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(p=>matches(p,p.id)).sort((a,b)=>timeMs(b.createdAt||b.submittedAt)-timeMs(a.createdAt||a.submittedAt))[0];if(found){q.candidate=found.id;transfer();}}
function listen(user){s.unsub?.();s.ids.clear();s.unsub=onSnapshot(query(collection(db,'properties'),where('createdBy','==',user.uid)),snap=>{scan(snap);s.ids=new Set(snap.docs.map(d=>d.id));},e=>console.warn('[AssistedListing] listener',e));}
function begin(){
  if(!s.user||document.getElementById('propertyDocId')?.value)return;const sel=document.getElementById('propertyListingAgent'),target=agentByKey(sel?.value),me=selfAgent();
  if(!target||!me||target.id===me.id||target.email===me.email)return;setLegacy(target);
  s.pending={target,ids:new Set(s.ids),started:Date.now(),title:norm(document.getElementById('propertyTitle')?.value),location:norm(document.getElementById('propertyLocation')?.value),price:Number(document.getElementById('propertyPrice')?.value||0),candidate:'',success:false,transferring:false};
}
async function transfer(){
  const q=s.pending,u=s.user;if(!q||!u||!q.success||!q.candidate||q.transferring)return;q.transferring=true;const a=q.target,uploader=document.getElementById('agentName')?.value.trim()||u.displayName||u.email||'Agente DRG';
  try{
    const propertyRef=doc(db,'properties',q.candidate),snap=await getDoc(propertyRef);if(!snap.exists()||norm(snap.data().createdBy)!==norm(u.uid))throw new Error('ownership changed');
    const auditRef=doc(db,'propertyListingAudit',q.candidate);
    const batch=writeBatch(db);
    batch.update(propertyRef,{agenteId:a.id,agentId:a.id,agentEmail:a.email,email:a.email,createdByEmail:a.email,ownerEmail:a.email,createdBy:a.id,ownerId:a.id,userId:a.id,agentName:a.name,agentPhone:a.phone||'',agentWhatsapp:a.whatsapp||'',agentPhoto:a.photo||'',updatedAt:serverTimestamp()});
    batch.set(auditRef,{propertyId:q.candidate,uploadedByAgentId:u.uid,uploadedByAgentEmail:norm(u.email),uploadedByAgentName:uploader,ownerAgentId:a.id,ownerAgentEmail:a.email,ownerAgentName:a.name,source:'agent-dashboard-assisted-listing',createdAt:serverTimestamp()});
    await batch.commit();
    s.pending=null;setMessage(`Propiedad enviada a revisión y enlistada a nombre de ${a.name}. Administración conservará de forma privada la trazabilidad de que la carga se realizó desde tu perfil.`,'success');unlock();
  }catch(e){console.error('[AssistedListing] assignment failed',e);s.pending=null;setMessage(`La propiedad se guardó, pero no pudo asignarse a ${a.name}. No la vuelvas a cargar para evitar duplicados; administración debe revisar los permisos de Firestore.`,'error');}
}
function watchMessage(){const n=document.getElementById('dashboardMessage');if(!n||s.observer)return;const inspect=()=>{if(!s.pending)return;const type=n.dataset.type||'',text=norm(n.textContent);if(type==='success'&&text.includes('propiedad enviada a revisión')){s.pending.success=true;transfer();}else if(type==='error'&&!s.pending.transferring)s.pending=null;};s.observer=new MutationObserver(inspect);s.observer.observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['data-type']});}
async function lockExisting(id){try{const snap=await getDoc(doc(db,'properties',id));if(!snap.exists())return;const p=snap.data(),a=s.agents.find(x=>x.id===p.agentId)||s.agents.find(x=>x.email===norm(p.agentEmail||p.email));if(a)lock(a);}catch(e){console.warn('[AssistedListing] edit owner',e);}}
function bind(){const form=document.getElementById('propertyForm');if(!form||form.dataset.assistedBound)return;form.dataset.assistedBound='1';form.addEventListener('submit',begin,true);document.getElementById('propertyFormReset')?.addEventListener('click',()=>{s.pending=null;setTimeout(unlock,0);});document.addEventListener('click',e=>{const b=e.target.closest('[data-edit-property]');if(b){s.pending=null;setTimeout(()=>lockExisting(b.dataset.editProperty),0);}},true);}

onAuthStateChanged(auth,user=>{
  if(!user){s.user=null;s.agents=[];s.pending=null;s.unsub?.();s.unsub=null;return;}
  s.user=user;injectUI();watchMessage();bind();loadAgents().then(()=>{const sel=document.getElementById('propertyListingAgent');if(sel)sel.disabled=false;unlock();listen(user);}).catch(e=>{console.error('[AssistedListing] init',e);const sel=document.getElementById('propertyListingAgent');if(sel){sel.disabled=true;sel.innerHTML='<option>No fue posible cargar los agentes</option>';}});
});
