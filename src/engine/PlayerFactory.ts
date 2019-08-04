import {RegisterMoveFunc} from '@/common/types';
import {BaseAI} from '@/common/interfaces';
import {PLAYER_TYPE} from '@/common/constants';
import {TsPlayer} from '@/engine/TsPlayer';
import {RustPlayer} from '@/engine/RustPlayer';

export default function NewPlayer(type: PLAYER_TYPE, register: RegisterMoveFunc, depth?: number): Promise<BaseAI> {
  return new Promise((resolve) => {
    switch (type) {
      case PLAYER_TYPE.TS:
        resolve(new TsPlayer(register, depth));
        break;
      case PLAYER_TYPE.RUST:
        import('®/bot/pkg/bot').then((wasm: any) => {
          resolve(new RustPlayer(register, wasm));
        });
        break;
      default:
        throw TypeError(`unknown player of type "${type}"`);
    }
  });
}
