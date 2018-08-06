import { elements } from "..";
import { IParserNode, ParserNode } from "../shared/parsernode";
import { ASTElementLayout, Dictionary } from "../elements/elements";

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
    constructor(public node: Node, public element: elements.ASTElement) {
    }
}


export class ParseResult {
    // public errors: ParseError[];
    // public ast: elements.ASTElement[];

    constructor(public ast: elements.ASTElement[] = [], public errors: ParseError[] = []) {
    }
}


export type ASTMixin<T> = new (...args: any[]) => T;

function ASTElementMixin<T extends ASTMixin<{}>>(mixinClass: T) {
    return class extends mixinClass {
        _tag: string;
        constructor(...args: any[]) {
            super(...args);
            this._tag = "";
        }
    }
}

export abstract class ASTBase {

    errors: ParseError[] = []
    insertedElements: elements.ASTElement[] = [];
    extensionElements: (ASTMixin<elements.ASTElement>)[] = [];

    constructor(extensionElements: (ASTMixin<elements.ASTElement>)[] = []) {
        this.extensionElements = extensionElements;
    }

    protected reportUnallowedNesting(child: elements.ASTElement, parent: elements.ASTElement) {
        this.errors.push(new ParseError(ParseErrorType.UnallowedNesting, `Element of type '${child.elementName}' inside '${parent.elementName}'`));
    }

    protected reportUnknownElement(element: elements.ASTElement, parent: elements.ASTElement) {
        this.errors.push(new ParseError(ParseErrorType.UnknownElement, `Unknown element of type '${element.elementName}' inside '${parent.elementName}'`));
    }

    protected reportEmptyElement(element: elements.ASTElement, parent?: elements.ASTElement) {
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

    protected getASTElement(node: IParserNode | string): elements.ASTElement {
        if (typeof node === "string") {
            node = new ParserNode(node);
        }

        var element = this.resolveASTElement(node);

        node.properties.forEach(x => {
            element.arguments[x.name] = x.arguments[0];
        });


        if (element instanceof elements.ASTWhitespaceElement)
            element.explicit = node.explicit;

        if (element instanceof elements.ASTElementWithValue)
            element.value = node.value;

        if (element instanceof elements.ASTElementWithAmount)
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
            case "d": return new elements.Document();
            case "p": return new elements.Paragraph();
            case "i": return new elements.Italic();
            case "ul": return new elements.UnorderedList();
            case "ol": return new elements.OrderedList();
            case "li": return new elements.ListItem();
            case "c": return new elements.Color("");
            case "b": return new elements.Bold();
            case "u": return new elements.Underline();
            case "a": return new elements.Hyperlink("");
            case "img": return new elements.Image("");
            case "_": return new elements.Space();
            case "s": return new elements.Strikethrough();
            case "w": return new elements.Word(node.value);
            case "t": return new elements.Text();
            case "n": return new elements.NewLine();
            case "#": return new elements.Comment(node.value);
            case "h": return new elements.Heading(node.amount);
            case "style": return new elements.Style();
            case "script": return new elements.Script();
            //case "tbl": return new elements.Table();
            //case "tbody": return new elements.TableBody();
            //case "tr": return new elements.TableRow();
            //case "th": return new elements.TableHeaderCell();
            //case "td": return new elements.TableDataCell();
            case "hr": return new elements.HorizontalRule();
            case "fragment": return new elements.Fragment();
        }

        return new elements.Unknown(node.name);
    }

    public doSanityCheck(children: elements.ASTElement[], parents: elements.ASTElement[] = []) {
        children.forEach(child => {
            if (child.layout == ASTElementLayout.NewLine) {
                if (parents.length > 0 && !child.allowedParents.some(type => parents.last() instanceof type)) {
                    //console.log(child);
                    this.reportUnallowedNesting(child, parents.last());
                }
            }

            if (child instanceof elements.Text && child.children.length == 0) {
                this.reportEmptyElement(child, parents.last());
            }

            this.doSanityCheck(child.children, parents.concat(child));
        });
    }


    public cloneElement(element: elements.ASTElement, withChildren = false) {
        let newElement = this.getASTElement(element.elementName);
        newElement.arguments = element.arguments;
        newElement.id = element.id;

        if (element instanceof elements.ASTWhitespaceElement)
            (newElement as elements.ASTWhitespaceElement).explicit = element.explicit;

        if (element instanceof elements.ASTElementWithValue)
            (newElement as elements.ASTElementWithValue).value = element.value;

        if (element instanceof elements.ASTElementWithAmount)
            (newElement as elements.ASTElementWithAmount).amount = element.amount;

        if (withChildren) {
            element.children.forEach(node => {
                newElement.children.push(this.cloneElement(node, withChildren));
            });
        }

        return newElement;
    }

    public findElementsWithName(elementName: string, searchElements: elements.ASTElement[], ) {
        return searchElements.reduce((acc: elements.ASTElement[], element) => {
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

    protected isTextType(element: elements.ASTElement) {
        return element instanceof elements.Word || element instanceof elements.Text || element instanceof elements.Space;
    }

    public static getCharLength(elements: elements.ASTElement[]) {
        let count = 0;
        elements.forEach(x => count += x.charLength());

        return count;
    }

    protected error(msg) {
        throw new Error(msg);
    }
}