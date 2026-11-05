import {randomBytes,createHmac,createHash,createCipheriv,createDecipheriv,timingSafeEqual} from "node:crypto";

const SESSION="__Host-librium_session",STATE="__Host-librium_oauth_state";
const TTL=7*24*60*60;
export const owner="jonathanfrazier",repository="Librium-Wars",branch="main";
export const configured=()=>Boolean(process.env.LIBRIUM_GITHUB_CLIENT_ID&&process.env.LIBRIUM_GITHUB_CLIENT_SECRET&&process.env.LIBRIUM_SESSION_SECRET&&process.env.LIBRIUM_SESSION_SECRET.length>=32);
const secret=()=>process.env.LIBRIUM_SESSION_SECRET||"";
export const site=()=>new URL(process.env.URL||"https://strong-pasca-714035.netlify.app").origin;
export const callback=()=>site()+"/.netlify/functions/librium-callback";
const key=()=>createHash("sha256").update(secret()).digest();
export const cookieHeader=(name,value,age)=>name+"="+value+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age="+age;
export const parseCookies=req=>Object.fromEntries((req.headers.get("cookie")||"").split(";").map(x=>x.trim().split(/=(.*)/s).slice(0,2)).filter(a=>a[0]).map(([k,v])=>[k,v]));
function sign(value){return createHmac("sha256",key()).update(value).digest("base64url")}
export function makeState(slot){
 const nonce=randomBytes(24).toString("base64url");
 const data=nonce+"."+(validSlot(slot)?slot:"");
 return [data,sign(data)].join(".");
}
export function readState(value){
 if(!value)return null;
 const k=value.lastIndexOf("."),data=value.slice(0,k),mac=value.slice(k+1),check=sign(data);
 if(k<0||mac.length!==check.length||!timingSafeEqual(Buffer.from(mac),Buffer.from(check)))return null;
 const index=data.indexOf(".");
 return {nonce:data.slice(0,index),slot:data.slice(index+1)};
}
export const validSlot=id=>typeof id==="string"&&/^[a-z0-9-]{2,90}$/.test(id);
export function seal(data){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);
 const ct=Buffer.concat([cipher.update(JSON.stringify(data),"utf8"),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),ct]).toString("base64url");
}
export function unseal(value){
 try{
  const buf=Buffer.from(value,"base64url");
  if(buf.length<30)return null;
  const decipher=createDecipheriv("aes-256-gcm",key(),buf.subarray(0,12));
  decipher.setAuthTag(buf.subarray(12,28));
  const data=JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)),decipher.final()]).toString("utf8"));
  if(!Number.isFinite(data.exp)||data.exp<Date.now()||typeof data.token!=="string")return null;
  return data;
 }catch{return null}
}
export function getSession(req){
 if(!configured())return null;
 return unseal(parseCookies(req)[SESSION]);
}
export {SESSION,STATE,TTL};
export function json(obj,status=200,headers={}){
 return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
}
export function redirect(to,cookies=[]){
 const h=new Headers({"location":to,"cache-control":"no-store"});
 cookies.forEach(x=>h.append("set-cookie",x));
 return new Response(null,{status:302,headers:h});
}
export async function gitHub(path,token,options={}){
 const r=await fetch("https://api.github.com"+path,{...options,headers:{
  "accept":"application/vnd.github+json","authorization":"Bearer "+token,
  "x-github-api-version":"2022-11-28",...(options.body?{"content-type":"application/json"}:{}),
  ...(options.headers||{})
 }});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const error=new Error(data.message||"GitHub request failed");error.status=r.status;throw error}
 return data;
}
export const authorizedLogin=login=>String(login).toLowerCase()===(process.env.LIBRIUM_GITHUB_LOGIN||owner).toLowerCase();
export const imagePath=id=>"assets/images/slots/"+id+".webp";
export const authPage=slot=>site()+"/upload-images/"+(validSlot(slot)?"?slot="+encodeURIComponent(slot):"");
