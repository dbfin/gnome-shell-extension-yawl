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
const Signals = imports.signals;

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
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinPopupMenu = Me.imports.dbfinpopupmenu;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTimeout = Me.imports.dbfintimeout;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinActivities = new Lang.Class({
	Name: 'dbFin.Activities',

    _init: function() {
    	_D('>' + this.__name__ + '._init()');

        this._activities = Main.panel && (Main.panel.statusArea || Main.panel._statusArea);
        this._activities = this._activities && this._activities['activities'] || null;
        this._activitiesActor = this._activities && this._activities.actor || null;
        if (!this._activitiesActor || !(this._activities instanceof PanelMenu.Button)) {
            this._activitiesActor = null;
            this._activities = null;
            _D('!Activities button is not found.');
            _D('<');
            return;
        }

		this._signals = new dbFinSignals.dbFinSignals();
        this._timeout = new dbFinTimeout.dbFinTimeout();

        this._bin = new St.Bin({ reactive: true, track_hover: true });
        if (this._bin) {
            this._activitiesActor.add_child(this._bin);
            this._bin.add_style_class_name('alternative-activities-face');
            this._signals.connectNoId({ emitter: this._bin, signal: 'enter-event',
                                        callback: this._activitiesActorEnterEvent, scope: this });
            this._signals.connectNoId({ emitter: this._bin, signal: 'leave-event',
                                        callback: this._activitiesActorLeaveEvent, scope: this });
        }

        this._activitiesActor.reactive = false;
        this._activitiesActor.add_style_class_name('alternative-activities');
        this._signals.connectNoId({ emitter: this._activitiesActor, signal: 'allocate',
                                    callback: this._activitiesActorAllocate, scope: this },
                                  true);
        this._signals.connectNoId({ emitter: this._activitiesActor, signal: 'style-changed',
                                    callback: this._updateLabelWidth, scope: this },
                                  true);

        this.label = this._activitiesActor.label_actor || this._activities._label || this._activities.label;
        if (this.label) {
            this._signals.connectNoId({	emitter: global.screen, signal: 'notify::n-workspaces',
                                        callback: this._updateLabel, scope: this });
            this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
                                        callback: this._updateLabel, scope: this });
            this._labelTextWas = this.label.get_text();
            this._labelXAlignWas = this.label.x_align;
            this.label.x_align = Clutter.ActorAlign.CENTER;
            this._updateLabel();
        }

        this._buildMenu();

        this._updatedStyleForceDefault = function () {
            if (this._activitiesActor) this._activitiesActor.name = 'panelActivities' + (global.yawlAA && global.yawlAA._styleForceDefault ? 'Alternative' : '');
        };
        this._updatedStyleBackground = function () {
            if (this._activitiesActor) {
                dbFinConsts.arrayStyleBackgrounds.forEach(Lang.bind(this, function (row) { this._activitiesActor.remove_style_class_name(row[0]); }));
                if (global.yawlAA && global.yawlAA._styleBackground) {
                    this._activitiesActor.add_style_class_name(dbFinConsts.arrayStyleBackgrounds[global.yawlAA._styleBackground][0]);
                }
            }
        };
        this._updatedMouseScrollTimeout = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawlAA && this._bin) {
                this._clicked = new dbFinClicked.dbFinClicked(this._bin, this._buttonClicked, this,
                                /*single = */true, /*doubleClicks = */false, /*scroll = */true,
                                /*dragAndDrop = */false, /*clickOnRelease = */true, /*longClick = */true,
                                /*clicksTimeThreshold = */null, /*scrollTimeout = */global.yawlAA._mouseScrollTimeout);
            }
		};

        this._signals.connectNoId({ emitter: this._activities.container, signal: 'notify::visible',
                                    callback: this._ensureVisible, scope: this },
                                  true);
        this._ensureVisible();

        global.yawlAA.watch(this);
    	_D('<');
    },

	destroy: function() {
		_D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this._timeout) {
            this._timeout.destroy();
            this._timeout = null;
        }
        if (this._clicked) {
            this._clicked.destroy();
            this._clicked = null;
        }
        this._destroyMenu();
        if (this.label) {
            this.label.set_text(' ');
            this.label.x_align = this._labelXAlignWas;
            this.label.set_text(this._labelTextWas);
            this.label = null;
        }
        if (this._bin) {
            this._bin.destroy();
            this._bin = null;
        }
        if (this._activitiesActor) {
            this._activitiesActor.remove_style_class_name('alternative-activities');
            this._activitiesActor.name = 'panelActivities';
            this._activitiesActor.reactive = true;
            this._activitiesActor = null;
        }
        this._activities = null;
        this.emit('destroy');
		_D('<');
	},

    _activitiesActorAllocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._activitiesActorAllocate()');
        let (childBox = this._bin && this._activitiesActor && new Clutter.ActorBox()) {
            if (childBox) {
                dbFinUtils.setBox(childBox,
                                  Math.min(0, box.x1),
                                  Math.min(0, box.y1),
                                  Math.max(this._activitiesActor.width || 0, box.x2),
                                  Math.max(this._activitiesActor.height || 0, box.y2));
                this._bin.allocate(childBox, flags);
            }
        }
        _D('<');
    },

    _activitiesActorEnterEvent: function() {
        _D('>' + this.__name__ + '._activitiesActorEnterEvent()');
        if (this._activitiesActor) {
            this._activitiesActor.add_style_pseudo_class('hover');
        }
        _D('<');
    },

    _activitiesActorLeaveEvent: function() {
        _D('>' + this.__name__ + '._activitiesActorLeaveEvent()');
        if (this._activitiesActor) {
            this._activitiesActor.remove_style_pseudo_class('hover');
        }
        _D('<');
    },

    _ensureVisible: function() {
        _D('>' + this.__name__ + '._ensureVisible()');
        if (this._activities && this._activities.container && !this._activities.container.visible) {
            if (global.yawl && global.yawl.set && global.yawl._hideActivities) {
                this._timeout.add('ensure-visible-yawl', 250, function () { global.yawl.set('hide-activities', false); }, null, true, true);
            }
            if (this._activities.container) this._activities.container.show();
        }
        _D('<');
    },

    _updateLabel: function() {
        _D('>' + this.__name__ + '._updateLabel()');
        if (this.label) {
            let (workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index()) {
                this.label.set_text(workspaceActiveIndex || workspaceActiveIndex === 0 ? '' + (workspaceActiveIndex + 1) : '?');
                this._updateLabelWidth();
            }
        }
        _D('<');
    },

    _updateLabelWidth: function() {
        _D('>' + this.__name__ + '._updateLabelWidth()');
        if (this.label) {
            let (wln = this.label.get_preferred_width(-1)[1] || 0) {
                this.label.min_width = wln + (this._activities && this._activities._minHPadding || 0) * 2;
                this.label.queue_relayout();
            }
        }
        _D('<');
    },

    _buildMenu: function() {
        _D('>' + this.__name__ + '._buildMenu()');
        this._destroyMenu();
        let (menu = this._activitiesActor && new PopupMenu.PopupMenu(this._activitiesActor, 0.0, St.Side.TOP, 0)) {
            if (menu && menu.actor) {
                this.menu = menu;
                menu.actor.add_style_class_name('alternative-activities');

                menu._yawlAAMenuWorkspaces = new dbFinPopupMenu.dbFinPopupMenuScrollableSection();
                if (menu._yawlAAMenuWorkspaces) menu.addMenuItem(menu._yawlAAMenuWorkspaces);
                menu._yawlAAOpenWas = menu.open;
                menu.open = Lang.bind(menu, this._openMenu);

                this._activitiesMenuWas = this._activities.menu;
                this._activities.setMenu(menu);

                this._menuManager = Main.panel && Main.panel.menuManager || null;
                if (this._menuManager) this._menuManager.addMenu(menu);
            } // if (menu && menu.actor)
        } // let (menu)
        _D('<');
    },

    _destroyMenu: function() {
        _D('>' + this.__name__ + '._destroyMenu()');
        if (this._menuManager) {
            if (this.menu) this._menuManager.removeMenu(this.menu);
            this._menuManager = null;
        }
        if (this.menu) {
            if (this.menu._yawlAAOpenWas) {
                this.menu.open = this.menu._yawlAAOpenWas;
            }
            if (this.menu._yawlAAMenuWorkspaces) {
                this.menu._yawlAAMenuWorkspaces.removeAll();
                this.menu._yawlAAMenuWorkspaces.destroy();
                this.menu._yawlAAMenuWorkspaces = null;
            }
            this.menu = null;
        }
        this._activities.setMenu(this._activitiesMenuWas || null);
        _D('<');
    },

    _openMenu: function(animate) {
        _D('>' + this.__name__ + '._openMenu()');
        if (this._yawlAAMenuWorkspaces) {
            this._yawlAAMenuWorkspaces.removeAll();
            // workspaces and running apps
            let (n_workspaces = global.screen && global.screen.n_workspaces,
                 workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index(),
                 workspaces = [],
                 workspacesApps = []) {
                for (let i = 0; i < n_workspaces; ++i) {
                    workspaces.push(global.screen.get_workspace_by_index(i));
                    workspacesApps.push([]);
                }
                let (metaApps = null,
                     appButtons = global.yawl && global.yawl.panelApps && global.yawl.panelApps._childrenObjects
                                  && global.yawl.panelApps._childrenObjects._keys || null) {
                    if (appButtons) {
                        metaApps =  appButtons
                                    .map(function (appButton) {
                                        return  appButton && appButton.metaApp && appButton.metaApp.state != Shell.AppState.STOPPED
                                                ? appButton.metaApp
                                                : null;
                                    });
                    }
                    else {
                        metaApps =  Shell.AppSystem.get_default().get_running()
                                    .filter(function (metaApp) {
                                        return  metaApp && metaApp.state != Shell.AppState.STOPPED;
                                    });
                    }
                    metaApps.forEach(function (metaApp) {
                        if (!metaApp) return;
                        for (let i = 0; i < n_workspaces; ++i) {
                            if (metaApp.is_on_workspace(workspaces[i])) workspacesApps[i].push(metaApp);
                        }
                    });
                } // let (metaApps, appButtons)
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
                            this._yawlAAMenuWorkspaces.addMenuItem(menuItem);
                        } // if (menuItem && menuItem.actor && menuItem._box)
                    } // let (menuItem, apps)
                } // for (let i)
            } // let (n_workspaces, workspaceActiveIndex, workspaces, workspacesApps)
        } // if (this._yawlAAMenuWorkspaces)
        if (this._yawlAAOpenWas) Lang.bind(this, this._yawlAAOpenWas)(animate);
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
            if (this._activities && (typeof this._activities._onButtonRelease == 'function')) this._activities._onButtonRelease();
            else Main.overview.toggle();
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
			}
		}
        _D('<');
   }
});
Signals.addSignalMethods(dbFinActivities.prototype);
