import InputStream from "./inputstream";

export enum TokenType {
    ElementStart,
    ElementEnd,
    PropertyStart,
    PropertyEnd,
    Punctuation,
    NewLine,
    Word,
    Space
}

export interface Token {
    type: TokenType,
    value: string
}

export class Lexer {
    current: Token | null = null;
    reportPunctuation = false;

    constructor(private input: InputStream) {

    }


    protected readNext(): Token | null {
        this.readWhile(ch => this.isWhitespace(ch));
        
        if (this.input.eof()) 
            return null;

        var ch = this.input.peek();

        if (this.isOpenAngleBracket(ch)) {
            this.reportPunctuation = true;
            this.input.next();
            var elementText = this.readWhile(x => this.isWord(x));

            return {
                type: TokenType.ElementStart,
                value: elementText
            }
        }

        if (this.isPunctuation(ch)) {
            return {
                type: TokenType.Punctuation,
                value: this.input.next()
            }
        }

        if (this.isCloseAngleBracket(ch)) {
            return {
                type: TokenType.ElementEnd,
                value: this.input.next()
            }
        }

        if (this.isOpenParenthesis(ch)) {
            return {
                type: TokenType.PropertyStart,
                value: this.input.next()
            }
        }

        if (this.isCloseParenthesis(ch)) {
            return {
                type: TokenType.PropertyEnd,
                value: this.input.next()
            }
        }
        
        if (this.isNewLine(ch)) {
            return {
                type: TokenType.NewLine,
                value: this.input.next()
            }
        }

        if (this.isSpace(ch)) {
            return {
                type: TokenType.Space,
                value: this.input.next()
            }
        }

        var text = this.readWhile(x => this.isWord(x));

        return {
            type: TokenType.Word,
            value: text
        }
    }

    isWord(ch: string){
        return !(this.isOpenAngleBracket(ch) 
        || this.isCloseAngleBracket(ch) 
        || this.isOpenParenthesis(ch) 
        || this.isCloseParenthesis(ch) 
        || this.isPunctuation(ch) 
        || this.isNewLine(ch) 
        || this.isWhitespace(ch) 
        || this.isSpace(ch));
    }

    isEscape(ch: string) {
        return "\\".indexOf(ch) >= 0;
    }

    isOpenAngleBracket(ch: string) {
        return "[".indexOf(ch) >= 0;
    }

    isCloseAngleBracket(ch: string) {
        return "]".indexOf(ch) >= 0;
    }

    isOpenParenthesis(ch: string) {
        return this.reportPunctuation && "(".indexOf(ch) >= 0;
    }

    isCloseParenthesis(ch: string) {
        return this.reportPunctuation && ")".indexOf(ch) >= 0;
    }

    // isPipe(ch: string) {
    //     return "|".indexOf(ch) >= 0;
    // }

    isPunctuation(ch: string) {
        return this.reportPunctuation && "|,".indexOf(ch) >= 0;
    }

    isNewLine(ch: string) {
        return "\n".indexOf(ch) >= 0;
    }

    isWhitespace(ch: string) {
        return "\t\r".indexOf(ch) >= 0;
    }

    isSpace(ch: string) {
        return " ".indexOf(ch) >= 0;
    }

    readWhile(predicate: (char: string) => boolean) {
        let str = "";
        let escapeCount = 0;

        while (!this.input.eof() && (predicate(this.input.peek()) || escapeCount > 0)) {
            if (this.isEscape(this.input.peek()) && escapeCount == 0) {
                escapeCount++;
                this.input.next();
            }
            else {
                escapeCount = 0;
                str += this.input.next();
            }
        }

        return str;
    }

    peek() {
        return this.current || (this.current = this.readNext());
    }

    next() {
        var tok = this.current;
        this.current = null;
        let next = tok || this.readNext();

        if (next == null){
            throw this.croak("Encountered null token");
        }

        return next;
    }

    eof() {
        return this.peek() == null;
    }

    public croak(msg: string) {
        return this.input.croak(msg);
    }
}

export default Lexer;