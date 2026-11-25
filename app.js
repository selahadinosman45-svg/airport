const D=window.BRIEFINGS,$=s=>document.querySelector(s),list=$('#list'),view=$('#view');
const AWC='https://aviationweather.gov/api/data/';
const strip=h=>h.replace(/<[^>]+>/g,' ');
D.forEach(x=>x.text=(x.code+' '+x.icao+' '+x.subtitle+' '+strip(x.html)).toLowerCase());
const AP=D.filter(x=>x.icao);
let pins=[];try{pins=JSON.parse(localStorage.pins||'[]')}catch(e){}
const savePins=()=>{try{localStorage.pins=JSON.stringify(pins)}catch(e){}};

/* splash */
const sp=$('#splash');let seen=false;try{seen=sessionStorage.seen}catch(e){}
setTimeout(()=>{sp.classList.add('hide');try{sessionStorage.seen=1}catch(e){}},seen?200:1900);

/* weather */
const cache={};
async function getWx(ids,force){
  const key=ids.join(),c=cache[key];
  if(!force&&c&&Date.now()-c.t<6e5)return c.d;
  const j=async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw 0;const t=await r.text();return t?JSON.parse(t):[]};
  const [m,t]=await Promise.all([j(`${AWC}metar?ids=${key}&format=json`),j(`${AWC}taf?ids=${key}&format=json`).catch(()=>[])]);
  const d={};m.forEach(x=>d[x.icaoId]={m:x});t.forEach(x=>{if(d[x.icaoId])d[x.icaoId].taf=x.rawTAF||x.rawTaf});
  cache[key]={t:Date.now(),d};return d;
}
const pad=n=>String(n).padStart(3,'0');
function parse(m){
  const ceil=(m.clouds||[]).find(c=>['BKN','OVC','OVX'].includes(c.cover));
  return {
    wind:m.wspd==null?'—':(m.wdir==='VRB'?'VRB':pad(m.wdir)+'°')+' / '+m.wspd+(m.wgst?'G'+m.wgst:'')+' kt',
    vis:m.visib==null?'—':m.visib+' SM',
    temp:m.temp==null?'—':Math.round(m.temp)+'° / '+Math.round(m.dewp)+'°',
    qnh:m.altim?Math.round(m.altim)+' hPa':'—',
    ceil:ceil?ceil.cover+' '+ceil.base+' ft':'No ceiling',
    cat:m.fltCat||'', age:m.obsTime?Math.max(0,Math.round((Date.now()/1000-m.obsTime)/60)):null
  };
}
const ago=a=>a==null?'':a<90?`${a} min ago`:`${Math.round(a/60)} h ago`;
function wxWidget(icao,name){
  return `<div class="w wxw" data-icao="${icao}"><h4>Weather · ${icao}<button class="rf">Refresh</button></h4><div class="wxb sm">Loading…</div></div>`;
}
async function fillWx(el,force){
  const icao=el.dataset.icao,b=el.querySelector('.wxb'),rf=el.querySelector('.rf');
  rf.classList.add('spin');
  try{
    const d=(await getWx([icao],force))[icao];
    if(!d)throw 0;
    const p=parse(d.m);
    b.className='wxb';
    b.innerHTML=`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ${p.cat}">${p.cat||'N/A'}</span><span class="sm">Observed ${ago(p.age)} · refreshed ${new Date().toISOString().slice(11,16)}Z</span></div>
    <div class="wx"><div><span>Wind</span><b>${p.wind}</b></div><div><span>Visibility</span><b>${p.vis}</b></div><div><span>Temp / Dew</span><b>${p.temp}</b></div><div><span>QNH</span><b>${p.qnh}</b></div><div><span>Ceiling</span><b>${p.ceil}</b></div></div>
    <pre class="raw">${d.m.rawOb||''}${d.taf?'\n\n'+d.taf:''}</pre>`;
  }catch(e){
    b.className='wxb sm';
    b.innerHTML=`Weather unavailable for ${icao} (offline, or no METAR issued). <a href="${AWC.replace('/api/data/','/metar')}?ids=${icao}" target="_blank" rel="noopener">Open on aviationweather.gov</a>`;
  }
  rf.classList.remove('spin');
}
function bindWx(root){root.querySelectorAll('.wxw').forEach(el=>{fillWx(el);el.querySelector('.rf').onclick=()=>fillWx(el,true)})}

/* nav */
function nav(q=''){
  q=q.toLowerCase().trim();let out='',g='';
  D.filter(x=>!q||x.text.includes(q)).forEach(x=>{
    if(x.group!==g){g=x.group;out+=`<h2>${g}</h2>`}
    out+=`<a href="#${x.id}" data-id="${x.id}">${x.flag} <span>${x.code}</span><small>${x.icao}</small></a>`});
  list.innerHTML=out||'<p class="empty">No matches</p>';mark()}
const mark=()=>list.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.id===location.hash.slice(1)));

/* clocks */
let tick;
function clocks(){
  const f=o=>{const d=new Date(Date.now()+o*36e5);return d.toISOString().slice(11,16)};
  const u=$('#utc'),l=$('#lt');if(!u){clearInterval(tick);return}u.textContent=f(0);l.textContent=f(3);
}

/* views */
function home(){
  const tiles=a=>a.map(x=>`<a class="w tile" href="#${x.id}"><div class="sm">${x.flag} ${x.icao}</div><div class="big">${x.code}</div><div class="sm">${x.subtitle.replace(x.icao,'').replace(/^[\s/]+/,'').split('/')[0]||''}</div></a>`).join('');
  const pinned=AP.filter(x=>pins.includes(x.id));
  view.innerHTML=`<div class="hero"><h2>Good day, Captain</h2><p>Airport briefings, weather and reference in one place.</p></div>
  <div class="grid two">
    <div class="w"><h4>Time</h4><div style="display:flex;gap:28px"><div><div class="big" id="utc"></div><div class="sm">UTC</div></div><div><div class="big" id="lt"></div><div class="sm">Addis (UTC+3)</div></div></div></div>
    <div class="w"><h4>Library</h4><div style="display:flex;gap:28px"><div><div class="big">${AP.length}</div><div class="sm">Airports</div></div><div><div class="big">${D.filter(x=>x.group==='Addis FIR').length}</div><div class="sm">FIR sheets</div></div><div><div class="big">${pins.length}</div><div class="sm">Pinned</div></div></div></div>
    ${wxWidget('HAAB')}
  </div>
  ${pinned.length?`<div class="hero" style="margin-bottom:10px"><p>Pinned</p></div><div class="grid">${tiles(pinned)}</div>`:''}
  <div class="hero" style="margin:26px 0 10px"><p>All airports</p></div><div class="grid">${tiles(AP)}</div>`;
  clocks();clearInterval(tick);tick=setInterval(clocks,10000);bindWx(view);
}
function show(){
  const id=location.hash.slice(1),x=D.find(d=>d.id===id);document.body.classList.remove('open');mark();scrollTo(0,0);
  if(!x)return home();
  const pin=x.icao?`<button class="pin ${pins.includes(x.id)?'on':''}" title="Pin to home">★</button>`:'';
  view.innerHTML=`<div class="hero" style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1"><h2>${x.flag} ${x.code}${x.status?` <span class="chip">${x.status}</span>`:''}</h2><p>${x.subtitle}</p></div>${pin}</div>
  ${x.icao?`<div style="margin-bottom:14px">${wxWidget(x.icao)}</div>`:''}
  <div class="w doc">${x.html}</div>`;
  const p=view.querySelector('.pin');if(p)p.onclick=()=>{pins=pins.includes(x.id)?pins.filter(i=>i!==x.id):[...pins,x.id];savePins();p.classList.toggle('on')};
  if(x.icao)bindWx(view);
}
$('#q').addEventListener('input',e=>nav(e.target.value));
$('#menu').onclick=()=>document.body.classList.toggle('open');
addEventListener('hashchange',show);nav();show();
