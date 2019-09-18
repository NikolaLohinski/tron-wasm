import {IWorkerContext} from '@/bots/types';
import WorkerWrapper from '@/bots/WorkerWrapper';
import {CppWrapper} from './CppWrapper';

const ctx: IWorkerContext = self as any;

const bot = new WorkerWrapper(ctx, new CppWrapper());

ctx.onmessage = bot.handleWEvent.bind(bot);
