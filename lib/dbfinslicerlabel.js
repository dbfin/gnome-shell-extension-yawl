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
 * dbfinslicerlabel.js
 * Slicer Label: Label in Slicer with animated change of state.
 *
 */

const Lang = imports.lang;

const St = imports.gi.St;

const Params = imports.misc.params;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSlicerActor = Me.imports.dbfinsliceractor;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerLabel = new Lang.Class({
	Name: 'dbFin.SlicerLabel',
    Extends: dbFinSlicerActor.dbFinSlicerActor,

    _init: function(paramsLabel, paramsContainer, params) {
        _D('>' + this.__name__ + '._init()');
        paramsLabel = paramsLabel || {};
		paramsContainer = paramsContainer || {};
        params = params || {};
        paramsLabel = Params.parse(paramsLabel, { visible: true }, true);
        this.parent(new St.Label(paramsLabel), paramsContainer, params);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        this.parent();
        _D('<');
	},

    getText: function() {
        _D('>' + this.__name__ + '.getText()');
        _D('<');
        return this.actor && this.actor.get_text();
    },

    setText: function(text) {
        _D('>' + this.__name__ + '.setText()');
		if (this.actor) this.actor.set_text('' + text || ' ');
        _D('<');
    }
});
