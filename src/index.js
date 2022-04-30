import express, { json } from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

// Conectar Banco de Dados
let database = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);

// Código para "servidor" Participantes
app.get("/participants", async (req, res) => {
	try {
		await mongoClient.connect();
		database = mongoClient.db(process.env.DATA_BASE);

		const participantes = await database
			.collection("participants")
			.find()
			.toArray();

		res.status(200).send(participantes);
		mongoClient.close();
	} catch (error) {
		res.status(500).send(error);
		mongoClient.close();
	}
});
app.post("/participants", (req, res) => {
	console.log("participants post");
});

// Código para "servidor" Mensagens
app.get("/messages", async (req, res) => {
	const { limit } = req.query;
	try {
		await mongoClient.connect();
		database = mongoClient.db(process.env.DATA_BASE);

		const mensagens = await database.collection("messages").find().toArray();

		if (limit != undefined) {
			const mensagensFiltradas = mensagens
				.reverse()
				.filter((element, index) => index <= limit - 1);
			res.status(200).send(mensagensFiltradas);
			mongoClient.close();
		} else {
			const arrayRevertida = mensagens.reverse();
			res.status(200).send(mensagensFiltradas);
			mongoClient.close();
		}
	} catch (error) {
		res.status(500).send(error);
		mongoClient.close();
	}
});
app.post("/messages", (req, res) => {
	console.log("messages post");
});

// Código para "servidor" status
app.post("/status", (req, res) => {
	console.log("status post");
});

app.listen(process.env.PORT, () =>
	console.log(chalk.bold.blue(`Servidor em pé na porta 5000`)),
);
