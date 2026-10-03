import { requireOwner, actionCall, ActionError } from "@/lib/server/actions";
import { z, ZodError } from "zod";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(req:Request) {
  try {
    const owner=requireOwner(req.headers);
    const origin=req.headers.get("origin");
    if(origin && origin!==new URL(req.url).origin) return Response.json({error:"origin_rejected",message:"この画面から再操作してください。"},{status:403,headers});
    if(!req.headers.get("content-type")?.includes("application/json")) return new Response(null,{status:415});
    const {name,arguments:args}=z.object({name:z.string(),arguments:z.unknown().optional()}).parse(await req.json());
    return Response.json(await actionCall(owner,name,args??{}),{headers});
  } catch(e) {
    const known=e instanceof ActionError;
    const status=known?e.status:e instanceof ZodError?400:503;
    return Response.json({error:known?e.code:e instanceof ZodError?"invalid_input":"outcome_unknown",message:known?e.message:e instanceof ZodError?"入力内容を確認してください。":"保存結果を確認できません。入力を保ったまま、更新して確認してください。"},{status,headers});
  }
}
