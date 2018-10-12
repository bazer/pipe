import { NewLineElement } from "../elements/core/NewLineElement";
import { ParserNode, IParserNode } from "../shared/parsernode";
import { ParseResult, ASTBase, ASTMixin } from "./astbase";
import { Parser } from "../reader/parser";
import { ASTElement, ASTElementLayout, ASTElementType } from "../elements/ASTElement";
import { TextElement } from "../elements/core/TextElement";
import { WordElement } from "../elements/core/WordElement";
import { SpaceElement } from "../elements/core/SpaceElement";
import { UnknownElement } from "../elements/core/UnknownElement";
import { ParagraphElement, CommentElement } from "../elements/elements";

export class AST extends ASTBase {

    constructor(extensionElements: (ASTMixin<ASTElement>)[] = []) {
        super(extensionElements);
    }

    public decode(input: string): ASTElement[] {
        if (input == null)
            return [];

        // if (typeof input === "string")
        let parser = new Parser(input);
        let nodes = parser.parse();

        // console.log(input);

        var ast = new AST(this.extensionElements);
        var list = nodes.map(x => this.getASTElements(x));
        list = list.flatMap(x => ast.removeUnknownElements(x));
        list = list.flatMap(x => ast.removeComments(x));
        list = ast.formatText(list);
        list = ast.removeNewLines(list);

        return list;
    }

    protected getASTElements(input: IParserNode): ASTElement {
        if (!this.isASTElementType(input)) {
            throw this.error(`Unknown element '${input.name}'`);
        }

        let element = this.getASTElement(input);
        input.children.forEach(node => {
            element.children.push(this.getASTElements(node));
        });

        return element;
    }

    public getNumChars(elements: ASTElement[]) {
        return elements.reduce((acc, x) => x.charLength() + acc, 0);
    }

    // public getNumChars(parentElement: elements.ASTElement, childIndex: number) {
    //     if (parentElement.children.length < childIndex)
    //         throw new Error(`Element does not have ${childIndex} children`);

    //     let numChars = 0;
    //     for (let i = 0; i < childIndex; i++) {
    //         let element = parentElement.children[i];

    //         numChars += element.charLength();
    //     }

    //     return numChars;
    // }

    public format(elements: ASTElement[]) {

        //elements = this.convertParagraphToNewLines(elements);
        elements = elements.flatMap(x => this.removeUnknownElements(x));
        elements = elements.flatMap(x => this.removeComments(x));
        elements = this.formatText(elements);
        elements = this.removeNewLines(elements);
        elements = this.removeNewLineAtEndFromParagraphs(elements);
        // list = ast.concatAllText(list);
        this.doSanityCheck(elements);
        // console.log(this.errors);

        let results = new ParseResult(elements, this.errors);

        return results;
    }

    public insert(original: ASTElement[], paste: ASTElement[], offset: number) {

        let list = this.insertNewLineAtEndInParagraphs(original);
        list = this.insertIntoElement(list, paste, offset);

        // var ast = new AST();
        // var list = html.flatMap(x => this.getASTElements(x));
        // list = this.reformatTextFromHtml(list);
        // list = this.convertDivToNewLine(list);
        // list = this.convertParagraphToNewLines(list);
        // list = list.flatMap(x => ast.removeUnknownElements(x));
        // list = list.flatMap(x => ast.removeComments(x));
        // list = list.flatMap(x => this.removeStyleAndScript(x));
        // list = ast.removeSpaces(list);
        // list = ast.removeNewLines(list);
        // list = ast.concatAllText(list);
        this.doSanityCheck(list);
        //console.log(errors);

        let results = new ParseResult(list, this.errors);

        return results;
    }

    // protected insertElements(originalElements: ASTElement[], elementsToInsert: ASTElement[], intoElement: elements.ASTElement, charIndex: number): ASTElement[] {
    //     var list = originalElements.reduce((acc: ASTElement[], child) => {
    //         if (child.id === intoElement.id) {
    //             this.insertIntoElement(child, elementsToInsert, charIndex)
    //                 .forEach(x => acc.push(x));
    //         }
    //         else {
    //             let newChild = this.cloneElement(child);
    //             acc.push(newChild);

    //             newChild.children = this.insertElements(child.children, elementsToInsert, intoElement, charIndex);
    //         }

    //         return acc;
    //     }, [])

    //     return list;
    // }


    protected insertIntoElement(originalElements: ASTElement[], elementsToInsert: ASTElement[], charIndex: number) {
        if (originalElements.length == 0) {
            return elementsToInsert.map(x => this.cloneElement(x, true));
        }

        let charCount = 0;
        let inserted = false;
        let list = originalElements.reduce((acc: ASTElement[], element: ASTElement) => {
            if (!inserted && charCount + element.charLength() >= charIndex) {
                let elementsToPush: ASTElement[] = [];

                elementsToInsert.forEach(x => {
                    elementsToPush.push(this.cloneElement(x, true));
                });

                if (element instanceof NewLineElement) {
                    elementsToPush.push(this.cloneElement(element, true));
                }
                else if (elementsToInsert.some(x => x.layout == ASTElementLayout.NewLine)) {
                    if (charCount === charIndex)
                        elementsToPush.push(this.cloneElement(element, true));
                    else
                        acc.push(this.cloneElement(element, true));
                }
                else if (element instanceof TextElement) {
                    let newText = this.splitText(element, charIndex - charCount);
                    this.pushIfNotEmpty(acc, newText[0]);
                    //acc.push(newText[0]);
                    this.pushIfNotEmpty(elementsToPush, newText[1]);
                    // elementsToPush.push(newText[1]);
                }
                else if (element.canHaveChildren && element.type != ASTElementType.Content) {
                    let newElement = this.cloneElement(element);
                    newElement.children = this.insertIntoElement(element.children, elementsToPush, charIndex - charCount);
                    elementsToPush = [newElement];

                    //elementsToPush = this.insertIntoElement(element.children, elementsToPush, charIndex - charCount);
                }
                else {
                    acc.push(this.cloneElement(element, true));
                }

                elementsToPush.forEach(x => {
                    acc.push(x);
                });

                inserted = true;
            }
            else {
                let newElement = this.cloneElement(element, true);
                acc.push(newElement);

                charCount += element.charLength();
            }

            return acc;
        }, [])

        if (!inserted) {
            this.reportUnknownPosition(charIndex);
        }

        return list;
    }


    // protected insertIntoElement(element: elements.ASTElement, elementsToInsert: ASTElement[], charIndex: number) {
    //     let list: ASTElement[] = [];

    //     if (element instanceof elements.Text) {
    //         let newText = this.splitText(element, charIndex);
    //         if (newText[0].children.length > 0)
    //             list.push(newText[0]);

    //         elementsToInsert.forEach(x => {
    //             list.push(this.cloneElement(x, true));
    //         });

    //         if (newText[1].children.length > 0)
    //             list.push(newText[1]);

    //         return list;
    //     }
    //     else {
    //         let charCount = 0;
    //         let inserted = false;
    //         list = element.children.reduce((acc: ASTElement[], child: elements.ASTElement) => {
    //             if (!inserted && charCount + child.charLength() >= charIndex) {
    //                 let elementsToPush: ASTElement[] = [];

    //                 elementsToInsert.forEach(x => {
    //                     elementsToPush.push(this.cloneElement(x, true));
    //                 });

    //                 if (charCount < charIndex) {
    //                     if (child instanceof elements.Text) {
    //                         let newText = this.splitText(child, charIndex - charCount);
    //                         acc.push(newText[0]);
    //                         elementsToPush.push(newText[1]);
    //                     }
    //                     else if (child.canHaveChildren && child.type == elements.ASTElementType.Container) {
    //                         elementsToPush = this.insertIntoElement(child, elementsToPush, charIndex - charCount);
    //                     }
    //                     else {
    //                         acc.push(child);
    //                     }
    //                 } else if (charCount === charIndex) {
    //                     elementsToPush.push(this.cloneElement(child, true));
    //                 }

    //                 elementsToPush.forEach(x => {
    //                     acc.push(x);
    //                 });

    //                 inserted = true;
    //             }
    //             else {
    //                 let newChild = this.cloneElement(child, true);
    //                 acc.push(newChild);

    //                 charCount += child.charLength();
    //             }

    //             return acc;
    //         }, [])

    //         if (!inserted) {
    //             this.reportUnknownPosition(element, charIndex);
    //         }
    //     }

    //     let newElement = this.cloneElement(element);
    //     newElement.children = list;

    //     return [newElement];
    // }

    protected splitText(element: TextElement, charIndex: number) {
        let firstElement = this.cloneElement(element) as TextElement;
        let secondElement = this.cloneElement(element) as TextElement;
        let charCount = 0;

        element.children.forEach(child => {
            if (charCount + child.charLength() < charIndex) {
                this.pushIfNotEmpty(firstElement.children, this.cloneElement(child));
            }
            else if (charCount > charIndex) {
                this.pushIfNotEmpty(secondElement.children, this.cloneElement(child));
            }
            else if (child instanceof WordElement) {
                let words = this.splitWord(child, charIndex - charCount);
                this.pushIfNotEmpty(firstElement.children, words[0]);
                this.pushIfNotEmpty(secondElement.children, words[1]);
            }
            else if (child instanceof SpaceElement) {
                let spaces = this.splitSpace(child, charIndex - charCount);

                this.pushIfNotEmpty(firstElement.children, spaces[0]);
                this.pushIfNotEmpty(secondElement.children, spaces[1]);
            }
            else {
                this.reportUnknownElement(child, element);
            }

            charCount += child.charLength();
        });

        return [firstElement, secondElement];
    }

    protected pushIfNotEmpty(list: ASTElement[], element: ASTElement) {
        if (element.charLength() > 0)
            list.push(element);
    }

    protected splitWord(element: WordElement, charIndex: number) {
        let newElement = this.cloneElement(element) as WordElement;
        newElement.value = element.value.substring(0, charIndex);

        return [newElement, new WordElement(element.value.substring(charIndex))];
    }

    protected splitSpace(element: SpaceElement, charIndex: number) {
        let newElement = this.cloneElement(element) as SpaceElement;
        newElement.amount = charIndex;

        return [newElement, new SpaceElement(element.amount - charIndex)];
    }


    public convertParagraphToNewLines(children: ASTElement[]): ASTElement[] {
        var list = children.reduce((acc: ASTElement[], child) => {
            if (child instanceof ParagraphElement) {
                acc.push(new NewLineElement(2));

                this.convertParagraphToNewLines(child.children).forEach(node => {
                    acc.push(node);
                });

                acc.push(new NewLineElement(2));
            }
            else {

                let newChild = this.cloneElement(child);
                newChild.children = this.convertParagraphToNewLines(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])

        return list;
    }


    public removeUnknownElements(element: ASTElement): ASTElement[] {
        let children: ASTElement[] = [];

        element.children.forEach(child => {
            this.removeUnknownElements(child).forEach(newChild => {
                children.push(newChild);
            });
        });

        if (element instanceof UnknownElement) {
            return children;
        }

        let newElement = this.cloneElement(element);
        newElement.children = children;

        return [newElement];
    }

    public removeComments(element: ASTElement): ASTElement[] {
        let children: ASTElement[] = [];

        element.children.forEach(child => {
            this.removeComments(child).forEach(newChild => {
                children.push(newChild);
            });
        });

        if (element instanceof CommentElement) {
            return children;
        }

        let newElement = this.cloneElement(element);
        newElement.children = children;

        return [newElement];
    }

    public formatText(children: ASTElement[]): ASTElement[] {
        return children.reduce((acc: ASTElement[], child) => {
            if (child instanceof TextElement) {
                this.removeSpaces(child, acc.length > 0 && acc.last() instanceof NewLineElement)
                    .forEach(x => acc.push(x));
            }
            else {
                let newChild = this.cloneElement(child)
                newChild.children = this.formatText(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])
    }

    public mergeText() {

    }

    public removeSpaces(text: TextElement, precededByNewLine = false): ASTElement[] {
        var count = 0;
        var list = text.children.reduce((acc: ASTElement[], child) => {
            if (child instanceof SpaceElement && !child.explicit) {
                count += child.amount;
            }
            else {
                if (count > 0) {
                    if (!precededByNewLine) {
                        acc.push(new SpaceElement());
                    }

                    count = 0;
                }

                precededByNewLine = false;

                let newChild = this.cloneElement(child);
                acc.push(newChild);
            }

            return acc;
        }, [])

        if (count > 0 && !precededByNewLine) {
            list.push(new SpaceElement());
        }

        if (list.length == 0) {
            return [];
        }

        let newText = this.cloneElement(text);
        newText.children = list;

        return [newText];
    }

    // public removeSpaces(children: ASTElement[]): ASTElement[] {
    //     var count = 0;
    //     var list = children.reduce((acc: ASTElement[], child) => {
    //         if (child instanceof elements.Space && !child.explicit) {
    //             count += child.amount;
    //         }
    //         else {
    //             if (count > 0 && !(acc.length > 0 && acc.last() instanceof elements.NewLine)) {
    //                 acc.push(new elements.Space());
    //             }

    //             let newChild = this.cloneElement(child);
    //             newChild.children = this.removeSpaces(child.children);

    //             acc.push(newChild);

    //             count = 0;
    //         }

    //         return acc;
    //     }, [])

    //     if (count > 0 && !(list.length > 0 && list.last() instanceof elements.NewLine)) {
    //         list.push(new elements.Space());
    //     }

    //     return list;
    // }

    public removeNewLines(children: ASTElement[]): ASTElement[] {
        var count = 0;
        var list = children.reduce((acc: ASTElement[], child) => {
            if (child instanceof NewLineElement && !child.explicit) {
                count += child.amount;
            }
            else {
                //Only insert if we are not in the beginning of a block and the element before and after does not create new lines themselves
                if (count > 0 && acc.length > 0 && !(child.layout == ASTElementLayout.NewLine || acc.last().layout == ASTElementLayout.NewLine)) {
                    if (count > 1)
                        acc.push(new NewLineElement(2));
                    else
                        acc.push(new NewLineElement(1));
                }

                count = 0;

                let newChild = this.cloneElement(child);
                newChild.children = this.removeNewLines(child.children);

                acc.push(newChild);
            }

            return acc;
        }, [])

        return list;
    }

    // public concatAllText(children: ASTElement[]): ASTElement[] {
    //     var text = "";
    //     var list = children.reduce((acc: ASTElement[], child) => {
    //         if (child instanceof elements.Text || child instanceof elements.Word) {
    //             if (text.length > 0 && !text.endsWith(" "))
    //                 text += " ";

    //             text += child.value;
    //         }
    //         else if (child instanceof elements.Space && !child.explicit) {
    //             text += " ";
    //         }
    //         else {
    //             if (text.length > 0) {
    //                 acc.push(new elements.Text(text));
    //                 text = "";
    //             }

    //             let newChild = this.cloneElement(child);
    //             newChild.children = this.concatAllText(child.children);

    //             acc.push(newChild);
    //         }

    //         return acc;
    //     }, [])

    //     if (text.length > 0) {
    //         list.push(new elements.Text(text));
    //     }

    //     return list;
    // }


    public removeNewLineAtEndFromParagraphs(list: ASTElement[]) {
        return list.reduce((acc: ASTElement[], element) => {
            let children = element.children;

            if (element instanceof ParagraphElement) {
                if (element.children.length > 0 && element.children.last() instanceof NewLineElement) {
                    children.pop();
                }
            }

            let newElement = this.cloneElement(element, true)
            newElement.children = this.insertNewLineAtEndInParagraphs(children);

            acc.push(newElement);

            return acc;
        }, [])
    }

    public insertNewLineAtEndInParagraphs(list: ASTElement[]) {
        return list.reduce((acc: ASTElement[], element) => {
            let children = element.children;

            if (element instanceof ParagraphElement) {
                if (element.children.length == 0 || !(element.children.last() instanceof NewLineElement)) {
                    children.push(new NewLineElement());
                }
            }

            let newElement = this.cloneElement(element, true)
            newElement.children = this.insertNewLineAtEndInParagraphs(children);

            acc.push(newElement);

            return acc;
        }, [])
    }

    public insertParagraphs(children: ASTElement[]) {
        var count = 0;
        var savedChildren: ASTElement[] = [];

        var list = children.reduce((acc: ASTElement[], child) => {
            if (child instanceof NewLineElement && !child.explicit) {
                count += child.amount;
            }
            else {
                while (count > 0) {
                    if (count == 2 && savedChildren.length > 0) {
                        var paragraph = new ParagraphElement();

                        paragraph.children = savedChildren;
                        acc.push(paragraph);

                        savedChildren = [];

                        count -= 2;
                    }
                    else {
                        //savedChildren.push(new elements.NewLine())
                        count--;
                    }
                }

                if (child.layout == ASTElementLayout.NewLine) {
                    if (savedChildren.length > 0) {
                        //if we only have explicit new lines left, try to stuff them in the last paragraph or return them as is. 
                        //Otherwise create a new paragraph
                        if (savedChildren.every(x => x instanceof NewLineElement)) {
                            if (acc.length > 0 && acc.last() instanceof ParagraphElement) {
                                savedChildren.forEach(x => {
                                    acc.last().children.push(x);
                                });
                            }
                            else {
                                savedChildren.forEach(x => {
                                    acc.push(x);
                                });
                            }
                        }
                        else {
                            var paragraph = new ParagraphElement();
                            paragraph.children = savedChildren;
                            acc.push(paragraph);
                        }
                        savedChildren = [];
                    }

                    acc.push(this.cloneElement(child, true));
                }
                else {
                    savedChildren.push(this.cloneElement(child, true));
                }
            }

            return acc;
        }, [])

        if (savedChildren.length > 0) {
            var paragraph = this.getASTElement(new ParserNode("p"))

            paragraph.children = savedChildren;
            list.push(paragraph);
        }

        return list;
    }
}

export default AST;