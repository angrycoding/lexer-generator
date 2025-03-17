/*
float:=([0-9]*\.)?[0-9]+[eE]?[+-]?[0-9]+
*/

const transitionTable = new Int32Array([
    -6,
    -10,
    48,
    57,
    -13,
    0,
    48,
    57,
    -24,
    0,
    46,
    -6,
    0,
    -10,
    48,
    57,
    -13,
    0,
    -29,
    101,
    -29,
    69,
    -29,
    0,
    -18,
    48,
    57,
    -24,
    0,
    -35,
    43,
    -35,
    45,
    -35,
    0,
    48,
    57,
    -39,
    0,
    -44,
    48,
    57,
    -39,
    0
]);
const transitionTableLength = 44;
const startSet = [0, -6, -10];

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

    static FLOAT = -44;

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