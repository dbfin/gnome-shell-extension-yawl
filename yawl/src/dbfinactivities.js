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
const Mainloop = imports.mainloop;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinClicked = Me.imports.dbfinclicked;
const dbFinSignals = Me.imports.dbfinsignals;

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
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
            this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                        callback: function () {
                                            this._minHPadding = 0;
                                            this._natHPadding = 0;
                                        }, scope: this },
                                        /*after = */true);
            this.actor.add_style_class_name('yawl-activities');
        }

        this.label = new St.Label({ style_class: 'yawl-activities-label', text: '?',
                                    x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER,
                                    x_expand: true, y_expand: true });
        if (this.label) {
            if (this.actor) this.actor.add_child(this.label);
            this._signals.connectNoId({	emitter: global.screen, signal: 'notify::n-workspaces',
                                        callback: this._updateLabel, scope: this });
            this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
                                        callback: this._updateLabel, scope: this });
            this._updateLabel();
        }

        this._clicked = null;
        this._updatedMouseDragAndDrop =
                this._updatedMouseClickRelease =
                this._updatedMouseLongClick = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawl && this.actor) {
                this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*single = */true, /*doubleClicks = */false,
                                /*scroll = */true, /*dragAndDrop = */false,
                                /*clickOnRelease = */global.yawl._mouseClickRelease || global.yawl._mouseDragAndDrop,
                                /*longClick = */global.yawl._mouseLongClick);
            }
		};

        global.yawl.watch(this);
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
	},

    _updateLabel: function() {
        _D('>' + this.__name__ + '._updateLabel()');
        if (this.label) {
            let (index = global.screen && global.screen.get_active_workspace_index()) {
                this.label.set_text(index || index === 0 ? '' + (index + 1) : '?');
            }
        }
        _D('<');
    },

    _buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!name || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (state.scroll) {
            if (state.up) {
				Mainloop.timeout_add(33, Lang.bind(this, function() { this.changeWorkspace(-1); }));
            }
            else {
				Mainloop.timeout_add(33, Lang.bind(this, function() { this.changeWorkspace(1); }));
            }
        }
        else if (state.left) {
            if (Main.overview) {
                if (Main.overview.visible) Main.overview.hide();
                else Main.overview.show();
            }
        }
        _D('<');
    },

    changeWorkspace: function (direction) {
        _D('>' + this.__name__ + '.changeWorkspace()');
		if (!direction || !global.screen) {
			_D('<');
			return;
		}
		let (workspaceIndex = global.screen.get_active_workspace_index() + direction) {
			let (workspace = workspaceIndex >= 0 && workspaceIndex < global.screen.n_workspaces
                             && global.screen.get_workspace_by_index(workspaceIndex)) {
				if (workspace) workspace.activate(global.get_current_time());
			} // let (workspace)
		} // let (workspaceIndex)
        _D('<');
   }
});
