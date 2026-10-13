// Golden Hour Grid backend. Zero dependencies: run with `node server.js` (Node 18+).
const http=require("http"),fs=require("fs"),path=require("path");
try{fs.readFileSync(".env","utf8").split("\n").forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);if(m&&m[2]&&!process.env[m[1]])process.env[m[1]]=m[2]})}catch(e){}
const rd=n=>JSON.parse(fs.readFileSync(path.join(__dirname,"data",n+".json"),"utf8"));
const D={locations:rd("locations"),hospitals:rd("hospitals"),scenarios:rd("scenarios"),hotspots:rd("hotspots")};
const eng=require("./engine")(D);let cases=eng.seed(60);
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml"};
function analytics(){const c=cases,n=c.length||1,by=k=>c.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
 return{total:c.length,avgSaved:+(c.reduce((s,x)=>s+x.nearestTime-x.bestEta,0)/n).toFixed(1),avgSurvGain:+(c.reduce((s,x)=>s+x.survBest-x.survNearest,0)/n).toFixed(1),wrongAvoided:c.filter(x=>x.wrongAvoided).length,byHospital:by("best"),byInjury:by("inj"),bySeverity:by("sev"),series:c.slice(-40).map(x=>x.survBest-x.survNearest),recent:c.slice(-8).reverse(),hospitals:D.hospitals.map(h=>({name:h.n,icu:h.icu,er:h.er,blood:h.bl}))}}
async function gemini(prompt){const key=process.env.GEMINI_API_KEY;if(!key)throw new Error("GEMINI_API_KEY missing");const m=process.env.GEMINI_MODEL||"gemini-2.5-flash";
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:.1}})});
 const d=await r.json();if(!r.ok)throw new Error(d.error&&d.error.message||r.status);return d.candidates[0].content.parts[0].text}
const body=req=>new Promise(r=>{let b="";req.on("data",c=>b+=c);req.on("end",()=>{try{r(JSON.parse(b||"{}"))}catch(e){r({})}})});
const send=(res,code,obj,type="application/json")=>{res.writeHead(code,{"Content-Type":type,"Access-Control-Allow-Origin":"*"});res.end(typeof obj=="string"?obj:JSON.stringify(obj))};
http.createServer(async(req,res)=>{const u=new URL(req.url,"http://x"),p=u.pathname;
 try{
 if(req.method=="OPTIONS")return send(res,204,"");
 if(p=="/data.js")return send(res,200,"window.GHG="+JSON.stringify({L:D.locations,H:D.hospitals,S:D.scenarios,HOT:D.hotspots})+";","text/javascript");
 if(p=="/api/health")return send(res,200,{ok:true,gemini:!!process.env.GEMINI_API_KEY,cases:cases.length});
 if(p=="/api/hospitals")return send(res,200,D.hospitals);
 if(p=="/api/locations")return send(res,200,D.locations);
 if(p=="/api/scenarios")return send(res,200,D.scenarios);
 if(p=="/api/analytics")return send(res,200,analytics());
 if(p=="/api/dispatch"&&req.method=="POST"){const c=await body(req),r=eng.dispatch(c);cases.push(eng.record(r.case,r,Date.now()));return send(res,200,r)}
 if(p=="/api/cases"&&req.method=="POST"){const c=await body(req);cases.push({t:Date.now(),...c});if(cases.length>2000)cases.shift();return send(res,201,{ok:true})}
 if(p=="/api/seed"&&req.method=="POST"){cases=u.searchParams.get("reset")?[]:eng.seed(60).concat(cases);return send(res,200,{total:cases.length})}
 if(p=="/api/ask"&&req.method=="POST"){const b=await body(req);return send(res,200,{text:await gemini(String(b.prompt||""))})}
 let f=path.join(__dirname,"public",p=="/"?"index.html":p);if(!f.startsWith(path.join(__dirname,"public")))return send(res,403,"no");
 fs.readFile(f,(e,d)=>e?send(res,404,"Not found","text/plain"):send(res,200,d,MIME[path.extname(f)]||"application/octet-stream"));
 }catch(e){send(res,500,{error:String(e.message||e)})}
}).listen(process.env.PORT||3000,()=>console.log("Golden Hour Grid running at http://localhost:"+(process.env.PORT||3000)));
