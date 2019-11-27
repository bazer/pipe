import { ASTMixin } from '../ast/astbase';
import { AST } from '../ast/ast';
import { HtmlBase } from './htmlbase';
import { JSDOM } from "jsdom";
import { PipeElement, ASTElementLayout, IPipeElement } from '../elements/ASTElement';
import { DocumentElement } from '../elements/elements';
import { IParserNode } from '../shared/parsernode';
const { document } = (new JSDOM(`...`)).window;

export function ASTHtmlEncoderMixin<T extends ASTMixin<PipeElement>>(mixinClass: T) {
    return class extends mixinClass {
        public create(node: IParserNode): IPipeElement {
            throw new Error("Method not implemented.");
        }
        constructor(...args: any[]) {
            super(...args);
        }

        public GetHtml(): HTMLElement | Text | Comment {
            let html = new HtmlEncoder();
            return html.resolveDomElement(this);
        }
    }
}

export class HtmlEncoder extends HtmlBase {
    public encodeExtensionElements: (ReturnType<typeof ASTHtmlEncoderMixin>)[] = [];

    constructor(encodeExtensionElements: (ReturnType<typeof ASTHtmlEncoderMixin>)[] = []) {
        super(encodeExtensionElements);
        
        this.encodeExtensionElements = encodeExtensionElements;
    }

    public getHtmlString(nodes: Node[]) {
        let htmlElement = document.createElement('div');
        nodes.forEach(node => {
            htmlElement.appendChild(node);
        });

        return htmlElement.innerHTML;
    }

    public encode(astElements: PipeElement[], insertParagraphs = false): Node[] {
        let ast = new AST(this.extensionElements);

        if (insertParagraphs)
            astElements = ast.insertParagraphs(astElements);

        astElements = ast.insertNewLineAtEndInParagraphs(astElements)
        //console.log(elementList);

        let domElements = this.getDomElements(astElements);

        return domElements;
    }

    public getDomElements(children: PipeElement[]): Node[] {
        var list = children.reduce((acc: Node[], element) => {
            // if (!this.isDOMElementType(element)) {
            //     this.error(`Unknown element '${element.name}'`);
            // }

            if (element instanceof DocumentElement) {
                this.getDomElements(element.children).forEach(newChild => {
                    acc.push(newChild);
                });
            }
            else {
                var dom = this.resolveDomElement(element);

                if (element.layout == ASTElementLayout.NewLine) {
                    let align = element.getAlign();
                    if (align != null) {
                        (dom as HTMLElement).style.textAlign = align;
                    }
                }

                acc.push(dom);

                //if (!(element instanceof elements.Text))
                if (!element.handlesChildren)
                    this.getDomElements(element.children).forEach(x => dom.appendChild(x));
            }

            return acc;
        }, [])

        return list;
    }

    public resolveDomElement(element: PipeElement): HTMLElement | Text | Comment {
        let matches = this.encodeExtensionElements.filter(x => {
            //let result = x.call(this);
            //console.log(x.prototype);
            return x.prototype.getExtensionName() == element.elementName
        });

        if (matches.length > 1)
            throw new Error(`More than one extensionElements match '${element.elementName}'`);
        else if (matches.length == 1) {
            //let mixin = new matches[0](element);

            let mixin = this.cloneElement(element, true) as any;
            //this.cloneElement()
            return mixin.GetHtml();
        }

        return super.resolveDomElement(element);
    }
}


