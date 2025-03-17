/*
space:=\s
rawid:=[a-zA-Z$_][a-zA-Z$_0-9]*
id,xyz:={space}*{rawid}({space}*,{space}*{rawid})*{space}*:={space}*
newline:=[\r\n]+
*/

const transitionTable = new Int32Array([
    -50,
    32,
    -247,
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
    -61,
    13,
    -241,
    10,
    -241,
    0,
    -248,
    97,
    122,
    -35,
    65,
    90,
    -35,
    36,
    -35,
    95,
    -35,
    48,
    57,
    -35,
    0,
    -248,
    97,
    122,
    -35,
    65,
    90,
    -35,
    36,
    -35,
    95,
    -35,
    48,
    57,
    -35,
    0,
    97,
    122,
    -65,
    65,
    90,
    -65,
    36,
    -65,
    95,
    -65,
    0,
    -50,
    32,
    -61,
    0,
    -80,
    97,
    122,
    -85,
    65,
    90,
    -85,
    36,
    -85,
    95,
    -85,
    48,
    57,
    -85,
    0,
    -100,
    -109,
    32,
    -112,
    0,
    -80,
    97,
    122,
    -85,
    65,
    90,
    -85,
    36,
    -85,
    95,
    -85,
    48,
    57,
    -85,
    0,
    -221,
    32,
    -224,
    0,
    -100,
    -165,
    32,
    -168,
    0,
    44,
    -116,
    0,
    -109,
    32,
    -112,
    0,
    -120,
    32,
    -131,
    0,
    97,
    122,
    -135,
    65,
    90,
    -135,
    36,
    -135,
    95,
    -135,
    0,
    -120,
    32,
    -131,
    0,
    -104,
    97,
    122,
    -150,
    65,
    90,
    -150,
    36,
    -150,
    95,
    -150,
    48,
    57,
    -150,
    0,
    -104,
    97,
    122,
    -150,
    65,
    90,
    -150,
    36,
    -150,
    95,
    -150,
    48,
    57,
    -150,
    0,
    44,
    -172,
    0,
    -165,
    32,
    -168,
    0,
    -176,
    32,
    -187,
    0,
    97,
    122,
    -191,
    65,
    90,
    -191,
    36,
    -191,
    95,
    -191,
    0,
    -176,
    32,
    -187,
    0,
    -104,
    97,
    122,
    -206,
    65,
    90,
    -206,
    36,
    -206,
    95,
    -206,
    48,
    57,
    -206,
    0,
    -104,
    97,
    122,
    -206,
    65,
    90,
    -206,
    36,
    -206,
    95,
    -206,
    48,
    57,
    -206,
    0,
    58,
    -228,
    0,
    -221,
    32,
    -224,
    0,
    61,
    -231,
    0,
    -249,
    -250,
    32,
    -236,
    0,
    -249,
    -250,
    32,
    -236,
    0,
    -251,
    13,
    -241,
    10,
    -241,
    0
]);
const transitionTableLength = 247;
const startSet = [0, -50];

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

    static SPACE = -247;
    static RAWID = -248;
    static XYZ = -249;
    static ID = -250;
    static NEWLINE = -251;

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