import {configured,getSession,json} from "./_librium-shared.mjs";
export default async function(req){
 if(req.method!=="GET")return json({error:"Method not allowed"},405);
 const session=getSession(req);
 return json({configured:configured(),authenticated:!!session,login:session?.login||null});
}
