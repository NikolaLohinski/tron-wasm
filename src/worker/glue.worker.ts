import {IBotWorker} from '@/worker/types';
import BotWorker from '@/worker/BotWorker';

const ctx: IBotWorker = self as any;

const bot = new BotWorker(ctx);

ctx.onmessage = bot.handleWEvent.bind(bot);
