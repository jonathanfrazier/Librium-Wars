import {configured,getSession,json,site,validSlot,imagePath,gitHub,owner,repository,branch,authorizedLogin} from "./_librium-shared.mjs";
export default async function(req){
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 if(!configured())return json({error:"GitHub sign-in has not been configured."},503);
 if(req.headers.get("origin")!==site()||req.headers.get("x-librium-upload")!=="yes")return json({error:"Unauthorized origin"},403);
 const session=getSession(req);
 if(!session||!authorizedLogin(session.login))return json({error:"Please sign in with GitHub"},401);
 const length=Number(req.headers.get("content-length")||0);
 if(length>6*1024*1024)return json({error:"Image upload too large"},413);
 let body;
 try{body=await req.json()}catch{return json({error:"Invalid upload"},400)}
 const id=body?.slotId;
 if(!validSlot(id))return json({error:"Invalid image destination"},400);
 if(typeof body.content!=="string"||body.content.length>5.2e6||! /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(body.content))return json({error:"Invalid or oversized image"},400);
 const bytes=Buffer.from(body.content,"base64");
 if(bytes.length>3.9*1024*1024||bytes.length<32)return json({error:"Image must be smaller than 3.9 MB"},413);
 if(bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WEBP")return json({error:"Please upload an image encoded as WebP"},400);
 try{
  const token=session.token,base="/repos/"+owner+"/"+repository;
  const profile=await gitHub("/user",token);
  if(!authorizedLogin(profile.login))return json({error:"Not an authorized editor"},403);
  const repo=await gitHub(base,token);
  if(!repo.permissions?.push)return json({error:"Missing write permission"},403);
  const registry=await gitHub(base+"/contents/assets/IMAGE-SLOTS.json?ref="+branch,token);
  const data=JSON.parse(Buffer.from(registry.content,"base64").toString("utf8"));
  const item=data.slots?.find(x=>x.id===id);
  if(!item)return json({error:"Unknown image destination"},400);
  const path=imagePath(id);
  let sha;
  try{const prior=await gitHub(base+"/contents/"+path+"?ref="+branch,token);sha=prior.sha}catch(e){if(e.status!==404)throw e}
  const uploaded=await gitHub(base+"/contents/"+path,token,{method:"PUT",body:JSON.stringify({message:"Upload artwork for "+id,content:body.content,sha,branch})});
  item.status="published";item.assetPath=path;
  const updated=Buffer.from(JSON.stringify(data,null,2)+"\n").toString("base64");
  let tracked=true;
  try{
   await gitHub(base+"/contents/assets/IMAGE-SLOTS.json",token,{
    method:"PUT",body:JSON.stringify({message:"Update image tracker for "+id,content:updated,sha:registry.sha,branch})
   });
  }catch(err){tracked=false}
  return json({success:true,slot:id,page:item.page,path,tracked,commit:uploaded.commit?.sha||null});
 }catch(e){
  return json({error:e.status===401?"GitHub authorization expired. Sign in again.":e.message||"Image upload failed"},e.status===401?401:500);
 }
}
