let offset = 0
let inputStr = ""
let inputLen = 0


const AST_RANGE = 0
const AST_CONCAT = 1;
const AST_ALTERNATE = 2
const AST_REPEAT = 3
const AST_GROUP = 4


const nextStringUntil = (char: string) => {
	const startOffset = offset;
	while (offset < inputLen && inputStr[offset] !== char) {
		offset++
	}
	return inputStr.slice(startOffset, offset);
}

const nextCharIs = (char: string) => {
	if (offset < inputLen && inputStr[offset] === char) {
		offset++
		return true
	}
	return false
}

const nextChar = (...skipChars: string[]) => {
	if (offset < inputLen) {
		const nextChar = inputStr[offset];
		if (!skipChars.includes(nextChar)) {
			offset++
			return nextChar
		}
	}
	return ""
}

const parseRange = (...skipChars: string[]) => {
	let value = nextChar(...skipChars);
	if (!value) return;
	if (value === ".") return [AST_RANGE, 0, 65535];

	if (value === "\\") {
		value = nextChar();
		if (!value) {
			value = '\\';
		}
		else if (value === 's') {
			value = ' '
		}
		else if (value === 'n') {
			value = '\n'
		}
		else if (value === 'r') {
			value = '\r'
		}
	}

	return [AST_RANGE, value.charCodeAt(0), value.charCodeAt(0)];
}

const inverseRange = (values: any[]): any => {

	const ALL_START = 0
	const ALL_END = 65535

	// Collect all single characters and ranges
	const existingRanges: number[][] = [];

	for (const rangeOrChar of values) {
		
		if (rangeOrChar[0] === AST_RANGE) {
			existingRanges.push([
				rangeOrChar[1],
				rangeOrChar[2]
			]);
		}
	}

	// Sort ranges by start position
	existingRanges.sort((a, b) => a[0] - b[0]);

	// Find the missing ranges (inverse)
	const inverseRanges: any[] = [];
	let currentStart = ALL_START;

	for (const range of existingRanges) {
		if (range[0] > currentStart) {
			inverseRanges.push([AST_RANGE, currentStart, range[0] - 1]);
		}
		currentStart = range[1] + 1
	}

	// Handle any remaining range at the end
	if (currentStart <= ALL_END) {
		inverseRanges.push([AST_RANGE, currentStart, ALL_END]);
	}

	return inverseRanges
}

const parseGroup = (...skipChars: string[]): any => {
	
	if (nextCharIs('(')) {
		const expression = parseExpression(...skipChars, ")");
		if (!expression) throw("expression");
		if (!nextCharIs(')')) throw("expected )");
		return [AST_GROUP, expression];
	}

	if (nextCharIs('[')) {
		const inverse = nextCharIs('^');

		const values: any[] = [];

		for (;;) {
			const fromChar = parseRange("]");
			if (!fromChar) break;
			if (nextCharIs('-')) {
				const toChar = parseRange("]");
				if (!toChar) {
					values.push(fromChar, [AST_RANGE, "-".charCodeAt(0), "-".charCodeAt(0)]);
				} else {
					values.push([AST_RANGE, fromChar[1], toChar[1]]);
				}

			} else {
				values.push(fromChar);
			}

		}

		if (!values.length) throw("EMPTY GROUP");
		if (!nextCharIs(']')) throw("missing ]");

		if (inverse) {
			values.splice(0, Infinity, ...inverseRange(values));
		}

		if (values.length === 1) {
			return values[0];
		}

		return [AST_ALTERNATE, ...values];
	}

	return parseRange(...skipChars)
}


const parseKleene = (...skipChars: string[]): any => {

	const value = parseGroup(...skipChars);
	if (!value) return;
	if (nextCharIs('+')) return [AST_REPEAT, 1, 0, value];
	if (nextCharIs('*')) return [AST_REPEAT, 0, 0, value];
	if (nextCharIs('?')) return [AST_REPEAT, 0, 1, value];

	if (nextCharIs('{')) {
		
		let contents = nextStringUntil('}').trim();
		if (!nextCharIs('}')) throw("expected }");
		if (!contents) throw("unexpected {}");

		const minMax = contents.split(',').map(x => x.trim());
		if (minMax.length > 2) throw("unexpected ,");

		

		const min = minMax[0] ? parseInt(minMax[0], 10) : 0; 
		const max = minMax[1] ? parseInt(minMax[1], 10) : 0;


		if (!Number.isInteger(min)) throw "invalid num";
		if (!Number.isInteger(max)) throw "invalid num";

		return [AST_REPEAT, min, minMax.length === 1 ? min : max, value];
	}

	return value
}

const parseAlternate = (...skipChars: string[]): any => {
	let expression = parseKleene(...skipChars);
	if (!expression) return;
	while (nextCharIs('|')) {

		const right = parseKleene(...skipChars);

		if (!right) {
			expression = [AST_CONCAT, expression, [AST_RANGE, 124, 124]]
			break;
		}

		if (expression[0] !== AST_ALTERNATE) {
			expression = [AST_ALTERNATE, expression];
		}
		
		expression.push(right)
	}
	return expression
}

const parseExpression = (...skipChars: string[]): any => {
	let expression = parseAlternate(...skipChars);
	if (!expression) return;
	for (;;) {
		const right = parseAlternate(...skipChars)
		if (!right) break;
		if (expression[0] !== AST_CONCAT) {
			expression = [AST_CONCAT, expression, right];
		} else {
			expression.push(right);
		}
	}
	return expression
}

const parseRegExp = (input: string): any => {
	offset = 0
	inputStr = input
	inputLen = inputStr.length;
	return parseExpression()
}

parseRegExp.AST_CONCAT = AST_CONCAT;
parseRegExp.AST_ALTERNATE = AST_ALTERNATE;
parseRegExp.AST_REPEAT = AST_REPEAT;
parseRegExp.AST_GROUP = AST_GROUP;
parseRegExp.AST_RANGE = AST_RANGE;


export default parseRegExp;
