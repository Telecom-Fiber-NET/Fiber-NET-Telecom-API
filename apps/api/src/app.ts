import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./api/routes";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas Reais
app.use("/api", routes);

// 404 - Rota não encontrada
app.use((req, res) => {
  console.log(`[404] Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Rota não encontrada",
    method: req.method,
    url: req.url,
    hint: "Verifique o prefixo /api e se o endpoint está correto."
  });
});

// Tratamento de Erro Padrão
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;