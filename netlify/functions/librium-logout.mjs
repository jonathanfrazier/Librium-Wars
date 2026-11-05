import {SESSION,cookieHeader,json,site} from "./_librium-shared.mjs";
export default async function(req){
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const origin=req.headers.get("origin");
 if(origin!==site())return json({error:"Invalid origin"},403);
 return json({authenticated:false},200,{"set-cookie":cookieHeader(SESSION,"",0)});
}
