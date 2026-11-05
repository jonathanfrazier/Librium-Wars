import {configured,site,callback,readState,parseCookies,seal,STATE,SESSION,TTL,cookieHeader,redirect,authPage,gitHub,authorizedLogin,owner,repository} from "./_librium-shared.mjs";
export default async function(req){
 const fallback=authPage(null)+"?auth=failed";
 if(!configured())return redirect(authPage(null)+"?auth=setup");
 const url=new URL(req.url),state=url.searchParams.get("state"),cookie=parseCookies(req)[STATE];
 const verified=readState(state);
 if(!state||!verified||state!==cookie)return redirect(fallback,[cookieHeader(STATE,"",0)]);
 if(url.searchParams.get("error"))return redirect(authPage(verified.slot)+"&auth=denied",[cookieHeader(STATE,"",0)]);
 const code=url.searchParams.get("code");
 if(!code)return redirect(fallback,[cookieHeader(STATE,"",0)]);
 try{
  const response=await fetch("https://github.com/login/oauth/access_token",{
   method:"POST",headers:{"accept":"application/json","content-type":"application/json"},
   body:JSON.stringify({client_id:process.env.LIBRIUM_GITHUB_CLIENT_ID,client_secret:process.env.LIBRIUM_GITHUB_CLIENT_SECRET,code,redirect_uri:callback()})
  });
  const creds=await response.json();
  if(!response.ok||!creds.access_token||creds.error)throw Error("OAuth code exchange failed");
  const user=await gitHub("/user",creds.access_token);
  if(!authorizedLogin(user.login))throw Error("Account is not an authorized editor");
  const repo=await gitHub("/repos/"+owner+"/"+repository,creds.access_token);
  if(!repo.permissions?.push)throw Error("Account has no write access");
  const session=seal({token:creds.access_token,login:user.login,exp:Date.now()+TTL*1000});
  const target=authPage(verified.slot);
  return redirect(target,[cookieHeader(STATE,"",0),cookieHeader(SESSION,session,TTL)]);
 }catch(err){return redirect(authPage(verified.slot)+(verified.slot?"&":"?")+"auth=failed",[cookieHeader(STATE,"",0)]);}
}
