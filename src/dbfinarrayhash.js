/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
 * free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License (GPL)
 * as published by the Free Software Foundation, version 3
 * of the License, or any later version.
 *
 * YAWL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY: without even implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the License (in file
 * GNUGPLv3) along with the program. A copy of the License
 * is also available at <http://www.gnu.org/licenses/>.
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
 *						setObject({k: v})			    	sets/adds keys and values taken from an object
 *						setMap([k], map:k->v)   	    	sets/adds values using mapping function
 *						remove(k)					    	removes a pair by key and returns its value or undefined
 *						removeAll()					    	removes all pairs
 *                      move(k, p)->p                       moves [k, v] to position p and returns new position or undefined
 *						sort(compare:[k1,v1],[k2,v2]->int)	sorts using compare function
 *						sortK(compare:k1,k2->int)	    	sorts by keys using compare function
 *						sortV(compare:v1,v2->int)	    	sorts by values using compare function
 *						forEach(callback:k,v)		    	calls callback on each pair
 * 						some(callback:k,v->boolean)			calls callback on each pair until it returns true
 * 															returns true iff some callback returned true
 *						toArray()					    	returns array of pairs [[ki, vi]]
 *						toString()					    	returns string represenating the array of pairs
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinArrayHash: array of pairs [ key, value ]
 */
const dbFinArrayHash = new Lang.Class({
	Name: 'dbFin.ArrayHash',

	_init: function() {
        _D('>' + this.__name__ + '._init()');
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<');
	},

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		this.removeAll();
		this._keys = null;
		this._values = null;
		this.length = null;
        _D('<');
	},

	getKeys: function() {
        _D('>' + this.__name__ + '.getKeys()');
        _D('<');
		return this._keys.slice();
	},

	getValues: function() {
        _D('>' + this.__name__ + '.getValues()');
        _D('<');
		return this._values.slice();
	},

	has: function(k) {
        _D('>' + this.__name__ + '.has()');
        _D('<');
		return this._keys.indexOf(k) != -1;
	},

	get: function(k) {
        _D('>' + this.__name__ + '.get()');
		let (i = this._keys.indexOf(k)) {
	        _D('<');
			if (i == -1) return undefined;
			else return this._values[i];
		}
	},

	set: function(k, v) {
        _D('>' + this.__name__ + '.set()');
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
        _D('>' + this.__name__ + '.setArray()');
		kvs.forEach(Lang.bind(this, function (kv) { this.set(kv[0], kv[1]); }));
        _D('<');
	},

	setObject: function(kvs) {
        _D('>' + this.__name__ + '.setObject()');
		for (let k in kvs) if (kvs.hasOwnProperty(k)) this.set(k, kvs[k]);
        _D('<');
	},

	setMap: function(ks, map) {
        _D('>' + this.__name__ + '.setMap()');
		ks.forEach(Lang.bind(this, function (k) { this.set(k, map(k)); }));
        _D('<');
	},

	remove: function(k) {
        _D('>' + this.__name__ + '.remove()');
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
        _D('>' + this.__name__ + '.removeAll()');
/* Do I really need this?
		for (let i = this.length - 1; i >= 0; --i) {
			this._keys[i] = null;
			this._values[i] = null;
		}*/
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<');
	},

    move: function(k, p) {
        _D('>' + this.__name__ + '.move()');
        if (!p && p !== 0 || !this.length) p = undefined;
        else if (this.length == 1) p = (this._keys[0] === k ? 0 : undefined);
        else let (i = this._keys.indexOf(k)) {
            if (i != -1) {
                if (p < 0) p = 0;
                else if (p >= this.length) p = this.length - 1;
                if (p != i) {
					this._keys.splice(p, 0, this._keys.splice(i, 1)[0]);
					this._values.splice(p, 0, this._values.splice(i, 1)[0]);
                }
            }
			else {
				p = undefined;
			}
        }
        _D('<');
		return p;
    },

    // TODO: sort functions are not optimal
	sort: function(compare) {
        _D('>' + this.__name__ + '.sort()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1, kv2); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	sortK: function(compare) {
        _D('>' + this.__name__ + '.sortK()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[0], kv2[0]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	sortV: function(compare) {
        _D('>' + this.__name__ + '.sortV()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[1], kv2[1]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<');
	},

	forEach: function(callback) { // this is a very delicate function: what if something changes this in callback?
        _D('>' + this.__name__ + '.forEach()');
        let (ks = this._keys.slice(), vs = this._values.slice(), l = this.length) {
    		for (let i = 0; i < l; ++i) callback(ks[i], vs[i]);
        }
        _D('<');
	},

	some: function(callback) { // this is a very delicate function: what if something changes this in callback?
        _D('>' + this.__name__ + '.some()');
        let (ks = this._keys.slice(), vs = this._values.slice(), l = this.length) {
    		for (let i = 0; i < l; ++i) if (callback(ks[i], vs[i])) { _D('<'); return true; }
        }
        _D('<');
		return false;
	},

	toArray: function() {
        _D('>' + this.__name__ + '.toArray()');
        _D('<');
		return dbFinUtils.zip(this._keys, this._values, this.length);
	},

	toString: function() {
        _D('>' + this.__name__ + '.toString()');
        _D('<');
		return this.toArray().toString();
	}
});
