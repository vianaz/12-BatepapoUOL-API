import express, { json } from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();
const horarioAtual = dayjs().locale("pt-br").format("HH:mm:ss");

// Conectar Banco de Dados
let database = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise = mongoClient.connect();
promise.then(() => {
	database = mongoClient.db(process.env.DATA_BASE);
	console.log(
		chalk.bold.green("Conexão com o Banco de Dados feita com sucesso!"),
	);
});
promise.catch(() => {
	console.log(
		chalk.bold.red("Houve alguma problema na conexão com o Banco de Dados!"),
	);
});

// Código para "servidor" Participantes
app.get("/participants", async (req, res) => {
	try {
		const participantes = await database
			.collection("participants")
			.find()
			.toArray();
		res.status(200).send(participantes);
	} catch (error) {
		res.status(500).send(error);
	}
});
app.post("/participants", async (req, res) => {
	const participante = req.body;

	// Schema/Validação com JOI
	const participanteSchema = Joi.object({
		name: Joi.string().required(),
	});
	const respostaValidacao = participanteSchema.validate(participante, {
		abortEarly: false,
	});

	if (respostaValidacao.error) {
		res.status(422).send(respostaValidacao.error.message);
	} else {
		const nomeParticipanteDisponivel = await database
			.collection("participants")
			.findOne(respostaValidacao.value);
		if (nomeParticipanteDisponivel) {
			res.status(409).send("Já existe alguém com esse nome, tente outro!");
		} else {
			const dadosLoginParticipante = {
				...respostaValidacao.value,
				lastStatus: Date.now(),
			};
			const dadosEntradaMensagem = {
				from: participante.name,
				to: "Todos",
				text: "entrou na sala...",
				type: "status",
				time: horarioAtual,
			};

			database.collection("participants").insertOne(dadosLoginParticipante);
			database.collection("messages").insertOne(dadosEntradaMensagem);
			res.status(201).send("");
		}
	}
});

// Código para "servidor" Mensagens
app.get("/messages", async (req, res) => {
	const { limit } = req.query;
	try {
		const mensagens = await database.collection("messages").find().toArray();

		if (limit != undefined) {
			const mensagensFiltradas = mensagens
				.reverse()
				.filter((element, index) => index <= limit - 1);
			res.status(200).send(mensagensFiltradas);
		} else {
			const arrayRevertida = mensagens.reverse();
			res.status(200).send(mensagensFiltradas);
		}
	} catch (error) {
		res.status(500).send(error);
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
