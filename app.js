const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ym=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),today=()=>{const d=new Date();return ym(d)+'-'+String(d.getDate()).padStart(2,'0')};
const S={v:'home',emps:[],recs:[],types:[],month:ym(new Date()),f:{emp:'',date:'',month:'',type:'',q:'',sort:'d-'},edit:null,eedit:null,qe:'',last:null};
const hh=m=>(m/60).toFixed(2).replace('.',','),fd=d=>d.split('-').reverse().join('/');
const mins=t=>{const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(t||'');return m?+m[1]*60+ +m[2]:null};
const RULES={from:960,to50:1260,to100:420}; // 16:00 / 21:00 / 07:00
function calc(s,e,b,type){const a=mins(s),z=mins(e);if(a==null||z==null)return{err:'Hora de inicio o fin con formato inválido'};
const br=b===''||b==null?0:Number(b);if(!Number.isInteger(br)||br<0)return{err:'El descanso debe ser un número entero de minutos'};
const d=(z-a+1440)%1440;if(!d)return{err:'Inicio y fin no pueden ser iguales'};
if(type&&type!=='auto'){if(d-br<=0)return{err:'El descanso supera la duración'};const m=d-br;return{min:m,reg:0,parts:{a:type==='50'?m:0,b:type==='100'?m:0,o:type==='50'||type==='100'?0:m}}}
let p50=0,p100=0,reg=0;for(let i=0;i<d;i++){const t=(a+i)%1440;if(t>=RULES.from&&t<RULES.to50)p50++;else if(t>=RULES.to50||t<RULES.to100)p100++;else reg++}
if(!p50&&!p100)return{err:'Ese horario no tiene horas extra: se cuentan desde las 16:00'};
let r=br;const q=Math.min(r,p50);p50-=q;r-=q;p100-=r;if(p100<0||p50+p100<=0)return{err:'El descanso supera las horas extra'};
return{min:p50+p100,reg,parts:{a:p50,b:p100,o:0}}}
const E=id=>S.emps.find(e=>e.id==id),TN=id=>id==='auto'?'Automático':(S.types.find(t=>t.id==id)||{name:id}).name,en=id=>E(id)?.name||'(eliminado)';
const parts=r=>r.parts||{a:r.type==='50'?r.min:0,b:r.type==='100'?r.min:0,o:r.type==='50'||r.type==='100'?0:r.min};
const tot=r=>r.reduce((a,x)=>{const p=parts(x);a.n++;a.t+=x.min;a.a+=p.a;a.b+=p.b;a.o+=p.o;return a},{n:0,t:0,a:0,b:0,o:0});
const ALL=()=>[{id:'auto',name:'Automático (16 h / 21 h / 7 h)'},...S.types];
const opt=(a,sel,f)=>a.map(x=>`<option value="${esc(x.id)}"${x.id==sel?' selected':''}>${esc(f(x))}</option>`).join('');
let busy=false;
function toast(m,ok=true){const t=$('#t');t.textContent=(ok?'✓ ':'⚠ ')+m;t.className='show '+(ok?'ok':'bad');clearTimeout(toast.h);toast.h=setTimeout(()=>t.className='',3500)}
async function load(){[S.emps,S.recs,S.types]=await Promise.all([DB.all('employees'),DB.all('records'),DB.all('types')]);S.emps.sort((a,b)=>a.name.localeCompare(b.name))}
async function run(b,fn){if(busy)return;busy=true;b&&(b.disabled=true);try{await fn()}catch(e){toast(e.message||'Error inesperado',false)}finally{busy=false;b&&(b.disabled=false)}}
const rrow=r=>`<div class=row><span>${fd(r.date)} · <b>${esc(en(r.empId))}</b></span><span>${r.start}–${r.end} · ${hh(r.min)} h · ${r.type==='auto'?`50 %: ${hh(parts(r).a)} · 100 %: ${hh(parts(r).b)}`:esc(TN(r.type))}</span></div>`;
function histList(){const f=S.f,q=f.q.toLowerCase();let l=S.recs.filter(r=>(!f.emp||r.empId==f.emp)&&(!f.date||r.date===f.date)&&(!f.month||r.date.startsWith(f.month))&&(!f.type||r.type===f.type)&&(!q||(en(r.empId)+' '+r.obs+' '+r.date+' '+TN(r.type)).toLowerCase().includes(q)));
l.sort((a,b)=>f.sort==='d+'?a.date.localeCompare(b.date)||a.id-b.id:f.sort==='e'?en(a.empId).localeCompare(en(b.empId)):f.sort==='h'?b.min-a.min:b.date.localeCompare(a.date)||b.id-a.id);
return `<p class=muted>${l.length} registros · ${hh(tot(l).t)} h</p>`+(l.map(r=>`<div class=card>${rrow(r)}${r.obs?`<p class=muted>${esc(r.obs)}</p>`:''}<button class="btn sm" data-a=view data-id=${r.id}>Ver</button><button class="btn sm" data-a=editRec data-id=${r.id}>Editar</button><button class="btn sm d" data-a=delRec data-id=${r.id}>Eliminar</button></div>`).join('')||'<div class=card>No hay registros con esos filtros.</div>')}
function empList(){const q=S.qe.toLowerCase();return S.emps.filter(e=>(e.name+e.legajo+e.sector).toLowerCase().includes(q)).map(e=>`<div class="card ${e.active?'':'off'}"><b>${esc(e.name)}</b> ${e.active?'':'(inactivo)'}<p class=muted>Legajo: ${esc(e.legajo||'—')} · Sector: ${esc(e.sector||'—')}</p><button class="btn sm" data-a=editEmp data-id=${e.id}>Editar</button><button class="btn sm" data-a=togEmp data-id=${e.id}>${e.active?'Desactivar':'Activar'}</button><button class="btn sm d" data-a=delEmp data-id=${e.id}>Eliminar</button></div>`).join('')||'<div class=card>Sin empleados.</div>'}
function sumRows(m){return S.emps.map(e=>({e,T:tot(S.recs.filter(r=>r.empId==e.id&&r.date.startsWith(m)))})).filter(x=>x.T.n||x.e.active)}
const V={
home(){const T=tot(S.recs.filter(r=>r.date.startsWith(ym(new Date())))),last=[...S.recs].sort((a,b)=>b.id-a.id).slice(0,5);
return `<div class=card><h2>ExtraTime Pro</h2><p>${new Date().toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
<div class=grid><div class=card><b>${S.emps.filter(e=>e.active).length}</b>Empleados activos</div><div class=card><b>${hh(T.t)}</b>Horas extras del mes</div><div class=card><b>${hh(T.a)}</b>Horas al 50 %</div><div class=card><b>${hh(T.b)}</b>Horas al 100 %</div></div>
<div class=grid>${[['reg','Registrar horas extras'],['emp','Empleados'],['hist','Historial'],['sum','Informes'],['bak','Copias de seguridad']].map(([i,t])=>`<button class="btn p" data-a=go data-id=${i}>${t}</button>`).join('')}</div>
<div class=card><h3>Últimos registros</h3>${last.map(rrow).join('')||'<p>Todavía no hay registros.</p>'}</div>`},
reg(){const r=S.edit?S.recs.find(x=>x.id==S.edit):{date:S.last?.date||today(),empId:S.last?.emp||'',brk:'',type:'auto'};
return `<form class=card id=rf data-s=saveReg><h2>${S.edit?'Editar registro':'Registrar horas extras'}</h2>
<label>Fecha<input type=date name=date value="${r.date}" required></label>
<label>Empleado<select name=emp required><option value="">Seleccionar…</option>${opt(S.emps.filter(e=>e.active||e.id==r.empId),r.empId,e=>e.name)}</select></label>
<div class=two><label>Inicio<input type=time name=start value="${r.start||''}" required></label><label>Fin<input type=time name=end value="${r.end||''}" required></label></div>
<label>Descanso no remunerado (minutos)<input type=number name=brk min=0 step=1 inputmode=numeric value="${r.brk||''}"></label>
<label>Tipo de hora extra<select name=type>${opt(ALL(),r.type,t=>t.name)}</select></label>
<label>Observaciones<textarea name=obs>${esc(r.obs||'')}</textarea></label><p id=pv class=pv></p>
<button class="btn p" type=submit>Guardar registro</button>${S.edit?'':'<button class=btn type=submit data-more=1>Guardar y registrar otro empleado</button>'}
<button class=btn type=button data-a=clear>Limpiar formulario</button><button class=btn type=button data-a=cancel>Cancelar</button></form>`},
hist(){const f=S.f;return `<div class=card><h2>Historial</h2><input type=search data-f=q placeholder="Buscar…" value="${esc(f.q)}">
<label>Empleado<select data-f=emp><option value="">Todos</option>${opt(S.emps,f.emp,e=>e.name)}</select></label>
<div class=two><label>Fecha<input type=date data-f=date value="${f.date}"></label><label>Mes<input type=month data-f=month value="${f.month}"></label></div>
<label>Tipo<select data-f=type><option value="">Todos</option>${opt(ALL(),f.type,t=>t.name)}</select></label>
<label>Ordenar por<select data-f=sort>${[['d-','Fecha (nuevas primero)'],['d+','Fecha (antiguas primero)'],['e','Empleado'],['h','Horas (mayor a menor)']].map(([v,t])=>`<option value="${v}"${f.sort===v?' selected':''}>${t}</option>`).join('')}</select></label>
<button class=btn data-a=clrF>Quitar filtros</button></div><div id=hl>${histList()}</div>`},
sum(){const R=sumRows(S.month),T=tot(S.recs.filter(r=>r.date.startsWith(S.month)));
return `<div class=card><h2>Resumen mensual</h2><label>Mes<input type=month id=sm value="${S.month}"></label></div>
${R.map(({e,T})=>`<div class=card><b>${esc(e.name)}</b><div class=row><span>Registros</span><b>${T.n}</b></div><div class=row><span>Total horas</span><b>${hh(T.t)}</b></div><div class=row><span>Al 50 %</span><b>${hh(T.a)}</b></div><div class=row><span>Al 100 %</span><b>${hh(T.b)}</b></div>${T.o?`<div class=row><span>Otros tipos</span><b>${hh(T.o)}</b></div>`:''}</div>`).join('')}
<div class=card><b>Total del mes: ${hh(T.t)} h</b> (${T.n} registros)</div>
<div class=card><h3>Exportar a CSV (Excel)</h3><button class=btn data-a=x data-id=all>Historial completo</button><button class=btn data-a=x data-id=month>Mes seleccionado</button>
<label>Empleado<select id=xe>${opt(S.emps,'',e=>e.name)}</select></label><button class=btn data-a=x data-id=emp>Datos del empleado</button><button class=btn data-a=x data-id=sum>Resumen mensual</button></div>`},
emp(){const e=S.eedit==='new'?{active:true}:S.emps.find(x=>x.id==S.eedit);
return `<button class="btn p" data-a=newEmp>+ Agregar empleado</button>`+(S.eedit?`<form class=card data-s=saveEmp><h3>${S.eedit==='new'?'Nuevo empleado':'Editar empleado'}</h3><label>Nombre y apellido<input name=name value="${esc(e.name||'')}" required></label><label>Legajo (opcional)<input name=legajo value="${esc(e.legajo||'')}"></label><label>Sector (opcional)<input name=sector value="${esc(e.sector||'')}"></label><label><input type=checkbox name=active ${e.active?'checked':''}> Activo</label><button class="btn p" type=submit>Guardar empleado</button><button class=btn type=button data-a=cancelEmp>Cancelar</button></form>`:'')+`<input type=search id=qe placeholder="Buscar empleado…" value="${esc(S.qe)}"><div id=el>${empList()}</div>`},
bak(){return `<div class=card><h2>Copias de seguridad</h2><p class=muted>Los datos viven solo en este navegador/instalación. Descargá copias con frecuencia.</p><button class="btn p" data-a=backup>Descargar copia (JSON)</button><label>Importar copia<input type=file id=bf accept=".json,application/json"></label></div>
<div class=card><h3>Tipos de hora extra</h3>${S.types.map(t=>`<div class=row><span>${esc(t.name)}</span></div>`).join('')}<button class=btn data-a=addType>+ Agregar tipo</button></div>`}};
function render(){$('#v').innerHTML=V[S.v]();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.id===S.v));scrollTo(0,0);if(S.v==='reg')pv()}
function pv(){const f=$('#rf');if(!f)return;const d=new FormData(f),c=calc(d.get('start'),d.get('end'),d.get('brk'),d.get('type'));$('#pv').textContent=!d.get('start')||!d.get('end')?'':c.err?'⚠ '+c.err:`Normales (no cuentan): ${hh(c.reg)} h · 50 %: ${hh(c.parts.a)} h · 100 %: ${hh(c.parts.b)} h${c.parts.o?' · Otros: '+hh(c.parts.o)+' h':''} · TOTAL EXTRA: ${hh(c.min)} h`}
const csv=r=>'\ufeff'+r.map(x=>x.map(c=>{c=String(c??'');return /[";\r\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')).join('\r\n');
function dl(n,t,m){const u=URL.createObjectURL(new Blob([t],{type:m})),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
const recRows=l=>[['Fecha','Empleado','Legajo','Inicio','Fin','Descanso (min)','Horas extra','Horas 50 %','Horas 100 %','Otros','Tipo','Observaciones'],...[...l].sort((a,b)=>a.date.localeCompare(b.date)).map(r=>[fd(r.date),en(r.empId),E(r.empId)?.legajo||'',r.start,r.end,r.brk,hh(r.min),hh(parts(r).a),hh(parts(r).b),hh(parts(r).o),TN(r.type),r.obs])];
const A={
go(id){S.v=id;S.edit=null;S.eedit=null;render()},
clear(){S.edit=null;render()},cancel(){const h=S.edit;S.edit=null;S.v=h?'hist':'home';render()},
clrF(){S.f={emp:'',date:'',month:'',type:'',q:'',sort:'d-'};render()},
async saveReg(f,sub){const d=new FormData(f),c=calc(d.get('start'),d.get('end'),d.get('brk'),d.get('type'));
if(!d.get('date')||!d.get('emp'))throw Error('Completá la fecha y elegí un empleado');if(c.err)throw Error(c.err);
const o={date:d.get('date'),empId:+d.get('emp'),start:d.get('start'),end:d.get('end'),brk:+d.get('brk')||0,min:c.min,parts:c.parts,type:d.get('type'),obs:d.get('obs').trim()};
if(S.edit)o.id=S.edit;await DB.put('records',o);await load();toast('Registro guardado: '+en(o.empId)+', '+hh(o.min)+' h');
if(S.edit){S.edit=null;S.v='hist'}else S.last={date:o.date,emp:sub?.dataset.more?'':o.empId};render()},
editRec(id){S.edit=+id;S.v='reg';render()},
async delRec(id){const r=S.recs.find(x=>x.id==id);if(!confirm(`¿Eliminar el registro de ${en(r.empId)} del ${fd(r.date)}?`))return;await DB.del('records',+id);await load();toast('Registro eliminado');render()},
view(id){const r=S.recs.find(x=>x.id==id);$('#dlg').innerHTML=`<h3>Detalle</h3><div class=row><span>Fecha</span><b>${fd(r.date)}</b></div><div class=row><span>Empleado</span><b>${esc(en(r.empId))}</b></div><div class=row><span>Inicio</span><b>${r.start}</b></div><div class=row><span>Fin</span><b>${r.end}</b></div><div class=row><span>Descanso</span><b>${r.brk} min</b></div><div class=row><span>Total</span><b>${hh(r.min)} h</b></div><div class=row><span>Tipo</span><b>${esc(TN(r.type))}</b></div><div class=row><span>Al 50 %</span><b>${hh(parts(r).a)} h</b></div><div class=row><span>Al 100 %</span><b>${hh(parts(r).b)} h</b></div><p>${esc(r.obs||'Sin observaciones')}</p><button class="btn p" onclick="dlg.close()">Cerrar</button>`;$('#dlg').showModal()},
newEmp(){S.eedit='new';render()},editEmp(id){S.eedit=+id;render()},cancelEmp(){S.eedit=null;render()},
async saveEmp(f){const d=new FormData(f),name=d.get('name').trim(),lg=d.get('legajo').trim();if(!name)throw Error('El nombre es obligatorio');
if(lg&&S.emps.some(e=>e.legajo&&e.legajo.toLowerCase()===lg.toLowerCase()&&e.id!==S.eedit))throw Error('Ya existe un empleado con ese legajo');
const o={name,legajo:lg,sector:d.get('sector').trim(),active:!!d.get('active')};if(S.eedit!=='new')o.id=S.eedit;await DB.put('employees',o);await load();S.eedit=null;toast('Empleado guardado');render()},
async togEmp(id){const e=E(id);await DB.put('employees',{...e,active:!e.active});await load();toast(e.active?'Empleado desactivado':'Empleado activado');render()},
async delEmp(id){const e=E(id);if(S.recs.some(r=>r.empId==id))throw Error('Tiene registros: desactivalo en lugar de eliminarlo para conservar su historial');if(!confirm(`¿Eliminar a ${e.name}?`))return;await DB.del('employees',+id);await load();toast('Empleado eliminado');render()},
async addType(){const n=(prompt('Nombre del nuevo tipo (ej. 150 %)')||'').trim();if(!n)return;if(S.types.some(t=>t.name.toLowerCase()===n.toLowerCase()))throw Error('Ese tipo ya existe');await DB.put('types',{id:'t'+Date.now(),name:n});await load();toast('Tipo agregado');render()},
x(kind){let rows,name;const m=S.month;
if(kind==='all'){rows=recRows(S.recs);name='historial'}
else if(kind==='month'){rows=recRows(S.recs.filter(r=>r.date.startsWith(m)));name='horas-'+m}
else if(kind==='emp'){const id=$('#xe').value;rows=recRows(S.recs.filter(r=>r.empId==id));name='empleado-'+(en(id)).replace(/\W+/g,'_')}
else{rows=[['Mes','Empleado','Registros','Total horas','Horas 50 %','Horas 100 %','Otros'],...sumRows(m).filter(x=>x.T.n).map(({e,T})=>[m,e.name,T.n,hh(T.t),hh(T.a),hh(T.b),hh(T.o)])];name='resumen-'+m}
if(rows.length<2)throw Error('No hay datos para exportar');dl(`extratime-${name}.csv`,csv(rows),'text/csv;charset=utf-8');toast(`Archivo extratime-${name}.csv generado (${rows.length-1} filas)`)},
backup(){dl('extratime-copia-'+today()+'.json',JSON.stringify({app:'extratime',version:1,exported:new Date().toISOString(),employees:S.emps,records:S.recs,types:S.types},null,1),'application/json');toast('Copia descargada: '+S.emps.length+' empleados, '+S.recs.length+' registros')}};
async function importFile(inp){const file=inp.files[0];if(!file)return;
try{let d;try{d=JSON.parse(await file.text())}catch{throw Error('El archivo no es un JSON válido')}
if(!d||d.app!=='extratime'||!['employees','records','types'].every(k=>Array.isArray(d[k])))throw Error('El archivo no es una copia de ExtraTime Pro');
const dt=/^\d{4}-\d\d-\d\d$/;
if(!d.employees.every(e=>Number.isInteger(e.id)&&typeof e.name==='string'&&e.name))throw Error('Empleados con estructura inválida');
if(!d.types.every(t=>typeof t.id==='string'&&typeof t.name==='string'))throw Error('Tipos con estructura inválida');
if(!d.records.every(r=>Number.isInteger(r.id)&&dt.test(r.date)&&mins(r.start)!=null&&mins(r.end)!=null&&Number.isInteger(r.min)&&r.min>0&&d.employees.some(e=>e.id===r.empId)&&(r.type==='auto'||d.types.some(t=>t.id===r.type))))throw Error('Registros con estructura inválida o que referencian empleados/tipos inexistentes');
if(new Set(d.records.map(r=>r.id)).size!==d.records.length||new Set(d.employees.map(e=>e.id)).size!==d.employees.length)throw Error('El archivo contiene IDs duplicados');
if(!confirm(`Se REEMPLAZARÁN los datos actuales (${S.emps.length} empleados, ${S.recs.length} registros) por los del archivo (${d.employees.length} empleados, ${d.records.length} registros). Esta acción no se puede deshacer. ¿Continuar?`))return;
await DB.replaceAll(d);await load();toast(`Importado: ${d.employees.length} empleados, ${d.records.length} registros`);render()}
catch(e){toast(e.message,false)}finally{inp.value=''}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])run(b,()=>A[b.dataset.a](b.dataset.id,b))});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;if(A[f.dataset.s])run(e.submitter,()=>A[f.dataset.s](f,e.submitter))});
const onf=e=>{const t=e.target;if(t.dataset.f){S.f[t.dataset.f]=t.value;$('#hl').innerHTML=histList()}else if(t.id==='sm'){if(t.value){S.month=t.value;render()}}else if(t.id==='qe'){S.qe=t.value;$('#el').innerHTML=empList()}else if(t.closest&&t.closest('#rf'))pv();else if(t.id==='bf'&&e.type==='change'&&!busy){busy=true;importFile(t).finally(()=>busy=false)}};
document.addEventListener('input',onf);document.addEventListener('change',onf);
(async()=>{try{await DB.open();await load();render()}catch(e){$('#v').innerHTML=`<div class=card><h2>No se puede guardar</h2><p>${esc(e.message)}</p></div>`}
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{})})();
