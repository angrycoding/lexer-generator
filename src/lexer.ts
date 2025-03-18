/*
space:=\s
rawid:=[a-zA-Z$_][a-zA-Z$_0-9]*
id,xyz:={space}*{rawid}({space}*,{space}*{rawid})*{space}*:={space}*
newline:=[\r\n]+
*/

const transitionTable = new Int32Array([
    -35,
    32,
    -170,
    97,
    122,
    -20,
    65,
    90,
    -20,
    36,
    -20,
    95,
    -20,
    32,
    -46,
    13,
    -164,
    10,
    -164,
    0,
    -171,
    97,
    122,
    -20,
    65,
    90,
    -20,
    36,
    -20,
    95,
    -20,
    48,
    57,
    -20,
    0,
    97,
    122,
    -50,
    65,
    90,
    -50,
    36,
    -50,
    95,
    -50,
    0,
    -35,
    32,
    -46,
    0,
    -65,
    97,
    122,
    -50,
    65,
    90,
    -50,
    36,
    -50,
    95,
    -50,
    48,
    57,
    -50,
    0,
    -70,
    -79,
    32,
    -82,
    0,
    -153,
    32,
    -70,
    0,
    -70,
    -116,
    32,
    -119,
    0,
    44,
    -86,
    0,
    -79,
    32,
    -82,
    0,
    -90,
    32,
    -86,
    0,
    97,
    122,
    -101,
    65,
    90,
    -101,
    36,
    -101,
    95,
    -101,
    0,
    -74,
    97,
    122,
    -101,
    65,
    90,
    -101,
    36,
    -101,
    95,
    -101,
    48,
    57,
    -101,
    0,
    44,
    -123,
    0,
    -116,
    32,
    -119,
    0,
    -127,
    32,
    -123,
    0,
    97,
    122,
    -138,
    65,
    90,
    -138,
    36,
    -138,
    95,
    -138,
    0,
    -74,
    97,
    122,
    -138,
    65,
    90,
    -138,
    36,
    -138,
    95,
    -138,
    48,
    57,
    -138,
    0,
    58,
    -156,
    0,
    61,
    -159,
    0,
    -172,
    -173,
    32,
    -159,
    0,
    -174,
    13,
    -164,
    10,
    -164,
    0
]);
const transitionTableLength = 170;
const startSet = [0, -35];

const closure = (input: number[]) => {
    for (const offset of input) {
        for (let c = Math.abs(offset); c < transitionTableLength; c++) {
            const shift = transitionTable[c];
            if (shift >= 0) break;
            if (!input.includes(shift)) {
                input.push(shift);
            }
        }
    }
}

const goto = (input: number[], code: number) => {
    const output: number[] = [];
    for (const offset of input) {
        for (let c = Math.abs(offset); c < transitionTableLength; c++) {

            const first = transitionTable[c];
            if (first === 0) break;
            if (first < 0) continue;
            const second = transitionTable[c + 1];

            if (second > 0) {

                if (code >= first && code <= second) {
                    const third = transitionTable[c + 2];
                    if (!output.includes(third)) {
                        output.push(third);
                    }
                }

                c += 2;
            } else if (second < 0) {

                if (code === first) {
                    if (!output.includes(second)) {
                        output.push(second);
                    }
                }

                c += 1;
            }

        }
    }

    if (output.length) closure(output);
    return output;

}

class Lexer {
    private offset = 0;
    private inputLen = 0;
    private inputStr = '';

    static FRAG = -1;

    static SPACE = -170;
    static RAWID = -171;
    static XYZ = -172;
    static ID = -173;
    static NEWLINE = -174;

    init = (input: string) => {
        this.offset = 0;
        this.inputStr = input;
        this.inputLen = input.length;
    }

    nextToken = () => {

        const {
            inputLen,
            inputStr,
            offset
        } = this;


        let weHaveToken: any = undefined;
        let start = [...startSet];

        if (offset >= inputLen) return;

        for (let c = offset; c <= inputLen; c++) {

            let x: number[] = [];

            if (c < inputLen) {
                x = goto(start, inputStr.charCodeAt(c));
                const acceptable = x.filter(a => Math.abs(a) >= transitionTableLength);
                if (acceptable.length) {
                    weHaveToken = [offset, c, ...acceptable];
                }
            }

            if (!x.length) {

                if (weHaveToken) {
                    this.offset = weHaveToken[1] + 1;
                    return [
                        ...weHaveToken.slice(2),
                        inputStr.slice(weHaveToken[0], weHaveToken[1] + 1)
                    ];
                } else {
                    this.offset++;
                    return [Lexer.FRAG, inputStr[offset]]
                }
            }

            start = x;

        }


    }

}


export default Lexer;