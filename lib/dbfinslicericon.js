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
 * dbfinslicericon.js
 * Slicer Icon: Icon in Slicer with animated change of state.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const Params = imports.misc.params;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSlicerActor = Me.imports.dbfinsliceractor;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerIcon = new Lang.Class({
	Name: 'dbFin.SlicerIcon',
    Extends: dbFinSlicerActor.dbFinSlicerActor,

    _init: function(paramsBin, paramsContainer, params) {
        _D('>' + this.__name__ + '._init()');
        paramsBin = paramsBin || {};
		paramsContainer = paramsContainer || {};
        params = params || {};
        paramsBin = Params.parse(paramsBin, { reactive: true,
                                              track_hover: true,
                                              pivot_point: new Clutter.Point({ x: 0.5, y: 0.5 }),
                                              visible: true }, true);
        this.parent(new St.Bin(paramsBin), paramsContainer, params);
        this._icon = null; // icons are never destroyed when new are assigned
        this._zoom = 1.0;
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this.actor) {
            this.actor.set_child(null);
        }
		this._icon = null;
        this.parent();
        _D('<');
	},

	getIcon: function() {
        _D('>' + this.__name__ + '.getIcon()');
        _D('<');
        return this._icon;
	},

	setIcon: function(icon) {
        _D('>' + this.__name__ + '.setIcon()');
		if (icon !== undefined && this._icon != icon) { // icon can be null!
			this._icon = icon;
            if (this.actor) this.actor.set_child(icon);
			this.restoreNaturalSize();
		}
        _D('<');
	},

	getZoom: function() {
        _D('>' + this.__name__ + '.getZoom()');
        _D('<');
        return this._zoom;
	},

	setZoom: function(zoom, time, transition) {
        _D('>' + this.__name__ + '.setZoom()');
		if (!isNaN(zoom = parseFloat(zoom)) && this._zoom != zoom) {
			this._zoom = zoom;
            this.animateActorToState({  scale_x: zoom, scale_y: zoom }, function () {
                if (this.actor) this.actor.queue_relayout();
            }, this, time, transition);
		}
        _D('<');
	}
});
