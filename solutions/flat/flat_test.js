const test = require('ava')
const { check, gen } = require('ava-check')

const { flatten,
        flatten_deep,
        flatten_deep_noloop,
        flatten_iter,
        flatten_iter2 } = require('./flat')

// test('ava works', check(gen.array(gen.int), (t, arr) => {
// 	t.deepEqual(flatten(arr), arr)
// }))

function test_suite_shallow(flatten_func) {
	test(`${flatten_func.name}, flat array returns flat`, t => {
		const input = [1, 2, 3, 4]
		t.deepEqual(flatten_func(input), input)
	});

	test(`${flatten_func.name}, nested arrays return flat structure`, t => {
		const input = [[1, 2], [3, 4]]
		const expected = [1, 2, 3, 4]
		t.deepEqual(flatten_func(input), expected)
	})
}

function test_suite_deep(flatten_func) {
	test(`${flatten_func.name}, deep nested arrays return flat`, t => {
		const input = [[[1, 2], [3, 4]], [5, 6]]
		const expected = [1, 2, 3, 4, 5, 6]
		t.deepEqual(flatten_func(input), expected)
	})

	test(`${flatten_func.name}, heterogenous nesting levels flatten`, t => {
		const input = [1, 2, [3, 4]]
		const expected = [1, 2, 3, 4]
		t.deepEqual(flatten_func(input), expected)
	})
}

function test_suite_iterables(flatten_func) {
	test(`${flatten_func.name}, flattens generators and arrays`, t => {
		function* testGen() {
			yield 3
			yield 4
		}

		const input = [[1, 2], testGen()]
		const expected = [1, 2, 3, 4]
		t.deepEqual(flatten_func(input), expected)
	})

	test(`${flatten_func.name}, flattens Maps`, t => {
		const input = [[1, 2], new Map([['a', 3], ['b', 4]])]
		const expected = [1, 2, ['a', 3], ['b', 4]]
		t.deepEqual(flatten_func(input, 1), expected)
	})
}

function flatten_iter_array(iterable, depth=Infinity) {
	return [...flatten_iter(iterable, depth)]
}

function flatten_iter2_array(iterable, depth=Infinity) {
	return [...flatten_iter2(iterable, depth)]
}

test_suite_shallow(flatten);
test_suite_shallow(flatten_deep);
test_suite_shallow(flatten_deep_noloop);
test_suite_shallow(flatten_iter_array);
test_suite_shallow(flatten_iter2_array);

test_suite_deep(flatten_deep);
test_suite_deep(flatten_deep_noloop);
test_suite_deep(flatten_iter_array);
test_suite_deep(flatten_iter2_array);

test_suite_iterables(flatten_iter_array);
test_suite_iterables(flatten_iter2_array);
