export interface EditorConfig {
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly paddingY: number;
    readonly lineHeight: number;
}

const fontSize = 16;
const paddingY = 3;

export const config: EditorConfig = {
    fontSize,
    fontFamily: 'monospace',
    paddingY,
    lineHeight: fontSize + (paddingY * 2), // 12 + 4 = 16
};
