import * as elements from "./elements";
import { ASTElementLayout } from "./elements";
import { ParserNode } from "./parsernode";
import { ParseResult, ASTBase, ASTMixin } from "./astbase";

export class AST extends ASTBase {

    constructor(extensionElements: (ASTMixin<elements.ASTElement>)[] = []) {
        super(extensionElements);
    }

    public getNumChars(elements: elements.ASTElement[]) {
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

    public format(elements: elements.ASTElement[]) {

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

    public insert(original: elements.ASTElement[], paste: elements.ASTElement[], offset: number) {

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

    // protected insertElements(originalElements: elements.ASTElement[], elementsToInsert: elements.ASTElement[], intoElement: elements.ASTElement, charIndex: number): elements.ASTElement[] {
    //     var list = originalElements.reduce((acc: elements.ASTElement[], child) => {
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


    protected insertIntoElement(originalElements: elements.ASTElement[], elementsToInsert: elements.ASTElement[], charIndex: number) {
        if (originalElements.length == 0) {
            return elementsToInsert.map(x => this.cloneElement(x, true));
        }

        let charCount = 0;
        let inserted = false;
        let list = originalElements.reduce((acc: elements.ASTElement[], element: elements.ASTElement) => {
            if (!inserted && charCount + element.charLength() >= charIndex) {
                let elementsToPush: elements.ASTElement[] = [];

                elementsToInsert.forEach(x => {
                    elementsToPush.push(this.cloneElement(x, true));
                });

                if (element instanceof elements.NewLine) {
                    elementsToPush.push(this.cloneElement(element, true));
                }
                else if (elementsToInsert.some(x => x.layout == ASTElementLayout.NewLine)) {
                    if (charCount === charIndex)
                        elementsToPush.push(this.cloneElement(element, true));
                    else
                        acc.push(this.cloneElement(element, true));
                }
                else if (element instanceof elements.Text) {
                    let newText = this.splitText(element, charIndex - charCount);
                    this.pushIfNotEmpty(acc, newText[0]);
                    //acc.push(newText[0]);
                    this.pushIfNotEmpty(elementsToPush, newText[1]);
                    // elementsToPush.push(newText[1]);
                }
                else if (element.canHaveChildren && element.type != elements.ASTElementType.Content) {
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


    // protected insertIntoElement(element: elements.ASTElement, elementsToInsert: elements.ASTElement[], charIndex: number) {
    //     let list: elements.ASTElement[] = [];

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
    //         list = element.children.reduce((acc: elements.ASTElement[], child: elements.ASTElement) => {
    //             if (!inserted && charCount + child.charLength() >= charIndex) {
    //                 let elementsToPush: elements.ASTElement[] = [];

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

    protected splitText(element: elements.Text, charIndex: number) {
        let firstElement = this.cloneElement(element) as elements.Text;
        let secondElement = this.cloneElement(element) as elements.Text;
        let charCount = 0;

        element.children.forEach(child => {
            if (charCount + child.charLength() < charIndex) {
                this.pushIfNotEmpty(firstElement.children, this.cloneElement(child));
            }
            else if (charCount > charIndex) {
                this.pushIfNotEmpty(secondElement.children, this.cloneElement(child));
            }
            else if (child instanceof elements.Word) {
                let words = this.splitWord(child, charIndex - charCount);
                this.pushIfNotEmpty(firstElement.children, words[0]);
                this.pushIfNotEmpty(secondElement.children, words[1]);
            }
            else if (child instanceof elements.Space) {
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

    protected pushIfNotEmpty(list: elements.ASTElement[], element: elements.ASTElement) {
        if (element.charLength() > 0)
            list.push(element);
    }

    protected splitWord(element: elements.Word, charIndex: number) {
        let newElement = this.cloneElement(element) as elements.Word;
        newElement.value = element.value.substring(0, charIndex);

        return [newElement, new elements.Word(element.value.substring(charIndex))];
    }

    protected splitSpace(element: elements.Space, charIndex: number) {
        let newElement = this.cloneElement(element) as elements.Space;
        newElement.amount = charIndex;

        return [newElement, new elements.Space(element.amount - charIndex)];
    }


    public convertParagraphToNewLines(children: elements.ASTElement[]): elements.ASTElement[] {
        var list = children.reduce((acc: elements.ASTElement[], child) => {
            if (child instanceof elements.Paragraph) {
                acc.push(new elements.NewLine(2));

                this.convertParagraphToNewLines(child.children).forEach(node => {
                    acc.push(node);
                });

                acc.push(new elements.NewLine(2));
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


    public removeUnknownElements(element: elements.ASTElement): elements.ASTElement[] {
        let children: elements.ASTElement[] = [];

        element.children.forEach(child => {
            this.removeUnknownElements(child).forEach(newChild => {
                children.push(newChild);
            });
        });

        if (element instanceof elements.Unknown) {
            return children;
        }

        let newElement = this.cloneElement(element);
        newElement.children = children;

        return [newElement];
    }

    public removeComments(element: elements.ASTElement): elements.ASTElement[] {
        let children: elements.ASTElement[] = [];

        element.children.forEach(child => {
            this.removeComments(child).forEach(newChild => {
                children.push(newChild);
            });
        });

        if (element instanceof elements.Comment) {
            return children;
        }

        let newElement = this.cloneElement(element);
        newElement.children = children;

        return [newElement];
    }

    public formatText(children: elements.ASTElement[]): elements.ASTElement[] {
        return children.reduce((acc: elements.ASTElement[], child) => {
            if (child instanceof elements.Text) {
                this.removeSpaces(child, acc.length > 0 && acc.last() instanceof elements.NewLine)
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

    public removeSpaces(text: elements.Text, precededByNewLine = false): elements.ASTElement[] {
        var count = 0;
        var list = text.children.reduce((acc: elements.ASTElement[], child) => {
            if (child instanceof elements.Space && !child.explicit) {
                count += child.amount;
            }
            else {
                if (count > 0) {
                    if (!precededByNewLine) {
                        acc.push(new elements.Space());
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
            list.push(new elements.Space());
        }

        if (list.length == 0) {
            return [];
        }

        let newText = this.cloneElement(text);
        newText.children = list;

        return [newText];
    }

    // public removeSpaces(children: elements.ASTElement[]): elements.ASTElement[] {
    //     var count = 0;
    //     var list = children.reduce((acc: elements.ASTElement[], child) => {
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

    public removeNewLines(children: elements.ASTElement[]): elements.ASTElement[] {
        var count = 0;
        var list = children.reduce((acc: elements.ASTElement[], child) => {
            if (child instanceof elements.NewLine && !child.explicit) {
                count += child.amount;
            }
            else {
                //Only insert if we are not in the beginning of a block and the element before and after does not create new lines themselves
                if (count > 0 && acc.length > 0 && !(child.layout == ASTElementLayout.NewLine || acc.last().layout == ASTElementLayout.NewLine)) {
                    if (count > 1)
                        acc.push(new elements.NewLine(2));
                    else
                        acc.push(new elements.NewLine(1));
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

    // public concatAllText(children: elements.ASTElement[]): elements.ASTElement[] {
    //     var text = "";
    //     var list = children.reduce((acc: elements.ASTElement[], child) => {
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


    public removeNewLineAtEndFromParagraphs(list: elements.ASTElement[]) {
        return list.reduce((acc: elements.ASTElement[], element) => {
            let children = element.children;

            if (element instanceof elements.Paragraph) {
                if (element.children.length > 0 && element.children.last() instanceof elements.NewLine) {
                    children.pop();
                }
            }

            let newElement = this.cloneElement(element, true)
            newElement.children = this.insertNewLineAtEndInParagraphs(children);

            acc.push(newElement);

            return acc;
        }, [])
    }

    public insertNewLineAtEndInParagraphs(list: elements.ASTElement[]) {
        return list.reduce((acc: elements.ASTElement[], element) => {
            let children = element.children;

            if (element instanceof elements.Paragraph) {
                if (element.children.length == 0 || !(element.children.last() instanceof elements.NewLine)) {
                    children.push(new elements.NewLine());
                }
            }

            let newElement = this.cloneElement(element, true)
            newElement.children = this.insertNewLineAtEndInParagraphs(children);

            acc.push(newElement);

            return acc;
        }, [])
    }

    public insertParagraphs(children: elements.ASTElement[]) {
        var count = 0;
        var savedChildren: elements.ASTElement[] = [];

        var list = children.reduce((acc: elements.ASTElement[], child) => {
            if (child instanceof elements.NewLine && !child.explicit) {
                count += child.amount;
            }
            else {
                while (count > 0) {
                    if (count == 2 && savedChildren.length > 0) {
                        var paragraph = new elements.Paragraph();

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
                        if (savedChildren.every(x => x instanceof elements.NewLine)) {
                            if (acc.length > 0 && acc.last() instanceof elements.Paragraph) {
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
                            var paragraph = new elements.Paragraph();
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