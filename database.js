const DB={db:null,
open(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB no está disponible: los datos NO se pueden guardar en este navegador.'));
const r=indexedDB.open('extratime',1);
r.onupgradeneeded=()=>{const d=r.result,t=r.transaction;d.createObjectStore('employees',{keyPath:'id',autoIncrement:true});d.createObjectStore('records',{keyPath:'id',autoIncrement:true});d.createObjectStore('types',{keyPath:'id'});
['Andrea','Claudio','Frank','Walter'].forEach(n=>t.objectStore('employees').add({name:n,legajo:'',sector:'',active:true}));
t.objectStore('types').add({id:'50',name:'50 %'});t.objectStore('types').add({id:'100',name:'100 %'})};
r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error||new Error('No se pudo abrir la base de datos'))})},
tx(s,m,f){return new Promise((res,rej)=>{const t=this.db.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error||new Error('Error de base de datos'))})},
all(s){return this.tx(s,'readonly',o=>o.getAll())},put(s,v){return this.tx(s,'readwrite',o=>o.put(v))},del(s,id){return this.tx(s,'readwrite',o=>o.delete(id))},
replaceAll(d){return new Promise((res,rej)=>{const n=['employees','records','types'],t=this.db.transaction(n,'readwrite');n.forEach(k=>{const s=t.objectStore(k);s.clear();d[k].forEach(v=>s.put(v))});t.oncomplete=()=>res();t.onerror=t.onabort=()=>rej(t.error||new Error('Importación cancelada; los datos actuales no se modificaron'))})}};
