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

const TIMEOUT_MINIMUM = 33; // 1/30 second

const dbFinTimeout = new Lang.Class({
	Name: 'dbFin.Timeout',

    _init: function() {
        this._timeouts = new dbFinArrayHash.dbFinArrayHash();
    },

	destroy: function() {
        if (this._timeouts) {
            this.removeAll();
            this._timeouts.destroy();
            this._timeouts = null;
        }
	},

    add: function(name, time, callback/* = null*/, scope/* = null*/, autoremove/* = false*/, idle/* = false*/, cancelIfExists/* = false*/) {
        if (!name || !this._timeouts) {
            log('Warning: dbFinTimeout.add: ' + (!name ? 'name == null' : 'this._timeouts == null'));
            return;
        }
        name = '' + name;
        if (!cancelIfExists) this.remove(name);
        else if (this._timeouts.has(name)) return;
        if (!time || time < TIMEOUT_MINIMUM) time = TIMEOUT_MINIMUM;
        if (!callback) callback = function () {};
        else if (scope) callback = Lang.bind(scope, callback);
        let (ids = [], callback_ = null) {
            callback_ = (function (name, callback, autoremove, idle, remove) {
                return autoremove || idle
                    ?   function () {
                            remove(name);
                            callback();
                        }
                    :   callback;
            })(name, callback, autoremove, idle, Lang.bind(this, this.remove));
            this._timeouts.set(name, ids);
            ids.push(Mainloop.timeout_add(time, callback_));
            if (idle) ids.push(Mainloop.idle_add(callback_));
        }
    },

    remove: function(name) {
        if (!name || !this._timeouts) {
            log('Warning: dbFinTimeout.remove: ' + (!name ? 'name == null' : 'this._timeouts == null'));
            return false;
        }
        let (ids = this._timeouts.remove(name = '' + name)) {
            if (ids && ids.length) {
                ids.forEach(function (id) { if (id) Mainloop.source_remove(id); });
                return true;
            }
        }
        return false;
    },

    removeAll: function() {
        if (this._timeouts) {
            this._timeouts.forEach(Lang.bind(this, function (name, ids) { this.remove(name) })); // not efficient, but stable
        }
    },

    has: function(name) {
        return name && this._timeouts && this._timeouts.has(name);
    }
});
