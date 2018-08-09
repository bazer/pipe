import { ASTElement, ASTElementLayout, ASTElementType } from "./ASTElement";
import { ASTElementWithValue } from "./ASTElementWithValue";
import { ASTElementWithAmount } from "./ASTElementWithAmount";


export class Fragment extends ASTElementWithValue {
    constructor(value?: string) {
        super("fragment", value);
    }
}

export class Comment extends ASTElementWithValue {
    constructor(value?: string | null) {
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