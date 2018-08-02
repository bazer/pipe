import { Lexer, TokenType, Token } from "./lexer";
import { InputStream } from "./inputstream";
import AST from "./ast";
import { elements } from ".";
import { IParserNode, ParserNode, ParserNodeProperty } from "./parsernode";
import { ASTBase, ASTMixin } from "./astbase";

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

    public testText = `[d version: 0.1, v: VagNu.Additions
        [p
            [c #333
                Gemensamhetsanläggning Tensta-Åsby ga:4.[n]Där ingår [h https://kw-test.vagnu.se/admin/sidor/edit/31|vägar, gång och cykelbanor], samt tillhörande diken, slänter, vändplaner och parkeringar. [n]
                Vägföreningen [b|ansvarar [i|ej]] [i|för]:
                [l type: bullets
                    [li|Belysning i samhället (Vattenfall)]
                    [li|Väg 707 Vikstavägen (Trafikverket driftområde Tierp)]
                    [li|Perronger/banområde Upptåget (Trafikverket/Kommunen)]
                    [li|Badplatsen vid Fyrisån (Kommunen)]
                    [li|Lekplatser (Kommunen)]
                ]
                [img width: 300px, height: 450px, type: base64|]
            ]
            [e:sida 345]
        ]
    ]`;

    public testText2 = `
        [p
            Gemensamhetsanläggning Tensta-Åsby ga:4.[n]Där ingår [h https://kw-test.vagnu.se/admin/sidor/edit/31|vägar, gång och cykelbanor], samt tillhörande diken, slänter, vändplaner och parkeringar. [n]
            Vägföreningen [b|ansvarar [i|ej]] [i|för]:
            [l type: bullets
                [li|Belysning i samhället (Vattenfall)]
                [li|Väg 707 Vikstavägen (Trafikverket driftområde Tierp)]
                [li|Perronger/banområde Upptåget (Trafikverket/Kommunen)]
                [li|Badplatsen vid Fyrisån (Kommunen)]
                [li|Lekplatser (Kommunen)]
            ]
            [img width: 300px, height: 450px, type: base64|]
        ][p|Våren är på väg!

            För att skona våra vägar under tjällossningen har vi beslutat att även i år införa maxvikt 4ton (axeltryck) i området. Detta kommer gälla från och med 29 mars 2018. Undantag ges endast till sopbilen och slamsugningsbilen. Begränsningen gäller tills vidare och det kommer sitta en skylt "max 4t" vid infarten från Överby till Abborrkroksvägen som informerar om detta.
            
            Begränsningen gäller till dess att skylten är nedtagen och information om när detta sker kommer att meddelas via e-post samt här på webben. Som vanligt är det fastighetsägaren som ansvarar för eventuella skador som uppstår på våra vägar i samband med transporter till och från fastigheten.
            
            Vi tackar för att ni respekterar detta och hoppas på en varm och skön vår!
            
            Hälsningar Styrelsen
            
            Abborrkrokens vägförening]
    `;

    public testText3 = `
        Gemensamhetsanläggning [_][_]Tensta-Åsby ga:4.[n]Där ingår [h https://kw-test.vagnu.se/admin/sidor/edit/31|vägar, gång och cykelbanor], samt tillhörande diken, slänter, vändplaner och parkeringar. [n]
        Vägföreningen [b|ansvarar [i|ej]] [i|för]:
        [ul type: bullets
            [li|Belysning i samhället (Vattenfall)]
            [li|Väg 707 Vikstavägen (Trafikverket driftområde Tierp)]
            [li|Perronger/banområde Upptåget (Trafikverket/Kommunen)]
            [li|Badplatsen vid Fyrisån (Kommunen)]
            [li|Lekplatser (Kommunen)]
        ]
        [img width: 300px, height: 450px, url: https://dst15js82dk7j.cloudfront.net/129389/73283245-QQ3l0.jpg]
        [h1|Våren är på väg!]

        För att skona våra vägar under tjällossningen har vi beslutat att även i år införa maxvikt 4ton (axeltryck) i området. Detta kommer gälla från och med 29 mars 2018. Undantag ges endast till sopbilen och slamsugningsbilen. Begränsningen gäller tills vidare och det kommer sitta en skylt "max 4t" vid infarten från Överby till Abborrkroksvägen som informerar om detta.
        
        Begränsningen gäller till dess att skylten är nedtagen och information om när detta sker kommer att meddelas via e-post samt här på webben. Som vanligt är det fastighetsägaren som ansvarar för eventuella skador som uppstår på våra vägar i samband med transporter till och från fastigheten.
        
        Vi tackar för att ni respekterar detta och hoppas på en varm och skön vår!
        
        Hälsningar Styrelsen
        Abborrkrokens vägförening
    `;

    public testText4 = `
        Gemensamhetsanläggning _2|Tensta-Åsby ga:4.n| Där ingår [h https://kw-test.vagnu.se/admin/sidor/edit/31|vägar, gång och cykelbanor], samt tillhörande diken, slänter, vändplaner och parkeringar. [n]
        Vägföreningen [b|ansvarar [i|ej]] [i|för]:
        l type: bullets
            li|Belysning i samhället (Vattenfall)
            [li|Väg 707 Vikstavägen (Trafikverket driftområde Tierp)]
            [li|Perronger/banområde Upptåget (Trafikverket/Kommunen)]
            [li|Badplatsen vid Fyrisån (Kommunen)]
            [li|Lekplatser (Kommunen)]
        ]
        [img width: 300px, height: 450px, url: https://dst15js82dk7j.cloudfront.net/129389/73283245-QQ3l0.jpg]
        h1|Våren är på väg!
        

        För att skona våra vägar under tjällossningen har vi beslutat att även i år införa maxvikt 4ton (axeltryck) i området. Detta kommer gälla från och med 29 mars 2018. Undantag ges endast till sopbilen och slamsugningsbilen. Begränsningen gäller tills vidare och det kommer sitta en skylt "max 4t" vid infarten från Överby till Abborrkroksvägen som informerar om detta.
        
        Begränsningen gäller till dess att skylten är nedtagen och information om när detta sker kommer att meddelas via e-post samt här på webben. Som vanligt är det fastighetsägaren som ansvarar för eventuella skador som uppstår på våra vägar i samband med transporter till och från fastigheten.
        
        Vi tackar för att ni respekterar detta och hoppas på en varm och skön vår!
        
        Hälsningar Styrelsen
        
        Abborrkrokens vägförening
    `;

}

export default Parser;