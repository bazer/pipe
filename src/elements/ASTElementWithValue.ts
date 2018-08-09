import { ASTElement, ASTElementLayout } from "./ASTElement";
export abstract class ASTElementWithValue extends ASTElement {
    public value: string;
    constructor(name: string, value?: string | null, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        super(name, layout);
        this.value = value || "";
    }
    public searchAndReplace(searchFor: string, newValue: string) {
        let i = this.index(searchFor);
        while (i >= 0) {
            this.value = this.replace(i, searchFor.length, newValue);
        }
    }
    public index(searchFor: string) {
        return this.value.toLowerCase().indexOf(searchFor.toLowerCase());
    }
    public replace(index: number, length: number, newValue: string) {
        return this.value.substring(0, index) + newValue + this.value.substring(index + length);
    }
}