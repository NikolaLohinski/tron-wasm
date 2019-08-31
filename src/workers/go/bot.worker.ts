import {IWorkerContext} from '@/workers/types';
import Wrapper from '@/workers/Wrapper';
import {GoAI} from '@/engine/GoAI';

const ctx: IWorkerContext = self as any;

const bot = new Wrapper(ctx, new GoAI());

ctx.onmessage = bot.handleWEvent.bind(bot);
