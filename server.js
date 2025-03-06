import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const app = express();
const PORT = 3000;
const parser = new Parser();

// Configuração do bot do Telegram
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/noticias/, async (msg) => {
    const chatId = msg.chat.id;
    const noticias = await buscarNoticias(); // Chama a função que já busca as notícias
    
    // Verifica se o texto das notícias excede o limite de 4096 caracteres
    while (noticias.length >= 4096) {
        console.log("Caracteres das notícias:", noticias.length);
        noticias = await buscarNoticias();
    }
    
    bot.sendMessage(chatId, noticias);
});

bot.on('message', (msg) => {
    console.log("Recebi uma mensagem:", msg.text);
    bot.sendMessage(msg.chat.id, "Recebi sua mensagem!");
});

// Inicializa o cliente Gemini com sua chave de API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Usando o modelo gemini-2.0-flash

// Função para buscar notícias
async function buscarNoticias() {
    try {
        const feeds = [
            'https://g1.globo.com/rss/g1/',
            'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
            'https://www.theverge.com/rss/index.xml',
            'https://www.theguardian.com/international/rss'
        ];

        let noticias = [];

        for (let feed of feeds) {
            const data = await parser.parseURL(feed);
            console.log("Feed:", data.title);
            noticias.push(...data.items.slice(0, 3).map(item => {
                return `📌 ${data.title}:
                    Título: ${item.title}
                    Data: ${item.pubDate || 'Data não disponível'}
                    Link: ${item.link || 'Link não disponível'}
                    Resumo: ${item.contentSnippet || item.content || 'Resumo não disponível'}`;
            }));
        }

        // Preparar o prompt para a Gemini API
        const prompt = `Summarize the following news in Brazilian Portuguese, ensuring the total length does not exceed 4096 characters. Each item must start with the news website's name and end with its link. If the summary exceeds the limit, shorten the content while preserving key information. News: ${noticias.join(' | ')}`;

        // Chamada para a Gemini API para gerar o conteúdo
        const result = await model.generateContent(prompt);

        // Retorna o conteúdo gerado pela Gemini API
        return result.response.text();
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        return "Não foi possível obter notícias hoje.";
    }
};

// Função para enviar notícias pelo Telegram
async function enviarNoticias(message) {
    try {
        const response = await bot.sendMessage(chatId, message);
        return response;
    } catch (error) {
        console.error("Erro ao enviar notícias pelo Telegram:", error);
        return "Erro ao enviar notícias pelo Telegram.";
    }
};

// Endpoint raiz
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

// Agenda a busca de notícias diariamente às 7h
cron.schedule('0 7 * * *', async () => {
    console.log("Enviando notícias às 07h no horário de São Paulo...");
    let noticias = await buscarNoticias();
    console.log("Caracteres das notícias:", noticias.length);

    // Verifica se o texto das notícias excede o limite de 4096 caracteres
    while (noticias.length >= 4096) {
        console.log("Caracteres das notícias:", noticias.length);
        noticias = await buscarNoticias();
    }

    const message = await enviarNoticias(noticias);
    console.log("Resumo das notícias do dia:", noticias, "message:", message);
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
