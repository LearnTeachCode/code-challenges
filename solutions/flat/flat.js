// basic flatten alias
function flatten(arr) {
	return [].concat(...arr);
}

function flatten_deep(arr, depth=Infinity) {
	let res = []
	for (const el of arr) {
		if (Array.isArray(el))
			res = res.concat(flatten_deep(el, depth-1))
		else
			res.push(el)
	}
	return res
}

// assumes array input
function flatten_deep_noloop(arr, acc=[]) {
	const [head, ...rest] = arr
	if (head === undefined)
		return acc

	const el = Array.isArray(head)
	      ? flatten_deep_noloop(head)
	      : arr[0];
	return flatten_deep_noloop(rest,
	                           acc.concat(el))
}

// take iterable with (maybe) nested iterables, and flatten elements
function* flatten_iter(iterable, depth=Infinity) {
	if (depth < 1) {
		yield iterable
		return
	}

	for (const el of iterable) {
		try {
			const el_it = el[Symbol.iterator]()
			yield* flatten_iter(el_it, depth-1)
		}
		catch (error) {
			yield el
		}
	}
}


function* gmap(iterable, callback, this_) {
	const f = callback.bind(this_)
	switch (callback.length) {
	case 1:
		for (const el of iterable)
			yield* f(el)
		break
	case 2:
	case 3:
		for (const [i, el] of enumerate(iterable))
			yield* f(el, i, iterable)
		break
	default:
		// some sort of error
		break
	}
}

// take iterable with (maybe) nested iterables, and flatten elements
function* flatten_iter2(iterable, depth=Infinity) {
	if (depth < 1) {
		yield iterable
		return
	}

	const g = gmap(iterable, function* (el) {
		if (isIterable(el)) {
			const el_it = el[Symbol.iterator]()
			yield* flatten_iter2(el_it, depth-1)
		} else {
			yield el
		}
	})
	yield* g
}

// lifted from SO
// https://stackoverflow.com/a/32538867/192780
function isIterable(obj) {
	if (obj == null)
		return false
	return typeof obj[Symbol.iterator] === 'function'
}

module.exports = {
	flatten,
	flatten_deep,
	flatten_deep_noloop,
	flatten_iter,
	flatten_iter2,
}
