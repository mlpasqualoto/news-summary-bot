# News Summarizer with Telegram Bot  
O **News Summary Bot** é um projeto Node.js que busca notícias de diversas fontes via RSS, gera um resumo objetivo utilizando a API da Inteligência Artificial do Google Gemini e envia esse resumo para um chat no Telegram. O envio é realizado de forma agendada (via node-cron) e também pode ser acionado manualmente através de um endpoint HTTP ou pelo prórprio chat no app do Telegram.

---

## ✨ Funcionalidades  
- **Coleta Automática de Notícias:** Busca as últimas notícias de portais como G1, Folha, The Verge e The Guardian.  
- **Resumo com IA:** Utiliza o modelo Gemini 2.0 Flash para gerar resumos em português, garantindo concisão e clareza.  
- **Agendamento Diário:** Envia os resumos automaticamente às 7h (horário de São Paulo) via Telegram.  
- **API Manual:** Permite acionar a busca de notícias manualmente através de um endpoint HTTP.  
- **Configuração Simplificada:** Utiliza variáveis de ambiente para chaves sensíveis (Telegram, Gemini).  

---

## 🛠 Tecnologias Utilizadas  
- **Node.js:** Ambiente de execução do servidor.  
- **Express:** Framework para criação da API e endpoints.  
- **node-cron:** Agendamento de tarefas para envio diário.  
- **rss-parser:** Leitura e processamento de feeds RSS.  
- **@google/generative-ai:** Integração com o modelo Gemini para resumo de texto.  
- **node-telegram-bot-api:** Comunicação com o bot do Telegram.  

---

## 📂 Estrutura do Código  
### **server.js**  
Configuração principal do servidor, incluindo:  
- Rotas para acesso manual (`GET /noticias`).  
- Agendamento de tarefas com `node-cron`.  
- Funções `buscarNoticias()` e `enviarNoticias()` para coleta e envio.  
- Integração com Gemini para resumo inteligente.  

### **Fluxo Principal**  
1. Coleta notícias dos feeds RSS pré-definidos.  
2. Formata o conteúdo para prompt do Gemini.  
3. Gera resumo com limite de caracteres (evitando limites do Telegram).  
4. Envia via bot para o chat configurado.  

---

## ⚙️ Configuração do Projeto  
1. **Clone o repositório:**  
```bash  
git clone <url-do-repositorio>  
cd news-summarizer
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**

- Crie um arquivo .env na raiz com:

```bash
TELEGRAM_BOT_TOKEN=<seu_token_do_bot>  
TELEGRAM_CHAT_ID=<id_do_chat>  
GEMINI_API_KEY=<sua_chave_gemini>
```

4. **Execute o servidor:**
```bash
node server.js
```

5. **Acesse via endpoint (opcional):**
```bash
http://localhost:3000/noticias  
```

---

## 🔍 Exemplo de Uso
- Automático: O bot enviará resumos diários às 7h no grupo/canal configurado.
- Manual:

  - Acesse GET /noticias para gerar um resumo imediato; ou
  - Digite /noticias no chat do seu bot no telegram, para também gerar um resumo imediato através do próprio app.

---

## 🤝 Contribuições

- Contribuições são bem-vindas! Reporte issues ou envie sugestões via pull requests.

---

## 📜 Licença

- Este projeto está licenciado sob a licença MIT.



