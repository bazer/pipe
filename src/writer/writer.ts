import { ASTBase } from "../ast/astbase";
import { elements } from "..";
import { IParserNode, ParserNode, IParserNodeProperty, ParserNodeProperty } from "../shared/parsernode";
import { ASTElementLayout } from "../elements/elements";

export class Writer extends ASTBase {
    constructor() {
        super();
    }

    public encode(elements: elements.ASTElement[]) {
        let nodes = this.getParserNodes(elements);

        return this.encodeNodes(nodes);
    }

    protected encodeNodes(nodes: ParserNode[], numTabs = 0) {
        let list = nodes.reduce((acc: string[], node) => {
            let numTabsChildren = numTabs;
            let tabs = ""

            if (acc.length > 0 && acc.last() == "\n") {
                numTabsChildren += 1;

                for (let i = 0; i < numTabs; i++) {
                    tabs += "  ";
                }
            }

            if (node.name == "n" && !node.explicit) {
                acc.push("\n");

            }
            else if (node.name == "t") {
                acc.push(tabs + this.getText(node))
            }
            else {
                let name = node.name;
                let children = this.encodeNodes(node.children, numTabsChildren);
                let delimiter = node.children.length > 0 && node.children[0].name === "n" && !node.children[0].explicit ? "" : "|";
                let args = this.getPropertiesString(node.properties);
                let value = node.value || "";
                let amount = node.amount || 1;

                let text = name;

                if (amount > 1) {
                    text += amount;
                }

                if (args.length > 0) {
                    text += " " + args;
                }

                if (children.length > 0) {
                    text += delimiter + children;
                }
                // else if (value.length > 0) {
                //     text += delimiter + value;
                // }

                acc.push(`${tabs}[${text}]`);
            }

            return acc;
        }, []);

        return list.join("");
    }

    protected getPropertiesString(properties: IParserNodeProperty[]) {
        return properties.map(x => {
            let name = x.name
                .split("\\").join("\\\\")
                .split("(").join("\\(")
                .split(")").join("\\)");

            let args = x.arguments.map(y => y
                .split("\\").join("\\\\")
                .split("(").join("\\(")
                .split(")").join("\\)")
                .split(",").join("\\,"));

            return `${name}(${args.join(", ")})`;
        })
        .join(" ");
    }

    protected getParserNodes(elements: elements.ASTElement[]) {
        let lastElement = null; //elements.length > 0 ? elements[0] : null;
        let list = elements.reduce((acc: ParserNode[], element) => {
            let node = this.resolveParserNode(element);
            node.children = this.getParserNodes(element.children);

            if (element.layout == ASTElementLayout.NewLine || (lastElement !== null && lastElement.layout == ASTElementLayout.NewLine))
                acc.push(new ParserNode("n"));

            acc.push(node);

            // if (element.children.length > 0 && )
            //     acc.push(new ParserNode("n"));

            // if (element == lastElement && element.layout == ASTElementLayout.NewLine)
            //     acc.push(new ParserNode("n"));

            lastElement = element;

            return acc;
        }, []);

        return list;
    }


    protected resolveParserNode(element: elements.ASTElement) {
        var node = new ParserNode(element.elementName);
        Object.keys(element.arguments).forEach(key => {
            let property = new ParserNodeProperty(key);
            property.arguments.push(element.arguments[key]);

            node.properties.push(property);
        });

        if (element instanceof elements.ASTWhitespaceElement)
            node.explicit = element.explicit;

        if (element instanceof elements.ASTElementWithValue)
            node.value = element.value;

        if (element instanceof elements.ASTElementWithAmount)
            node.amount = element.amount;

        return node;
    }

    protected getText(node: ParserNode) {
        var text = "";
        node.children.forEach(child => {
            if (child.name == "w") {
                text += child.value
                    .split("\\").join("\\\\")
                    .split("[").join("\\[")
                    .split("]").join("\\]");
            }
            else if (child.name == "_") {
                if (child.explicit) {
                    text += this.encodeNodes([child]);
                }
                else
                    text += " ";
            }
        })

        return text;
    }
}