import chalk from "chalk";
import express from "express";

const app = express();
app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.listen(process.env.PORT || 5000, () =>
	console.log(chalk.bold.blue(`Servidor em pé na porta 5000`)),
);
