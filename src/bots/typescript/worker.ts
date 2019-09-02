import {IWorkerContext} from '@/bots/types';
import WorkerWrapper from '@/bots/WorkerWrapper';
import Bot from '@/bots/typescript/Bot';

const ctx: IWorkerContext = self as any;

const bot = new WorkerWrapper(ctx, new Bot());

ctx.onmessage = bot.handleWEvent.bind(bot);
