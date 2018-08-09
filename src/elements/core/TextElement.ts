import { ASTElement, ASTElementLayout, ASTElementType } from "../ASTElement";
export class TextElement extends ASTElement {
    constructor() {
        super("t", ASTElementLayout.Inline);
        this.handlesChildren = true;
        this.type = ASTElementType.Text;
    }
}