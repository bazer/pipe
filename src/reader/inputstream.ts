export interface StreamPosition {
    character: number,
    line: number,
    column: number
}

export class InputStream {
    pos = 0;
    line = 1;
    col = 1;

    lastPosition = this.getCurrentPos();

    constructor(private input: string) {

    }

    public getLastPos(): StreamPosition {
        return this.lastPosition;
    }

    public getCurrentPos(): StreamPosition {
        return {
            character: this.pos,
            line: this.line,
            column: this.col
        };
    }

    public next() {
        this.lastPosition = this.getCurrentPos();

        var char = this.input.charAt(this.pos++);

        if (char == "\n") {
            this.line++;
            this.col = 1;
        }
        else {
            this.col++;
        }

        return char;
    }

    public peek() {
        return this.input.charAt(this.pos);
    }

    public eof() {
        return this.peek() == "";
    }

    public error(msg: string) {
        return new Error(msg + " (" + this.line + ":" + this.col + ")");
    }
}

export default InputStream;