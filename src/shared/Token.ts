export enum TokenType {
    // ElementStart,
    // ElementEnd,
    // PropertyStart,
    // PropertyEnd,
    // Punctuation,
    // NewLine,
    // Word,
    // Space,
    Pipe,
    Text,
    Space,
    Keyword,
    Comment,
    Control
}

export interface Token {
    type: TokenType,
    value: string,
    position: TokenPosition
}

export interface TokenPosition {
    character: number,
    line: number,
    column: number
}