import {Position, UUID} from '@/common/types';

export default class Grid {

    public static parse(object: any): Grid {
        const grid = new Grid(object.sizeX, object.sizeY);
        grid.filled = object.filled;
        return grid;
    }

    private static key(position: Position): string {
        return `${position.x}-${position.y}`;
    }

    public readonly sizeX: number;
    public readonly sizeY: number;
    private filled: {[xy: string]: UUID[]};

    constructor(sizeX: number, sizeY: number) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.filled = {};
    }

    public isEmpty(): boolean {
        return Object.keys(this.filled).length === 0;
    }

    public reset(): void {
        this.filled = {};
    }

    public toJson(): string {
        return JSON.stringify(this.filled);
    }

    public getCell(position: Position): UUID[] {
        return this.filled[Grid.key(position)];
    }

    public setCell(userID: UUID, position: Position): void {
        if (!this.getCell(position)) {
            this.filled[Grid.key(position)] = [];
        }
        this.filled[Grid.key(position)].push(userID);
    }
}
