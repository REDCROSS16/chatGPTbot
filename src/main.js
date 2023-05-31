import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import {code} from 'telegraf/format';
import config from 'config';
import {ogg} from './ogg.js';
import { openai } from "./openai.js";

const INITIAL_SESSION = {
    messages: []
};

const bot = new Telegraf(config.get('TELEGRAM_TOKEN')); // token

bot.use(session());

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Жду ваше сообщение');
})

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Жду ваше сообщение');
})

// голосовое общение
bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;

    try {
        
        await ctx.reply(code('Сообщение принял! Жду ответа...'));
        const link  =  await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);
        const text = await openai.transctiption(mp3Path);

        await ctx.reply(code(`Ваш запрос: ${text}`));    

        ctx.session.messages.push({ role: openai.roles.USER,  content: text });

        // const messages = [
        //     {
        //         role: openai.roles.USER, 
        //         content: text
        //     }
        // ];
        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({ role: openai.roles.ASSISTANT,  content: response.content });
        
        await ctx.reply(response.content)
    } catch ($e) {
        console.log('Error while voice', $e.message);
    }
});

// текстовое общение
bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;

    try {
        
        await ctx.reply(code('Сообщение принял! Жду ответа...'));

        ctx.session.messages.push({ role: openai.roles.USER,  content: ctx.message.text });
        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({ role: openai.roles.ASSISTANT,  content: response.content });
        
        await ctx.reply(response.content)
    } catch ($e) {
        console.log('Error while voice', $e.message);
    }
});


// bot.command('start', async(ctx) => {
//     await ctx.reply(JSON.stringify(ctx.message, null, 2))
// })

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));