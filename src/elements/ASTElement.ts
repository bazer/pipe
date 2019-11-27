import { AST } from "../ast/ast";
import { Utils } from "./Utils";
import { Token } from "../shared/Token";


export enum ASTElementLayout {
    Inline,
    NewLine
}

export enum ASTElementType {
    Text,
    TextModifier,
    Container,
    Content
}

export interface IASTArgument {
    name: string,
    value: string
}

export interface Dictionary<T> {
    [K: string]: T;
}

//export type AlignValue = "left" | "center" | "right" | "justify";

// function activator<T extends IASTElement>(type: { new(): T ;} ): T {
//     return new type();
// }

// var classA: ClassA = activator(ClassA);

export interface IPipeElement {
    arguments: Dictionary<string>;
    children: PipeElement[];
    elementName: string;
    layout: ASTElementLayout;
    allowedParents: (typeof PipeElement)[];
    id: number;
    handlesChildren: boolean;
    canHaveChildren: boolean;
    type: ASTElementType;
    //create: (node: IParserNode) => IASTElement;
    create(tokens: Token[]): IPipeElement;
}

export abstract class PipeElement implements IPipeElement {
    public arguments: Dictionary<string> = {};
    public children: PipeElement[] = [];
    public elementName: string;
    public layout: ASTElementLayout;
    public allowedParents: (typeof PipeElement)[] = [];
    public id: number;
    public handlesChildren = false;
    public canHaveChildren = true;
    public type: ASTElementType = ASTElementType.Container;

    constructor(name: string, layout: ASTElementLayout = ASTElementLayout.NewLine) {
        this.elementName = name.toLowerCase();
        this.layout = layout;
        this.id = Utils.getNewId(); // this.uuidv4();
    }

    public abstract create(tokens: Token[]): IPipeElement;

    // protected parseChildren(tokens: Token[]): IPipeElement[] {

    // }

    public getArgument(name: string): string | null {
        let value = this.arguments[name];
        if (value && value.length > 0)
            return value;
        return null;
    }
    public setArgument(name: string, value: string) {
        //if (this.arguments[name])
        this.arguments[name] = value;
        // else
        //     this.arguments.push({
        //         name: name,
        //         value: value
        //     });
    }
    public getAlign() {
        return this.getArgument("align");
    }
    public setAlign(value: string) {
        return this.setArgument("align", value);
    }
    public charLength() {
        let charLength = AST.getCharLength(this.children);
        // if (this.layout == ASTElementLayout.NewLine)
        //     charLength += 1;
        return charLength;
    }
}