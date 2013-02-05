/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinutils.js
 * Common utilities.
 *
 * 1) functions
 * now              returns current date/time as a toString string or as a 'yyyyMMddHHmmss' string
 * 					Parameters:
 *						justnumbers		set true to return just numbers, otherwise returns Date.toString()
 *
 * setBox           sets x1, y1, x2, y2 of Clutter.ActorBox (or another class supporting these properties)
 * 					Parameters:
 *						box, x1, y1, x2, y2
 *
 * 2) classes
 * ArrayHash		array of pairs ( key, value )
 *					Properties:
 *						length								the number of pairs
 * 					Methods:
 * 						getKeys()							array of keys
 * 						getValues()							array of values
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
 * Signals          keeps track of connected signals (identified by unique text ID's, or no-name signals)
 *                  Methods:
 *						connectNoId({ emitter:, signal:, callback:, scope: })		Connect signal, no text ID
 *						disconnectAllNoId()											Remove all connected no-ID signals
 *						connectId(textId, { emitter:, signal:, callback:, scope: })	Connect signal with text ID
 *						disconnectId(textId)										Disconnect signal by text ID
 *						disconnectAllId()											Disconnect all signals with text IDs
 *						disconnectAll()												Disconnect all signals
 *
 * PanelButtonToggle    hides and restores panel buttons with roles
 *                  Methods:
 *                      hide(role, panelid)					hides button with role=('dateMenu', 'activities', ...)
 *															on panelid=('left', 'center', 'right')
 *                      restore(role)                       restores previously hidden button with role
 *                      restoreAll()						restores all previously hidden buttons
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;

const Main = imports.ui.main;
const SessionMode = imports.ui.sessionMode;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinDebug = Me.imports.dbfindebug;
const _D = dbFinDebug._D;

/* function now: returns current date/time
 * Parameters:
 *     justnumbers == true:  returns in format 'yyyyMMddHHmmss'
 *                 == false: returns in Date.toString() format
 */
function now(justnumbers) {
    let (now = new Date()) {
        if (!justnumbers) {
            return now.toString();
        }
        else {
            // leading0 -- not to have to deal with all the JS Date format mess!
            let (leading0 = function (n) { if (n < 10) return '0' + n; else return '' + n; }) {
                return    now.getFullYear()
                        + leading0(now.getMonth() + 1)
                        + leading0(now.getDate())
                        + leading0(now.getHours())
                        + leading0(now.getMinutes())
                        + leading0(now.getSeconds());
            } // let (leading0)
        } // if (!justnumbers) else
    } // let (now)
}

/* function setBox: sets x1, y1, x2, y2 of box
 */
function setBox(box, x1, y1, x2, y2) {
    box.x1 = x1;
    box.y1 = y1;
    box.x2 = x2;
    box.y2 = y2;
}

/* class ArrayHash: array of pairs [ key, value ]
 */
const ArrayHash = new Lang.Class({
	Name: 'dbFin.Utils.ArrayHash',

	_init: function() {
        _D('>dbFinUtils.ArrayHash._init()');
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<. . .');
	},

	destroy: function() {
        _D('>dbFinUtils.ArrayHash.destroy()');
		this.removeAll();
		this._keys = null;
		this._values = null;
		this.length = null;
        _D('<. . .');
	},

	getKeys: function() {
        _D('>dbFinUtils.ArrayHash.getKeys()');
        _D('<. . .');
		return this._keys.slice();
	},

	getValues: function() {
        _D('>dbFinUtils.ArrayHash.getValues()');
        _D('<. . .');
		return this._values.slice();
	},

	get: function(k) {
        _D('>dbFinUtils.ArrayHash.get()');
		let (i = this._keys.indexOf(k)) {
	        _D('<. . .');
			if (i == -1) return undefined;
			else return this._values[i];
		}
	},

	set: function(k, v) {
        _D('>dbFinUtils.ArrayHash.set()');
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
        _D('<. . .');
	},

	setArray: function(kvs) {
        _D('>dbFinUtils.ArrayHash.setArray()');
		kvs.forEach(Lang.bind(this, function (kv) { this.set(kv[0], kv[1]); }));
        _D('<. . .');
	},

	setMap: function(ks, map) {
        _D('>dbFinUtils.ArrayHash.setMap()');
		ks.forEach(Lang.bind(this, function (k) { this.set(k, map(k)); }));
        _D('<. . .');
	},

	remove: function(k) {
        _D('>dbFinUtils.ArrayHash.remove()');
		let (i = this._keys.indexOf(k)) {
			if (i == -1) {
		        _D('<. . .');
				return undefined;
			}
			else {
				this.length--;
				this._keys.splice(i, 1);
		        _D('<. . .');
				return (this._values.splice(i, 1))[0];
			}
		}
	},

	removeAll: function() {
        _D('>dbFinUtils.ArrayHash.removeAll()');
		for (let i = this.length - 1; i >= 0; --i) {
			this._keys[i] = null;
			this._values[i] = null;
		}
		this._keys = [];
		this._values = [];
		this.length = 0;
        _D('<. . .');
	},

    // sort functions are not optimal
	sort: function(compare) {
        _D('>dbFinUtils.ArrayHash.sort()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1, kv2); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<. . .');
	},

	sortK: function(compare) {
        _D('>dbFinUtils.ArrayHash.sortK()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[0], kv2[0]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<. . .');
	},

	sortV: function(compare) {
        _D('>dbFinUtils.ArrayHash.sortV()');
		let (kvs = this.toArray()) {
			kvs.sort(Lang.bind(this, function (kv1, kv2) { return compare(kv1[1], kv2[1]); }));
			this.removeAll();
			this.setArray(kvs);
		}
        _D('<. . .');
	},

	forEach: function(callback) {
        _D('>dbFinUtils.ArrayHash.forEach()');
		for (let i = 0; i < this.length; ++i) callback(this._keys[i], this._values[i]);
        _D('<. . .');
	},

	toArray: function() {
        _D('>dbFinUtils.ArrayHash.toArray()');
		let (a = []) {
			for (let i = 0; i < this.length; ++i) a.push([this._keys[i], this._values[i]]);
	        _D('<. . .');
			return a;
		}
	},

	toString: function() {
        _D('>dbFinUtils.ArrayHash.toString()');
        _D('<. . .');
		return this.toArray().toString();
	}
});

/* class Signals: keeps track of connected signals
 */
const Signals = new Lang.Class({
    Name: 'dbFin.Utils.Signals',

    _init: function() {
        _D('>dbFinUtils.Signals._init()');
        this._signalsNoId = [];
		this._signalsId = new ArrayHash();
        _D('<. . .');
    },

    destroy: function() {
        _D('>dbFinUtils.Signals.destroy()');
		if (this._signalsNoId && this._signalsId) {
			this.disconnectAll();
			this._signalsNoId = null;
			this._signalsId.destroy();
			this._signalsId = null;
		}
        _D('<. . .');
    },

    connectNoId: function(escs) {
        _D('>dbFinUtils.Signals.connectNoId()');
		let (	emitter = escs['emitter'],
				signal = escs['signal'],
				callback = escs['callback'],
				scope = escs['scope']) {
            let id = emitter.connect(signal, Lang.bind(scope, callback));
			this._signalsNoId.push({ 'id': id, 'emitter': emitter, 'signal': signal });
		}
        _D('<. . .');
    },

	disconnectAllNoId: function() {
        _D('>dbFinUtils.Signals.disconnectAllNoId()');
		while (this._signalsNoId.length) {
			let (ies = this._signalsNoId.pop()) {
				ies['emitter'].disconnect(ies['id']);
			}
		}
        _D('<. . .');
	},

	connectId: function (textId, escs) {
        _D('>dbFinUtils.Signals.connectId()');
		this.disconnectId(textId);
		let (	emitter = escs['emitter'],
				signal = escs['signal'],
				callback = escs['callback'],
				scope = escs['scope']) {
            let id = emitter.connect(signal, Lang.bind(scope, callback));
			this._signalsId.set(textId, { 'id': id, 'emitter': emitter, 'signal': signal });
		}
        _D('<. . .');
	},

	disconnectId: function (textId) {
        _D('>dbFinUtils.Signals.disconnectId()');
		let (ies = this._signalsId.remove(textId)) {
			if (ies !== undefined) {
				ies['emitter'].disconnect(ies['id']);
			}
		}
        _D('<. . .');
	},

	disconnectAllId: function () {
        _D('>dbFinUtils.Signals.disconnectAllId()');
		let (ids = this._signalsId.getKeys()) {
			for (let i = ids.length - 1; i >= 0; --i) {
				this.disconnectId(ids[i]); // not optimal but stable
			}
		}
        _D('<. . .');
	},

	disconnectAll: function () {
        _D('>dbFinUtils.Signals.disconnectAll()');
		this.disconnectAllNoId();
		this.disconnectAllId();
        _D('<. . .');
	}
});

/* class PanelButtonToggle    hides and restores panel buttons with roles
*/
const PanelButtonToggle = new Lang.Class({
	Name: 'dbFin.Utils.PanelButtonToggle',

	_init: function() {
        _D('>dbFinUtils.PanelButtonToggle._init()');
        this._hiddenroles = new ArrayHash();
        _D('<. . .');
	},

	destroy: function() {
        _D('>dbFinUtils.PanelButtonToggle.destroy()');
		if (this._hiddenroles) {
            this.restoreAll(); // This should restore all buttons if they were hidden
            this._hiddenroles.destroy();
            this._hiddenroles = null;
		}
        _D('<. . .');
	},

	// GNOMENEXT: ui/sessionmode.js, ui/panel.js
	hide: function(role, panelid) {
        _D('>dbFinUtils.PanelButtonToggle.hide()');
		if (!this._hiddenroles) {
			_D('this._hiddenroles === null');
	        _D('<. . .');
			return;
		}
		let (panel = SessionMode._modes['user'].panel) {
			if (!panel[panelid]) {
				_D('Panel "' + panelid + '" not found.');
				_D('<. . .');
				return;
			}
			let (i = panel[panelid].indexOf(role)) {
				if (i == -1) {
					_D('<. . .');
					return;
				}
				panel[panelid].splice(i, 1);
				Main.panel._updatePanel();
				this._hiddenroles.set(role, { 'panelid': panelid, 'index': i });
			} // let (i)
		} // let (panel)
        _D('<. . .');
	},

	restore: function(role) {
        _D('>dbFinUtils.PanelButtonToggle.restore()');
		if (!this._hiddenroles) {
			_D('this._hiddenroles === null');
	        _D('<. . .');
			return;
		}
		let (hr = this._hiddenroles.remove(role)) {
			if (hr === undefined) {
		        _D('<. . .');
				return;
			}
			let (	panel = SessionMode._modes['user'].panel,
			     	panelid = hr['panelid'],
			     	i = hr['index']) {
				if (i > panel[panelid].length) i = panel[panelid].length;
				panel[panelid].splice(i, 0, role);
				Main.panel._updatePanel();
			} // let (panel, panelid, i)
		} // let (hr)
        _D('<. . .');
	},

	restoreAll: function() {
        _D('>dbFinUtils.PanelButtonToggle.restoreAll()');
		let (roles = this._hiddenroles.getKeys()) {
			for (let i = roles.length - 1; i >= 0; --i) {
				this.restore(roles[i]); // not optimal but stable
			}
		}
        _D('<. . .');
	}
});
