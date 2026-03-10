import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Debug: Ver o que chegou no header
  console.log("Header Authorization recebido:", authHeader);

  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2)
    return res
      .status(401)
      .json({ error: "Token malformado (formato inválido)" });

  const scheme = parts[0];
  const token = parts[1];

  if (!/^Bearer$/i.test(scheme))
    return res.status(401).json({ error: "Token malformado (falta Bearer)" });

  try {
const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET || "secret_padrao_seguro"
);    (req as any).user = decoded;
    return next();
  } catch (err: any) {
    // Debug: Ver o erro real
    console.error("ERRO JWT:", err.message);
    return res.status(401).json({
      error: "Token inválido",
      details: err.message,
    });
  }
}
