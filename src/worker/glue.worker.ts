import {IWorker, IWorkerContext} from '@/worker/types';
import BotWorker from '@/worker/BotWorker';

const ctx: IWorkerContext = self as any;

const bot = new BotWorker(ctx);

ctx.onmessage = bot.handleWEvent.bind(bot);
