import { PipeElement, ASTElementLayout } from "../ASTElement";
export class UnknownElement extends PipeElement {
    constructor(name: string) {
        super(name, ASTElementLayout.Inline);
    }
}