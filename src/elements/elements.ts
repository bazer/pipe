import { PipeElement, ASTElementLayout, ASTElementType, IPipeElement } from "./ASTElement";
import { ASTElementWithValue } from "./ASTElementWithValue";
import { ASTElementWithAmount } from "./ASTElementWithAmount";
import { IParserNode } from "../shared/parsernode";


// export class StandardElement extends ASTElement {
//     public create(): IASTElement {
        
//     }
//     constructor(name: string, layout?: ASTElementLayout) {
//         super(name, layout);
//     }
// }

export class FragmentElement extends ASTElementWithValue {
    public create(node: IParserNode): IPipeElement {
        return new FragmentElement(node.value);
    }
    constructor(value?: string | null) {
        super("fragment", value);
    }
}

export class CommentElement extends ASTElementWithValue {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor(value?: string | null) {
        super("#", value);
    }
}

export class StyleElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("style");
    }
}

export class ScriptElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("script");
    }
}

export class DocumentElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    // version: string;

    constructor() {
        super("d");
    }
}

export class ParagraphElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("p");
    }

    // public charLength() {
    //     return super.charLength() + 1;
    // } 
}

export class ColorElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    public color() {
        return this.getArgument("color");
    }

    constructor(color: string) {
        super("c", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;

        this.setArgument("color", color);
    }
}
export class ItalicElement extends PipeElement {
    public create(): IPipeElement {
        return new ItalicElement();
    }
    constructor() {
        super("i", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class UnderlineElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("u", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class StrikethroughElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("s", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class UnorderedListElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("ul");

        this.allowedParents = [ListItemElement];
    }
}
export class OrderedListElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("ol");

        this.allowedParents = [ListItemElement];
    }
}
export class ListItemElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("li");

        this.allowedParents = [UnorderedListElement, OrderedListElement];
    }
}

export class BoldElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("b", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class ImageElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    public url() {
        return this.getArgument("url");
    }

    constructor(url?: string) {
        super("img", ASTElementLayout.Inline);
        this.type = ASTElementType.Content;
        this.canHaveChildren = false;

        if(url)
            this.setArgument("url", url);
    }
}

export class HyperlinkElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
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

export class HeadingElement extends ASTElementWithAmount {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor(size: number) {
        super("h", size);
    }
}

export class HorizontalRuleElement extends PipeElement {
    public create(): IPipeElement {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("hr");
        this.canHaveChildren = false;
    }
}