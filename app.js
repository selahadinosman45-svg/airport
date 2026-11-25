const D=window.BRIEFINGS,$=s=>document.querySelector(s),list=$('#list'),view=$('#view');
const AWC='https://aviationweather.gov/api/data/',AP=D.filter(x=>x.icao);
const ld=(k,f)=>{try{return JSON.parse(localStorage[k])}catch(e){return f}},sv=(k,v)=>{try{localStorage[k]=JSON.stringify(v)}catch(e){}};
let pins=ld('pins',[]),recent=ld('recent',[]),chk=ld('chk',{}),tab='ov',onWx=null;
D.forEach(x=>x.text=(x.code+' '+x.icao+' '+x.subtitle+' '+(x.html||'').replace(/<[^>]+>/g,' ')).toLowerCase());
const catOf=x=>x.cat||'?',CT=window.CATS||{A:Object.fromEntries(D.filter(x=>x.cat==='A').map(x=>[x.code,x.subtitle||x.code])),B:Object.fromEntries(D.filter(x=>x.cat==='B').map(x=>[x.code,x.subtitle||x.code])),C:Object.fromEntries(D.filter(x=>x.cat==='C').map(x=>[x.code,x.subtitle||x.code]))},LL={HAAB:[8.98,38.80]};AP.forEach(x=>{if(Number.isFinite(+x.lat)&&Number.isFinite(+x.lon))LL[x.icao]=[+x.lat,+x.lon]});

/* splash + theme */
const sp=$('#splash');let seen=false;try{seen=sessionStorage.seen}catch(e){}
setTimeout(()=>{sp.classList.add('hide');try{sessionStorage.seen=1}catch(e){}},seen?200:1900);
const th=$('#theme'),setTh=t=>{document.documentElement.dataset.theme=t;th.textContent=t==='dark'?'☀':'☾';document.querySelector('meta[name=theme-color]').content=t==='dark'?'#0b0d12':'#e9ecf4';try{localStorage.theme=t}catch(e){}};
setTh(document.documentElement.dataset.theme||'light');th.onclick=()=>setTh(document.documentElement.dataset.theme==='dark'?'light':'dark');

/* weather */
const cache={};
async function getWx(icao,force){
  const c=cache[icao];if(!force&&c&&Date.now()-c.t<6e5)return c.d;const [la,lo]=LL[icao];
  const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,visibility,cloud_cover,weather_code&wind_speed_unit=kn&timezone=GMT`,{cache:'no-store'});
  if(!r.ok)throw 0;const d=(await r.json()).current;if(!d)throw 0;cache[icao]={t:Date.now(),d};return d}
const WMO=c=>c===0?'Clear':c<=2?'Partly cloudy':c===3?'Overcast':c<=48?'Fog':c<=57?'Drizzle':c<=67?'Rain':c<=77?'Snow':c<=82?'Rain showers':c<=86?'Snow showers':'Thunderstorm';
const pad=n=>String(n).padStart(3,'0'),R=Math.round;
const ago=a=>a<2?'just now':a<90?`${a} min ago`:`${R(a/60)} h ago`;
const wxWidget=(icao,cls='')=>`<div class="w g wxw ${cls}" data-icao="${icao}"><h4>Weather · ${icao}<button class="rf">Refresh</button></h4><div class="wxb sm">Loading…</div></div>`;
async function fillWx(el,force){
  const icao=el.dataset.icao,b=el.querySelector('.wxb'),rf=el.querySelector('.rf');rf.classList.add('spin');
  try{const d=await getWx(icao,force),gs=R(d.wind_gusts_10m),sp=R(d.wind_speed_10m),age=Math.max(0,R((Date.now()-Date.parse(d.time+'Z'))/6e4));b.className='wxb';
    b.innerHTML=`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip" style="background:var(--text);color:var(--bg)">${WMO(d.weather_code)}</span><span class="sm">Updated ${ago(age)} · refreshed ${new Date().toISOString().slice(11,16)}Z</span></div>
    <div class="wx"><div><span>Wind</span><b>${sp<1?'Calm':pad(R(d.wind_direction_10m))+'° / '+sp+(gs>sp+5?'G'+gs:'')+' kt'}</b></div><div><span>Visibility</span><b>${d.visibility>=10000?'10+ km':(d.visibility/1000).toFixed(1)+' km'}</b></div><div><span>Temp / Dew</span><b>${R(d.temperature_2m)}° / ${R(d.dew_point_2m)}°</b></div><div><span>Pressure</span><b>${R(d.pressure_msl)} hPa</b></div><div><span>Cloud cover</span><b>${d.cloud_cover}%</b></div></div>
    <p class="sm" style="margin:12px 0 0">Model data from Open-Meteo, not a METAR. <a href="https://aviationweather.gov/data/metar/?ids=${icao}&taf=1" target="_blank" rel="noopener" style="color:inherit">Raw METAR / TAF ↗</a></p>`;
    if(onWx)onWx({wdir:d.wind_direction_10m,wspd:sp,wgst:gs>sp+5?gs:0});
  }catch(e){b.className='wxb sm';b.innerHTML=`Weather could not be loaded (check your connection and tap Refresh). <a href="https://aviationweather.gov/data/metar/?ids=${icao}&taf=1" target="_blank" rel="noopener" style="color:inherit">Open METAR ↗</a>`}
  rf.classList.remove('spin')}
const bindWx=r=>r.querySelectorAll('.wxw').forEach(el=>{fillWx(el);el.querySelector('.rf').onclick=()=>fillWx(el,true)});

/* clocks */
const utcLbl=tz=>{try{const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'shortOffset'}).formatToParts(new Date()).find(a=>a.type==='timeZoneName').value;return p==='GMT'?'UTC+0':p.replace('GMT','UTC')}catch(e){return ''}};
const tm=tz=>new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false});
const clk=()=>document.querySelectorAll('[data-tz]').forEach(e=>e.textContent=tm(e.dataset.tz));
setInterval(clk,15000);

/* nav */
function nav(q=''){q=q.toLowerCase().trim();let out='',g='';
  D.filter(x=>!q||x.text.includes(q)).forEach(x=>{if(x.group!==g){g=x.group;out+=`<h2>${g}</h2>`}out+=`<a href="#${x.id}" data-id="${x.id}">${x.flag} <span>${x.code}</span><small>${x.icao}</small></a>`});
  list.innerHTML=out||'<p class="empty">No matches</p>';mark()}
const mark=()=>list.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.id===location.hash.slice(1)));

/* home */
function home(){
  onWx=null;const tiles=a=>a.map(x=>`<a class="w tile" href="#${x.id}"><div class="sm">${x.flag} ${x.icao}</div><div class="big">${x.code}</div><div class="sm"><b>${utcLbl(x.tz)}</b>${x.exit?' · Exit '+x.exit:''}</div></a>`).join('');
  const ni=AP.reduce((a,x)=>a+x.inb.length,0),no=AP.reduce((a,x)=>a+x.out.length,0),cs={A:Object.keys(CT.A).length,B:Object.keys(CT.B).length,C:Object.keys(CT.C).length},mx=Math.max(...Object.values(cs));
  const rec=recent.map(i=>D.find(x=>x.id===i)).filter(Boolean),pn=AP.filter(x=>pins.includes(x.id));
  view.innerHTML=`<div class="hero"><h2>Good day, Captain</h2><p>Airport briefings, weather and reference in one place.</p></div>
  <div class="grid g2">
   <div class="w"><h4>Time</h4><div style="display:flex;gap:28px"><div><div class="big" data-tz="UTC"></div><div class="sm">UTC</div></div><div><div class="big" data-tz="Africa/Addis_Ababa"></div><div class="sm">Addis · UTC+3</div></div></div></div>
   <div class="w"><h4>Library</h4><div style="display:flex;gap:26px"><div><div class="big">${AP.length}</div><div class="sm">Airports</div></div><div><div class="big">${D.filter(x=>x.group==='Addis FIR').length}</div><div class="sm">FIR sheets</div></div><div><div class="big">${pn.length}</div><div class="sm">Pinned</div></div></div></div>
   <div class="w"><h4>Routes</h4><div style="display:flex;gap:26px"><div><div class="big" style="color:var(--in)">${ni}</div><div class="sm">↘ Inbound</div></div><div><div class="big" style="color:var(--out)">${no}</div><div class="sm">↗ Outbound</div></div></div></div>
   <div class="w"><h4>Categories</h4>${['A','B','C'].map(c=>`<div style="display:flex;justify-content:space-between"><span>Category ${c}</span><b>${cs[c]}</b></div><div class="mini"><i style="width:${cs[c]/mx*100}%"></i></div>`).join('<div style="height:6px"></div>')}<div class="sm" style="margin-top:8px">Cat C: ${Object.values(CT.C).map(n=>n[0]+n.slice(1).toLowerCase()).join(' · ')}</div></div>
   ${wxWidget('HAAB','span')}
  </div>
  ${rec.length?`<div class="sec"><i style="background:var(--muted)"></i>Recently viewed</div><div class="grid">${tiles(rec)}</div>`:''}
  ${pn.length?`<div class="sec"><i style="background:#f5b301"></i>Pinned</div><div class="grid">${tiles(pn)}</div>`:''}
  <div class="sec"><i style="background:var(--muted)"></i>Domestic Briefing</div><div class="grid">${tiles(D.filter(x=>x.group==='Domestic Briefing'))}</div>
  <div class="sec"><i style="background:var(--muted)"></i>All airports</div><div class="grid">${tiles(AP)}</div>`;
  clk();bindWx(view)}

/* source-grounded operational pop-ups */
const escHTML=s=>String(s||'Not provided in the supplied briefing.').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function domesticSection(raw,kind){
  const text=String(raw||'');
  if(!text)return 'No domestic airport source details are available.';
  if(kind==='escape'){
    const m=text.match(/Depressurization escape route[\s\S]*?(?=\nFire\b|$)/i);
    return m?m[0].trim():'No depressurization escape-route text was present in this airport source.';
  }
  const m=text.match(/ADD\s*[–-][\s\S]*?(?=\nFIX\b|\nETP\s+PNR\b|\nDepressurization escape route|$)/i);
  return m?m[0].trim():'No SID / route details were present in this airport source.';
}
const DOMESTIC_DOCUMENT_PAGES={HAJJ:2,HADR:3,HABD:4,HAGN:5,HALL:6,HASR:7,HAMK:8,HAAX:9,HALA:10,HAJM:11,HAAM:12,HASM:13,HADC:14,HASO:15,HANK:16,HAGM:17,HADD:18,HAGB:19,HABC:20,HAGO:22,HAKD:23,HCGR:24,HCMF:25,HCMH:26,HUEN:27,HJWW:28};
function domesticBriefingPanel(x){
  const page=DOMESTIC_DOCUMENT_PAGES[x.icao];
  const src=page?`./domestic-pages/${encodeURIComponent(x.icao)}.jpg`:'';
  return `<div class="sec"><i style="background:var(--muted)"></i>Domestic briefing · original document</div>
  <div class="domestic-document">
    <div class="domestic-document-head"><div><div class="sm">AIRPORT INFORMATION · 09 SEP 2024</div><h3>${escHTML(x.subtitle||x.code)} · ${escHTML(x.icao)}</h3></div><span class="source-date">${page?'PDF PAGE '+page:'SOURCE PAGE UNAVAILABLE'}</span></div>
    ${page?`<a class="domestic-document-open" href="${src}" target="_blank" rel="noopener" aria-label="Open full-size ${escHTML(x.icao)} airport briefing document"><img src="${src}" alt="Original airport briefing document for ${escHTML(x.code)} ${escHTML(x.icao)}, including runway data, minima, MSA, MAP, frequencies, elevations, routes and escape procedures" loading="lazy" decoding="async"></a><div class="domestic-document-actions"><a class="action-btn" href="${src}" target="_blank" rel="noopener">Open full-size document ↗</a><span class="sm">Tap the document to zoom in</span></div>`:`<div class="domestic-document-missing">No matching airport page was found in the supplied September 2024 source PDF. No operational data has been reconstructed or guessed.</div>`}
    <p class="sm domestic-warning">Source: Airport Information, 09 September 2024. Historical reference only. Verify all runway, minima, route and escape procedures against current approved charts and company documentation.</p>
  </div>`;
}
function procedureModal(x,kind){
  const title=kind==='sid'?'SIDs / departure procedures':'Escape routes';
  const isDomestic=x.group==='Domestic Briefing';
  const exitPoint=x.exit||x.info?.EXIT||x.info?.DEP||'';
  const value=kind==='sid'?(x.sids||x.info?.SID||(isDomestic?domesticSection(x.domesticSource,'routes'):'No SID details were provided in the source briefing.')):(x.escape|| (isDomestic?domesticSection(x.domesticSource,'escape'):x.exit?`Identified departure/flight-plan exit point: ${x.exit}.\n\nThe supplied airport briefing does not contain a complete depressurization escape-route procedure for this destination. The exit point alone is not sufficient to construct a safe route. Use current approved company escape-route documentation and charts.`:'No exit point or complete escape-route procedure is present in the supplied airport records. Do not infer a route.'));
  const old=document.querySelector('.proc-overlay');if(old)old.remove();
  const overlay=document.createElement('div');overlay.className='proc-overlay';
  overlay.innerHTML=`<div class="proc-modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="proc-head"><div><div class="sm">${x.code} · ${x.icao}</div><h2>${title}</h2></div><button class="ib proc-close" aria-label="Close">×</button></div><div class="proc-body"><pre>${escHTML(value)}</pre>${kind==='escape'&&x.escape_source?`<p class="sm">Source: ${escHTML(x.escape_source)}.</p>`:''}<p class="sm">Operational reference only. Confirm current AIP charts, NOTAMs, aircraft performance and company-approved procedures before flight.</p></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.proc-close').onclick=()=>overlay.remove();
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
}
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
  const i=x.info||{},v=k=>(i[k]||'').trim(),ap=!!x.icao,rw=[...new Set((v('RW').match(/\b\d{1,2}(?=[LRC]*\b)/g)||[]))];
  const tabs=[['ov','Overview'],...(x.inb&&x.inb.length?[['in','Inbound',x.inb.length]]:[]),...(x.out&&x.out.length?[['out','Outbound',x.out.length]]:[])];
  view.innerHTML=`<div class="col"><div class="bar"><a class="ib" href="#" aria-label="Back">‹</a><div>${ap?`<button class="ib pin ${pins.includes(x.id)?'on':''}" aria-label="Pin">★</button>`:''}</div></div>
  <h1 class="t">${x.flag} ${x.code}<br>Briefing</h1><p class="sub">${x.subtitle||''} <span class="chip" style="background:var(--text);color:var(--bg)">${utcLbl(x.tz)}</span>${x.status?` · <span class="chip">${x.status}</span>`:''}</p>
  ${ap?`<div class="tabs">${tabs.map(t=>`<button data-t="${t[0]}" class="${tab===t[0]?'on':''}">${t[1]}${t[2]?`<i class="${t[0]}">${t[2]}</i>`:''}</button>`).join('')}<span class="d">${new Date().toUTCString().slice(0,11)}</span></div>`:''}<div id="tb"></div></div>`;
  const p=view.querySelector('.pin');if(p)p.onclick=()=>{pins=pins.includes(x.id)?pins.filter(a=>a!==x.id):[...pins,x.id];sv('pins',pins);p.classList.toggle('on')};
  const tb=$('#tb');
  function draw(){onWx=null;
    if(!ap){tb.innerHTML=`<div class="w doc">${x.html}</div>`;return}
    if(tab==='ov'){
      const rt=['SID','DEP','EXIT'].filter(k=>v(k)&&!(k==='DEP'&&v('DEP')===v('EXIT')));
      tb.innerHTML=`<div class="grid g2">${LL[x.icao]?wxWidget(x.icao,'span'):''}
      ${x.tz?`<div class="w"><h4>Local time</h4><div style="display:flex;gap:24px"><div><div class="big" data-tz="${x.tz}"></div><div class="sm">Local · ${utcLbl(x.tz)}</div></div><div><div class="big" data-tz="UTC"></div><div class="sm">UTC</div></div></div></div>`:''}
      ${x.group==='Domestic Briefing'?'':`<div class="w"><h4>Airport</h4><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="chip" style="background:var(--text);color:var(--bg)">CAT ${x.cat||'—'}</span>${v('TL')?`<span class="chip">TL ${v('TL')}</span>`:''}${v('ELEV')?`<span class="chip">ELEV ${v('ELEV')}</span>`:''}</div><div class="sm" style="margin-top:8px">${x.icao}${v('OPS')?' · '+v('OPS'):''}</div></div>`}
      ${rw.length?`<div class="w" id="xw"><h4>Wind components<select>${rw.map(r=>`<option value="${r}">RWY ${r}</option>`).join('')}</select></h4><div class="big" id="xw1">—</div><div class="sm" id="xw2">Waiting for weather…</div></div>`:''}
      ${rt.length?`<div class="w" style="background:var(--gout)"><h4>↗ Addis departure · exit point</h4><div class="route">${rt.map(k=>`<div><small>${k}</small><span ${k==='EXIT'?'style="font-size:22px"':''}>${v(k)}</span></div>`).join('<span class="a">→</span>')}</div></div>`:''}
      ${x.group==='Domestic Briefing'?'':`<div class="w"><h4>Routes</h4><div class="legend"><span style="--c:var(--in)"><a href="#" data-go="in" style="color:inherit">${x.inb.length} inbound</a></span><span style="--c:var(--out)"><a href="#" data-go="out" style="color:inherit">${x.out.length} outbound</a></span></div></div>`}
      <div class="w span"><h4>Operational procedures</h4><div class="action-row"><button class="action-btn" data-proc="sid">View SIDs / departures ↗</button><button class="action-btn" data-proc="escape">View escape routes ↗</button></div></div></div>
      ${x.group==='Domestic Briefing'?domesticBriefingPanel(x):(Object.keys(i).length?`<div class="sec"><i style="background:var(--muted)"></i>Airport data</div><div class="w"><div class="kv">${Object.entries(i).map(([k,a])=>`<div><span>${k}</span><b>${a}</b></div>`).join('')}</div></div>`:'')}
      ${x.notes.trim()?`<div class="sec"><i style="background:var(--muted)"></i>Notes</div><div class="w doc">${x.notes}</div>`:''}
      `;
      bindWx(tb);clk();
      tb.querySelectorAll('[data-proc]').forEach(b=>b.onclick=()=>procedureModal(x,b.dataset.proc));
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
