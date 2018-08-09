import { ASTElement, ASTElementLayout, ASTElementType } from "./ASTElement";
export abstract class ASTExtensionElement extends ASTElement {
    constructor(name: string, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
        this.type = ASTElementType.Content;
    }
    public abstract getExtensionName(): string;
}