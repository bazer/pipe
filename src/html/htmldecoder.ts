import { AST } from '../ast/ast';
import { ParseResult, ASTMixin } from '../ast/astbase';
import { HtmlBase } from './htmlbase';
import { ASTElement, ASTElementLayout } from '../elements/ASTElement';
import { SpaceElement } from '../elements/core/SpaceElement';
import { NewLineElement } from '../elements/core/NewLineElement';
import { CommentElement, FragmentElement, StyleElement, ScriptElement, ParagraphElement } from '../elements/elements';


export function ASTHtmlDecoderMixin<T extends ASTMixin<ASTElement>>(mixinClass: T) {
    return class extends mixinClass {
        constructor(...args: any[]) {
            super(...args);
        }

        public static FromHtml(htmlElement: HTMLElement): ASTElement {
            let html = new HtmlDecoder();
            return html.getASTElementFromHTML(htmlElement);
        }
    }
}

// export class ASTHtmlDecoderMixinClass<T extends ASTMixin<elements.ASTElement>> implements ASTHtmlDecoderMixin() {

// }

let allowedTextAlign = ["left", "center", "right", "justify"];


export class HtmlDecoder extends HtmlBase {
    public decodeExtensionElements: (ReturnType<typeof ASTHtmlDecoderMixin>)[] = [];
    //public extensionElements: (ASTMixin<elements.ASTElement>)[] = [];

    constructor(decodeExtensionElements: (ReturnType<typeof ASTHtmlDecoderMixin>)[] = []) {
        super(decodeExtensionElements);

        this.decodeExtensionElements = decodeExtensionElements;
    }

    public decode(html: string | Node[]) {
        if (typeof html === "string") {
            if (html.length == 0)
                return new ParseResult();

            let temp = html;
            html = [document.createElement('div')];
            (html[0] as HTMLElement).innerHTML = temp;
        }
        
        var ast = new AST(this.extensionElements);
        var list = this.getASTElements(html);
        list = this.removeFragments(list);
        list = this.reformatTextFromHtml(list);
        list = this.convertDivToNewLine(list);
        //console.log(list);
        
        // list = ast.convertParagraphToNewLines(list);
        // list = list.flatMap(x => ast.removeUnknownElements(x));
        list = list.flatMap(x => ast.removeComments(x));
        list = list.flatMap(x => this.removeStyleAndScript(x));
        
        // list = ast.removeSpaces(list);
        list = ast.removeNewLines(list);
        // list = ast.concatAllText(list);
        this.doSanityCheck(list);
        // console.log(this.errors);

        let results = new ParseResult(list, this.errors);
        return results;
    }

    public getASTElements(nodes: Node[]): ASTElement[] {
        var list = nodes.reduce((acc: ASTElement[], node) => {

            let element = this.getASTElementFromHTML(node);

            if (element !== null) {
                if (!element.handlesChildren) {
                    this.getASTElements(Array.from(node.childNodes))
                        .forEach(x => element.children.push(x));
                }

                if (node instanceof HTMLElement) {
                    if (element.layout == ASTElementLayout.NewLine) {
                        if (node.style.textAlign && allowedTextAlign.some(x => node.style.textAlign != null && x == node.style.textAlign.toLowerCase())) {
                            element.setAlign(node.style.textAlign.toLowerCase());
                        }
                    }
                }

                acc.push(element);
            }

            return acc;
        }, [])

        return list;
    }


    public reformatTextFromHtml(children: ASTElement[]): ASTElement[] {
        var count = 0;
        var list = children.reduce((acc: ASTElement[], child) => {
            if (child instanceof NewLineElement && !child.explicit) {
                count += child.amount;
            }
            else {
                if (count > 0) {
                    if (child.layout == ASTElementLayout.Inline && acc.length > 0 && acc.last().layout == ASTElementLayout.Inline)
                        acc.push(new SpaceElement());
                    else
                        acc.push(new NewLineElement(count));

                    count = 0;
                }

                let newChild = this.cloneElement(child);
                newChild.children = this.reformatTextFromHtml(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])

        if (count > 0) {
            list.push(new NewLineElement(count));
        }

        return list;
    }

    public convertDivToNewLine(children: ASTElement[]): ASTElement[] {
        var list = children.reduce((acc: ASTElement[], child) => {
            if (child.elementName == "div") {
                if (acc.length > 0 && !(acc.last() instanceof NewLineElement))
                    acc.push(new NewLineElement());

                this.convertDivToNewLine(child.children).forEach(node => {
                    acc.push(node);
                });
            }
            else {

                let newChild = this.cloneElement(child);
                newChild.children = this.convertDivToNewLine(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])

        return list;
    }

    // public removeFragments(children: ASTElement[]): ASTElement[] {
    //     let hasReachedendFragment = false;
    //     return children.reduce((acc: ASTElement[], child) => {
    //         if (child instanceof elements.Fragment) {
    //             if (child.value.toLowerCase() === "startfragment") {
    //                 return [];
    //             }
    //             else if (child.value.toLowerCase() === "endfragment") {
    //                 hasReachedendFragment = true;
    //                 return acc;
    //             }
    //         }

    //         if (!hasReachedendFragment) {
    //             let newChild = this.cloneElement(child)
    //             newChild.children = this.removePasteFragments(child.children);

    //             acc.push(newChild);
    //         }

    //         return acc;
    //     }, [])
    // }

    public removeFragments(children: ASTElement[]): ASTElement[] {
        let hasReachedendFragment = false;
        return children.reduce((acc: ASTElement[], child) => {
            if (child instanceof CommentElement) {
                if (child.value.toLowerCase() === "startfragment") {
                    return [];
                }
                else if (child.value.toLowerCase() === "endfragment") {
                    hasReachedendFragment = true;
                    return acc;
                }
            }
            
            if (child instanceof FragmentElement) {
                this.removeFragments(child.children).forEach(x => {
                    acc.push(x);
                })
            }
            else if (!hasReachedendFragment) {
                let newChild = this.cloneElement(child)
                newChild.children = this.removeFragments(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])
    }

    public removeStyleAndScript(element: ASTElement): ASTElement[] {
        let children: ASTElement[] = [];

        element.children.forEach(child => {
            this.removeStyleAndScript(child).forEach(newChild => {
                children.push(newChild);
            });
        });

        if (element instanceof StyleElement || element instanceof ScriptElement) {
            return [];
        }

        let newElement = this.cloneElement(element);
        newElement.children = children;

        return [newElement];
    }

    public getASTElementFromHTML(html: Node) {
        if (html instanceof HTMLElement && html.dataset.type) {
            let matches = this.decodeExtensionElements.filter(x => x.prototype.getExtensionName() == html.dataset.type);

            if (matches.length > 1)
                throw new Error(`More than one extensionElements match '${html.dataset.type}'`);
            else if (matches.length == 1) {
                return matches[0].FromHtml(html);
            }
        }

        return super.getASTElementFromHTML(html);
    }

    public getCharsSelected(editableElement: HTMLElement, range?: Range) {
        if (range == null)
            range = window.getSelection().getRangeAt(0);

        let preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(editableElement);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        // var start = preSelectionRange.toString().length;
        let start = this.getNumChars(preSelectionRange, true);
        let length = this.getNumChars(range);

        return {
            start: start,
            end: start + length
        };
    }

    public getNumChars(range: Range, insertNewLine = false) {
        //let htmldecoder = new HtmlDecoder();
        let astElements = this.getASTElements([range.cloneContents()]);
        astElements = this.removeFragments(astElements);

        let ast = new AST(this.extensionElements);
        astElements = astElements.flatMap(x => ast.removeUnknownElements(x));
        
        if (insertNewLine 
            && astElements.length > 0 
            && astElements.last() instanceof ParagraphElement 
            && (astElements.last().children.length == 0 || (astElements.last().children.length == 1 && astElements.last().children[0] instanceof NewLineElement))) {
            astElements = ast.insertNewLineAtEndInParagraphs(astElements);
        }

        let length = ast.getNumChars(astElements);

        return length;
    }
}


