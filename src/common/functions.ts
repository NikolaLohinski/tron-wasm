import {Color, UUID} from '@/common/types';
import {COLORS, NAMES} from '@/common/constants';

export function generateUUID(): UUID {
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); // use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);

        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export function randomColor(): Color {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function randomName(): string {
    return NAMES[Math.floor(Math.random() * NAMES.length)];
}
