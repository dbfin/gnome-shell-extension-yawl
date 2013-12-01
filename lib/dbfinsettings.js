/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL GNOME Shell Extensions
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * YAWL, a group of GNOME Shell extensions, is provided as
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
 * dbfinsettings.js
 * Working with GSettings.
 *
 */

const Lang = imports.lang;

const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinSettings = new Lang.Class({
	Name: 'dbFin.Settings',

    _init: function() {
        this._signals = new dbFinSignals.dbFinSignals();
		this._variables = [];
        this._objects = [];
		for (let i = 0; i < dbFinConsts.Settings.length; ++i) {
            this.registerVariable(dbFinConsts.Settings[i][0], dbFinConsts.Settings[i][1], dbFinConsts.Settings[i][2]);
        }
    },

	destroy: function() {
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		if (this._variables) {
			this._variables.forEach(Lang.bind(this, function(n) { this[n] = null; this[n + '_'] = {}; }));
			this._variables = [];
		}
        this._objects = [];
	},

    set: function(k, v, s) {
        if (s === undefined || s === null) s = Convenience.getSettings();
        if (!s || !s.list_keys || !k) return;
        if (s.list_keys().indexOf(k) == -1) return;
        if (typeof v == 'boolean') s.set_boolean(k, v);
        else if (typeof v == 'string') s.set_string(k, v);
        else if (typeof v == 'number') s.set_int(k, parseInt('' + v));
    },

    /* parseInt(k, d, p, s): returns a number parsed from settings key:string
     * Parameters:
     *      k               the key
     *      d               default value
     *      p               { min:, max: }
     *      s               settings (uses Convenience.getSettings() by default)
     */
    parseInt: function(k, d, p, s) {
        if (s === undefined || s === null) s = Convenience.getSettings();
        if (!s || !s.list_keys || !k) return d;
        if (s.list_keys().indexOf(k) == -1) return d;
        let (value = parseInt(s.get_string(k))) {
            if (isNaN(value)) return d;
            return dbFinUtils.inRange(value, p.min, p.max, d);
        } // let (value)
    },

    /* getBoolean(k, d, p, s): returns a boolean value from settings key:boolean
     * Parameters:
     * 		k				the key
     *      d               default value
     * 		p				{ }
     *      s               settings (uses Convenience.getSettings() by default)
     */
    getBoolean: function(k, d, p, s) {
        if (s === undefined || s === null) s = Convenience.getSettings();
        if (!s || !s.list_keys || !k) return d;
        if (s.list_keys().indexOf(k) == -1) return d;
        return s.get_boolean(k);
    },

    /* getString(k, d, p, s): returns a string value from settings key:string
     * Parameters:
     * 		k				the key
     *      d               default value
     * 		p				{ }
     *      s               settings (uses Convenience.getSettings() by default)
     */
    getString: function(k, d, p, s) {
        if (s === undefined || s === null) s = Convenience.getSettings();
        if (!s || !s.list_keys || !k) return d;
        if (s.list_keys().indexOf(k) == -1) return d;
        return s.get_string(k);
    },

    /* getInteger(k, d, p, s): returns an integer value from settings key:integer
     * Parameters:
     * 		k				the key
     *      d               default value
     *      p               { min:, max: }
     *      s               settings (uses Convenience.getSettings() by default)
     */
    getInteger: function(k, d, p, s) {
        if (s === undefined || s === null) s = Convenience.getSettings();
        if (!s || !s.list_keys || !k) return d;
        if (s.list_keys().indexOf(k) == -1) return d;
        return dbFinUtils.inRange(s.get_int(k), p.min, p.max, d);
    },

    /* getGlobalSettings(schemaName): returns Gio.Settings object corresponding to schemaName or null
     */
    getGlobalSettings: function(schemaName) {
        if (!schemaName || (schemaName = '' + schemaName) == '') return null;
        let (schemaSource = Gio.SettingsSchemaSource.get_default()) {
            let (schemaObject = schemaSource && schemaSource.lookup(schemaName, true)) {
                return schemaObject ? new Gio.Settings({ settings_schema: schemaObject }) : null;
            }
        }
    },

    /* registerVariable(k, i, p, s)     given key k=='gsettings-key' creates and binds this._gsettingsKey=i,
     *                                  automatically updates it (using additional properties p if needed),
     *                                  and calls associated callbacks
     * 									k				the settings key
     * 									i				the variable's initial value
     * 									p				additional parameters for updating (like { min:, max: })
     *                                  s               settings (uses Convenience.getSettings() by default)
     */
    registerVariable: function(k, i, p, s) {
        if (!this._signals) return;
        if (!k || (k = '' + k) == '' || i === undefined || i === null) return;
        p = p || {};
        if (s === undefined || s === null) s = Convenience.getSettings();
        let (n = this.getNameByKey(k)) {
            let (n_ = n + '_',
                 cn = '_updated' + n[1].toUpperCase() + n.substring(2),
                 un = '_update' + n[1].toUpperCase() + n.substring(2)) {
                if (this[n] !== undefined || this[un] !== undefined) return;
				this._variables.push(n);
                this[n] = i;
                this[n_] = { key: '', callbackName: cn, objects: [] };
				if (s && s.list_keys && s.list_keys().indexOf(k) != -1) {
                    this[n_].key = k;
					this[un] = this._getUpdateFunction(n, p, s);
                    Lang.bind(this, this[un])();
					this._signals.connectNoId({	emitter: s, signal: 'changed::' + k,
												callback: this[un], scope: this });
				}
				else {
					this[un] = null;
				}
            } // let (n_, cn, un)
        } // let (n)
    },

    /* watch(object)                    connects all _updated methods of object to corresponding registered variables
     */
    watch: function(object) {
		if (!object) return;
		this._variables.forEach(Lang.bind(this, function(n) {
			let (cn = this[n + '_'] && this[n + '_'].callbackName) {
				if (cn && object[cn]) {
					Lang.bind(object, object[cn])();
					if (this[n + '_'] && this[n + '_'].objects) {
                        let (i = this[n + '_'].objects.indexOf(object)) {
                            if (i == -1) this[n + '_'].objects.push(object);
                        }
                    }
				}
			}
		}));
        if (this._objects) {
            let (i = this._objects.indexOf(object)) {
				if (i == -1) {
					let (l = this._objects.length) {
						this._objects.push(object);
						if (object.connect) {
							this._signals.connectId('destroy-' + l, {	emitter: object, signal: 'destroy',
																		callback: this.unwatch, scope: this });
						}
						else {
							log('Warning: dbFinSettings.watch: object ' + object.__name__ + ' has no connect method: it should unwatch itself when being destroyed!');
						}
					}
				}
			}
        }
    },

    /* unwatch(object)                  disconnects all _updated methods of object from corresponding registered variables
     */
    unwatch: function(object) {
		if (!object) return;
		this._variables.forEach(Lang.bind(this, function(n) {
			if (this[n + '_'] && this[n + '_'].objects) {
				let (i = this[n + '_'].objects.indexOf(object)) {
					if (i != -1) this[n + '_'].objects.splice(i, 1);
				}
			}
		}));
        if (this._objects) {
            let (i = this._objects.indexOf(object)) {
                if (i != -1) {
                    this._objects.splice(i, 1);
                    this._signals.disconnectId('destroy-' + i);
                }
            }
        }
    },

    /* getNameByKey(k)                  transforms key to variable name
     */
	getNameByKey: function(k) {
		return '_' + ('' + k).replace(/[ \t]/g, '').replace(/\-[^-]+/g, function (m) { return m[1].toUpperCase() + m.substring(2); });
	},

    /* internal functions
     */
    _getUpdateFunction: function(n, p, s) {
		let (uf = null,
		     n_ = n + '_') {
			if (typeof this[n] === 'number') uf = this.parseInt;
			else if (typeof this[n] === 'boolean') uf = this.getBoolean;
			else if (typeof this[n] === 'string') uf = this.getString;
			if (!uf) return null;
			return function() {
				this[n] = Lang.bind(this, uf)(this[n_].key, this[n], p, s);
				if (this[n_].objects) {
					let (cn = this[n_].callbackName) {
						for (let i = 0; i < this[n_].objects.length; ++i) {
							let (o = this[n_].objects[i]) {
								if (o && o[cn]) Lang.bind(o, o[cn])();
							} // let (o)
						} // for (let i)
					} // let (cn)
				} // if (this[n_].objects)
			} // return function()
		} // let (uf, n_)
    }
});
