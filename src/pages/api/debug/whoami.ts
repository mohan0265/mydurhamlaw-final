// src/pages/api/debug/whoami.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getServerUser(req, res);
  return res.status(200).json({
    ok: true,
    user,                            // { id } or null
    hasAuthz: !!req.headers.authorization,  // whether a Bearer token header was sent
  });
}
