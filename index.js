import express from 'express';
import {read, write} from './src/utils/files.js';
import winston from 'winston';
import Joi from 'joi';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    console.log('Middleware');
    next();
})

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console(),
    ],
});

const mangaSchema = Joi.object({
    titulo: Joi.string().min(1).required(),
    autor: Joi.string().min(1).required(),
    genero: Joi.array().items(Joi.string().valid('Aventura', 'Acción', 'Comedia', 'Drama', 'Fantasia', 'Sobrenatural', 'Oscuro')).min(1).required(),
    volumenes: Joi.number().integer().min(1).required(),
    fechaPublicacion: Joi.date().iso().required(),
    sinopsis: Joi.string().min(10).required(),
    calificacion: Joi.number().min(0).max(10).required(),
    editorial: Joi.string().min(1).required(),
});

const updateMangaSchema = Joi.object({
    titulo: Joi.string().min(1).optional(),
    autor: Joi.string().min(1).optional(),
    genero: Joi.array().items(Joi.string().valid('Aventura', 'Acción', 'Comedia', 'Drama', 'Fantasía', 'Sobrenatural', 'Oscuro')).min(1).optional(),
    volumenes: Joi.number().integer().min(1).optional(),
    fechaPublicacion: Joi.date().iso().optional(),
    sinopsis: Joi.string().min(1).optional(),
    calificacion: Joi.number().min(0).max(10).optional(),
    editorial: Joi.string().min(1).optional(),
});

app.get('/mangas', (req, res) => {
    const mangas = read();
    res.json(mangas);
});

app.post('/mangas',
    (req, res, next) => {
        console.log('Middleware POST');
        next();
    },
    
    (req, res) => {
        const { error } = mangaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message }); // Respuesta en caso de error de validación
        }
    const mangas = read();
    const manga = {
        ...req.body, 
        id : mangas.length + 1
    }
    mangas.push(manga);
    write(mangas);
    res.status(201).json(mangas);
})

app.get('/mangas/:id', (req, res) => {
    const mangas = read();
    const manga = mangas.find(manga => manga.id === parseInt(req.params.id));
    if(manga){
        res.json(manga);
    } else {
        res.status(404).end();
    }
})

app.put('/mangas/:id', (req, res) => {
    const { error } = updateMangaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const mangas = read();
    let manga = mangas.find(manga => manga.id === parseInt(req.params.id));
    if (manga) {
        manga = {
            ...manga,
            ...req.body
        }
        mangas[mangas.findIndex(manga => manga.id === parseInt(req.params.id))] = manga;
        write(mangas);
        res.json(manga);
    } else {
        res.status(404).end();
    }
})

app.delete('/mangas/:id', (req, res) => {
    const mangas = read();
    const manga = mangas.find(manga => manga.id === parseInt(req.params.id));
    if (manga) {
        mangas.splice(
            mangas.findIndex(manga => manga.id === parseInt(req.params.id)),
            1
        );
        write(mangas);
        res.json(manga);
    } else {
        res.status(404).end();
    }
})

app.listen(4000, () => {
    console.log('Server is running on port 4000');   
})