import { Lexer, TokenType, Token } from "./lexer";
import { InputStream } from "./inputstream";
import { IParserNode, ParserNode, ParserNodeProperty } from "../shared/parsernode";

export class Parser {
    protected lexer: Lexer;

    constructor(input: string) {
        this.lexer = new Lexer(new InputStream(input));
    }

    public parse(): IParserNode[] {
        var nodes: IParserNode[] = [];

        while (!this.lexer.eof()) {
            // var token = this.lexer.peek();

            nodes.push(this.parseNode())
        }

        return this.parseText(nodes);
    }

    protected parseText(nodes: ParserNode[]): ParserNode[] {
        var textNodes: ParserNode[] = [];
        var list = nodes.reduce((acc: ParserNode[], node) => {
            if (node.name == "w" || node.name == "_") {
                textNodes.push(node);
            }
            else {
                if (textNodes.length > 0) {
                    let text = new ParserNode("t");
                    text.children = textNodes;
                    acc.push(text);

                    textNodes = [];
                }

                let newNode = node.clone();
                newNode.children = this.parseText(node.children);

                acc.push(newNode);
            }

            return acc;
        }, [])

        if (textNodes.length > 0) {
            let text = new ParserNode("t");
            text.children = textNodes;
            list.push(text);
        }

        return list;
    }
    
    protected parseNode(): IParserNode {
        var node: IParserNode | null = null;

        var token = this.lexer.next();

        if (token.type == TokenType.ElementStart) {
            let nodeNameSplit = token.value.split(/(\d+)/).filter(Boolean);

            node = new ParserNode(nodeNameSplit[0], null, true);

            if (nodeNameSplit.length > 1 && parseInt(nodeNameSplit[1]) > 1)
                node.amount = parseInt(nodeNameSplit[1]);

            let lastWord: Token | null = null;
            while (!this.lexer.eof() && !this.peekIsPunctuation("|") && !this.peekIsNewLine() && !this.peekIsElementEnd()) {
                if (token.type === TokenType.Word) {
                    lastWord = token;
                }

                if (this.peekIsPropertyStart()) {
                    token = this.lexer.next();

                    if (lastWord == null) {
                        throw this.croak("Token is not a word");
                    }

                    let property = new ParserNodeProperty(lastWord.value);
                    node.properties.push(property);

                    let arg = "";
                    while(!this.lexer.eof() && !this.peekIsPropertyEnd()) {
                        token = this.lexer.next();

                        if (token.type == TokenType.Punctuation && token.value === ",") {
                            property.arguments.push(arg);
                            arg = "";
                        }
                        else {
                            arg += token.value;
                        }
                    }

                    if (arg.length > 0) {
                        property.arguments.push(arg);
                        arg = "";
                    }
                }

                token = this.lexer.next();
            }

            if (this.peekIsPunctuation("|"))
                token = this.lexer.next();

            this.lexer.reportPunctuation = false;
        }
        else if (token.type == TokenType.NewLine) {
            return new ParserNode("n");
        }
        else if (token.type == TokenType.Space) {
            return new ParserNode("_");
        }
        else if (token.type == TokenType.Word) {
            return new ParserNode("w", token.value);
        }
        else
            throw this.croak(`Unexpected token type '${token.type}'`);

        while (!this.lexer.eof()) {
            let peek = this.lexer.peek();

            if (peek && peek.type == TokenType.ElementEnd) {
                this.lexer.next();
                return node;
            }

            node.children.push(this.parseNode())
        }

        return node;
    }


    protected peekIsPunctuation(ch?: string) {
        var tok = this.lexer.peek();
        return tok && tok.type == TokenType.Punctuation && (!ch || tok.value == ch) && tok;
    }

    protected peekIsNewLine() {
        var tok = this.lexer.peek();
        return tok && tok.type == TokenType.NewLine
    }

    protected peekIsElementEnd() {
        var tok = this.lexer.peek();
        return tok && tok.type == TokenType.ElementEnd
    }

    protected peekIsPropertyStart() {
        var tok = this.lexer.peek();
        return tok && tok.type == TokenType.PropertyStart
    }

    protected peekIsPropertyEnd() {
        var tok = this.lexer.peek();
        return tok && tok.type == TokenType.PropertyEnd
    }

    protected croak(msg: string) {
        return this.lexer.croak(msg);
    }
}

export default Parser;