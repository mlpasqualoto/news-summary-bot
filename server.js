import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 4000;
const parser = new Parser();

// Inicializa o cliente Gemini com sua chave de API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Usando o modelo gemini-2.0-flash

// Função para buscar notícias
async function buscarNoticias() {
    try {
        const feeds = [
            'https://g1.globo.com/rss/g1/',
            'https://www.theverge.com/rss/index.xml'
        ];

        let noticias = [];

        for (let feed of feeds) {
            const data = await parser.parseURL(feed);
            console.log("Feed:", data.title);
            noticias.push(...data.items.slice(0, 3).map(item => `📌 ${item.title}`));
        }

        // Preparar o prompt para a Gemini API
        const prompt = `Faça um resumo dessas notícias da forma mais objetiva possível. Forneça o resumo sempre em Português do Brasil. Aqui estão as notícias: ${noticias.join(' | ')}`;

        // Chamada para a Gemini API para gerar o conteúdo
        const result = await model.generateContent(prompt);

        // Retorna o conteúdo gerado pela Gemini API
        return result.response.text();
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        return "Não foi possível obter notícias hoje.";
    }
};

app.get("/", (req, res) => {

    res.send("Welcome to the News Summarizer API!");
});

// Endpoint para buscar notícias manualmente
app.get("/noticias", async (req, res) => {
    try {
        const noticias = await buscarNoticias();
        
        res.send(noticias);
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        res.status(500).send("Erro ao buscar notícias.");
    }
});

// Agenda a busca de notícias diariamente às 8h
cron.schedule('0 8 * * *', async () => {    
    const noticias = await buscarNoticias();
    console.log("Resumo das notícias do dia:", noticias);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
