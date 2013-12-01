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
 * dbfintimeout.js
 * Mainloop's timeouts wrapper.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const TIMEOUT_MINIMUM = 33; // 1/30 second

const dbFinTimeout = new Lang.Class({
	Name: 'dbFin.Timeout',

    _init: function() {
    	_D('>' + this.__name__ + '._init()');
        this._timeouts = new dbFinArrayHash.dbFinArrayHash();
    	_D('<');
    },

	destroy: function() {
		_D('>' + this.__name__ + '.destroy()');
        if (this._timeouts) {
            this.removeAll();
            this._timeouts.destroy();
            this._timeouts = null;
        }
		_D('<');
	},

    add: function(name, time, callback, scope, autoremove/* = true*/, idle/* = false*/) {
        _D('>' + this.__name__ + '.add(' + name + ', ' + time + ')');
        if (!name || !callback || !this._timeouts) {
            _D(!name ? 'name == null' : !callback ? 'callback == null' : 'this._timeouts == null');
            _D('<');
            return;
        }
        this.remove(name = '' + name);
        if (!time || time < TIMEOUT_MINIMUM) time = TIMEOUT_MINIMUM;
        let (ids = [], callback_ = null) {
            callback_ = autoremove || idle
                    ?   Lang.bind(this, function () {
                            this.remove(name);
                            (scope ? Lang.bind(scope, callback) : callback)();
                        })
                    :   (scope ? Lang.bind(scope, callback) : callback);
            this._timeouts.set(name, ids);
            ids.push(Mainloop.timeout_add(time, callback_));
            if (idle) ids.push(Mainloop.idle_add(callback_));
        }
        _D('<');
    },

    remove: function(name) {
        _D('>' + this.__name__ + '.remove(' + name + ')');
        if (!name || !this._timeouts) {
            _D(!name ? 'name == null' : 'this._timeouts == null');
            _D('<');
            return;
        }
        let (ids = this._timeouts.remove(name = '' + name)) {
            if (ids && ids.length) {
                ids.forEach(function (id) { if (id) Mainloop.source_remove(id); });
            }
        }
        _D('<');
    },

    removeAll: function() {
        _D('>' + this.__name__ + '.removeAll()');
        if (this._timeouts) {
            this._timeouts.forEach(Lang.bind(this, function (name, ids) { this.remove(name) })); // not efficient, but stable
        }
        _D('<');
    }
});
