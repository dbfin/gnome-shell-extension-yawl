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
 * dbfinactivities.js
 * Alternative Activities button.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSignals = Me.imports.dbfinsignals;
//const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinActivities = new Lang.Class({
	Name: 'dbFin.Activities',
    Extends: PanelMenu.Button,

    _init: function() {
    	_D('>' + this.__name__ + '._init()');
        this.parent(0.0, null);

		this._signals = new dbFinSignals.dbFinSignals();

        if (this.container) {
            this.container.add_style_class_name('panel-button-container');
            if (global.yawl && global.yawl.panelTools) {
                global.yawl.panelTools.add_child(this.container);
            }
        }

        this._minHPadding = 0;
        this._natHPadding = 0;
        if (this.actor) {
            this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                        callback: function () {
                                            this._minHPadding = 0;
                                            this._natHPadding = 0;
                                        }, scope: this },
                                        /*after = */true);
        }

        this.label = new St.Label({ style_class: 'yawl-activities-label', text: '0', y_align: Clutter.ActorAlign.FILL, y_expand: true });
        if (this.label) {
            if (this.actor) this.actor.add_child(this.label);
        }
    	_D('<');
    },

	destroy: function() {
		_D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this.label) {
            this.label.destroy();
            this.label = null;
        }
        if (this.container) {
            if (global.yawl && global.yawl.panelTools) global.yawl.panelTools.remove_child(this.container);
        }
        this.parent();
		_D('<');
	}
});
