/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
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
 * dbfinmenubuilder.js
 * Building menus for apps.
 *
 */

const Lang = imports.lang;

const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinConsts = Me.imports.dbfinconsts;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPopupMenuScrollableSection = new Lang.Class({
    Name: 'dbFin.PopupMenuScrollableSection',
    Extends: PopupMenu.PopupMenuSection,

    _init: function() {
        this.parent();
		this.actor = new St.ScrollView({ style_class: 'popup-menu-section-scroll' });
        this.actor.add_actor(this.box);
        this.actor._delegate = this;
        this.actor.clip_to_allocation = true;
    },

    destroy: function() {
		if (this.actor && this.actor.has_style_class_name('popup-menu-section-scroll')) {
			this.actor.destroy();
			this.actor = this.box;
	        this.actor._delegate = this;
		}
        this.parent();
    }
});

const dbFinMenuBuilder = new Lang.Class({
	Name: 'dbFin.MenuBuilder',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._names = new dbFinArrayHash.dbFinArrayHash();
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._names) {
            this._names.destroy();
            this._names = null;
        }
        _D('<');
	},

    build: function(trackerApp, actor, hideMenuMain/* = false*/, hideMenuAddons/* = false*/) {
        _D('>' + this.__name__ + '.build()');
		if (!trackerApp || !trackerApp.metaApp || trackerApp.metaApp.state != Shell.AppState.RUNNING || !actor) {
	        _D('<');
            return null;
		}
		let (	menu = null,
		     	actionGroup = !hideMenuMain && trackerApp.metaApp.menu && trackerApp.metaApp.action_group) {
            // remote menu
			if (actionGroup) {
				menu = new PopupMenu.RemoteMenu(actor, trackerApp.metaApp.menu, actionGroup);
				if (menu && menu.isEmpty()) {
					if (typeof menu.destroy === 'function') menu.destroy();
					menu = null;
				}
			} // if (actionGroup)
            // if no remote menu
			if (!menu) {
                menu = new PopupMenu.PopupMenu(actor, 0.0, St.Side.TOP, 0);
				// set up menu
				if (!hideMenuMain && dbFinConsts.arrayAppMenuItems.length) {
					for (let i = 0; i < dbFinConsts.arrayAppMenuItems.length; ++i) {
						let (   text = _(dbFinConsts.arrayAppMenuItems[i][0]),
								functionName = dbFinConsts.arrayAppMenuItems[i][1]) {
							if (text && text != '' && trackerApp[functionName]) {
								menu.addAction(text, Lang.bind(trackerApp, trackerApp[functionName]));
							}
							else {
								menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
							}
						} // let (text, functionName)
					} // for (let i)
				} // if (dbFinConsts.arrayAppMenuItems.length)
			} // if (!menu)
            // menu add-ons
            if (!hideMenuAddons && menu) {
                if (global.yawl._appQuicklists) {
                    let (mf = this._getMenuFunction('quicklists', 'setQuicklist')) {
                        if (mf) {
                            menu._submenuQuicklists = new dbFinPopupMenuScrollableSection();
							if (menu._submenuQuicklists) {
								mf(trackerApp.metaApp, menu._submenuQuicklists);
								if (menu._submenuQuicklists.isEmpty()) {
									menu._submenuQuicklists.destroy();
									menu._submenuQuicklists = null;
								}
								else {
									menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 0);
									menu.addMenuItem(menu._submenuQuicklists, 0);
								}
							}
                        }
                    }
                }
            }
			if (menu) {
				menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 0);
				menu._app = trackerApp.metaApp;
                menu._tracker = Shell.WindowTracker.get_default();
				menu._openWas = menu.open;
				menu.open = this.open;
			}
            _D('<');
            return menu;
		} // let (menu, actionGroup)
    },

	open: function(animate) {
		_D('>' + this.__name__ + '.open()');
		if (this) {
			if (this._menuWindows) {
				if (typeof this._menuWindows.destroy === 'function') this._menuWindows.destroy();
				this._menuWindows = null;
			}
			if (this._app && this._tracker) {
				// add windows
				let (windows = []) {
					this._app.get_windows().forEach(Lang.bind(this, function (metaWindow) {
						if (!metaWindow || !this._tracker.is_window_interesting(metaWindow)) return;
						windows.push([
								(metaWindow.is_on_all_workspaces() ? -1 : metaWindow.get_workspace().index()),
								metaWindow
						]);
					})); // this._app.get_windows().forEach(metaWindow)
					if (windows.length) {
						this._menuWindows = new PopupMenu.PopupMenuSection();
						windows.sort(function (imwA, imwB) { return imwA[0] - imwB[0]; });
						let (wIndexWas = windows[0][0],
                             focusedWindow = global.display && global.display.focus_window || null) {
							windows.forEach(Lang.bind(this, function ([ wIndex, metaWindow ]) {
								if (wIndex !== wIndexWas) {
									wIndexWas = wIndex;
									this._menuWindows.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
								}
								let (title = metaWindow.get_title()) {
									if (title.length > 33) title = title.substring(0, 30) + '...';
									let (menuItem = this._menuWindows.addAction(title, function () { Main.activateWindow(metaWindow); })) {
                                        if (focusedWindow && (metaWindow === focusedWindow
                                                              || metaWindow === focusedWindow.get_transient_for())) {
                                            menuItem.setShowDot(true);
                                        }
									}
								}
							})); // windows.forEach([ wIndex, metaWindow ])
						} // let (wIndexWas, focusedWindow)
						this.addMenuItem(this._menuWindows, 0);
					}
				} // let (windows)
			} // if (this._app && this._tracker)
			if (this._openWas) Lang.bind(this, this._openWas)(animate);
		} // if (this)
		_D('<');
	},

    _getExtension: function(n, f) {
        _D('>' + this.__name__ + '._getExtension()');
		if (!this._names) {
			_D('<');
			return null;
		}
		let (en = this._names.get(n)) {
			if (en && ExtensionUtils.extensions[en]) {
				_D('<');
				return ExtensionUtils.extensions[en];
			}
			let (re = new RegExp('^' + n + '@')) {
				for (en in ExtensionUtils.extensions) {
					if (ExtensionUtils.extensions.hasOwnProperty(en)
							&& re.test(en)
					    	&& ExtensionUtils.extensions[en]
							&& ExtensionUtils.extensions[en].stateObj
							&& typeof ExtensionUtils.extensions[en].stateObj[f] === 'function') {
						this._names.set(n, en);
						_D('<');
						return ExtensionUtils.extensions[en];
					}
				} // for (en)
			} // let (re)
		} // let (en)
        _D('<');
		return null;
    },

    _getMenuFunction: function(n, f) {
        _D('>' + this.__name__ + '.getMenuFunction()');
		let (e = this._getExtension(n, f)) {
			_D('<');
			return e && e.stateObj[f] || null;
		}
    }
});
