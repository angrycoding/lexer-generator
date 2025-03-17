import parseRegExp from "./re2ast";
import AST2NFA from "./ast2nfa";
import { useState } from "react";
import Lexer from './lexer';
import x from 'js-beautify'


import XLexer from './xlexer';


const xLexer = new XLexer();


xLexer.init(`
	
	.52e+3
	
`)
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())
console.info(xLexer.nextToken())




const createTransitionTable = (...tokens: Array<[string, string, ...string[]]>): number[] => {

	const nfa: {[key: string]: any[]} = {};

	AST2NFA.reset();

	for (const token of tokens) {
		let [ expression, ...names ] = token.reverse();
		try {


			expression = expression.replace(/\{([^}]+)\}/g, (value: any, match: string) => {
				match = match.toUpperCase();
				const regexp = tokens.map(t => {
					const hasMatch = t.slice(1).some(x => x.toUpperCase() === match);
					if (hasMatch) return t[0];
				}).filter(Boolean)[0]
				return (regexp ? regexp : value);
			})

			const ast = parseRegExp(expression)
			AST2NFA(ast, 0, names.join(','), nfa);
		} catch (e) {}
	}


	console.info(JSON.stringify(nfa, null, '\t'));
	return [];
	
	for (const state in nfa) {
		nfa[state].push(0);
	}
	
	let counter = 0;
	let mappings: any = {};
	for (const key in nfa) {
		mappings[key] = counter;
		counter -= nfa[key].flat(Infinity).length
	}



	let result: any = [];


	for (const key in nfa) {
		result.push(...nfa[key].map((item: any) => {
			
			if (item instanceof Array) {
				const lastItem = item[item.length - 1];
				if (mappings[lastItem]) {
					item[item.length - 1] = mappings[lastItem];
				}
			} else if (mappings[item]) {
				item = mappings[item];
			}


			return item;
		}));
	}


	result = result.flat(Infinity)

	const length = result.length;
	const idMappigns: any = {};

	let foo = 0;
	for (let c = 0; c < length; c++) {
		const terminal = result[c];
		if (typeof terminal !== 'string') continue;
		result[c] = idMappigns[terminal] = idMappigns[terminal] || -(length + foo++);
	}


	return result.flat(Infinity);
}

const closure = (transitionTable: number[], input: number[]) => {
	for (const offset of input) {
		for (let c = Math.abs(offset); c < transitionTable.length; c++) {
			const shift = transitionTable[c];
			if (shift >= 0) break;
			if (!input.includes(shift)) {
				input.push(shift);
			}
		}
	}
	return input;
}
const lexer = new Lexer()


const parseContents = () => {
	let result = '';
	for (;;) {
		const token = lexer.nextToken();
		if (!token) break
		if (token.includes(Lexer.NEWLINE)) break;
		result += token[1];
	}
	return result;
}

const parseGrammar = (grammar: string) => {

	grammar = grammar.replace(/[ ]+/g, '');

	const result: Array<[string, string, ...string[]]> = [];
	lexer.init(grammar);


	for (;;) {
		let name: any = lexer.nextToken();
		if (!name) break;
		if (name.includes(Lexer.ID)) {
			name = name.pop().split(':').shift().split(',').map((x: any) => x.trim().toUpperCase()).join(',') as string;
			const contents = parseContents();
			// @ts-ignore
			result.push([...name.split(','), contents]);
		}
	}

	const table = createTransitionTable(...result);

	let counter = 0;
	return x(`

/*
${grammar.trim().replace(/[ \t]+/g, '')}
*/

		const transitionTable = new Int32Array(${JSON.stringify(table, null, '\t')});
		const transitionTableLength = ${table.length};
		const startSet = ${JSON.stringify(closure(table, [0]))};
	
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
					}

					else if (second < 0) {

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

			${result.map((token: any) => {
				return token.slice(1).map((t: any) => `static ${t} = ${-(table.length + counter++)};`)
			}).flat(Infinity).join('\n')}

			init = (input: string) => {
				this.offset = 0;
				this.inputStr = input;
				this.inputLen = input.length;
			}

			nextToken = () => {

				const { inputLen, inputStr, offset } = this;


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
						}
						
						else {
							this.offset++;
							return [Lexer.FRAG, inputStr[offset]]
						}
					}

					start = x;

				}


			}

		}


		export default Lexer;

	
	`);
	
}

// parseGrammar(`
// 	space := \\s
// 	id := [a-zA-Z$_][a-zA-Z$_0-9]*
// 	ID:={space}*{id}({space}*,{space}*{id})*{space}*:={space}*
// `)

const App = () => {

	const [ grammar, setGrammar ] = useState('');

	
	return <div style={{border: '1px solid red', position: 'fixed', inset: 0, display: 'flex'}}>
		<textarea style={{flex: 1}} value={grammar} onChange={e => setGrammar(e.target.value)}></textarea>
		<textarea readOnly style={{flex: 1, whiteSpace: 'pre', overflow: 'auto'}} value={parseGrammar(grammar)} />
	</div>;
}

export default App;
