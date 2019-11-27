import { PipeElement, ASTElementLayout } from "./ASTElement";
export abstract class ASTElementWithAmount extends PipeElement {
    constructor(name: string, public amount: number, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
    }
}