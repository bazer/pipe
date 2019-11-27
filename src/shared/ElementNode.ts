import { Token } from "./Token";

export interface IElementNode {
    name?: string,
    size?: IElementNodeSize,
    properties: IElementNodeProperty[],
    hasBrackets: boolean,
    isMultiLine: boolean,
    declarationTokens: Token[],
    childTokens: Token[]
}

export interface IElementNodeSize {
    value?: number,
    modifierBeforeSize: boolean,
    modifier?: SizeModifierType,
}

export enum SizeModifierType {
    Plus,
    Minus
}

export interface IElementNodeProperty {
    name: string,
    arguments: string[]
}


export class ElementNodeProperty implements IElementNodeProperty {
    name: string;
    arguments: string[];

    constructor (name: string, args: string[] = []) {
        this.name = name;
        this.arguments = args;
    }
}

export class ElementNode implements IElementNode {
    public isMultiLine: boolean = false;
    public childTokens: Token[] = [];
    public size?: IElementNodeSize;
    public hasBrackets: boolean = false;
    public declarationTokens: Token[] = [];
    public properties: IElementNodeProperty[] = [];
    // public children: IParserNode[] = [];
    public name?: string;

    constructor() {

    }

    // constructor(name: string, value?: string | null) {
    //     this.name = name.toLowerCase();
    //     this.value = value || null;
    // }
}