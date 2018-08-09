import { ASTElementLayout, ASTElementType } from "../ASTElement";
import { ASTElementWithValue } from "../ASTElementWithValue";
export class WordElement extends ASTElementWithValue {
    constructor(value?: string | null) {
        super("w", value, ASTElementLayout.Inline);
        this.type = ASTElementType.Text;
    }
    public charLength() {
        return this.value.length;
    }
}