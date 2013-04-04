/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
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

    _init: function(paramsLabel, params) {
        _D('>' + this.__name__ + '._init()');
        paramsLabel = paramsLabel || {};
        params = params || {};
        paramsLabel = Params.parse(paramsLabel, { visible: true }, true);
        this.parent(new St.Label(paramsLabel), params);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this.actor) {
            if (this.container) this.container.set_child(null);
            this.actor.destroy();
            this.actor = null;
        }
        this.parent();
        _D('<');
	},

    getText: function() {
        _D('>' + this.__name__ + '.getText()');
        _D('<');
        return this.actor && this.actor.get_text() || null;
    },

    setText: function(text) {
        _D('>' + this.__name__ + '.setText()');
		if (this.actor) this.actor.set_text(text);
        _D('<');
    }
});
