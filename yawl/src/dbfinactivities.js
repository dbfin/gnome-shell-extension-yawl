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
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Util = imports.misc.util;

const ExtensionSystem = imports.ui.extensionSystem;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinClicked = Me.imports.dbfinclicked;
const dbFinMenuBuilder = Me.imports.dbfinmenubuilder;
const dbFinPopupMenu = Me.imports.dbfinpopupmenu;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinActivities = new Lang.Class({
	Name: 'dbFin.Activities',
    Extends: PanelMenu.Button,

    _init: function() {
    	_D('>' + this.__name__ + '._init()');
        this.parent(0.0, null, true);

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
            if (this.actor) {
                this.actor.add_child(this.label);
                this.actor.label_actor = this.label;
            }
            this._signals.connectNoId({	emitter: global.screen, signal: 'notify::n-workspaces',
                                        callback: this._updateLabel, scope: this });
            this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
                                        callback: this._updateLabel, scope: this });
            this._updateLabel();
        }

        this._buildMenu();

        this._clicked = null;
        this._updatedMouseDragAndDrop =
                this._updatedMouseClickRelease =
                this._updatedMouseLongClick =
                this._updatedMouseScrollTimeout = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawl && this.actor) {
                this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*single = */true, /*doubleClicks = */false,
                                /*scroll = */true, /*dragAndDrop = */false,
                                /*clickOnRelease = */global.yawl._mouseClickRelease || global.yawl._mouseDragAndDrop,
                                /*longClick = */global.yawl._mouseLongClick,
                                /*clicksTimeThreshold = */null/*global.yawl._mouseClicksTimeThreshold*/,
                                /*scrollTimeout = */global.yawl._mouseScrollTimeout);
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
        this._destroyMenu();
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

    _getPreferredWidth: function (actor, forWidth, alloc) {
        this.parent(actor, forWidth, alloc);
        let (wln = actor && actor.label_actor && actor.label_actor.get_preferred_width(-1)[1] || 0) {
            if (wln > alloc.min_size) alloc.min_size = wln;
        }
    },

    _updateLabel: function() {
        _D('>' + this.__name__ + '._updateLabel()');
        if (this.label) {
            let (workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index()) {
                this.label.set_text(workspaceActiveIndex || workspaceActiveIndex === 0 ? '' + (workspaceActiveIndex + 1) : '?');
            }
        }
        _D('<');
    },

    _buildMenu: function() {
        _D('>' + this.__name__ + '._buildMenu()');
        this._destroyMenu();
        let (menu = this.actor && new PopupMenu.PopupMenu(this.actor, 0.0, St.Side.TOP, 0)) {
            if (menu) {
                menu._yawlMenuWorkspaces = new dbFinPopupMenu.dbFinPopupMenuScrollableSection();
                if (menu._yawlMenuWorkspaces) menu.addMenuItem(menu._yawlMenuWorkspaces);
                menu._yawlOpenWas = menu.open;
                menu.open = Lang.bind(menu, this._openMenu);
                // adding menu items
                menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                menu.addAction('\u2692 ' + _("extension preferences"), function () {
                    try { Util.trySpawn([ 'gnome-shell-extension-prefs', 'yawl@dbfin.com' ]); }
                    catch (e) { _D('!Error launching preferences: ' + (e && e.message || e)); }
                });
                menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                menu.addAction('\u27f2 ' + _("reload extension"), function () {
                    try { ExtensionSystem.reloadExtension(Me); }
                    catch (e) { _D('!Error reloading extension: ' + (e && e.message || e)); }
                });
                this.setMenu(menu);
                this._menuManager = Main.panel && Main.panel.menuManager || null;
                if (this._menuManager) this._menuManager.addMenu(this.menu);
            } // if (menu)
        } // let (menu)
        _D('<');
    },

    _destroyMenu: function() {
        _D('>' + this.__name__ + '._destroyMenu()');
        if (this._menuManager) {
            if (this.menu) this._menuManager.removeMenu(this.menu);
            this._menuManager = null;
        }
        if (this.menu && this.menu._yawlMenuWorkspaces) {
            this.menu._yawlMenuWorkspaces.removeAll();
            this.menu._yawlMenuWorkspaces.destroy();
            this.menu._yawlMenuWorkspaces = null;
        }
        this.setMenu(null);
        _D('<');
    },

    _openMenu: function(animate) {
        _D('>' + this.__name__ + '._openMenu()');
        if (this._yawlMenuWorkspaces) {
            this._yawlMenuWorkspaces.removeAll();
            let (n_workspaces = global.screen && global.screen.n_workspaces,
                 workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index(),
                 workspaces = [],
                 workspacesApps = []) {
                for (let i = 0; i < n_workspaces; ++i) {
                    workspaces.push(global.screen.get_workspace_by_index(i));
                    workspacesApps.push([]);
                }
                let (appButtons = global.yawl && global.yawl.panelApps && global.yawl.panelApps._childrenObjects
                                  && global.yawl.panelApps._childrenObjects._keys || null) {
                    if (appButtons && (appButtons = appButtons.filter(function (appButton) {
                            return appButton && appButton.metaApp && appButton.metaApp.state != Shell.AppState.STOPPED;
                        })).length) {
                        appButtons.forEach(function (appButton) {
                            for (let i = 0; i < n_workspaces; ++i) {
                                if (appButton.metaApp.is_on_workspace(workspaces[i])) workspacesApps[i].push(appButton.metaApp);
                            }
                        }); // appButtons.forEach(appButton)
                    } // if (appButtons && appButtons.length)
                } // let (appButtons)
                for (let i = 0; i < n_workspaces; ++i) {
                    let (menuItem = new PopupMenu.PopupBaseMenuItem(),
                         apps = workspacesApps[i]) {
                        if (menuItem) menuItem._box = new St.BoxLayout({ vertical: false, y_align: Clutter.ActorAlign.CENTER, y_expand: false });
                        if (menuItem && menuItem.actor && menuItem._box) {
                            if (menuItem.addActor) menuItem.addActor(menuItem._box);
                            else menuItem.actor.add_actor(menuItem._box);
                            let (label = new St.Label({ text: '' + (i + 1) + ' : ', y_align: Clutter.ActorAlign.CENTER })) {
                                if (label) {
                                    menuItem._box.add_child(label);
                                }
                            }
                            for (let j = 0; j < apps.length; ++j) {
                                if (j >= 10) {
                                    let (label = new St.Label({ text: '...', y_align: Clutter.ActorAlign.END })) {
                                        if (label) {
                                            label.set_style('padding: 0 0 0 12px;');
                                            menuItem._box.add_child(label);
                                        }
                                    }
                                    break;
                                }
                                let (icon = new St.Bin()) {
                                    if (icon) {
                                        icon.set_child(apps[j].create_icon_texture(24) || null);
                                        icon.set_style('padding: 0 0 0 12px;');
                                        icon.x_align = Clutter.ActorAlign.CENTER;
                                        icon.y_align = Clutter.ActorAlign.CENTER;
                                        icon.x_expand = false;
                                        icon.y_expand = false;
                                        menuItem._box.add_child(icon);
                                    }
                                }
                            } // for (let j)
                            if (i === workspaceActiveIndex) {
                                if (menuItem.setShowDot) menuItem.setShowDot(true);
                                else if (menuItem.setOrnament && PopupMenu.Ornament) menuItem.setOrnament(PopupMenu.Ornament.DOT);
                            }
                            menuItem.connect('activate', (function (i) { return function (menuItem, event) {
                                let (workspace = global.screen && global.screen.get_workspace_by_index(i)) {
                                    if (workspace) workspace.activate(global.get_current_time && global.get_current_time() || 0);
                                }
                            }; })(i));
                            this._yawlMenuWorkspaces.addMenuItem(menuItem);
                        } // if (menuItem && menuItem.actor && menuItem._box)
                    } // let (menuItem, apps)
                } // for (let i)
            } // let (n_workspaces, workspaceActiveIndex, workspaces, workspacesApps)
        } // if (this._yawlMenuWorkspaces)
        if (this._yawlOpenWas) Lang.bind(this, this._yawlOpenWas)(animate);
        _D('<');
    },

    _buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!name || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (state.scroll) {
            this.changeWorkspace(state.up ? -1 : 1);
        }
        else if (state.left) {
            if (Main.overview) {
                if (Main.overview.visible) Main.overview.hide();
                else Main.overview.show();
            }
        }
        else if (state.right) {
            if (this.menu) this.menu.toggle();
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
				if (workspace) workspace.activate(global.get_current_time && global.get_current_time() || 0);
			} // let (workspace)
		} // let (workspaceIndex)
        _D('<');
   },

	_onButtonPress: function() {
		// nothing to do here
	}
});
