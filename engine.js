// Routing engine: scores every hospital for survival, explains every rejection.
const NEED={Critical:4,High:3,Moderate:1,Low:0},G=["O-","O+","A-","A+","B-","B+","AB-","AB+"];
const NAMES={trauma:"trauma surgeon",neuro:"neurosurgeon",cardiac:"cardiologist",ortho:"orthopaedic surgeon",burns:"burns specialist"};
const dist=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
module.exports=function(D){
const L=D.locations,H=D.hospitals,HOT=D.hotspots;
function frac(p){let n=0;for(let i=0;i<=24;i++){const t=i/24,s=t<.5?[p[0],p[1],t*2]:[p[1],p[2],t*2-1],x=s[0][0]+(s[1][0]-s[0][0])*s[2],y=s[0][1]+(s[1][1]-s[0][1])*s[2];if(HOT.some(c=>Math.hypot(x-c[0],y-c[1])<c[2]))n++}return n/25}
function routes(a,h,c){const b=[h.x,h.y],len=dist(a,b);return[[a,[b[0],a[1]],b],[a,[a[0],b[1]],b]].map(p=>{const f=frac(p);return{f,km:+(len*.06).toFixed(1),eta:Math.round(len*.075*c.traffic*(c.greenWave?.8:1)*(1+1.4*f)*10)/10}}).sort((x,y)=>x.eta-y.eta)}
const surv=(c,e,ok,er)=>Math.max(8,Math.round({Critical:74,High:86,Moderate:94,Low:98}[c.sev]-e*.55-(ok?0:20)-er*6));
function why(r,b,c){const o=[];if(r.specialist=="none")o.push("no "+NAMES[c.inj]+" on duty");else if(r.specialist=="surgery")o.push(NAMES[c.inj]+" busy in surgery");if(r.stock<r.need)o.push(`only ${r.stock} units of ${c.bg} (needs ${r.need})`);if(r.er>.7)o.push(`ER ${Math.round(r.er*100)}% full`);if(r.icu<=1)o.push("ICU nearly full");if(r.eta>b.eta+3)o.push((r.eta-b.eta).toFixed(1)+" min slower");return o.length?o.join(", "):"slightly lower overall score"}
function dispatch(c){c={traffic:1,greenWave:true,weights:[30,15,30,10,15],...c};const a=L[c.loc];if(!a)throw new Error("Unknown location: "+c.loc);
 const need=Math.max(NEED[c.sev]??1,1),W=c.weights,T=W.reduce((x,y)=>x+y,0)||1;
 const rows=H.map((h,i)=>{const R=routes(a,h,c),e=R[0].eta,sp=h.sp[c.inj]||"none",fs=sp=="free"?1:sp=="surgery"?.4:0,stock=h.bl[G.indexOf(c.bg)],f=[1-Math.min(e/40,1),h.icu/6,fs,1-h.er,Math.min(stock/need,1)];
  return{id:i,name:h.n,x:h.x,y:h.y,eta:e,km:R[0].km,altEta:R[1].eta,icu:h.icu,er:h.er,specialist:sp,stock,need,score:Math.round(f.reduce((s,v,k)=>s+v*W[k],0)/T*100)}}).sort((x,y)=>y.score-x.score);
 const best=rows[0],ne=[...rows].sort((x,y)=>dist(a,[x.x,x.y])-dist(a,[y.x,y.y]))[0],ok=ne.specialist=="free",nt=+(ne.eta+({free:0,surgery:12}[ne.specialist]??25)).toFixed(1);
 rows.forEach((r,i)=>r.reason=i?why(r,best,c):"Best mix of time, specialist and blood");
 const sb=surv(c,best.eta,best.specialist=="free",best.er),sn=surv(c,nt,ok,ne.er);
 return{case:c,best,nearest:ne,nearestTime:nt,nearestHasSpecialist:ok,survivalBest:sb,survivalNearest:sn,savedMinutes:+(nt-best.eta).toFixed(1),ranked:rows}}
const record=(c,r,t)=>({t,loc:c.loc,inj:c.inj,sev:c.sev,bg:c.bg,best:r.best.name,bestEta:r.best.eta,nearest:r.nearest.name,nearestTime:r.nearestTime,survBest:r.survivalBest,survNearest:r.survivalNearest,wrongAvoided:!r.nearestHasSpecialist});
function seed(n=60){const ks=Object.keys(L),inj=Object.keys(NAMES),sev=["Critical","High","High","Moderate"],out=[];for(let i=0;i<n;i++){const c={loc:ks[Math.random()*ks.length|0],inj:inj[Math.random()*5|0],sev:sev[Math.random()*4|0],bg:G[Math.random()*8|0],traffic:+(1+Math.random()*1.6).toFixed(1)};out.push(record(c,dispatch(c),Date.now()-(n-i)*18*60000))}return out}
return{dispatch,seed,record}};
