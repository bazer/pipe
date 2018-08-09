import { ASTElementLayout, ASTElementType } from "./ASTElement";
import { ASTElementWithAmount } from "./ASTElementWithAmount";
export abstract class ASTWhitespaceElement extends ASTElementWithAmount {
    constructor(name: string, amount: number, public explicit: boolean) {
        super(name, amount, ASTElementLayout.Inline);
        this.type = ASTElementType.Text;
    }
}