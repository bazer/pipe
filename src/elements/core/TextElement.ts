import { PipeElement, ASTElementLayout, ASTElementType, IPipeElement } from "../ASTElement";
import { Token } from "../../shared/Token";


export class TextElement extends PipeElement {
    public create(tokens: Token[]): IPipeElement {
        return new TextElement();
    }
    constructor() {
        super("t", ASTElementLayout.Inline);
        this.handlesChildren = true;
        this.type = ASTElementType.Text;
    }
}