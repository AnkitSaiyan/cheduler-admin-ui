export function getNumberArray(end: number, start = 1, step = 1): number[] {
	if (!end) {
		return [];
	}

	if (step < 1) {
		// eslint-disable-next-line no-param-reassign
		step = 1;
	}

	const numbers: number[] = [];
	for (let i = start; i <= end; i += step) {
		numbers.push(i);
	}

	return numbers;
}
