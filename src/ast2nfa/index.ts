import parseRegExp from "../re2ast";


type AST = ReturnType<typeof parseRegExp>;

type NFA = {[key: string]: any[]};

let LAST_GID = 0;

const getNextStateId = () => {
	LAST_GID++;
	return LAST_GID;
}

const processRange = (operator: number[], fromState: number, toState: any, nfa: NFA) => {
	if (!nfa[fromState]) nfa[fromState] = [];

	for (const x of String(toState).split(',')) {
		if (operator[1] === operator[2]) {
			nfa[fromState].push([operator[1], x]);
		} else {
			nfa[fromState].push([operator[1], operator[2], x]);
		}
	}
}

const processConcatenation = (operator: number[], fromState: number, toState: any, resultSet: NFA) => {
	const length = operator.length;
	let nextState = fromState;
	for (let iterator = 1; iterator < length; iterator++) {
		const prevState = nextState;
		if (iterator === length - 1) nextState = toState;
		else nextState = getNextStateId();
		AST2NFA(operator[iterator], prevState, nextState, resultSet);
	}
}

function processAlternate(operator: any, fromState: any, toState: any, resultSet: any) {
	var index = 0, length = operator.length;
	while (++index < length) AST2NFA(
		operator[index],
		fromState,
		toState,
		resultSet
	);
}

const processRepetition = (operator: number[], fromState: number, toState: any, resultSet: NFA) => {

	const [ , min, max, value ] = operator;

	let nextState = fromState;
	if (!resultSet[fromState]) resultSet[fromState] = [];

	for (let iterator = 0; iterator < min; iterator++) {
		const prevState = nextState;
		if (iterator === max - 1) nextState = toState;
		else nextState = getNextStateId();
		AST2NFA(value, prevState, nextState, resultSet);
	}

	for (let iterator = min; iterator < max; iterator++) {
		const prevState = nextState;
		if (iterator === max - 1) nextState = toState;
		else nextState = getNextStateId();
		AST2NFA(value, prevState, nextState, resultSet);
		if (!resultSet[prevState]) resultSet[prevState] = [];


		for (const x of String(toState).split(',')) {
			resultSet[prevState].unshift(x);
		}

	}

	if (max === 0) {
		if (min === 0) {
			const prevState = nextState;
			nextState = getNextStateId();
			AST2NFA(value, prevState, nextState, resultSet);
			if (!resultSet[prevState]) resultSet[prevState] = [];

			for (const x of String(toState).split(',')) {
				resultSet[prevState].unshift(x);
			}
	
		}
		const prevState = nextState;
		AST2NFA(value, prevState, prevState, resultSet);
		if (!resultSet[prevState]) resultSet[prevState] = [];

		for (const x of String(toState).split(',')) {
			resultSet[prevState].unshift(x);
		}
	}
}

const AST2NFA = (operator: AST, fromState: number, toState: any, nfa: NFA) => {
	switch (operator[0]) {
		case parseRegExp.AST_GROUP: AST2NFA(operator[1], fromState, toState, nfa); break;
		case parseRegExp.AST_RANGE: processRange(operator, fromState, toState, nfa); break;
		case parseRegExp.AST_REPEAT: processRepetition(operator, fromState, toState, nfa); break;
		case parseRegExp.AST_ALTERNATE: processAlternate(operator, fromState, toState, nfa); break;
		case parseRegExp.AST_CONCAT: processConcatenation(operator, fromState, toState, nfa); break;
		default: throw JSON.stringify(operator);
	}
}

AST2NFA.reset = () => {
	LAST_GID = 0;
}

export default AST2NFA;