import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./api/routes";

const app = express();

const allowedOrigins = [
  'https://www.fibernettelecom.com',
  'https://fibernettelecom.com',
  'https://fiber-net-telecom-web.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // permitir requests sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ixcsoft'],
  credentials: true
}));
app.use(express.json());

// Rotas Reais
app.use("/api", routes);

// Tratamento de Erro Padrão
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;