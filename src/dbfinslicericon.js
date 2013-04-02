/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinslicericon.js
 * Slicer Icon: Icon in Slicer with animated change of state.
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

const dbFinSlicerIcon = new Lang.Class({
	Name: 'dbFin.SlicerIcon',
    Extends: dbFinSlicerActor.dbFinSlicerActor,

    _init: function(params) {
        _D('>' + this.__name__ + '._init()');
        params = Params.parse(params, { reactive: true, track_hover: true, visible: true }, true);
        this.parent(new St.Bin(params));
        this._icon = null; // icons are never destroyed when new are assigned
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this.actor) {
            this.actor.set_child(null);
            if (this.container) this.container.set_child(null);
            this.actor.destroy();
            this.actor = null;
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
	}
});
