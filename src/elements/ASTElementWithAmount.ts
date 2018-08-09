import { ASTElement, ASTElementLayout } from "./ASTElement";
export abstract class ASTElementWithAmount extends ASTElement {
    constructor(name: string, public amount: number, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
    }
}