import { Token, TokenType } from "../shared/Token";
import InputStream from "./inputstream";



export class Lexer {
    current: Token | null = null;
    reportPunctuation = false;

    constructor(private input: InputStream) {

    }


    protected readNext(): Token | null {
        //this.readWhile(ch => this.isWhitespace(ch));
        
        if (this.input.eof()) 
            return null;

        let ch = this.input.next();
        let pos = this.input.getLastPos();

        // if (this.isOpenAngleBracket(ch)) {
        //     this.reportPunctuation = true;
        //     this.input.next();
        //     var elementText = this.readWhile(x => this.isWord(x));

        //     return {
        //         type: TokenType.ElementStart,
        //         value: elementText,
        //         position: this.input.getLastPos()
        //     }
        // }

        // if (this.isPunctuation(ch)) {
        //     return {
        //         type: TokenType.Punctuation,
        //         value: this.input.next(),
        //         position: this.input.getLastPos()
        //     }
        // }

        // if (this.isCloseAngleBracket(ch)) {
        //     return {
        //         type: TokenType.ElementEnd,
        //         value: this.input.next(),
        //         position: this.input.getLastPos()
        //     }
        // }

        // if (this.isOpenParenthesis(ch)) {
        //     return {
        //         type: TokenType.PropertyStart,
        //         value: this.input.next(),
        //         position: this.input.getLastPos()
        //     }
        // }

        // if (this.isCloseParenthesis(ch)) {
        //     return {
        //         type: TokenType.PropertyEnd,
        //         value: this.input.next(),
        //         position: this.input.getLastPos()
        //     }
        // }
        
        // if (this.isNewLine(ch)) {
        //     return {
        //         type: TokenType.NewLine,
        //         value: this.input.next(),
        //         position: this.input.getLastPos()
        //     }
        // }

        if (this.isComment(ch)) {
            return {
                type: TokenType.Comment,
                value: ch,
                position: pos
            }
        }

        if (this.isCommentPart(ch) && this.isComment(ch + this.input.peek())) {
            return {
                type: TokenType.Comment,
                value: ch + this.input.next(),
                position: pos
            }
        }

        if (this.isPipe(ch)) {
            return {
                type: TokenType.Pipe,
                value: ch,
                position: pos
            }
        }

        if (this.isControl(ch)) {
            return {
                type: TokenType.Control,
                value: ch,
                position: pos
            }
        }

        if (this.isKeyword(ch)) {
            return {
                type: TokenType.Keyword,
                value: ch,
                position: pos
            }
        }

        if (this.isSpace(ch)) {
            return {
                type: TokenType.Space,
                value: ch,
                position: pos
            }
        }

        let text = ch + this.readWhile(x => this.isWord(x));

        return {
            type: TokenType.Text,
            value: text,
            position: pos
        }
    }

    isPipe(ch: string) {
        return "|".indexOf(ch) >= 0; //'\[', '\]', '\|', '(', ')', ':', ',', '.', '+', '-', '"', '_'
    }

    isKeyword(ch: string) {
        return "[]():,.+-\"_".indexOf(ch) >= 0; //'\[', '\]', '\|', '(', ')', ':', ',', '.', '+', '-', '"', '_'
    }

    isComment(ch: string) {
        return "%".indexOf(ch) >= 0
        || ch === "/:"
        || ch === ":/";
    }

    isCommentPart(ch: string) {
        return "/:".indexOf(ch) >= 0;
    }

    isControl(ch: string) {
        return "\n\r\t".indexOf(ch) >= 0; //'\n', '\r', '\t'
    }

    isWord(ch: string){
        return !(this.isKeyword(ch) 
        || this.isControl(ch) 
        || this.isCommentPart(ch) 
        || this.isSpace(ch));
    }

    isEscape(ch: string) {
        return "\\".indexOf(ch) >= 0;
    }

    // isOpenAngleBracket(ch: string) {
    //     return "[".indexOf(ch) >= 0;
    // }

    // isCloseAngleBracket(ch: string) {
    //     return "]".indexOf(ch) >= 0;
    // }

    // isOpenParenthesis(ch: string) {
    //     return this.reportPunctuation && "(".indexOf(ch) >= 0;
    // }

    // isCloseParenthesis(ch: string) {
    //     return this.reportPunctuation && ")".indexOf(ch) >= 0;
    // }

    // isPipe(ch: string) {
    //     return "|".indexOf(ch) >= 0;
    // }

    // isPunctuation(ch: string) {
    //     return this.reportPunctuation && "|,".indexOf(ch) >= 0;
    // }

    // isNewLine(ch: string) {
    //     return "\n".indexOf(ch) >= 0;
    // }

    // isWhitespace(ch: string) {
    //     return "\t\r".indexOf(ch) >= 0;
    // }

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
            throw this.error("Encountered null token");
        }

        return next;
    }

    eof() {
        return this.peek() == null;
    }

    public error(msg: string) {
        return this.input.error(msg);
    }
}

export default Lexer;