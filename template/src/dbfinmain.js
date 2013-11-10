/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL Gnome-Shell Extensions
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * YAWL, a group of Gnome-Shell extensions, is provided as
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
 * dbfin#%#name.js
 * Main class.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFin#%#Name = new Lang.Class({
    Name: 'dbFin.#%#Name',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		global.yawl#%#Name = new dbFinSettings.dbFinSettings();
		if (!global.yawl#%#Name) {
			_D('!#%#ExtensionName: critical error "Cannot create global object."');
			_D('<');
			return;
		}

        this._signals = new dbFinSignals.dbFinSignals();

        this._updatedFirstTime = function () {
        	if (global.yawl#%#Name && global.yawl#%#Name._firstTime) global.yawl#%#Name.set('first-time', false);
        }

        global.yawl#%#Name.watch(this);
        _D('<');
    },

    destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        if (global.yawl#%#Name) { // must be destroyed last
            global.yawl#%#Name.destroy();
            global.yawl#%#Name = null;
        }
        this.emit('destroy');
        _D('<');
    }
});
Signals.addSignalMethods(dbFin#%#Name.prototype);
