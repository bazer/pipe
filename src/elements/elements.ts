import AST from "../ast/ast";

export enum ASTElementLayout {
    Inline,
    NewLine
}

export enum ASTElementType {
    Text,
    TextModifier,
    Container,
    Content
}

export interface IASTArgument {
    name: string,
    value: string
}

export interface Dictionary<T> {
    [K: string]: T;
}

//export type AlignValue = "left" | "center" | "right" | "justify";

export interface IASTElement {
    arguments: Dictionary<string>;
    children: ASTElement[];
    elementName: string;
    layout: ASTElementLayout;
    allowedParents: (typeof ASTElement)[];
    id: number;
    handlesChildren: boolean;
    canHaveChildren: boolean;
    type: ASTElementType;
}

class Utils {
    static elementIdCounter: number = 0;

    public static getNewId() {
        return this.elementIdCounter++;
    }
}

export abstract class ASTElement implements IASTElement {
    public arguments: Dictionary<string> = {};
    public children: ASTElement[] = [];
    public elementName: string;
    public layout: ASTElementLayout;
    public allowedParents: (typeof ASTElement)[] = [];
    public id: number;
    public handlesChildren = false;
    public canHaveChildren = true;
    public type: ASTElementType = ASTElementType.Container;
    
    constructor(name: string, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        this.elementName = name.toLowerCase();
        this.layout = layout;
        this.id = Utils.getNewId(); // this.uuidv4();
    }

    public getArgument(name: string): string | null {
        let value = this.arguments[name];

        if (value && value.length > 0)
            return value;
        
        return null;
    }

    public setArgument(name: string, value: string) {
        //if (this.arguments[name])
            this.arguments[name] = value;
        // else
        //     this.arguments.push({
        //         name: name,
        //         value: value
        //     });
    }

    public getAlign() {
        return this.getArgument("align");
    }

    public setAlign(value: string) {
        return this.setArgument("align", value);
    }


    public charLength() {
        let charLength = AST.getCharLength(this.children);

        // if (this.layout == ASTElementLayout.NewLine)
        //     charLength += 1;

        return charLength;
    }

    // protected uuidv4() {
    //     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    //       var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    //       return v.toString(16);
    //     });
    //   }
}

export abstract class ASTElementWithValue extends ASTElement {
    constructor(name: string, public value = "", layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
    }

    public searchAndReplace(searchFor: string, newValue: string){
        let i = this.index(searchFor);

        while(i >= 0) {
            this.value = this.replace(i, searchFor.length, newValue);
        }
    }

    public index(searchFor: string) {
        return this.value.toLowerCase().indexOf(searchFor.toLowerCase());
    }

    public replace(index: number, length: number, newValue: string) {
        return this.value.substring(0, index) + newValue + this.value.substring(index + length);
    }
}

export abstract class ASTElementWithAmount extends ASTElement {
    constructor(name: string, public amount: number, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
    }
}

export abstract class ASTWhitespaceElement extends ASTElementWithAmount {
    constructor(name: string, amount: number, public explicit: boolean) {
        super(name, amount, ASTElementLayout.Inline);
        this.type = ASTElementType.Text;
    }
}

export abstract class ASTExtensionElement extends ASTElement {
    constructor(name: string, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
        this.type = ASTElementType.Content;
    }

    public abstract getExtensionName(): string;

    // public static getExtensionName() {
    //     throw new Error("Extension name not implemented");
    // }
}

export class Unknown extends ASTElement {
    constructor(name: string) {
        super(name, ASTElementLayout.Inline);
    }
}

export class Fragment extends ASTElementWithValue {
    constructor(value?: string) {
        super("fragment", value);
    }
}

export class Comment extends ASTElementWithValue {
    constructor(value?: string) {
        super("#", value);
    }
}

export class Style extends ASTElement {
    constructor() {
        super("style");
    }
}

export class Script extends ASTElement {
    constructor() {
        super("script");
    }
}

export class Document extends ASTElement {
    // version: string;

    constructor() {
        super("d");
    }
}

export class Paragraph extends ASTElement {
    constructor() {
        super("p");
    }

    // public charLength() {
    //     return super.charLength() + 1;
    // } 
}

export class Color extends ASTElement {
    public color() {
        return this.getArgument("color");
    }

    constructor(color: string) {
        super("c", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;

        this.setArgument("color", color);
    }
}
export class Italic extends ASTElement {
    constructor() {
        super("i", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class Underline extends ASTElement {
    constructor() {
        super("u", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class Strikethrough extends ASTElement {
    constructor() {
        super("s", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class UnorderedList extends ASTElement {
    constructor() {
        super("ul");

        this.allowedParents = [ListItem];
    }
}
export class OrderedList extends ASTElement {
    constructor() {
        super("ol");

        this.allowedParents = [ListItem];
    }
}
export class ListItem extends ASTElement {
    constructor() {
        super("li");

        this.allowedParents = [UnorderedList, OrderedList];
    }
}

export class Bold extends ASTElement {
    constructor() {
        super("b", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class Image extends ASTElement {
    public url() {
        let hash = this.getArgument("hash");
        if(hash != null) {
            return "/api/publik/Img?h="+hash;
        }
        return this.getArgument("url");
    }

    constructor(url?: string, hash?: string) {
        super("img", ASTElementLayout.Inline);
        this.type = ASTElementType.Content;
        this.canHaveChildren = false;
        if(url)
            this.setArgument("url", url);
        if(hash)
            this.setArgument("hash", hash);
    }
}

export class NewLine extends ASTWhitespaceElement {
    constructor(amount = 1, explicit = false) {
        super("n", amount, explicit);
        this.canHaveChildren = false;
    }

    public charLength() {
        return this.amount;
    } 
}

export class Space extends ASTWhitespaceElement {
    constructor(amount = 1, explicit = false) {
        super("_", amount, explicit);
        this.canHaveChildren = false;
    }

    public charLength() {
        return this.amount;
    } 
}

export class Hyperlink extends ASTElement {
    public getUrl() {
        return this.getArgument("url");
    }

    public setUrl(url: string) {
        return this.setArgument("url", url);
    }

    public getTarget() {
        return this.getArgument("target");
    }

    public setTarget(target: string) {
        return this.setArgument("target", target);
    }

    constructor(url: string, target?: string) {
        super("a", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;

        this.setUrl(url);

        if (target)
            this.setTarget(target);
    }
}

export class Text extends ASTElement {
    constructor() {
        super("t", ASTElementLayout.Inline);
        this.handlesChildren = true;
        this.type = ASTElementType.Text;
    }

    
}
export class Word extends ASTElementWithValue {
    constructor(value?: string) {
        super("w", value, ASTElementLayout.Inline);
        this.type = ASTElementType.Text;
    }

    public charLength() {
        return this.value.length;
    } 
}

export class Heading extends ASTElementWithAmount {
    constructor(size: number) {
        super("h", size);
    }
}

export class HorizontalRule extends ASTElement {
    constructor() {
        super("hr");
        this.canHaveChildren = false;
    }
}