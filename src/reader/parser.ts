import { Lexer, TokenType, Token } from "./lexer";
import { InputStream } from "./inputstream";
import AST from "../ast/ast";
import { elements } from "..";
import { IParserNode, ParserNode, ParserNodeProperty } from "../shared/parsernode";
import { ASTBase, ASTMixin } from "../ast/astbase";

export class Parser extends ASTBase {
    lexer: Lexer;

    constructor(extensionElements: (ASTMixin<elements.ASTElement>)[] = []) {
        super(extensionElements);
    }

    public decode(input: string | IParserNode[]): elements.ASTElement[] {
        if (input == null)
            return [];

        if (typeof input === "string")
            input = this.parse(input);

        input = this.parseText(input);

        // console.log(input);

        var ast = new AST(this.extensionElements);
        var list = input.map(x => this.getASTElements(x));
        list = list.flatMap(x => ast.removeUnknownElements(x));
        list = list.flatMap(x => ast.removeComments(x));
        list = ast.formatText(list);
        list = ast.removeNewLines(list);

        return list;
    }

    protected getASTElements(input: IParserNode): elements.ASTElement {
        if (!this.isASTElementType(input)) {
            this.error(`Unknown element '${input.name}'`);
        }

        let element = this.getASTElement(input);
        input.children.forEach(node => {
            element.children.push(this.getASTElements(node));
        });

        return element;
    }

    public parseText(nodes: ParserNode[]): ParserNode[] {
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

    public parse(input: string): IParserNode[] {
        this.lexer = new Lexer(new InputStream(input));

        var nodes: IParserNode[] = [];

        while (!this.lexer.eof()) {
            var token = this.lexer.peek();

            nodes.push(this.parseNode())
        }

        return nodes;
    }

    protected parseNode(): IParserNode {
        var node: IParserNode | null = null;

        var token = this.lexer.next();

        if (token.type == TokenType.ElementStart) {
            let nodeNameSplit = token.value.split(/(\d+)/).filter(Boolean);

            node = new ParserNode(nodeNameSplit[0], null, true);

            if (nodeNameSplit.length > 1 && parseInt(nodeNameSplit[1]) > 1)
                node.amount = parseInt(nodeNameSplit[1]);

            let lastWord: Token = null;
            while (!this.lexer.eof() && !this.peekIsPunctuation("|") && !this.peekIsNewLine() && !this.peekIsElementEnd()) {
                if (token.type === TokenType.Word) {
                    lastWord = token;
                }

                if (this.peekIsPropertyStart()) {
                    token = this.lexer.next();

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
            this.croak(`Unexpected token type '${token.type}'`);

        while (!this.lexer.eof()) {
            token = this.lexer.peek();

            if (token.type == TokenType.ElementEnd) {
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
        this.lexer.croak(msg);
    }
}

export default Parser;