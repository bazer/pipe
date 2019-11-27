import { ASTBase, ASTMixin } from "../ast/astbase";
import { elements } from "..";
import 'core-js/es6/string';
import { JSDOM } from "jsdom";
import { PipeElement } from "../elements/ASTElement";
import { TextElement } from "../elements/core/TextElement";
import { WordElement } from "../elements/core/WordElement";
import { SpaceElement } from "../elements/core/SpaceElement";
import { UnknownElement } from "../elements/core/UnknownElement";
import { NewLineElement } from "../elements/core/NewLineElement";
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
    constructor(extensionElements: (ASTMixin<PipeElement>)[] = []) {
        super(extensionElements);
    }

    public static parseText(text: string | null) {
        let textElement = new TextElement();
        let savedWord = "";

        textElement.children = (text || "").split("").reduce((acc: PipeElement[], char) => {
            let space = char === " ";
            let explicitSpace = char === '\u00A0';
            let newLine = char === "\n" || char === "\r" || char === "\r\n";

            if (space || explicitSpace || newLine) {
                if (savedWord.length > 0) {
                    acc.push(new WordElement(savedWord));
                    savedWord = "";
                }

                // if (explicitSpace && text.length == 1)
                //     explicitSpace = false;

                //if (space || explicitSpace)
                acc.push(new SpaceElement(1, explicitSpace));
                // else if (newLine)
                //     acc.push(new elements.NewLine());
            }
            else {
                savedWord += char;
            }

            return acc;
        }, []);

        if (savedWord.length > 0) {
            textElement.children.push(new WordElement(savedWord));
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
            case "p": return new elements.ParagraphElement();

            case "ul": return new elements.UnorderedListElement();
            case "ol": return new elements.OrderedListElement();
            case "li": return new elements.ListItemElement();
            //case "c": return new elements.Color();

            case "a": {
                var h = (html as HTMLLinkElement);
                if (h.href.length > 0 && !h.href.startsWith("#"))
                    return new elements.HyperlinkElement(h.href, h.target);
                else
                    return new UnknownElement(html.nodeName.toLowerCase());
            }
            case "img": {
                let img = (html as HTMLImageElement);
                let src = img.src;
                
                return new elements.ImageElement(src);
            }
            case "#text": return HtmlBase.parseText(html.nodeValue);
            case "br": return new NewLineElement(1, true);
            //case "e": return new elements.Extension();
            case "#comment": return new elements.CommentElement(html.nodeValue);
            case "#document-fragment": return new elements.FragmentElement();
            case "style": return new elements.StyleElement();
            case "script": return new elements.ScriptElement();
            //case "table": return new elements.Table();
            //case "tbody": return new elements.TableBody();
            //case "tr": return new elements.TableRow();
            //case "th": return new elements.TableHeaderCell();
            //case "td": return new elements.TableDataCell();
            case "hr": return new elements.HorizontalRuleElement();
            case "font": {
                let color = (html as HTMLFontElement).color;
                if (color == "" || color == "#000" || color === "#000000")
                    return new UnknownElement("span");
                else
                    return new elements.ColorElement(color);
            }
            case "h1": return new elements.HeadingElement(1);
            case "h2": return new elements.HeadingElement(2);
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                return new elements.HeadingElement(3);
            case "u":
                return new elements.UnderlineElement();
            case "s":
            case "strike":
                return new elements.StrikethroughElement();
            case "i":
            case "em":
                return new elements.ItalicElement();
            case "b":
            case "strong":
                return new elements.BoldElement();
        }

        return new UnknownElement(html.nodeName.toLowerCase());
    }

    public getHtmlText(textElement: TextElement) {
        var text = "";
        textElement.children.forEach(child => {
            if (child instanceof WordElement) {
                text += child.value;
            }
            else if (child instanceof SpaceElement) {
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

    protected isDOMElementType(element: PipeElement) {
        return this.resolveDomElement(element) != null;
    }

    public resolveDomElement(element: PipeElement): HTMLElement | Text | Comment {
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
                let color = (element as elements.ColorElement).color();
                if (color)
                    f.setAttribute('color', color);
                return f;
            }
            case "b": return document.createElement('b');
            case "u": return document.createElement('u');
            case "a": {
                let a = document.createElement('a');

                var h = (element as elements.HyperlinkElement);

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
                let url = (element as elements.ImageElement).url();
                if (url)
                    e.setAttribute('src', url);

                return e;
            };
            case "n": return document.createElement('br');
            case "e": return document.createElement('span');
            case "#": return document.createComment((element as elements.CommentElement).value);
            case "h": return document.createElement('h' + (element as elements.HeadingElement).amount);
            case "tbl": return document.createElement('table');
            //case "tbody": return document.createElement('tbody');
            case "tr": return document.createElement('tr');
            case "th": return document.createElement('th');
            case "td": return document.createElement('td');
            //case "document": return (element as elements.LinkedDocument).GetHtml();
            //case "form": return (element as elements.Form).GetHtml();
        }

        if (element instanceof UnknownElement)
            return document.createElement('span');

        throw this.error(`Unknown element '${element.elementName}'`);
    }
}