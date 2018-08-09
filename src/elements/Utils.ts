export class Utils {
    static elementIdCounter: number = 0;
    public static getNewId() {
        return this.elementIdCounter++;
    }
}