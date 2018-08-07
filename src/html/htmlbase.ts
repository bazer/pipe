import { ASTBase, ASTMixin } from "../ast/astbase";
import { elements } from "..";
import 'core-js/es6/string';
import { JSDOM } from "jsdom";
const { document } = (new JSDOM(`...`)).window;

// export class ASTHtmlEncoderMixin extends elements.ASTElement
// {
//     public GetHtml(): HTMLElement | Text | Comment {
//         let html = new HtmlEncoder();
//         return html.resolveDomElement(this);
//     }
// }


// LinkedDocumentHtml.FromHtml()
// const Test = Tagged(ASTHtmlMixin);
// let test = new Test();
// test.GetHtml();
// Test.FromHtml()

export abstract class HtmlBase extends ASTBase {
    constructor(extensionElements: (ASTMixin<elements.ASTElement>)[] = []) {
        super(extensionElements);
    }

    public static parseText(text: string | null) {
        let textElement = new elements.Text();
        let savedWord = "";

        textElement.children = (text || "").split("").reduce((acc: elements.ASTElement[], char) => {
            let space = char === " ";
            let explicitSpace = char === '\u00A0';
            let newLine = char === "\n" || char === "\r" || char === "\r\n";

            if (space || explicitSpace || newLine) {
                if (savedWord.length > 0) {
                    acc.push(new elements.Word(savedWord));
                    savedWord = "";
                }

                // if (explicitSpace && text.length == 1)
                //     explicitSpace = false;

                //if (space || explicitSpace)
                acc.push(new elements.Space(1, explicitSpace));
                // else if (newLine)
                //     acc.push(new elements.NewLine());
            }
            else {
                savedWord += char;
            }

            return acc;
        }, []);

        if (savedWord.length > 0) {
            textElement.children.push(new elements.Word(savedWord));
        }

        // if (textElement.children.length == 0)
        //     return null;

        return textElement;
    }

    
    public getASTElementFromHTML(html: Node) {
        // if (html instanceof HTMLElement && html.dataset.type) {
        //     switch (html.dataset.type) {
        //         case "document": {
        //             return elements.LinkedDocument.FromHtml(html);
        //         }
        //         case "form": {
        //             return elements.Form.FromHtml(html);
        //         }
        //     }
        // }

        switch (html.nodeName.toLowerCase()) {
            //case "d": return new elements.Document();
            case "p": return new elements.Paragraph();

            case "ul": return new elements.UnorderedList();
            case "ol": return new elements.OrderedList();
            case "li": return new elements.ListItem();
            //case "c": return new elements.Color();

            case "a": {
                var h = (html as HTMLLinkElement);
                if (h.href.length > 0 && !h.href.startsWith("#"))
                    return new elements.Hyperlink(h.href, h.target);
                else
                    return new elements.Unknown(html.nodeName.toLowerCase());
            }
            case "img": {
                let img = (html as HTMLImageElement);
                let src = img.src;
                
                return new elements.Image(src);
            }
            case "#text": return HtmlBase.parseText(html.nodeValue);
            case "br": return new elements.NewLine(1, true);
            //case "e": return new elements.Extension();
            case "#comment": return new elements.Comment(html.nodeValue);
            case "#document-fragment": return new elements.Fragment();
            case "style": return new elements.Style();
            case "script": return new elements.Script();
            //case "table": return new elements.Table();
            //case "tbody": return new elements.TableBody();
            //case "tr": return new elements.TableRow();
            //case "th": return new elements.TableHeaderCell();
            //case "td": return new elements.TableDataCell();
            case "hr": return new elements.HorizontalRule();
            case "font": {
                let color = (html as HTMLFontElement).color;
                if (color == "" || color == "#000" || color === "#000000")
                    return new elements.Unknown("span");
                else
                    return new elements.Color(color);
            }
            case "h1": return new elements.Heading(1);
            case "h2": return new elements.Heading(2);
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                return new elements.Heading(3);
            case "u":
                return new elements.Underline();
            case "s":
            case "strike":
                return new elements.Strikethrough();
            case "i":
            case "em":
                return new elements.Italic();
            case "b":
            case "strong":
                return new elements.Bold();
        }

        return new elements.Unknown(html.nodeName.toLowerCase());
    }

    public getHtmlText(textElement: elements.Text) {
        var text = "";
        var list = textElement.children.forEach(child => {
            if (child instanceof elements.Word) {
                text += child.value;
            }
            else if (child instanceof elements.Space) {
                if (child.explicit) {
                    for (let i = 0; i < child.amount; i++) {
                        text += "\u00A0";
                    }
                }
                else
                    text += " ";
            }
        })
        
        return document.createTextNode(text);
    }

    protected isDOMElementType(element: elements.ASTElement) {
        return this.resolveDomElement(element) != null;
    }

    public resolveDomElement(element: elements.ASTElement): HTMLElement | Text | Comment {
        switch (element.elementName) {
            case "d": return document.createElement('div');
            case "p": return document.createElement('p');
            case "_": return document.createTextNode('\u00A0');
            case "s": return document.createElement('s');
            //case "w": return document.createTextNode((element as elements.Text).value);
            case "t": return this.getHtmlText(element);
            case "i": return document.createElement('i');
            case "ul": return document.createElement('ul');
            case "ol": return document.createElement('ol');
            case "li": return document.createElement('li');
            case "hr": return document.createElement('hr');
            case "c": {
                let f = document.createElement('font');
                let color = (element as elements.Color).color();
                if (color)
                    f.setAttribute('color', color);
                return f;
            }
            case "b": return document.createElement('b');
            case "u": return document.createElement('u');
            case "a": {
                let a = document.createElement('a');

                var h = (element as elements.Hyperlink);

                let url = h.getUrl();
                if (url && url.length > 0)
                    a.setAttribute('href', url);

                let target = h.getTarget();
                if (target && target.length > 0)
                    a.setAttribute('target', target);

                a.style.cursor = "text";

                return a;
            };

            case "img": {
                let e = document.createElement('img');
                let url = (element as elements.Image).url();
                if (url)
                    e.setAttribute('src', url);

                return e;
            };
            case "n": return document.createElement('br');
            case "e": return document.createElement('span');
            case "#": return document.createComment((element as elements.Comment).value);
            case "h": return document.createElement('h' + (element as elements.Heading).amount);
            case "tbl": return document.createElement('table');
            //case "tbody": return document.createElement('tbody');
            case "tr": return document.createElement('tr');
            case "th": return document.createElement('th');
            case "td": return document.createElement('td');
            //case "document": return (element as elements.LinkedDocument).GetHtml();
            //case "form": return (element as elements.Form).GetHtml();
        }

        if (element instanceof elements.Unknown)
            return document.createElement('span');

        throw this.error(`Unknown element '${element.elementName}'`);
    }
}