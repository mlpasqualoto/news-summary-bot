import express from 'express';
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 3000;
const parser = new Parser();

const metaApiKey = process.env.META_API_KEY;
const phoneNumberId = process.env.PHONE_NUMBER_ID;
const phoneNumber = process.env.PHONE_NUMBER;

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
            'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            'https://feeds.bbci.co.uk/news/rss.xml',
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
        const prompt = `Summarize the provided news objectively, always indicating at the beginning of each item which news website it belongs to and including its respective link at the end of each item. Always provide the summary in Brazilian Portuguese. Here are the news: ${noticias.join(' | ')}`;

        // Chamada para a Gemini API para gerar o conteúdo
        const result = await model.generateContent(prompt);

        // Retorna o conteúdo gerado pela Gemini API
        return result.response.text();
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        return "Não foi possível obter notícias hoje.";
    }
};

async function enviarNoticias(message) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "template",
                template: {
                    name: "newsbot",
                    language: { code: "pt_BR" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: message }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${metaApiKey}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Erro ao enviar notícias:", error);
        return "Erro ao enviar notícias.";
    }
}

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
    const message = await enviarNoticias(noticias);
    console.log("Resumo das notícias do dia:", noticias, "message:", message);
});

/*(async () => {
    const noticias = await buscarNoticias();
    const message = await enviarNoticias(noticias);
    console.log("Resumo das notícias do dia:", noticias, "message:", message);
})(); */

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
