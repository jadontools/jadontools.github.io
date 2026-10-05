window.JT_TOOLS=window.JT_TOOLS||{};
(function(){
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==="class")e.className=a[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),a[k]);else e.setAttribute(k,a[k])}e.append(...c);return e};
const num=(x,n)=>{if(x===""||x==null||isNaN(x))throw n+" must be a number.";return +x},fmt=x=>String(+Number(x).toPrecision(10)),m2=x=>x.toFixed(2);
const int=(x,n,a,b)=>{const v=num(x,n);if(!Number.isInteger(v)||v<a||v>b)throw`${n} must be a whole number from ${a} to ${b}.`;return v};
const TA=(id,l)=>({id,label:l,type:"textarea"}),SEL=(id,l,o,d)=>({id,label:l,type:"select",opts:o,def:d||o[0]}),N=(id,l,d)=>({id,label:l,type:"number",def:d}),T=(id,l,d)=>({id,label:l,type:"text",def:d});
const lines=t=>t.split(/\r?\n/).map(x=>x.trim()).filter(x=>x);
const toPng=c=>new Promise((s,j)=>c.toBlob(b=>b?s(b):j("Could not create the image."),"image/png"));
// ---- QR + barcode (libraries loaded on demand)
const QRECC={"Low (L)":"L","Medium (M)":"M","Quartile (Q)":"Q","High (H)":"H"};
const png=(b,name)=>({files:[{blob:b,name:`jadon-tools-${name}.png`,type:"image/png"}]});
// ---- JavaScript tokenizer (used by minifier and formatter; it never executes the code)
const isW=c=>/[\w$\u0080-\uFFFF]/.test(c);
const PUN=[">>>=","...","===","!==","**=","<<=",">>=",">>>","&&=","||=","??=","=>","==","!=","<=",">=","&&","||","??","?.","++","--","+=","-=","*=","/=","%=","&=","|=","^=","<<",">>","**"];
const jsTok=src=>{const T=[],n=src.length;let i=0,prev=null;const add=t=>{T.push(t);prev=t;};
const rx=()=>{if(!prev)return true;if(prev.t==="p")return!/^([)\]}]|\+\+|--)$/.test(prev.v);if(prev.t==="w")return/^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/.test(prev.v);return false};
while(i<n){const c=src[i];
if(/\s/.test(c)){let j=i,nl=false;while(j<n&&/\s/.test(src[j])){if(src[j]==="\n"||src[j]==="\r")nl=true;j++}T.push({t:"s",v:" ",nl});i=j;continue}
if(c==="/"&&src[i+1]==="/"){let j=src.indexOf("\n",i);if(j<0)j=n;i=j;continue}
if(c==="/"&&src[i+1]==="*"){const j=src.indexOf("*/",i+2);if(j<0)throw"Unterminated comment.";T.push({t:"s",v:" ",nl:src.slice(i,j).includes("\n")});i=j+2;continue}
if(c==='"'||c==="'"){let j=i+1;while(j<n&&src[j]!==c){if(src[j]==="\\")j++;if(src[j]==="\n")throw"Unterminated string.";j++}if(j>=n)throw"Unterminated string.";add({t:"x",v:src.slice(i,++j)});i=j;continue}
if(c==="`"){let j=i+1,d=0;while(j<n){if(src[j]==="\\"){j+=2;continue}if(src[j]==="`"&&d===0)break;if(src[j]==="$"&&src[j+1]==="{"){d++;j+=2;continue}if(src[j]==="}"&&d>0)d--;j++}if(j>=n)throw"Unterminated template string.";add({t:"x",v:src.slice(i,++j)});i=j;continue}
if(c==="/"&&rx()){let j=i+1,cl=false;while(j<n){const d=src[j];if(d==="\\"){j+=2;continue}if(d==="\n")throw"Unterminated regular expression.";if(d==="[")cl=true;else if(d==="]")cl=false;else if(d==="/"&&!cl)break;j++}if(j>=n)throw"Unterminated regular expression.";j++;while(j<n&&isW(src[j]))j++;add({t:"x",v:src.slice(i,j)});i=j;continue}
if(isW(c)){let j=i;while(j<n&&isW(src[j]))j++;add({t:"w",v:src.slice(i,j)});i=j;continue}
const p=PUN.find(x=>src.startsWith(x,i))||c;add({t:"p",v:p});i+=p.length}
return T};
const jsMin=src=>{const T=jsTok(src),o=[];let last=null,pend=null;for(const t of T){if(t.t==="s"){pend=pend?{nl:pend.nl||t.nl}:{nl:t.nl};continue}
if(pend&&last){const a=last.v,b=t.v;let sep="";if(pend.nl){const drop=(last.t==="p"&&!/^(\+\+|--|\)|\]|\})$/.test(a))||(t.t==="p"&&/^[)\]},;.:?]/.test(b));sep=drop?"":"\n"}else if(last.t==="w"&&t.t==="w")sep=" ";else if((a.endsWith("+")&&b.startsWith("+"))||(a.endsWith("-")&&b.startsWith("-")))sep=" ";else if(last.t==="w"&&t.t==="x"&&/^\//.test(b))sep="";if(sep===""&&((a.endsWith("+")&&b.startsWith("+"))||(a.endsWith("-")&&b.startsWith("-"))||(a.endsWith("/")&&/^[\/*]/.test(b))))sep=" ";o.push(sep)}
o.push(t.v);last=t;pend=null}return o.join("")};
const KW=new Set(["if","for","while","switch","catch","return","typeof","else","do","case","throw","new","in","of","instanceof","void","delete","await","yield","function","const","let","var"]);
const BIN=new Set(["=","==","===","!=","!==","<",">","<=",">=","&&","||","??","=>","+=","-=","*=","/=","%=","&=","|=","^=","**","**=","*","%","/","<<",">>",">>>","&","|","^","?"]);
const jsFmt=src=>{const raw=jsTok(src),T=[];let nb=false;for(const t of raw){if(t.t==="s"){nb=nb||t.nl;continue}t.nb=nb;nb=false;T.push(t)}
let o="",ind=0,par=0,q=0,prev=null;const nl=()=>{o=o.trimEnd()+"\n"+"  ".repeat(ind)};
const drop=(p,t)=>p&&((p.t==="p"&&!/^(\+\+|--|\)|\]|\})$/.test(p.v))||(t.t==="p"&&/^[)\]},;.:?]/.test(t.v)));
for(let k=0;k<T.length;k++){const t=T[k],v=t.v,nx=T[k+1];
if(t.t==="p"&&v==="{"){if(nx&&nx.v==="}"&&nx.t==="p"){o+=(prev&&!/^[(\[]$/.test(prev.v)?" ":"")+"{}";k++;prev=nx;continue}o+=(prev&&!/^[(\[]$/.test(prev.v)?" ":"")+"{";ind++;nl();prev=t;continue}
if(t.t==="p"&&v==="}"){ind=Math.max(0,ind-1);nl();o+="}";prev=t;if(nx&&!(nx.t==="p"&&/^[),;.\]]$/.test(nx.v))&&!(nx.t==="w"&&/^(else|catch|finally|while)$/.test(nx.v)))nl();else if(nx&&nx.t==="w")o+=" ";continue}
if(t.t==="p"&&v===";"){o=o.trimEnd()+";";if(par>0)o+=" ";else nl();prev=t;continue}
if(t.t==="p"&&v===","){o=o.trimEnd()+", ";prev=t;continue}
if(t.t==="p"&&(v==="("||v==="["))par++;if(t.t==="p"&&(v===")"||v==="]"))par=Math.max(0,par-1);
if(t.t==="p"&&(v==="+"||v==="-"))t.bin=!!prev&&((prev.t==="w"&&!KW.has(prev.v))||prev.t==="x"||/^[)\]]$/.test(prev.v));
let tern=false;if(t.t==="p"&&v==="?")q++;if(t.t==="p"&&v===":"&&q>0){tern=true;q--}
if(prev&&t.nb&&!drop(prev,t)){nl();o+=v;prev=t;continue}
let sp=false;if(prev){const pb=prev.t==="p"&&(BIN.has(prev.v)||prev.bin||prev.tern);
if(t.t==="w"||t.t==="x")sp=prev.t==="w"||prev.t==="x"||prev.v===")"||pb||(prev.t==="p"&&prev.v===":"&&!prev.tern&&true);
else if(t.t==="p"){sp=BIN.has(v)||tern||(v==="("&&prev.t==="w"&&KW.has(prev.v))||((v==="+"||v==="-")&&t.bin);if(/^[+-]/.test(v)&&prev.t==="p"&&prev.v[prev.v.length-1]===v[0])sp=true;if(pb&&!sp&&(v==="("||v==="["||v==="{"||v==="/"))sp=true}}
t.tern=tern;o+=(sp&&!/\s$/.test(o)?" ":"")+v;prev=t}
return o.split("\n").map(l=>l.trimEnd()).filter((l,i,a)=>l.trim()||(i&&a[i-1].trim())).join("\n").trim()};
const jsIn=f=>({fields:[TA("t","JavaScript code")],run:v=>{if(!v.t.trim())throw"Paste some JavaScript first.";if(v.t.length>5e5)throw"Input is too large (500,000 characters max).";try{return f(v.t)}catch(e){throw typeof e==="string"?"Could not process this code: "+e:"Could not process this code."}}});
// ---- Invoices (rendered from validated data with textContent only)
const clean=s=>String(s||"").trim().slice(0,120);
const build=(v,k)=>{const L=lines(v.t);if(!L.length)throw"Add at least one item.";const rows=[];let sub=0,gst=0;
L.forEach((x,i)=>{const p=x.split(",").map(s=>s.trim()),n=[];while(p.length>1&&p[p.length-1]!==""&&!isNaN(p[p.length-1])&&n.length<3)n.unshift(+p.pop());const d=p.join(",")||"Item",max=k==="gst"?3:2;if(n.length<2||n.length>max)throw`Line ${i+1}: use "description, quantity, price${k==="gst"?", GST %":""}".`;const[q,u]=n,r=k==="gst"?(n.length===3?n[2]:num(v.r,"Default GST rate")):0;if(q<=0||u<0||r<0)throw`Line ${i+1}: quantity must be above zero and values cannot be negative.`;const a=q*u;sub+=a;gst+=a*r/100;rows.push(k==="gst"?[d.slice(0,80),fmt(q),m2(u),fmt(r)+"%",m2(a)]:[d.slice(0,80),fmt(q),m2(u),m2(a)])});
const head=k==="gst"?["Description","Qty","Price","GST","Amount"]:["Description","Qty","Price","Amount"],tot=[["Subtotal",m2(sub)]];let grand;
if(k==="gst"){if(v.s.startsWith("Within")){tot.push(["CGST",m2(gst/2)],["SGST",m2(gst/2)])}else tot.push(["IGST",m2(gst)]);grand=sub+gst}else{const x=num(v.x,"Tax");if(x<0)throw"Tax cannot be negative.";const tx=sub*x/100;if(x)tot.push([`Tax (${fmt(x)}%)`,m2(tx)]);grand=sub+tx}tot.push(["Total",m2(grand)]);
const meta=k==="gst"?[["Seller",clean(v.a)],["Seller GSTIN",clean(v.g)],["Buyer",clean(v.b)],["Buyer GSTIN",clean(v.h)],["Invoice no.",clean(v.n)],["Date",clean(v.d)],["Supply",v.s]]:k==="receipt"?[["Store",clean(v.a)],["Receipt no.",clean(v.n)],["Date",clean(v.d)],["Payment",v.p]]:[["From",clean(v.a)],["Bill to",clean(v.b)],["Invoice no.",clean(v.n)],["Date",clean(v.d)]];
return{title:k==="gst"?"Tax invoice (informational)":k==="receipt"?"Receipt":"Invoice",meta:meta.filter(x=>x[1]),head,rows,tot,notes:clean(v.o)}};
const txt=b=>[b.title,...b.meta.map(x=>`${x[0]}: ${x[1]}`),"",b.head.join(" | "),...b.rows.map(r=>r.join(" | ")),"",...b.tot.map(x=>`${x[0]}: ${x[1]}`),b.notes?"\nNotes: "+b.notes:"",b.title.includes("informational")?"\nCalculations are informational and are not a certified tax document.":""].join("\n");
const view=(v,el)=>{const b=v._b;el.textContent="";el.style.display="block";const t=h("table"),hd=h("tr");b.head.forEach(x=>hd.append(h("th",{scope:"col"},x)));t.append(h("thead",{},hd));const tb=h("tbody");b.rows.forEach(r=>tb.append(h("tr",{},...r.map(c=>h("td",{},c)))));t.append(tb);const tf=h("tfoot");b.tot.forEach(x=>tf.append(h("tr",{},h("td",{colspan:b.head.length-1,style:"text-align:right;font-weight:700"},x[0]),h("td",{style:"font-weight:700"},x[1]))));t.append(tf);
el.append(h("div",{class:"inv"},h("h2",{style:"margin-top:0"},b.title),...b.meta.map(x=>h("div",{},h("strong",{},x[0]+": "),x[1])),h("div",{class:"tw"},t),b.notes?h("p",{},"Notes: "+b.notes):h("span"),b.title.includes("informational")?h("small",{},"Calculations are informational and are not a certified tax document."):h("span")),h("div",{class:"row"},h("button",{class:"btn pri",type:"button",onclick:()=>{document.body.classList.add("pp");const d=()=>{document.body.classList.remove("pp");removeEventListener("afterprint",d)};addEventListener("afterprint",d);print()}},"Print / Save as PDF")))};
const ITEMS=TA("t","Items (one per line: description, quantity, price)"),today=()=>new Date().toISOString().slice(0,10);
const inv=(k,fields)=>({fields,run:v=>{const b=build(v,k);v._b=b;return txt(b)},preview:view});

// ---- advanced QR generator + barcode encoder (no external libraries besides the bundled QR matrix library)
const CL=(id,l,d)=>({id,label:l,type:"color",def:d});
const rrect=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
const lumi=hx=>{const c=[1,3,5].map(i=>parseInt(hx.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const ratio=(a,b)=>{const x=lumi(a),y=lumi(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const xe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dataUrl=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
const QT=["Text","URL","Phone","SMS","Email","Wi-Fi","Contact (vCard)","Location","Event","WhatsApp","UPI payment","Custom raw data"];
const QF=(id,l,t,ty,d)=>({id,label:l,type:ty||"text",def:d,when:{id:"k",in:t}});
const payload=v=>{const k=v.k,t=(v.t||"").trim(),rq=(x,n)=>{if(!x||!String(x).trim())throw n+" is required.";return String(x).trim()},ph=()=>rq(v.p,"Phone number").replace(/[^\d+]/g,"");
switch(k){case"Text":case"Custom raw data":return rq(t,"Text");
case"URL":{const u=rq(t,"URL");return/^[a-z][a-z0-9+.-]*:/i.test(u)?u:"https://"+u}
case"Phone":return"tel:"+ph();
case"SMS":return`SMSTO:${ph()}:${v.m||""}`;
case"Email":return`mailto:${rq(v.e,"Email address")}?subject=${encodeURIComponent(v.sj||"")}&body=${encodeURIComponent(v.m||"")}`;
case"Wi-Fi":{const es=x=>String(x).replace(/([\\;,:"])/g,"\\$1"),sec={"WPA/WPA2":"WPA",WEP:"WEP",None:"nopass"}[v.sc];return`WIFI:T:${sec};S:${es(rq(v.ss,"Wi-Fi name"))};${sec==="nopass"?"":"P:"+es(v.sp||"")+";"}${v.sh?"H:true;":""};`}
case"Contact (vCard)":{const e=x=>String(x||"").replace(/([\\;,])/g,"\\$1").replace(/\n/g,"\\n");return["BEGIN:VCARD","VERSION:3.0","FN:"+e(rq(v.fn,"Full name")),v.og?"ORG:"+e(v.og):"",v.p?"TEL:"+e(v.p):"",v.e?"EMAIL:"+e(v.e):"",v.ur?"URL:"+e(v.ur):"","END:VCARD"].filter(Boolean).join("\n")}
case"Location":{const a=num(v.la,"Latitude"),b=num(v.lo,"Longitude");if(Math.abs(a)>90||Math.abs(b)>180)throw"Latitude must be -90 to 90 and longitude -180 to 180.";return`geo:${a},${b}`}
case"Event":{if(!(v.et||"").trim()||!v.es)throw"Event title and start time are required.";const f=x=>x.replace(/[-:]/g,"")+"00";if(v.ee&&v.ee<v.es)throw"The event cannot end before it starts.";return["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT","SUMMARY:"+v.et.trim(),"DTSTART:"+f(v.es),"DTEND:"+f(v.ee||v.es),v.el?"LOCATION:"+v.el.trim():"","END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\n")}
case"WhatsApp":return`https://wa.me/${rq(v.p,"Phone number").replace(/\D/g,"")}${v.m?"?text="+encodeURIComponent(v.m):""}`;
case"UPI payment":{const a=rq(v.ua,"UPI ID");if(!/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(a))throw"Enter a valid UPI ID like name@bank.";let u=`upi://pay?pa=${encodeURIComponent(a)}&pn=${encodeURIComponent(v.un||"")}&cu=INR`;if(v.um!==""&&v.um!=null){const m=num(v.um,"Amount");if(m<=0)throw"Amount must be above zero.";u+="&am="+m}return u}}throw"Choose a content type."};
const qrRun=async v=>{const data=payload(v);if(data.length>1500)throw"Content is too long for a QR code (1500 characters max).";const z=int(v.z,"Size",128,2048),mg=int(v.mg,"Margin",0,10);
await JT.lib(new URL((document.documentElement.dataset.root||"./")+"js/vendor/qrcode.js",location.href).href);
let lg=null;if(v.lg&&v.lg.length){const f=v.lg[0];if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>2e6)throw"The logo must be a PNG, JPG or WebP image under 2 MB.";lg=await createImageBitmap(f).catch(()=>{throw"The logo image could not be read."})}
const lv=lg?"H":QRECC[v.ec];let q;try{q=new QRCodeLib.QRCode(-1,QRCodeLib.Level[lv]);q.addData(unescape(encodeURIComponent(data)));q.make()}catch(e){throw"This content is too long for a QR code at that error-correction level. Shorten it or lower the level."}
const n=q.getModuleCount(),cell=Math.max(2,Math.floor(z/(n+2*mg))),S=cell*(n+2*mg),lb=(v.lb||"").trim().slice(0,60),band=lb?Math.round(cell*n*.09)+2*cell:0,W=S,H=S+band,fg=v.fg,fg2=v.gr?v.f2:v.fg,bg=v.bg,eye=(r,c)=>(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7),sh=[];
for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c)&&!eye(r,c)){const x=(c+mg)*cell,y=(r+mg)*cell;if(v.ms==="Dots")sh.push([x+cell*.08,y+cell*.08,cell*.84,cell*.84,cell*.42]);else if(v.ms==="Rounded")sh.push([x,y,cell,cell,cell*.3]);else sh.push([x,y,cell,cell,0])}
[[0,0],[0,n-7],[n-7,0]].forEach(([r,c])=>{const x=(c+mg)*cell,y=(r+mg)*cell,R=v.ey==="Rounded";sh.push([x,y,7*cell,7*cell,R?2*cell:0],[x+cell,y+cell,5*cell,5*cell,R?1.5*cell:0,1],[x+2*cell,y+2*cell,3*cell,3*cell,R?cell:0])});
const cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.fillStyle=bg;c.fillRect(0,0,W,H);const gd=c.createLinearGradient(0,0,S,S);gd.addColorStop(0,fg);gd.addColorStop(1,fg2);
sh.forEach(([x,y,w,h,rx,f])=>{c.fillStyle=f?bg:gd;if(rx){rrect(c,x,y,w,h,rx);c.fill()}else c.fillRect(x,y,w,h)});
let box=null;if(lg){const ls=Math.round(cell*n*.2),lx=Math.round((S-ls)/2),k=Math.min(ls/lg.width,ls/lg.height),dw=lg.width*k,dh=lg.height*k;c.fillStyle=bg;rrect(c,lx-cell,lx-cell,ls+2*cell,ls+2*cell,cell*1.5);c.fill();c.drawImage(lg,lx+(ls-dw)/2,lx+(ls-dh)/2,dw,dh);box={lx,ls,dw,dh}}
if(lb){c.fillStyle=fg;c.font=`600 ${Math.round(band*.5)}px system-ui,sans-serif`;c.textAlign="center";c.textBaseline="middle";c.fillText(lb,W/2,S+band/2-cell*.3,W-2*cell)}
const f2=x=>x.toFixed(2);let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="${v.ms==="Square"&&v.ey==="Square"?"crispEdges":"auto"}"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${S}" y2="${S}"><stop offset="0" stop-color="${fg}"/><stop offset="1" stop-color="${fg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="${bg}"/>`+sh.map(([x,y,w,h,rx,f])=>`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}"${rx?` rx="${f2(rx)}"`:""} fill="${f?bg:"url(#g)"}"/>`).join("");
if(box){const du=await dataUrl(v.lg[0]);svg+=`<rect x="${box.lx-cell}" y="${box.lx-cell}" width="${box.ls+2*cell}" height="${box.ls+2*cell}" rx="${f2(cell*1.5)}" fill="${bg}"/><image href="${du}" x="${f2(box.lx+(box.ls-box.dw)/2)}" y="${f2(box.lx+(box.ls-box.dh)/2)}" width="${f2(box.dw)}" height="${f2(box.dh)}"/>`}
if(lb)svg+=`<text x="${W/2}" y="${S+band/2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="${Math.round(band*.5)}" font-weight="600" fill="${fg}">${xe(lb)}</text>`;svg+="</svg>";
const w=[];if(Math.min(ratio(fg,bg),ratio(fg2,bg))<3)w.push("Low contrast between the code and the background. It may not scan.");else if(lumi(bg)<Math.min(lumi(fg),lumi(fg2)))w.push("The background is darker than the code (inverted). Some scanners cannot read inverted QR codes.");if(v.ms!=="Square")w.push("Dots and rounded modules scan in most apps, but test with your scanner before printing.");if(lg)w.push("A logo covers part of the code. Error correction was set to High automatically. Test before printing.");if(S<200)w.push("The code is small and may be hard to scan.");
const b=await toPng(cv);return{text:`QR code created: ${W}×${H}px, error correction ${lv}.`+(w.length?"\nWarnings:\n- "+w.join("\n- "):"\nTest it with a phone before printing."),files:[{blob:b,name:"jadon-tools-qr-code.png",type:"image/png"},{blob:new Blob([svg],{type:"image/svg+xml"}),name:"jadon-tools-qr-code.svg",type:"image/svg+xml"}],print:true}};
const C128="212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112".split(" ");
const EL="0001101 0011001 0010011 0111101 0100011 0110001 0101111 0111011 0110111 0001011".split(" "),EG="0100111 0110011 0011011 0100001 0011101 0111001 0000101 0010001 0001001 0010111".split(" "),ER="1110010 1100110 1101100 1000010 1011100 1001110 1010000 1000100 1001000 1110100".split(" "),PAR="LLLLLL LLGLGG LLGGLG LLGGGL LGLLGG LGGLLG LGGGLL LGLGLG LGLGGL LGGLGL".split(" ");
const bits=p=>p.split("").map(Number).map((w,i)=>(i%2?"0":"1").repeat(w)).join("");
const bcRun=async v=>{const raw=(v.t||"").trim();if(!raw)throw"Enter a value.";let b,label=raw;
if(v.f==="Code 128"){if(raw.length>60)throw"Value is too long (60 characters max).";const vals=[...raw].map(ch=>{const c=ch.charCodeAt(0);if(c<32||c>126)throw"Code 128 supports standard keyboard characters only.";return c-32});let sum=104;vals.forEach((x,i)=>sum+=x*(i+1));b=[104,...vals,sum%103,106].map(x=>bits(C128[x])).join("")}
else{let d=raw.replace(/\s/g,"");if(!/^\d+$/.test(d))throw"EAN-13 and UPC-A need digits only.";if(v.f==="UPC-A"){if(d.length!==11&&d.length!==12)throw"UPC-A needs 11 or 12 digits.";d="0"+d}else if(d.length!==12&&d.length!==13)throw"EAN-13 needs 12 or 13 digits.";const cd=(10-([...d.slice(0,12)].reduce((a,x,i)=>a+ +x*(i%2?3:1),0)%10))%10;if(d.length===13&&+d[12]!==cd)throw`The check digit is wrong. It should be ${cd}.`;d=d.slice(0,12)+cd;const pr=PAR[+d[0]];b="101"+[...d.slice(1,7)].map((x,i)=>(pr[i]==="L"?EL:EG)[x]).join("")+"01010"+[...d.slice(7)].map(x=>ER[x]).join("")+"101";label=v.f==="UPC-A"?d.slice(1):d}
const bw=int(v.w,"Bar width",1,8),bh=int(v.h,"Bar height",30,400),tx=v.x,qz=10*bw,pad=10,th=tx?bw*9+10:0,W=b.length*bw+2*qz,H=bh+th+2*pad,cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.fillStyle=v.bg;c.fillRect(0,0,W,H);c.fillStyle=v.fg;let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges"><rect width="${W}" height="${H}" fill="${v.bg}"/>`;
for(let i=0;i<b.length;){if(b[i]==="1"){let j=i;while(j<b.length&&b[j]==="1")j++;c.fillRect(qz+i*bw,pad,(j-i)*bw,bh);svg+=`<rect x="${qz+i*bw}" y="${pad}" width="${(j-i)*bw}" height="${bh}" fill="${v.fg}"/>`;i=j}else i++}
if(tx){c.font=`${bw*7}px monospace`;c.textAlign="center";c.textBaseline="top";c.fillText(label,W/2,pad+bh+6,W-10);svg+=`<text x="${W/2}" y="${pad+bh+6}" text-anchor="middle" dominant-baseline="hanging" font-family="monospace" font-size="${bw*7}" fill="${v.fg}">${xe(label)}</text>`}svg+="</svg>";
const out=await toPng(cv);return{text:`${v.f} barcode created for "${label}" (${W}×${H}px). Test it with a scanner before printing.`,files:[{blob:out,name:"jadon-tools-barcode.png",type:"image/png"},{blob:new Blob([svg],{type:"image/svg+xml"}),name:"jadon-tools-barcode.svg",type:"image/svg+xml"}],print:true}};
const QW=["Wi-Fi"],QV=["Contact (vCard)"];
const qrFields=[SEL("k","Content type",QT,"URL"),{...TA("t","Text, URL or raw data"),when:{id:"k",in:["Text","URL","Custom raw data"]}},QF("p","Phone number (with country code)",["Phone","SMS","WhatsApp","Contact (vCard)"]),QF("m","Message",["SMS","WhatsApp","Email"]),QF("e","Email address",["Email","Contact (vCard)"]),QF("sj","Email subject",["Email"]),QF("ss","Wi-Fi name (SSID)",QW),QF("sp","Wi-Fi password",QW),{...SEL("sc","Security",["WPA/WPA2","WEP","None"]),when:{id:"k",in:QW}},{id:"sh",label:"Hidden network",type:"checkbox",when:{id:"k",in:QW}},QF("fn","Full name",QV),QF("og","Organisation",QV),QF("ur","Website",QV),QF("la","Latitude",["Location"]),QF("lo","Longitude",["Location"]),QF("et","Event title",["Event"]),QF("es","Starts",["Event"],"datetime-local"),QF("ee","Ends",["Event"],"datetime-local"),QF("el","Event location",["Event"]),QF("ua","UPI ID (e.g. name@bank)",["UPI payment"]),QF("un","Payee name",["UPI payment"]),QF("um","Amount in INR (optional)",["UPI payment"],"number"),
N("z","Size (px, 128-2048)",512),N("mg","Margin (modules, 0-10)",4),SEL("ec","Error correction",Object.keys(QRECC),"Medium (M)"),CL("fg","Foreground colour","#000000"),{id:"gr",label:"Use gradient",type:"checkbox"},CL("f2","Gradient end colour","#2563ff"),CL("bg","Background colour","#ffffff"),SEL("ms","Module style",["Square","Rounded","Dots"]),SEL("ey","Corner (eye) style",["Square","Rounded"]),T("lb","Label under the code (optional)"),{id:"lg",label:"Logo (optional)",type:"file",accept:"image/png,image/jpeg,image/webp",hint:"PNG, JPG or WebP under 2 MB. It covers the centre of the code."}];
Object.assign(window.JT_TOOLS,{
"qr-code-generator":{fields:qrFields,run:qrRun},
"barcode-generator":{fields:[T("t","Value","123456789012"),SEL("f","Format",["Code 128","EAN-13","UPC-A"]),N("w","Bar width (1-8 px)",2),N("h","Bar height (30-400 px)",100),CL("fg","Bar colour","#000000"),CL("bg","Background colour","#ffffff"),{id:"x",label:"Show the number under the bars",type:"checkbox",def:true}],run:bcRun},
"javascript-minifier":jsIn(jsMin),"javascript-formatter":jsIn(jsFmt),
"simple-invoice-generator":inv("simple",[T("a","Your business name"),T("b","Customer name"),T("n","Invoice number","INV-001"),{id:"d",label:"Date",type:"date",def:today()},ITEMS,N("x","Tax (%)",0),TA("o","Notes (optional)")]),
"gst-invoice-generator":inv("gst",[T("a","Seller name"),T("g","Seller GSTIN (optional)"),T("b","Buyer name"),T("h","Buyer GSTIN (optional)"),T("n","Invoice number","INV-001"),{id:"d",label:"Date",type:"date",def:today()},SEL("s","Supply type",["Within same state (CGST + SGST)","Different states (IGST)"]),TA("t","Items (one per line: description, quantity, price, GST %)"),N("r","Default GST % (when a line has none)",18),TA("o","Notes (optional)")]),
"receipt-generator":inv("receipt",[T("a","Store or business name"),T("n","Receipt number","R-001"),{id:"d",label:"Date",type:"date",def:today()},ITEMS,N("x","Tax (%)",0),SEL("p","Payment method",["Cash","Card","UPI / bank transfer","Other"]),TA("o","Notes (optional)")])
});
})();
