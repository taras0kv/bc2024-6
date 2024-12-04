const { Command } = require('commander')
const express = require('express')
const fs = require('fs')
const path = require('path')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const app = express()

// Налаштування Commander.js для командного рядка
const program = new Command()
program
	.requiredOption('-h, --host <host>', 'server host')
	.requiredOption('-p, --port <port>', 'server port')
	.requiredOption('-c, --cache <cachePath>', 'path to cache directory')
program.parse(process.argv)
const options = program.opts()

// Конфігурація параметрів
const HOST = options.host
const PORT = options.port
const CACHE_DIR = path.resolve(options.cache)

// Переконайтеся, що директорія кешу існує
if (!fs.existsSync(CACHE_DIR)) {
	fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Swagger конфігурація
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Notes API',
			version: '1.0.0',
			description: 'A simple Express Notes API',
		},
	},
	apis: ['./app.js'], // Шлях до файлів, де описано API
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Підключення Swagger UI для доступу до документації
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Опис ендпоінтів з коментарями Swagger


app.get('/notes', (req, res) => {
	const notes = []
	fs.readdirSync(CACHE_DIR).forEach(file => {
		const noteContent = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8')
		notes.push({ name: file, text: noteContent })
	})
	res.status(200).json(notes)
})


app.get('/notes/:name', (req, res) => {
	const notePath = path.join(CACHE_DIR, req.params.name)
	if (!fs.existsSync(notePath)) {
		return res.status(404).send('Not found')
	}
	const noteContent = fs.readFileSync(notePath, 'utf-8')
	res.send(noteContent)
})


app.post('/notes/:name', express.text(), (req, res) => {
	const notePath = path.join(CACHE_DIR, req.params.name)
	if (fs.existsSync(notePath)) {
		return res.status(400).send('Note already exists')
	}
	fs.writeFileSync(notePath, req.body, 'utf-8')
	res.status(201).send('Created')
})


app.put('/notes/:name', express.text(), (req, res) => {
	const notePath = path.join(CACHE_DIR, req.params.name)
	if (!fs.existsSync(notePath)) {
		return res.status(404).send('Not found')
	}
	fs.writeFileSync(notePath, req.body, 'utf-8')
	res.send('Updated')
})


app.delete('/notes/:name', (req, res) => {
	const notePath = path.join(CACHE_DIR, req.params.name)
	if (!fs.existsSync(notePath)) {
		return res.status(404).send('Not found')
	}
	fs.unlinkSync(notePath)
	res.send('Deleted')
})

// Запуск сервера
app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}`)
})
