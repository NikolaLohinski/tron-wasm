import {IWorkerContext} from '@/workers/types';
import Wrapper from '@/workers/Wrapper';
import {TypescriptAI} from '@/engine/TypescriptAI';

const ctx: IWorkerContext = self as any;

const bot = new Wrapper(ctx, new TypescriptAI());

ctx.onmessage = bot.handleWEvent.bind(bot);
