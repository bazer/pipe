export class InputStream {
    pos = 0;
    line = 1;
    col = 0;

    constructor(private input: string) {

    }

    public next() {
        var ch = this.input.charAt(this.pos++);

        if (ch == "\n") {
            this.line++;
            this.col = 0;
        }
        else {
            this.col++;
        }

        return ch;
    }

    public peek() {
        return this.input.charAt(this.pos);
    }

    public eof() {
        return this.peek() == "";
    }

    public croak(msg: string) {
        return new Error(msg + " (" + this.line + ":" + this.col + ")");
    }
}

export default InputStream;