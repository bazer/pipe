export interface IParserNodeProperty {
    name: string
    arguments: string[];
}

export class ParserNodeProperty implements IParserNodeProperty {
    name: string;
    arguments: string[];

    constructor (name: string, args: string[] = []) {
        this.name = name;
        this.arguments = args;
    }
}

export interface IParserNode {
    name: string,
    properties: IParserNodeProperty[],
    children: IParserNode[]
    value: string | null;
    amount: number;
    explicit: boolean;
    clone(withChildren?: boolean): IParserNode;
}

export class ParserNode implements IParserNode {
    public properties: IParserNodeProperty[] = [];
    public children: IParserNode[] = [];
    public name: string;
    public value: string | null;
    public amount: number = 1;
    public explicit: boolean;

    constructor(name: string, value?: string, explicit = false) {
        this.name = name.toLowerCase();
        this.value = value || null;
        this.explicit = explicit;
    }

    public clone(withChildren = false) {
        let node = new ParserNode(this.name, this.value, this.explicit);
        node.amount = this.amount;
        node.properties = this.properties;

        if (withChildren)
            node.children = this.children.map(x => x.clone(withChildren));

        return node;
    }
}