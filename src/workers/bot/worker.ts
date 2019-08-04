import { IWorkerContext } from '@/workers/bot/types';
import BotWorker from '@/workers/bot/BotWorker';

const ctx: IWorkerContext = self as any;

const bot = new BotWorker(ctx);

ctx.onmessage = bot.handleWEvent.bind(bot);
