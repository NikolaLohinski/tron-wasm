import {IWorkerContext} from '@/bots/types';
import WorkerWrapper from '@/bots/WorkerWrapper';
import GoWrapper from '@/bots/golang/GoWrapper';

const ctx: IWorkerContext = self as any;

const bot = new WorkerWrapper(ctx, new GoWrapper());

ctx.onmessage = bot.handleWEvent.bind(bot);
