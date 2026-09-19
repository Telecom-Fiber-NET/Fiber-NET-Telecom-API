import { Router } from "express";
import { getReactivationByCustomer, listBlockedCustomers, registerReactivation } from "./controller";

export const reactivationRoutes = Router();

reactivationRoutes.get("/bloqueados", listBlockedCustomers);
reactivationRoutes.get("/:customerId", getReactivationByCustomer);
reactivationRoutes.post("/registrar", registerReactivation);
