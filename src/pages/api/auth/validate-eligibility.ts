// src/pages/api/auth/validate-eligibility.ts
import type { NextApiRequest, NextApiResponse } from "next";

const DURHAM_DOMAIN = "@durham.ac.uk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Email is required",
    });
  }

  // Validate Durham email domain
  if (!email.toLowerCase().endsWith(DURHAM_DOMAIN.toLowerCase())) {
    return res.status(403).json({
      eligible: false,
      error: "Not eligible",
      message: "Caseway is exclusively for Durham University students",
      domain_required: DURHAM_DOMAIN,
    });
  }

  // Set eligibility verification cookie (httpOnly for security)
  res.setHeader("Set-Cookie", [
    `__eligibility_verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
  ]);

  return res.status(200).json({
    eligible: true,
    message: "Eligibility confirmed",
    email,
  });
}
