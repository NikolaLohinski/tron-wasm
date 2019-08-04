import {BaseAI} from '@/common/interfaces';
import {Turn} from '@/common/types';
import {MOVE} from '@/common/constants';

export class RustPlayer extends BaseAI {
    private wasm: any;

    constructor(props: any, wasm: any) {
        super(props);
        // tslint:disable-next-line
        console.log(wasm);
        this.wasm = wasm;
    }

    public play(turn: Turn): void {
        this.register(turn.correlationID, MOVE.FORWARD, 0);
    }
}
