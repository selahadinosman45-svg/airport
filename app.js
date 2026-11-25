const D=window.BRIEFINGS,$=s=>document.querySelector(s),list=$('#list'),view=$('#view');
const AWC='https://aviationweather.gov/api/data/',AP=D.filter(x=>x.icao);
const ld=(k,f)=>{try{return JSON.parse(localStorage[k])}catch(e){return f}},sv=(k,v)=>{try{localStorage[k]=JSON.stringify(v)}catch(e){}};
let pins=ld('pins',[]),recent=ld('recent',[]),chk=ld('chk',{}),tab='ov',onWx=null;
D.forEach(x=>x.text=(x.code+' '+x.icao+' '+x.subtitle+' '+(x.html||'').replace(/<[^>]+>/g,' ')).toLowerCase());
const catOf=x=>((x.info&&x.info.CAT||'').match(/\b[ABC]\b/)||['?'])[0];

/* splash + theme */
const sp=$('#splash');let seen=false;try{seen=sessionStorage.seen}catch(e){}
setTimeout(()=>{sp.classList.add('hide');try{sessionStorage.seen=1}catch(e){}},seen?200:1900);
const th=$('#theme'),setTh=t=>{document.documentElement.dataset.theme=t;th.textContent=t==='dark'?'☀':'☾';document.querySelector('meta[name=theme-color]').content=t==='dark'?'#0b0d12':'#e9ecf4';try{localStorage.theme=t}catch(e){}};
setTh(document.documentElement.dataset.theme||'light');th.onclick=()=>setTh(document.documentElement.dataset.theme==='dark'?'light':'dark');

/* weather */
const cache={};
async function getWx(icao,force){
  const c=cache[icao];if(!force&&c&&Date.now()-c.t<6e5)return c.d;
  const j=async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw 0;const t=await r.text();return t?JSON.parse(t):[]};
  const [m,t]=await Promise.all([j(`${AWC}metar?ids=${icao}&format=json`),j(`${AWC}taf?ids=${icao}&format=json`).catch(()=>[])]);
  const d=m[0]?{m:m[0],taf:t[0]&&(t[0].rawTAF||t[0].rawTaf)}:null;cache[icao]={t:Date.now(),d};return d;
}
const pad=n=>String(n).padStart(3,'0');
function parse(m){const ce=(m.clouds||[]).find(c=>['BKN','OVC','OVX'].includes(c.cover));
  return{wind:m.wspd==null?'—':(m.wdir==='VRB'?'VRB':pad(m.wdir)+'°')+' / '+m.wspd+(m.wgst?'G'+m.wgst:'')+' kt',vis:m.visib==null?'—':m.visib+' SM',
  temp:m.temp==null?'—':Math.round(m.temp)+'° / '+Math.round(m.dewp)+'°',qnh:m.altim?Math.round(m.altim)+' hPa':'—',ceil:ce?ce.cover+' '+ce.base+' ft':'No ceiling',
  cat:m.fltCat||'',age:m.obsTime?Math.max(0,Math.round((Date.now()/1000-m.obsTime)/60)):null}}
const ago=a=>a==null?'':a<90?`${a} min ago`:`${Math.round(a/60)} h ago`;
const wxWidget=(icao,cls='')=>`<div class="w g wxw ${cls}" data-icao="${icao}"><h4>Weather · ${icao}<button class="rf">Refresh</button></h4><div class="wxb sm">Loading…</div></div>`;
async function fillWx(el,force){
  const icao=el.dataset.icao,b=el.querySelector('.wxb'),rf=el.querySelector('.rf');rf.classList.add('spin');
  try{const d=await getWx(icao,force);if(!d)throw 0;const p=parse(d.m);b.className='wxb';
    b.innerHTML=`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ${p.cat}">${p.cat||'N/A'}</span><span class="sm">Observed ${ago(p.age)} · refreshed ${new Date().toISOString().slice(11,16)}Z</span></div>
    <div class="wx"><div><span>Wind</span><b>${p.wind}</b></div><div><span>Visibility</span><b>${p.vis}</b></div><div><span>Temp / Dew</span><b>${p.temp}</b></div><div><span>QNH</span><b>${p.qnh}</b></div><div><span>Ceiling</span><b>${p.ceil}</b></div></div>
    <pre class="raw">${d.m.rawOb||''}${d.taf?'\n\n'+d.taf:''}</pre>`;if(onWx)onWx(d.m);
  }catch(e){b.className='wxb sm';b.innerHTML=`Weather unavailable for ${icao} (offline, or no METAR issued). <a href="https://aviationweather.gov/data/metar/?ids=${icao}" target="_blank" rel="noopener">Open on aviationweather.gov</a>`}
  rf.classList.remove('spin')}
const bindWx=r=>r.querySelectorAll('.wxw').forEach(el=>{fillWx(el);el.querySelector('.rf').onclick=()=>fillWx(el,true)});

/* clocks */
const off=v=>{const m=(v||'').match(/([+-]?)\s*(\d+)(?::(\d+))?/);return m?(m[1]==='-'?-1:1)*(+m[2]+(+m[3]||0)/60):null};
const clk=()=>document.querySelectorAll('[data-off]').forEach(e=>{e.textContent=new Date(Date.now()+ +e.dataset.off*36e5).toISOString().slice(11,16)});
setInterval(clk,15000);

/* nav */
function nav(q=''){q=q.toLowerCase().trim();let out='',g='';
  D.filter(x=>!q||x.text.includes(q)).forEach(x=>{if(x.group!==g){g=x.group;out+=`<h2>${g}</h2>`}out+=`<a href="#${x.id}" data-id="${x.id}">${x.flag} <span>${x.code}</span><small>${x.icao}</small></a>`});
  list.innerHTML=out||'<p class="empty">No matches</p>';mark()}
const mark=()=>list.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.id===location.hash.slice(1)));

/* home */
function home(){
  onWx=null;const tiles=a=>a.map(x=>`<a class="w tile" href="#${x.id}"><div class="sm">${x.flag} ${x.icao}</div><div class="big">${x.code}</div><div class="sm">${x.subtitle.replace(x.icao,'').replace(/^[\s/]+/,'').split('/')[0]||'&nbsp;'}</div></a>`).join('');
  const ni=AP.reduce((a,x)=>a+x.inb.length,0),no=AP.reduce((a,x)=>a+x.out.length,0),cs={A:0,B:0,C:0};AP.forEach(x=>{const c=catOf(x);if(cs[c]!==undefined)cs[c]++});
  const rec=recent.map(i=>D.find(x=>x.id===i)).filter(Boolean),pn=AP.filter(x=>pins.includes(x.id));
  view.innerHTML=`<div class="hero"><h2>Good day, Captain</h2><p>Airport briefings, weather and reference in one place.</p></div>
  <div class="grid g2">
   <div class="w"><h4>Time</h4><div style="display:flex;gap:28px"><div><div class="big" data-off="0"></div><div class="sm">UTC</div></div><div><div class="big" data-off="3"></div><div class="sm">Addis · UTC+3</div></div></div></div>
   <div class="w"><h4>Library</h4><div style="display:flex;gap:26px"><div><div class="big">${AP.length}</div><div class="sm">Airports</div></div><div><div class="big">${D.filter(x=>x.group==='Addis FIR').length}</div><div class="sm">FIR sheets</div></div><div><div class="big">${pn.length}</div><div class="sm">Pinned</div></div></div></div>
   <div class="w"><h4>Routes</h4><div style="display:flex;gap:26px"><div><div class="big" style="color:var(--in)">${ni}</div><div class="sm">↘ Inbound</div></div><div><div class="big" style="color:var(--out)">${no}</div><div class="sm">↗ Outbound</div></div></div></div>
   <div class="w"><h4>Categories</h4>${['A','B','C'].map(c=>`<div style="display:flex;justify-content:space-between"><span>Category ${c}</span><b>${cs[c]}</b></div><div class="mini"><i style="width:${cs[c]/AP.length*100}%"></i></div>`).join('<div style="height:6px"></div>')}</div>
   ${wxWidget('HAAB','span')}
  </div>
  ${rec.length?`<div class="sec"><i style="background:var(--muted)"></i>Recently viewed</div><div class="grid">${tiles(rec)}</div>`:''}
  ${pn.length?`<div class="sec"><i style="background:#f5b301"></i>Pinned</div><div class="grid">${tiles(pn)}</div>`:''}
  <div class="sec"><i style="background:var(--muted)"></i>All airports</div><div class="grid">${tiles(AP)}</div>`;
  clk();bindWx(view)}

/* airport */
function steps(x,k,list){
  let out='';list.forEach((s,si)=>{
    const g=`${x.id}|${k}|${si}`,t=document.createElement('div');t.innerHTML=s.h;let n=0,cards='';
    [...t.children].forEach(c=>{
      if(c.tagName==='UL')[...c.children].forEach(li=>{n++;const key=g+'|'+n;cards+=`<div class="step ${k} ${chk[key]?'done':''}" data-g="${g}" data-k="${key}"><button class="ck" aria-label="Done">✓</button><div class="sb"><div class="lab"><span class="chip ${k}">${k==='in'?'IN':'OUT'}</span>${String(n).padStart(2,'0')}</div>${li.innerHTML}</div></div>`});
      else if(c.textContent.trim()||c.querySelector('img,a'))cards+=`<div class="w doc" style="margin-bottom:10px">${c.outerHTML}</div>`});
    out+=`<div class="sec ${k}" data-g="${g}"><i></i>${s.t||'Route'}<b></b></div>${cards}`});
  return out||`<p class="empty">No ${k==='in'?'inbound':'outbound'} routes in this briefing.</p>`}
function sync(root){const gs={};root.querySelectorAll('.step').forEach(e=>{(gs[e.dataset.g]=gs[e.dataset.g]||[]).push(e);e.classList.remove('next')});
  Object.entries(gs).forEach(([g,a])=>{const f=a.find(e=>!e.classList.contains('done'));if(f)f.classList.add('next');const s=root.querySelector(`.sec[data-g="${g}"] b`);if(s)s.textContent=a.filter(e=>e.classList.contains('done')).length+' / '+a.length})}
function airport(x){
  const i=x.info||{},v=k=>(i[k]||'').trim(),ap=!!x.icao,o=off(v('UTC')),rw=[...new Set((v('RW').match(/\b\d{1,2}(?=[LRC]*\b)/g)||[]))];
  const tabs=[['ov','Overview'],...(x.inb&&x.inb.length?[['in','Inbound',x.inb.length]]:[]),...(x.out&&x.out.length?[['out','Outbound',x.out.length]]:[])];
  view.innerHTML=`<div class="col"><div class="bar"><a class="ib" href="#" aria-label="Back">‹</a><div>${ap?`<button class="ib pin ${pins.includes(x.id)?'on':''}" aria-label="Pin">★</button>`:''}</div></div>
  <h1 class="t">${x.flag} ${x.code}<br>Briefing</h1><p class="sub">${x.subtitle||''}${x.status?` · <span class="chip">${x.status}</span>`:''}</p>
  ${ap?`<div class="tabs">${tabs.map(t=>`<button data-t="${t[0]}" class="${tab===t[0]?'on':''}">${t[1]}${t[2]?`<i class="${t[0]}">${t[2]}</i>`:''}</button>`).join('')}<span class="d">${new Date().toUTCString().slice(0,11)}</span></div>`:''}<div id="tb"></div></div>`;
  const p=view.querySelector('.pin');if(p)p.onclick=()=>{pins=pins.includes(x.id)?pins.filter(a=>a!==x.id):[...pins,x.id];sv('pins',pins);p.classList.toggle('on')};
  const tb=$('#tb');
  function draw(){onWx=null;
    if(!ap){tb.innerHTML=`<div class="w doc">${x.html}</div>`;return}
    if(tab==='ov'){
      const rt=['SID','DEP','EXIT'].filter(k=>v(k));
      tb.innerHTML=`<div class="grid g2">${wxWidget(x.icao,'span')}
      ${o!=null?`<div class="w"><h4>Local time</h4><div style="display:flex;gap:24px"><div><div class="big" data-off="${o}"></div><div class="sm">Local · UTC${v('UTC')}</div></div><div><div class="big" data-off="0"></div><div class="sm">UTC</div></div></div></div>`:''}
      <div class="w"><h4>Airport</h4><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="chip" style="background:var(--text);color:var(--bg)">CAT ${catOf(x)}</span>${v('TL')?`<span class="chip">TL ${v('TL')}</span>`:''}${v('ELEV')?`<span class="chip">ELEV ${v('ELEV')}</span>`:''}</div><div class="sm" style="margin-top:8px">${x.icao}${v('OPS')?' · '+v('OPS'):''}</div></div>
      ${rw.length?`<div class="w" id="xw"><h4>Wind components<select>${rw.map(r=>`<option value="${r}">RWY ${r}</option>`).join('')}</select></h4><div class="big" id="xw1">—</div><div class="sm" id="xw2">Waiting for weather…</div></div>`:''}
      ${rt.length?`<div class="w" style="background:var(--gout)"><h4>↗ Departure from ${x.code}</h4><div class="route">${rt.map(k=>`<div><small>${k}</small>${v(k)}</div>`).join('<span class="a">→</span>')}</div></div>`:''}
      <div class="w"><h4>Routes</h4><div class="legend"><span style="--c:var(--in)"><a href="#" data-go="in" style="color:inherit">${x.inb.length} inbound</a></span><span style="--c:var(--out)"><a href="#" data-go="out" style="color:inherit">${x.out.length} outbound</a></span></div></div></div>
      ${Object.keys(i).length?`<div class="sec"><i style="background:var(--muted)"></i>Airport data</div><div class="w"><div class="kv">${Object.entries(i).map(([k,a])=>`<div><span>${k}</span><b>${a}</b></div>`).join('')}</div></div>`:''}
      ${x.notes.trim()?`<div class="sec"><i style="background:var(--muted)"></i>Notes</div><div class="w doc">${x.notes}</div>`:''}`;
      bindWx(tb);clk();
      const xw=$('#xw');if(xw){let m=null;const calc=()=>{const hd=+xw.querySelector('select').value*10,a=$('#xw1'),b=$('#xw2');
        if(!m||m.wspd==null||m.wdir==null||m.wdir==='VRB'){a.textContent='—';b.textContent=m?'Variable or calm wind':'Waiting for weather…';return}
        const r=(m.wdir-hd)*Math.PI/180,hw=Math.round(m.wspd*Math.cos(r)),cw=Math.round(m.wspd*Math.sin(r));
        a.textContent=`${Math.abs(cw)} kt`;b.textContent=`Crosswind from ${cw>0?'right':cw<0?'left':'ahead'} · ${hw>=0?'headwind':'tailwind'} ${Math.abs(hw)} kt${m.wgst?' (gusts '+m.wgst+' kt)':''}`};
        onWx=d=>{m=d;calc()};xw.querySelector('select').onchange=calc}
      tb.querySelectorAll('[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();tab=a.dataset.go;airport(x)});
    }else{const k=tab,L=k==='in'?x.inb:x.out;
      tb.innerHTML=`<div style="text-align:right"><button class="reset">Reset progress</button></div>`+steps(x,k,L);
      sync(tb);tb.querySelectorAll('.ck').forEach(b=>b.onclick=()=>{const s=b.closest('.step');s.classList.toggle('done');chk[s.dataset.k]=s.classList.contains('done')?1:0;sv('chk',chk);sync(tb)});
      tb.querySelector('.reset').onclick=()=>{tb.querySelectorAll('.step').forEach(s=>{s.classList.remove('done');delete chk[s.dataset.k]});sv('chk',chk);sync(tb)}}}
  view.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;view.querySelectorAll('.tabs button').forEach(c=>c.classList.toggle('on',c===b));draw()});
  draw()}
function show(){const x=D.find(d=>d.id===location.hash.slice(1));document.body.classList.remove('open');mark();scrollTo(0,0);tab='ov';
  if(!x)return home();recent=[x.id,...recent.filter(i=>i!==x.id)].slice(0,6);sv('recent',recent);airport(x)}
$('#q').addEventListener('input',e=>nav(e.target.value));$('#menu').onclick=()=>document.body.classList.toggle('open');
addEventListener('hashchange',show);nav();show();
