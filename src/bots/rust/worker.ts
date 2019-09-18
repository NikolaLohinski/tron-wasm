import {IWorkerContext} from '@/bots/types';
import WorkerWrapper from '@/bots/WorkerWrapper';
import {RustWrapper} from './RustWrapper';

const ctx: IWorkerContext = self as any;

const bot = new WorkerWrapper(ctx, new RustWrapper());

ctx.onmessage = bot.handleWEvent.bind(bot);
