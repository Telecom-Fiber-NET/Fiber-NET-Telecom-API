import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./api/routes";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas Reais
app.use("/api", routes);

// Tratamento de Erro Padrão
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;