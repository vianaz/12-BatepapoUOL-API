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
	const horarioAtual = dayjs().locale("pt-br").format("HH:mm:ss");

	// Schema/Validação com JOI
	const participanteSchema = Joi.object({
		name: Joi.string().required(),
	});
	const respostaValidacao = participanteSchema.validate(participante, {
		abortEarly: false,
	});

	if (respostaValidacao.error) {
		res.status(422).send(respostaValidacao.error.message);
		return;
	}

	try {
		const nomeParticipanteDisponivel = await database
			.collection("participants")
			.findOne(respostaValidacao.value);

		if (nomeParticipanteDisponivel) {
			res.status(409).send("Já existe alguém com esse nome, tente outro!");
			return;
		}

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
	} catch (error) {
		res.status(400).send("Houve algum erro, tente novamente!");
	}
});

// Código para "servidor" Mensagens
app.get("/messages", async (req, res) => {
	const { limit } = req.query;
	const { user } = req.headers;
	try {
		const mensagens = await database.collection("messages").find().toArray();

		if (limit != undefined) {
			const mensagensFiltradas = mensagens
				.reverse()
				.filter(
					(element, index) =>
						index <= limit - 1 &&
						(element.from === user || element.to === "Todos"),
				); //uso reverse para poder pegar as mais recentes
			res.status(200).send(mensagensFiltradas.reverse()); //uso o reverse de novo, porque o front não pode receber revertido
		} else {
			res.status(200).send(mensagens);
		}
	} catch (error) {
		res.status(500).send(error);
	}
});
app.post("/messages", async (req, res) => {
	const mensagem = req.body;
	const { user } = req.headers;
	const horarioAtual = dayjs().locale("pt-br").format("HH:mm:ss");

	// Schema/Validação com JOI
	const mensagemSchema = Joi.object({
		from: Joi.string().required(),
		to: Joi.string().required(),
		text: Joi.string().required(),
		type: Joi.string().valid("private_message", "message").required(),
	});
	const respostaValidacao = mensagemSchema.validate(
		{ ...mensagem, from: user },
		{
			abortEarly: false,
		},
	);

	if (respostaValidacao.error) {
		res.status(422).send(respostaValidacao.error);
		return;
	}

	const isParticipant = await database
		.collection("participants")
		.findOne({ name: user });

	if (isParticipant != null) {
		const dadosMensagem = {
			...respostaValidacao.value,
			time: horarioAtual,
		};
		database.collection("messages").insertOne(dadosMensagem);
		res.status(201).send("");
	}
});

// Código para "servidor" status
app.post("/status", async (req, res) => {
	const { user } = req.headers;
	const colecaoParticipantes = database.collection("participants");
	const eParticipante = await colecaoParticipantes.findOne({ name: user });

	if (eParticipante === null) {
		res.status(404).send("");
		return;
	}

	await colecaoParticipantes.updateOne(
		{
			_id: eParticipante._id,
		},
		{ $set: { ...eParticipante, lastStatus: Date.now() } },
	);
	console.log("eparticipante");
	res.status(200).send("");
});

const verificarStatus = setInterval(async () => {
	const horarioAtual = dayjs().locale("pt-br").format("HH:mm:ss");
	const colecaoParticipantes = database.collection("participants");
	const participantes = await colecaoParticipantes.find().toArray();
	participantes.forEach((element) => {
		const tempoInativo = Date.now() - element.lastStatus;

		if (tempoInativo >= 10000) {
			const mensagemSairSala = {
				from: element.name,
				to: "Todos",
				text: "saiu da sala...",
				type: "status",
				time: horarioAtual,
			};
			colecaoParticipantes.deleteOne({ _id: element._id });
			database.collection("messages").insertOne(mensagemSairSala);
		}
	});
}, 15000);

app.listen(process.env.PORT, () =>
	console.log(chalk.bold.blue(`Servidor em pé na porta 5000`)),
);
