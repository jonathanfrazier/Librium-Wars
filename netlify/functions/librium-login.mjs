import {configured,site,callback,makeState,STATE,cookieHeader,redirect} from "./_librium-shared.mjs";
export default async function(req){
 if(!configured())return redirect(site()+"/upload-images/?auth=setup");
 const slot=new URL(req.url).searchParams.get("slot");
 const state=makeState(slot);
 const url=new URL("https://github.com/login/oauth/authorize");
 url.searchParams.set("client_id",process.env.LIBRIUM_GITHUB_CLIENT_ID);
 url.searchParams.set("redirect_uri",callback());
 url.searchParams.set("scope","public_repo");
 url.searchParams.set("state",state);
 return redirect(url.toString(),[cookieHeader(STATE,state,600)]);
}
