import { Lexer } from "./lexer";
import { InputStream } from "./inputstream";
// import { IParserNode, ParserNode, ParserNodeProperty } from "../shared/parsernode";
import { IPipeElement } from "../elements/ASTElement";
import { ElementNode, ElementNodeProperty } from "../shared/ElementNode";
import { Token, TokenType } from "../shared/Token";
import { TextElement } from "../elements/core/TextElement";

export interface ParseResults {
    Elements: IPipeElement[],
    Errors: IParserError[]
}

export interface IParserError {
    Type: ParserErrorType,
    Token: Token,
    Message: string
}

export enum ParserErrorType {
    MissingParenthesis,
    MissingPropertyName,
    InvalidPropertyName
}

export class ParserError implements IParserError {
    Type: ParserErrorType;    
    Token: Token;
    Message: string;

    constructor (type: ParserErrorType, token: Token, message: string) {
        this.Type = type;
        this.Token = token;
        this.Message = message;
    }
}

export class Parser {
    protected lexer: Lexer;
    protected loadedElements: IPipeElement[];
    protected tokenBuffer: Token[];
    protected errors: IParserError[];

    constructor(input: string, elements: IPipeElement[]) {
        this.lexer = new Lexer(new InputStream(input));
        this.loadedElements = elements;
        this.tokenBuffer = [];
        this.errors = [];
    }

    public parse(): ParseResults {
        var elements: IPipeElement[] = [];

        while (!this.lexer.eof()) {
            // var token = this.lexer.peek();

            while (!this.lexer.eof() && this.lexer.peek()?.type !== TokenType.Pipe) {
                this.tokenBuffer.push(this.lexer.next());
            }
            
            if (this.lexer.eof())
                elements.push(new TextElement().create(this.popBuffer(this.tokenBuffer.length)));
            else {
                let node = this.popElementDeclarationFromBuffer();

                if (node instanceof ElementNode) {
                    //find element of name and pass it the node

                    //elements.push(node);
                }
                    
            }
        }

        return {
            Elements: elements,
            Errors: this.errors
        };

        // return this.parseText(elements);
    }

    // protected parseText(nodes: IPipeElement[]): IPipeElement[] {
    //     var textNodes: ParserNode[] = [];
    //     var list = nodes.reduce((acc: ParserNode[], node) => {
    //         if (node.name == "w" || node.name == "_") {
    //             textNodes.push(node);
    //         }
    //         else {
    //             if (textNodes.length > 0) {
    //                 let text = new ParserNode("t");
    //                 text.children = textNodes;
    //                 acc.push(text);

    //                 textNodes = [];
    //             }

    //             let newNode = node.clone();
    //             newNode.children = this.parseText(node.children);

    //             acc.push(newNode);
    //         }

    //         return acc;
    //     }, [])

    //     if (textNodes.length > 0) {
    //         let text = new ParserNode("t");
    //         text.children = textNodes;
    //         list.push(text);
    //     }

    //     return list;
    // }

    protected error(type: ParserErrorType, token: Token, message: string) {
        let error = new ParserError(type, token, message);
        this.errors.push(error);

        return error;
    }
    
    // protected readTokens(): IPipeElement[] {

    //     while (!this.lexer.eof() && this.lexer.peek()?.type !== TokenType.Pipe) {
    //         this.tokenBuffer.push(this.lexer.next());
    //     }
        
    //     if (this.lexer.eof())
    //         return tokens;

        
       



    // }

    public popElementDeclarationFromBuffer(): ElementNode | ParserError {
        let node = new ElementNode();

        let token = this.tokenBuffer.pop();
        if (token === undefined)
            return node;

        while (token.type == TokenType.Keyword && token.value === ')') {
            let args = this.searchBufferUntil('(');
            if (args.length === 0)
                return this.error(ParserErrorType.MissingParenthesis, token, "Matching '(' not found");

            this.popBuffer(args.length);

            let propertyName = this.searchBufferUntil(':');
            if (propertyName.length === 0)
                return this.error(ParserErrorType.MissingPropertyName, args[0], "Required ':' not found");
            
            propertyName.splice(1);
            if (propertyName.length !== 1)
                return this.error(ParserErrorType.InvalidPropertyName, propertyName[0], `Invalid property name '${this.tokensToString(propertyName)}'`);

            node.properties.push(new ElementNodeProperty(propertyName[0].value, [this.tokensToString(args)]))
            
            this.popBuffer(propertyName.length);
            token = this.tokenBuffer.pop();

            if (token === undefined)
                return node;
        }

        let name = token.value;
        node.name = name;

        let startBracket = this.searchBufferUntil('[');
        if (startBracket.length !== 0) {
            node.hasBrackets = true;
            this.popBuffer(startBracket.length);
        }

        return node;
    }

    private searchBufferUntil(match: string): Token[]  {
        let tokens: Token[] = [];

        let index = this.tokenBuffer.length - 1;

        while (index >= 0 && tokens.last()?.value !== match)
        {
            let token = this.tokenBuffer[index];

            if (token)
                tokens.push(token);

            index -= 1;
        }

        if (tokens.last()?.value === match)
            return tokens.reverse();
        else
            return [];
    }

    protected popBuffer(length: number) {
        return this.tokenBuffer.splice(this.tokenBuffer.length - length, length);
    }

    protected tokensToString(tokens: Token[]) {
        return tokens.map(x => x.value).join();
    }
    // protected parseNode(): IPipeElement {
    //     var node: IParserNode | null = null;

    //     var token = this.lexer.next();

    //     if (token.type == TokenType.Control) {
    //         let nodeNameSplit = token.value.split(/(\d+)/).filter(Boolean);

    //         node = new ParserNode(nodeNameSplit[0], null, true);

    //         if (nodeNameSplit.length > 1 && parseInt(nodeNameSplit[1]) > 1)
    //             node.amount = parseInt(nodeNameSplit[1]);

    //         let lastWord: Token | null = null;
    //         while (!this.lexer.eof() && !this.peekIsPunctuation("|") && !this.peekIsNewLine() && !this.peekIsElementEnd()) {
    //             if (token.type === TokenType.Word) {
    //                 lastWord = token;
    //             }

    //             if (this.peekIsPropertyStart()) {
    //                 token = this.lexer.next();

    //                 if (lastWord == null) {
    //                     throw this.croak("Token is not a word");
    //                 }

    //                 let property = new ParserNodeProperty(lastWord.value);
    //                 node.properties.push(property);

    //                 let arg = "";
    //                 while(!this.lexer.eof() && !this.peekIsPropertyEnd()) {
    //                     token = this.lexer.next();

    //                     if (token.type == TokenType.Punctuation && token.value === ",") {
    //                         property.arguments.push(arg);
    //                         arg = "";
    //                     }
    //                     else {
    //                         arg += token.value;
    //                     }
    //                 }

    //                 if (arg.length > 0) {
    //                     property.arguments.push(arg);
    //                     arg = "";
    //                 }
    //             }

    //             token = this.lexer.next();
    //         }

    //         if (this.peekIsPunctuation("|"))
    //             token = this.lexer.next();

    //         this.lexer.reportPunctuation = false;
    //     }
    //     else if (token.type == TokenType.NewLine) {
    //         return new ParserNode("n");
    //     }
    //     else if (token.type == TokenType.Space) {
    //         return new ParserNode("_");
    //     }
    //     else if (token.type == TokenType.Word) {
    //         return new ParserNode("w", token.value);
    //     }
    //     else
    //         throw this.croak(`Unexpected token type '${token.type}'`);

    //     while (!this.lexer.eof()) {
    //         let peek = this.lexer.peek();

    //         if (peek && peek.type == TokenType.ElementEnd) {
    //             this.lexer.next();
    //             return node;
    //         }

    //         node.children.push(this.parseNode())
    //     }

    //     return node;
    // }


    // protected peekIsPunctuation(ch?: string) {
    //     var tok = this.lexer.peek();
    //     return tok && tok.type == TokenType.Punctuation && (!ch || tok.value == ch) && tok;
    // }

    // protected peekIsNewLine() {
    //     var tok = this.lexer.peek();
    //     return tok && tok.type == TokenType.NewLine
    // }

    // protected peekIsElementEnd() {
    //     var tok = this.lexer.peek();
    //     return tok && tok.type == TokenType.ElementEnd
    // }

    // protected peekIsPropertyStart() {
    //     var tok = this.lexer.peek();
    //     return tok && tok.type == TokenType.PropertyStart
    // }

    // protected peekIsPropertyEnd() {
    //     var tok = this.lexer.peek();
    //     return tok && tok.type == TokenType.PropertyEnd
    // }

    // protected error(msg: string) {
    //     return this.lexer.error(msg);
    // }
}

export default Parser;