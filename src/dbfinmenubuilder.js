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

const AppFavorites = imports.ui.appFavorites;
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
		if (this.actor) {
			this.actor.add_actor(this.box);
			this.actor._delegate = this;
			this.actor.clip_to_allocation = true;
		}
		else if (this.box) {
			this.actor = this.box;
	        this.actor._delegate = this;
		}
    },

    destroy: function() {
		if (this.actor && this.actor.has_style_class_name('popup-menu-section-scroll')) {
            this.actor.remove_actor(this.box);
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
		if (Main.panel && Main.panel.actor) {
			this.menuWindowsManager = new PopupMenu.PopupMenuManager(Main.panel);
		}
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this.menuWindowsManager) {
            this.menuWindowsManager = null;
        }
        if (this._names) {
            this._names.destroy();
            this._names = null;
        }
        _D('<');
	},

    _menuSetProperties: function(menu, metaApp, trackerApp, createPinMenu/* = true*/) {
        _D('>' + this.__name__ + '._menuSetProperties()');
        if (menu) {
            menu._app = metaApp;
            menu._trackerApp = trackerApp;
            menu._tracker = trackerApp && trackerApp._tracker || null;
            if (createPinMenu === undefined || createPinMenu) menu._createPinMenu = true;
			if (menu._addonsPosition !== undefined) {
                menu._menuUpdateAddons = Lang.bind(this, this._menuUpdateAddons);
            }
            if (!menu._openWas) {
                menu._openWas = menu.open;
                menu.open = this.open;
            }
        }
        _D('<');
    },

    _menuUpdateAddons: function(menu, metaApp) {
        _D('>' + this.__name__ + '._menuUpdateAddons()');
        // menu add-ons
        if (!menu || !metaApp || menu._addonsPosition === undefined) {
            _D('<');
            return;
        }
        let (position = menu._addonsPosition >= 0 ? menu._addonsPosition : undefined) {
            if (global.yawl._appQuicklists && !menu._menuQuicklists) {
                let (mf = this._getMenuFunction('quicklists', 'setQuicklist')) {
                    if (mf) {
                        menu._menuQuicklists = new dbFinPopupMenuScrollableSection();
                        if (menu._menuQuicklists) {
                            mf(metaApp, menu._menuQuicklists);
                            if (menu._menuQuicklists.isEmpty()) {
                                menu._menuQuicklists.destroy();
                                menu._menuQuicklists = null;
                            }
                            else {
                                menu.addMenuItem(menu._menuQuicklists, position);
                                menu._menuQuicklistsSeparator = new PopupMenu.PopupSeparatorMenuItem();
                                if (menu._menuQuicklistsSeparator) {
                                    menu.addMenuItem(menu._menuQuicklistsSeparator, position);
                                }
                            }
                        }
                    }
                }
            }
            else if (!global.yawl._appQuicklists && menu._menuQuicklists) {
                if (menu._menuQuicklistsSeparator) {
                    menu._menuQuicklistsSeparator.destroy();
                    menu._menuQuicklistsSeparator = null;
                }
                menu._menuQuicklists.destroy();
                menu._menuQuicklists = null;
            }
        }
        _D('<');
    },

    build: function(trackerApp, actor, empty/* = false*/) {
        _D('>' + this.__name__ + '.build()');
		if (!trackerApp || !actor) {
	        _D('<');
            return null;
		}
        let (metaApp = trackerApp.metaApp,
             state = trackerApp.metaApp && trackerApp.metaApp.state == Shell.AppState.RUNNING ? 2 : 1,
             menu = null) {
            if (!metaApp) {
                _D('<');
                return null;
            }
            if (empty) {
                menu = new PopupMenu.PopupMenu(actor, 0.0, St.Side.TOP, 0);
                this._menuSetProperties(menu, metaApp, trackerApp, false);
                _D('<');
                return menu;
            }
            // remote menu
			if (metaApp.action_group && metaApp.menu) {
				menu = new PopupMenu.RemoteMenu(actor, metaApp.menu, metaApp.action_group);
				if (menu && menu.isEmpty()) {
					if (typeof menu.destroy === 'function') menu.destroy();
					menu = null;
				}
                if (menu) {
                    menu._addonsPosition = 0;
                    this._menuSetProperties(menu, metaApp, trackerApp);
                    _D('<');
                    return menu;
                }
			}
            // if no remote menu
            menu = new PopupMenu.PopupMenu(actor, 0.0, St.Side.TOP, 0);
            if (!menu) {
                _D('<');
                return null;
            }
            // set up menu
            for (let i = 0, p = 0; i < dbFinConsts.arrayAppMenuItems.length; ++i) {
                let (   text = _(dbFinConsts.arrayAppMenuItems[i][0]),
                        functionName = dbFinConsts.arrayAppMenuItems[i][1],
                        inState = dbFinConsts.arrayAppMenuItems[i][2]) {
                    if (!text || !(state & inState)) continue;
                    if (text === 'addons') {
                        menu._addonsPosition = p;
                    }
                    else if (functionName && trackerApp[functionName]) {
                        menu.addAction(text, Lang.bind(trackerApp, trackerApp[functionName]));
                        ++p;
                    }
                    else {
                        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                        ++p;
                    }
                } // let (text, functionName, inState)
            } // for (let i)
            this._menuSetProperties(menu, metaApp, trackerApp);
            _D('<');
            return menu;
        } // let (metaApp, menu)
    },

	open: function(animate) {
		if (this) {
            _D('>' + this.__name__ + '.open()');
			if (this._menuWindows) {
				if (typeof this._menuWindows.destroy === 'function') this._menuWindows.destroy();
				this._menuWindows = null;
			}
			if (this._app && this._tracker) {
				// addons
				if (this._menuUpdateAddons) {
		            this._menuUpdateAddons(this, this._app);
					this._menuUpdateAddons = null;
				}
				// add windows
				let (windows = [],
                     tracker = this._tracker.getTracker()) {
                    if (tracker) this._app.get_windows().forEach(Lang.bind(this, function (metaWindow) {
						if (!metaWindow || !this._tracker.isWindowInteresting(metaWindow)) return;
						windows.push([
								(metaWindow.is_on_all_workspaces() ? -1 : metaWindow.get_workspace().index()),
								metaWindow
						]);
					})); // if (tracker) this._app.get_windows().forEach(metaWindow)
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
									let (menuItem = this._menuWindows.addAction(title, Lang.bind(this, function () {
														if (this._tracker) this._tracker.activateWindow(metaWindow);
                                                    }))) {
                                        if (focusedWindow && (metaWindow === focusedWindow
                                                              || metaWindow === focusedWindow.get_transient_for())) {
                                            menuItem.setShowDot(true);
                                        }
										if (tracker && this._tracker.hasAppWindowAttention(tracker.get_window_app(metaWindow), metaWindow)) {
											menuItem.addActor(new St.Icon({ icon_name: 'dialog-warning', icon_size: 16, x_align: St.Align.END }));
										}
									}
								}
							})); // windows.forEach([ wIndex, metaWindow ])
						} // let (wIndexWas, focusedWindow)
					} // if (windows.length)
				} // let (windows, tracker)
                // add pin menu
                if (this._createPinMenu && this._trackerApp && this._trackerApp._isStable()) {
                    if (!this._menuWindows) {
                        this._menuWindows = new PopupMenu.PopupMenuSection();
                    }
                    else if (!this._menuWindows.isEmpty()) {
                        this._menuWindows.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    }
                    if (this._trackerApp.pin) {
                        this._menuWindows.addAction(_("Remove from Favorites"), Lang.bind(this, function() {
                            if (this._app) AppFavorites.getAppFavorites().removeFavorite(this._app.get_id());
                        }));
                    }
                    else {
                        this._menuWindows.addAction(_("Add to Favorites"), Lang.bind(this, function() {
                            if (this._app) AppFavorites.getAppFavorites().addFavorite(this._app.get_id());
                        }));
                    }
                }
                if (this._menuWindows) {
                    this.addMenuItem(this._menuWindows, 0);
                }
			} // if (this._app && this._tracker)
			if (this._openWas) Lang.bind(this, this._openWas)(animate);
            _D('<');
		} // if (this)
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
