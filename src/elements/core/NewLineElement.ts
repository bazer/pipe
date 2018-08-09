import { ASTWhitespaceElement } from "../ASTWhitespaceElement";
export class NewLineElement extends ASTWhitespaceElement {
    constructor(amount = 1, explicit = false) {
        super("n", amount, explicit);
        this.canHaveChildren = false;
    }
    public charLength() {
        return this.amount;
    }
}