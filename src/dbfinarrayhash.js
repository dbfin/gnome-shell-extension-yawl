/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinarrayhash.js
 * Class to represent array of pairs ( key, value ).
 *
 * dbFinArrayHash	array of pairs ( key, value )
 *					Properties:
 *						length								the number of pairs
 * 					Methods:
 * 						getKeys()							array of keys
 * 						getValues()							array of values
 *                      has(k)                              true or false
 *						get(k)						    	returns value or undefined
 *						set(k, v)					    	sets/adds value by key
 *						setArray([[k, v]])			    	sets/adds keys and values taken from array of pairs
 *						setMap([k], map:k->v)   	    	sets/adds values using mapping function
 *						remove(k)					    	removes a pair by key and returns its value or undefined
 *						removeAll()					    	removes all pairs
 *						sort(compare:[k1,v1],[k2,v2]->int)	sorts using compare function
 *						sortK(compare:k1,k2->int)	    	sorts by keys using compare function
 *						sortV(compare:v1,v2->int)	    	sorts by values using compare function
 *						forEach(callback:k,v)		    	calls callback on each pair
 *						toArray()					    	returns array of pairs [[ki, vi]]
 *						toString()					    	returns string represenating the array of pairs
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinArrayHash: array of pairs [ key, value ]
 */
const dbFinArrayHash = new Lang.Class({
	Name: 'dbFin.ArrayHash',

	_init: function() {
        _D('>dbFinArrayHash._init()');
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<');
	},

	destroy: function() {
        _D('>dbFinArrayHash.destroy()');
		this.removeAll();
		this._keys = null;
		this._values = null;
		this.length = null;
        _D('<');
	},

	getKeys: function() {
        _D('>dbFinArrayHash.getKeys()');
        _D('<');
		return this._keys.slice();
	},

	getValues: function() {
        _D('>dbFinArrayHash.getValues()');
        _D('<');
		return this._values.slice();
	},

	has: function(k) {
        _D('>dbFinArrayHash.has()');
        _D('<');
		return this._keys.indexOf(k) != -1;
	},

	get: function(k) {
        _D('>dbFinArrayHash.get()');
		let (i = this._keys.indexOf(k)) {
	        _D('<');
			if (i == -1) return undefined;
			else return this._values[i];
		}
	},

	set: function(k, v) {
        _D('>dbFinArrayHash.set()');
		let (i = this._keys.indexOf(k)) {
			if (i == -1) {
				this._keys.push(k);
				this._values.push(v);
				this.length++;
			}
			else {
				this._values[i] = v;
			}
		}
        _D('<');
	},

	setArray: function(kvs) {
        _D('>dbFinArrayHash.setArray()');
		kvs.forEach(Lang.bind(this, function (kv) { this.set(kv[0], kv[1]); }));
        _D('<');
	},

	setMap: function(ks, map) {
        _D('>dbFinArrayHash.setMap()');
		ks.forEach(Lang.bind(this, function (k) { this.set(k, map(k)); }));
        _D('<');
	},

	remove: function(k) {
        _D('>dbFinArrayHash.remove()');
		let (i = this._keys.indexOf(k)) {
			if (i == -1) {
		        _D('<');
				return undefined;
			}
			else {
				this.length--;
				this._keys.splice(i, 1);
		        _D('<');
				return (this._values.splice(i, 1))[0];
			}
		}
	},

	removeAll: function() {
        _D('>dbFinArrayHash.removeAll()');
		for (let i = this.length - 1; i >= 0; --i) {
			this._keys[i] = null;
			this._values[i] = null;
		}
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<');
	},

    // TODO: sort functions are not optimal
	sort: function(compare) {
        _D('>dbFinArrayHash.sort()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1, kv2); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	sortK: function(compare) {
        _D('>dbFinArrayHash.sortK()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[0], kv2[0]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	sortV: function(compare) {
        _D('>dbFinArrayHash.sortV()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[1], kv2[1]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	forEach: function(callback) { // this is a very delicate function: what if something changes this in callback?
        _D('>dbFinArrayHash.forEach()');
        let (ks = this._keys.slice(), vs = this._values.slice(), l = this.length) {
    		for (let i = 0; i < l; ++i) callback(ks[i], vs[i]);
        }
        _D('<');
	},

	toArray: function() {
        _D('>dbFinArrayHash.toArray()');
        _D('<');
		return zip(this._keys, this._values, this.length);
	},

	toString: function() {
        _D('>dbFinArrayHash.toString()');
        _D('<');
		return this.toArray().toString();
	}
});