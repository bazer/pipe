import { PipeElement, ASTElementLayout, ASTElementType } from "./ASTElement";
export abstract class ASTExtensionElement extends PipeElement {
    constructor(name: string, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
        this.type = ASTElementType.Content;
    }
    public abstract getExtensionName(): string;
}