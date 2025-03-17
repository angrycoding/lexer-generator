import regexpParser from './src/re2ast/index.ts'

const {
	AST_RANGE,
	AST_ALTERNATE,
	AST_CONCAT,
	AST_GROUP,
	AST_REPEAT
} = regexpParser;

const testCases = {
	'.': [AST_RANGE, 0, 65535],
	'a': [AST_RANGE, 97, 97],
	'ab': [AST_CONCAT, [AST_RANGE, 97, 97], [AST_RANGE, 98, 98]],
	'ab|c': [AST_CONCAT, [AST_RANGE, 97, 97], [AST_ALTERNATE, [AST_RANGE, 98, 98], [AST_RANGE, 99, 99]]],
	'a|': [AST_CONCAT, [AST_RANGE, 97, 97], [AST_RANGE, 124, 124]],
	'|': [AST_RANGE, 124, 124],
	'||': [AST_CONCAT, [AST_RANGE, 124, 124], [AST_RANGE, 124, 124]],
	'|||': [AST_ALTERNATE, [AST_RANGE, 124, 124], [AST_RANGE, 124, 124]],
	'||||': [AST_CONCAT, [AST_ALTERNATE, [AST_RANGE, 124, 124], [AST_RANGE, 124, 124]], [AST_RANGE, 124, 124]],
	'a|b': [AST_ALTERNATE, [AST_RANGE, 97, 97], [AST_RANGE, 98, 98]],
	'[a-z]': [AST_RANGE, 97, 122],
	'[^a-z]': [AST_ALTERNATE, [AST_RANGE, 0, 96], [AST_RANGE, 123, 65535]],
	'[a-z0-9]': [AST_ALTERNATE, [AST_RANGE, 97, 122], [AST_RANGE, 48, 57]],
	'(a)': [AST_GROUP, [AST_RANGE, 97, 97]],
	'(abc)': [AST_GROUP, [AST_CONCAT, [AST_RANGE, 97, 97], [AST_RANGE, 98, 98], [AST_RANGE, 99, 99]]],
	'a+': [AST_REPEAT, 1, 0, [AST_RANGE, 97, 97]],
	'a*': [AST_REPEAT, 0, 0, [AST_RANGE, 97, 97]],
	'a?': [AST_REPEAT, 0, 1, [AST_RANGE, 97, 97]],
	'a{10}': [AST_REPEAT, 10, 10, [AST_RANGE, 97, 97]],
	'a{3,}': [AST_REPEAT, 3, 0, [AST_RANGE, 97, 97]],
	'a{,8}': [AST_REPEAT, 0, 8, [AST_RANGE, 97, 97]]
};

for (const expression in testCases) {
	const expectedResult = testCases[expression];
	const actualResult = regexpParser(expression);
	if (JSON.stringify(expectedResult) !== JSON.stringify(actualResult)) {
		console.info(
			expression,
			actualResult,
			expectedResult
		)
		throw 1;
	} else {
		console.info(
			expression,
			actualResult,
		)
	}
}