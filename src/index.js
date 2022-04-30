import express, { json } from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

// Código para "servidor" Participantes
app.get("/participants", (req, res) => {
	console.log("participants get");
});
app.post("/participants", (req, res) => {
	console.log("participants post");
});

// Código para "servidor" Mensagens
app.get("/messages", (req, res) => {
	console.log("messages get");
});
app.post("/messages", (req, res) => {
	console.log("messages post");
});

// Código para "servidor" status
app.post("/status", (req, res) => {
	console.log("status post");
});

app.listen(5000, () =>
	console.log(chalk.bold.blue(`Servidor em pé na porta 5000`)),
);
