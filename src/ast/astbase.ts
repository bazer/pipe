import { IParserNode, ParserNode } from "../shared/parsernode";
import { ASTElement, ASTElementLayout } from "../elements/ASTElement";
import { ASTElementWithValue } from "../elements/ASTElementWithValue";
import { ASTElementWithAmount } from "../elements/ASTElementWithAmount";
import { ASTWhitespaceElement } from "../elements/ASTWhitespaceElement";
import { TextElement } from "../elements/core/TextElement";
import { WordElement } from "../elements/core/WordElement";
import { SpaceElement } from "../elements/core/SpaceElement";
import { UnknownElement } from "../elements/core/UnknownElement";
import { NewLineElement } from "../elements/core/NewLineElement";
import { DocumentElement, ParagraphElement, ItalicElement, UnorderedListElement, OrderedListElement, ColorElement, ListItemElement, BoldElement, UnderlineElement, HyperlinkElement, ImageElement, StrikethroughElement, CommentElement, HeadingElement, StyleElement, ScriptElement, HorizontalRuleElement, FragmentElement } from "../elements/elements";

export enum ParseErrorType {
    UnallowedNesting,
    UnknownElement,
    UnknownPosition,
    EmptyElement
}

export class ParseError {
    constructor(public type: ParseErrorType, public description: string) {

    }
}

export class SearchNode {
    constructor(public node: Node, public element: ASTElement) {
    }
}


export class ParseResult {
    // public errors: ParseError[];
    // public ast: ASTElement[];

    constructor(public ast: ASTElement[] = [], public errors: ParseError[] = []) {
    }
}


export type ASTMixin<T> = new (...args: any[]) => T;

// function ASTElementMixin<T extends ASTMixin<{}>>(mixinClass: T) {
//     return class extends mixinClass {
//         _tag: string;
//         constructor(...args: any[]) {
//             super(...args);
//             this._tag = "";
//         }
//     }
// }

export abstract class ASTBase {

    errors: ParseError[] = []
    insertedElements: ASTElement[] = [];
    extensionElements: (ASTMixin<ASTElement>)[] = [];

    constructor(extensionElements: (ASTMixin<ASTElement>)[] = []) {
        this.extensionElements = extensionElements;
    }

    protected reportUnallowedNesting(child: ASTElement, parent: ASTElement) {
        this.errors.push(new ParseError(ParseErrorType.UnallowedNesting, `Element of type '${child.elementName}' inside '${parent.elementName}'`));
    }

    protected reportUnknownElement(element: ASTElement, parent: ASTElement) {
        this.errors.push(new ParseError(ParseErrorType.UnknownElement, `Unknown element of type '${element.elementName}' inside '${parent.elementName}'`));
    }

    protected reportEmptyElement(element: ASTElement, parent?: ASTElement) {
        if (parent)
            this.errors.push(new ParseError(ParseErrorType.EmptyElement, `Element of type '${element.elementName}' inside '${parent.elementName}' should not be empty.`));
        else
            this.errors.push(new ParseError(ParseErrorType.EmptyElement, `Element of type '${element.elementName}' should not be empty.`));
    }

    protected reportUnknownPosition(index: number) {
        this.errors.push(new ParseError(ParseErrorType.UnknownElement, `Could not find position ${index}`));
    }

    protected isASTElementType(node: IParserNode) {
        return this.getASTElement(node) != null;
    }

    protected getASTElement(node: IParserNode | string): ASTElement {
        if (typeof node === "string") {
            node = new ParserNode(node);
        }

        var element = this.resolveASTElement(node);

        node.properties.forEach(x => {
            element.arguments[x.name] = x.arguments[0];
        });


        if (element instanceof ASTWhitespaceElement)
            element.explicit = node.explicit;

        if (element instanceof ASTElementWithValue)
            element.value = node.value || ""; 

        if (element instanceof ASTElementWithAmount)
            element.amount = node.amount;

        return element;
    }

    protected resolveASTElement(node: IParserNode) {
        let matches = this.extensionElements.filter(x => x.prototype.getExtensionName() == node.name);

        if (matches.length > 1)
            throw new Error(`More than one extensionElements match '${node.name}'`);
        else if (matches.length == 1)
            return new matches[0]();

        switch (node.name) {
            case "d": return new DocumentElement();
            case "p": return new ParagraphElement();
            case "i": return new ItalicElement();
            case "ul": return new UnorderedListElement();
            case "ol": return new OrderedListElement();
            case "li": return new ListItemElement();
            case "c": return new ColorElement("");
            case "b": return new BoldElement();
            case "u": return new UnderlineElement();
            case "a": return new HyperlinkElement("");
            case "img": return new ImageElement("");
            case "_": return new SpaceElement();
            case "s": return new StrikethroughElement();
            case "w": return new WordElement(node.value);
            case "t": return new TextElement();
            case "n": return new NewLineElement();
            case "#": return new CommentElement(node.value);
            case "h": return new HeadingElement(node.amount);
            case "style": return new StyleElement();
            case "script": return new ScriptElement();
            //case "tbl": return new elements.Table();
            //case "tbody": return new elements.TableBody();
            //case "tr": return new elements.TableRow();
            //case "th": return new elements.TableHeaderCell();
            //case "td": return new elements.TableDataCell();
            case "hr": return new HorizontalRuleElement();
            case "fragment": return new FragmentElement();
        }

        return new UnknownElement(node.name);
    }

    public doSanityCheck(children: ASTElement[], parents: ASTElement[] = []) {
        children.forEach(child => {
            if (child.layout == ASTElementLayout.NewLine) {
                if (parents.length > 0 && !child.allowedParents.some(type => parents.last() instanceof type)) {
                    //console.log(child);
                    this.reportUnallowedNesting(child, parents.last());
                }
            }

            if (child instanceof TextElement && child.children.length == 0) {
                this.reportEmptyElement(child, parents.last());
            }

            this.doSanityCheck(child.children, parents.concat(child));
        });
    }


    public cloneElement(element: ASTElement, withChildren = false) {
        let newElement = this.getASTElement(element.elementName);
        newElement.arguments = element.arguments;
        newElement.id = element.id;

        if (element instanceof ASTWhitespaceElement)
            (newElement as ASTWhitespaceElement).explicit = element.explicit;

        if (element instanceof ASTElementWithValue)
            (newElement as ASTElementWithValue).value = element.value;

        if (element instanceof ASTElementWithAmount)
            (newElement as ASTElementWithAmount).amount = element.amount;

        if (withChildren) {
            element.children.forEach(node => {
                newElement.children.push(this.cloneElement(node, withChildren));
            });
        }

        return newElement;
    }

    public findElementsWithName(elementName: string, searchElements: ASTElement[], ) {
        return searchElements.reduce((acc: ASTElement[], element) => {
            if (element.elementName == elementName) {
                acc.push(element);
            }
            else {
                this
                    .findElementsWithName(elementName, element.children)
                    .forEach(x => acc.push(x));
            }

            return acc;
        }, [])
    }

    protected isTextType(element: ASTElement) {
        return element instanceof WordElement || element instanceof TextElement || element instanceof SpaceElement;
    }

    public static getCharLength(elements: ASTElement[]) {
        let count = 0;
        elements.forEach(x => count += x.charLength());

        return count;
    }

    protected error(msg: string) {
        return new Error(msg);
    }
}