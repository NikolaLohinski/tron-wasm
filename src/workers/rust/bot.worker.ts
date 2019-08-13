import {IWorkerContext} from '@/workers/types';
import Wrapper from '@/workers/Wrapper';
import {RustAI} from '@/engine/RustAI';

const ctx: IWorkerContext = self as any;

const bot = new Wrapper(ctx, new RustAI());

ctx.onmessage = bot.handleWEvent.bind(bot);
