const test = require('ava')
const jsc = require('jsverify')
const _ = require('lodash')

const { flatten,
        flatten_deep,
        flatten_deep_noloop,
        flatten_iter,
        flatten_iter2 } = require('../flat')

const arb_primitive = jsc.oneof(
	jsc.char,
	jsc.string,
	jsc.bool,
	jsc.integer,
	jsc.number,
	jsc.datetime,
)

const is_primitive = x => _.isString(x) | _.isBoolean(x) | _.isNumber(x) | _.isDate(x)
const all_primitive = arr => arr.filter(is_primitive).length === arr.length

const arb_nested_array = jsc.recursive(
	jsc.array(
		jsc.oneof(
			arb_primitive,
			jsc.dict,
			jsc.json,
			jsc.falsy)),
	jsc.array)

const n_nested_array = n =>
      n === 0
      ? jsc.oneof(arb_primitive)
      : jsc.array(n_nested_array(n-1))

const arb_n_nested_array = jsc.nat.smap(n => n_nested_array(n),
                                        n => n_nested_array(n-1))

const n_arb_nested_array = jsc.nat.smap(n => [ n,   n_nested_array(n)   ],
                                        n => [ n-1, n_nested_array(n-1) ])

function check(property) {
	return jsc.check(property, {quiet: true})
}

const env = {
	primitive: arb_primitive
}

// tests for minimum basic flatten behavior
function property_basic(f) {
	property_flat(f)
	property_nested1(f)
}

function property_flat(f) {
	test(`${f.name}, flat array returns flat`, t => {
		const input = [1, 2, 3, 4]
		t.true(_.isEqual(f(input), input))
	})

	test(`${f.name}, id on flat array (does not change)`, t => {
		const res = jsc.check(
			jsc.forall(
				'[primitive]', env,
				arr => _.isEqual(f(arr), arr)),
		    {quiet: true})
		t.true(res)
	})

	test(`${f.name}, idempotent on flat arrays`, t => {
		const res = check(
			jsc.forall(
				'[primitive]', env,
				arr => _.isEqual(f(f(arr)), f(arr))))
		t.true(res)
	})
}

function property_nested1(f) {
	test(`${f.name}, nested arrays return flat structure`, t => {
		const input = [[1, 2], [3, 4]]
		const expected = [1, 2, 3, 4]
		t.true(_.isEqual(f(input), expected))
	})

	test(`${f.name}, flattened length is sum of inputs`, t => {
		const res = check(
			jsc.forall(
				"[[primitive]]", env,
				arrs => {
					const nelem = sum(arrs.map(a => a.length))
					return _.isEqual(f(arrs).length, nelem)
				}))
		t.true(res)
	})

	test(`${f.name}, flattened elements are same as inputs`, t => {
		const res = jsc.check(
			jsc.forall(
				"[[primitive]]", env,
				arrs => _.isEqual(new Set(f(arrs)),
				                  set_union(...arrs))),
			{quiet: true})
		t.true(res)
	})
}

function property_heterogenous(f) {
	test(`${f.name}, heterogenous nesting levels flatten`, t => {
		const input = [1, 2, [3, 4]]
		const expected = [1, 2, 3, 4]
		t.deepEqual(f(input), expected)
	})

	test(`${f.name}, heterogenous lengths is sum of inputs`, t => {
		const res = jsc.check(
			jsc.forall(
				"[primitive]", "[[primitive]]", env,
				(arr, arrs) => {
					var nelem = arr.length + sum(arrs.map(a => a.length))
					var shuffled = _.shuffle(arr.concat(arrs))
					return f(shuffled).length === nelem
				}),
			{quiet: true})
		t.true(res)
	})
}

function property_deep(f) {
	test(`${f.name}, deep nested arrays flatten`, t => {
		const input = [[[1, 2], [3, 4]], [5, 6]]
		const expected = [1, 2, 3, 4, 5, 6]
		t.deepEqual(f(input), expected)
	})

	test(`${f.name}, deep nested arrays when flattened are all primitive`, t => {
		const res = check(
			jsc.forall(
				jsc.recursive(jsc.array(arb_primitive), jsc.array),
				arr => all_primitive(f(arr))))
		t.true(res)
	})
}

function property_depth(f) {
	test(`${f.name}, depth`, t => {
		const res = jsc.check(
			jsc.forall(
				n_arb_nested_array,
				([n, arr]) => all_primitive(f(arr, depth=n))),
			{quiet: true, size: 2})
		t.true(res)
	})
}

function run_tests() {
	const tests = {
		'basic': property_basic,
		'heterogenous-levels': property_heterogenous,
		'deep': property_deep,
		'depth': property_depth,
	}

	const func_properties = new Map([
		[flatten,
		 ['basic', 'heterogenous-levels']],
		[flatten_deep,
		 ['basic', 'heterogenous-levels', 'deep', 'depth']],
		[flatten_deep_noloop,
		 ['basic', 'heterogenous-levels', 'deep']],
	])

	func_properties.forEach(function(props, func) {
		props.forEach(prop => tests[prop](func))
	})
}

run_tests()

function test_suite_iterables(flatten_func) {
	test(`${flatten_func.name}, flattens generators and arrays`, t => {
		function* testGen() {
			yield 3
			yield 4
		}

		const input = [[1, 2], testGen()]
		const expected = [1, 2, 3, 4]
		expect(flatten_func(input)).toBe(expected)
	})

	test(`${flatten_func.name}, flattens Maps`, t => {
		const input = [[1, 2], new Map([['a', 3], ['b', 4]])]
		const expected = [1, 2, ['a', 3], ['b', 4]]
		expect(flatten_func(input, 1)).toBe(expected)
	})
}

function set_union(...sets) {
	var _union = new Set()
	for (const set of sets) {
		for (const elem of set)
			_union.add(elem)
	}
	return _union
}

function sum(elems) {
	return elems.reduce((a, b) => a + b, 0)
}
