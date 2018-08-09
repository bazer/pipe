import { ASTWhitespaceElement } from "../ASTWhitespaceElement";
export class SpaceElement extends ASTWhitespaceElement {
    constructor(amount = 1, explicit = false) {
        super("_", amount, explicit);
        this.canHaveChildren = false;
    }
    public charLength() {
        return this.amount;
    }
}