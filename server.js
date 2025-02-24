import express from 'express';
import OpenAI from 'openai';
import cron from 'node-cron';
import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

const app = express();
const PORT = 4000;
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const parser = new Parser();

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

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an assistant that must summarize the main news from the websites provided to you as objectively as possible. Always return the news summary in Brazilian Portuguese.'
                },
                {
                    role: 'user',
                    content: `Aqui estão as notícias: ${noticias.join(' | ')}`
                }
            ],
            max_tokens: 500
        });

        return response.choices[0].message.content;
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
