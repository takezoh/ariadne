import { requireOwner, actionCall, ActionError } from "@/lib/server/actions";
import { readGuardedJson } from "@/lib/http/request-guard";
import { z, ZodError } from "zod";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
/** Web action API shares the same Origin/media-type/body-size guard as Remote MCP. */
export async function POST(req:Request) {
  try {
    const raw=await readGuardedJson(req);
    const owner=requireOwner(req.headers);
    const {name,arguments:args}=z.object({name:z.string(),arguments:z.unknown().optional()}).strict().parse(raw);
    return Response.json(await actionCall(owner,name,args??{}),{headers});
  } catch(e) {
    const known=e instanceof ActionError;
    const status=known?e.status:e instanceof ZodError?400:503;
    return Response.json({error:known?e.code:e instanceof ZodError?"invalid_input":"outcome_unknown",message:known?e.message:e instanceof ZodError?"入力内容を確認してください。":"保存結果を確認できません。入力を保ったまま、更新して確認してください。"},{status,headers});
  }
}
