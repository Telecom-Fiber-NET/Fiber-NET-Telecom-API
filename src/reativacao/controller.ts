import { Request, Response } from "express";
import { z } from "zod";
import { reactivationService } from "./service";

const registerSchema = z.object({
  customerId: z.number(),
  contractId: z.number().optional(),
  phone: z.string().optional(),
  state: z.enum([
    "BLOCKED",
    "CONTACT_PENDING",
    "CONTACTED",
    "WAITING_CUSTOMER",
    "PAYMENT_PENDING",
    "PAYMENT_CONFIRMED",
    "REACTIVATION_PENDING",
    "REACTIVATED",
    "HUMAN_ATTENDANCE",
    "NO_RESPONSE",
    "CANCELLED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function listBlockedCustomers(_: Request, res: Response) {
  const blocked = await reactivationService.listBlockedCustomers();
  return res.json(blocked);
}

export async function getReactivationByCustomer(req: Request, res: Response) {
  const customerId = Number(req.params.customerId);
  if (!customerId) return res.status(400).json({ error: "Cliente invalido" });

  const result = await reactivationService.getCustomerReactivation(customerId);
  return res.json({ success: true, ...result });
}

export async function registerReactivation(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Payload invalido", detalhes: parsed.error.issues });

  const result = await reactivationService.register(parsed.data);
  return res.json(result);
}
