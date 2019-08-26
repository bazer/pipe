import { ASTElement, ASTElementLayout, ASTElementType } from "./ASTElement";
import { ASTElementWithValue } from "./ASTElementWithValue";
import { ASTElementWithAmount } from "./ASTElementWithAmount";


export class FragmentElement extends ASTElementWithValue {
    constructor(value?: string) {
        super("fragment", value);
    }
}

export class CommentElement extends ASTElementWithValue {
    constructor(value?: string | null) {
        super("#", value);
    }
}

export class StyleElement extends ASTElement {
    constructor() {
        super("style");
    }
}

export class ScriptElement extends ASTElement {
    constructor() {
        super("script");
    }
}

export class DocumentElement extends ASTElement {
    // version: string;

    constructor() {
        super("d");
    }
}

export class ParagraphElement extends ASTElement {
    constructor() {
        super("p");
    }

    // public charLength() {
    //     return super.charLength() + 1;
    // } 
}

export class ColorElement extends ASTElement {
    public color() {
        return this.getArgument("color");
    }

    constructor(color: string) {
        super("c", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;

        this.setArgument("color", color);
    }
}
export class ItalicElement extends ASTElement {
    constructor() {
        super("i", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class UnderlineElement extends ASTElement {
    constructor() {
        super("u", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class StrikethroughElement extends ASTElement {
    constructor() {
        super("s", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class UnorderedListElement extends ASTElement {
    constructor() {
        super("ul");

        this.allowedParents = [ListItemElement];
    }
}
export class OrderedListElement extends ASTElement {
    constructor() {
        super("ol");

        this.allowedParents = [ListItemElement];
    }
}
export class ListItemElement extends ASTElement {
    constructor() {
        super("li");

        this.allowedParents = [UnorderedListElement, OrderedListElement];
    }
}

export class BoldElement extends ASTElement {
    constructor() {
        super("b", ASTElementLayout.Inline);
        this.type = ASTElementType.TextModifier;
    }
}
export class ImageElement extends ASTElement {
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

export class HyperlinkElement extends ASTElement {
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
    constructor(size: number) {
        super("h", size);
    }
}

export class HorizontalRuleElement extends ASTElement {
    constructor() {
        super("hr");
        this.canHaveChildren = false;
    }
}