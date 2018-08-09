import { ASTElement, ASTElementLayout } from "../ASTElement";
export class UnknownElement extends ASTElement {
    constructor(name: string) {
        super(name, ASTElementLayout.Inline);
    }
}