var util = require('util');

function clone (obj) {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Dictionary object.
 */

function Dictionary (hash) {
	this.hash = hash || {};
};

Dictionary.prototype.copy = function () {
	return new this.constructor(clone(this.hash), this.name)
};

Dictionary.prototype.has = function (k) {
	return Object.prototype.hasOwnProperty.call(this.hash, k);
};

Dictionary.prototype.get = function (k, def) {
	return this.has(k) ? this.hash[k] : def;
};

Dictionary.prototype.set = function (k, v) {
	this.hash[k] = v;
};

Dictionary.prototype.remove = function (k) {
	return delete this.hash[k];
};

// Get keys.
Dictionary.prototype.keys = function () {
	return Object.keys(this.hash);
};

Dictionary.prototype.toJSON = function () {
	return JSON.parse(JSON.stringify(this.hash));
};

// Gets an unsorted sequence of frequencies.
Dictionary.prototype.values = function () {
	return this.keys().map(function (key) {
		return this.hash[key];
	}.bind(this))
};

Dictionary.prototype.total = function () {
	return this.values().reduce(function(a, b) {
		return a + b;
	});
};

Dictionary.prototype.max = function () {
	return Math.max.apply(null, this.values())
};

Dictionary.prototype.increment = function (x, term) {
	term = term == null ? 1 : term;
	this.hash[x] = this.get(x, 0) + term;
};

Dictionary.prototype.multiply = function (x, factor) {
	this.hash[x] = this.get(x, 0) * factor;
};

/**
 * Represents a histogram, which is a map from values to frequencies.
 * Values can be any hashable type; frequencies are integer counters.
 */

util.inherits(Hist, Dictionary);

function Hist (hash, name) {
	Dictionary.call(this, hash);
	this.name = name;
}

// Gets the frequency associated with the value x.
Hist.prototype.frequency = function (x) {
	return getOwnProperty(this.hash, x, 0);
}

// Checks whether the values in this histogram are a subset of the values in the given histogram.
Hist.prototype.isSubset = function (b) {
	var a = this;
	return a.keys().every(function (key) {
		return a.frequency(key) <= b.frequency(key);
	});
}

// Subtracts the values in the given histogram from this histogram.
Hist.prototype.subtract = function (b) {
	var a = this;
	a.keys().forEach(function (key) {
		a.increment(key, -b.frequency(key));
	});
}

/**
 * Represents a probability mass function.
 * Values can be any hashable type; probabilities are floating-point.
 * Pmfs are not necessarily normalized.
 */

util.inherits(Pmf, Dictionary);

function Pmf (hash, name) {
	Dictionary.call(this, hash);
	this.name = name;
}

// Returns the probability for a given key.
Pmf.prototype.probability = function (x, def) {
	return this.get(x, def);
};

// Normalizes this PMF so the sum of all probs is 1.
Pmf.prototype.normalize = function (fraction) {
	fraction = fraction == null ? 1.0 : Number(fraction);

	var total = this.total();
	if (total == 0) {
		throw new Error('Total probability is zero.');
	}
	this.keys().forEach(function (k) {
		this.multiply(k, fraction / total);
	}.bind(this));
};

Pmf.prototype.peak = function () {
	var top = Math.max.apply(null, this.values());
	for (var key in this.hash) {
		if (this.hash[key] == top) {
			return key;
		}
	}
}

// Chooses a random element from this PMF.
Pmf.prototype.random = function () {
	if (!this.values().length) {
		throw new Error('Pmf contains no values.');
	}

	var target = Math.random();
	var total = 0;
	var ret = NaN;
	this.keys().some(function (x) {
		total += this.probability(x);
		if (total > target) {
			ret = x;
			return true;
		}
	}.bind(this));
	return ret;
};

// Computes the mean of a PMF.
Pmf.prototype.mean = function () {
	return this.keys().reduce(function (last, x) {
		return last + (this.probability(x) * x);
	}.bind(this), 0)
};

// Computes the variance of a PMF.
Pmf.prototype.variance = function (mu) {
	mu = mu == null ? this.mean() : mu;
	return this.keys().reduce(function (last, x) {
		return last + (this.probability(x) * Math.pow(x - mu, 2));
	}.bind(this), 0);
};

// Log transforms the probabilities.
Pmf.prototype.log = function () {
	var m = this.max();
	this.keys().forEach(function (x) {
		this.set(x, Math.exp(this.probability(x) / m));
	});
};

// Exponentiates the probabilities.
Pmf.prototype.exp = function () {
	var m = this.max();
	this.keys().forEach(function (x) {
		this.set(x, Math.exp(this.probability(x) - m));
	});
};



function Suite (hypos) {
	Pmf.call(this);
	hypos.forEach(function (k) {
		this.set(k, 1);
	}.bind(this));
	this.normalize();
}

Suite.prototype = new Pmf();

Suite.prototype.update = function (data) {
	if (Array.isArray(data)) {
		data.map(this.update.bind(this));
		return;
	}
	this.keys().forEach(function (hypo) {
		var like = this.likelihood(hypo, data);
		this.multiply(hypo, like)
	}.bind(this));
	this.normalize();
}

/**
 * Module API.
 */

exports.creatHist = function () {
	return new Hist();
};

exports.createPmf = function () {
	return new Pmf();
};

exports.createSuite = function (hypos) {
	return new Suite(hypos);
};