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

const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinConsts = Me.imports.dbfinconsts;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

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

    build: function(trackerApp, actor) {
        _D('>' + this.__name__ + '.build()');
		if (!trackerApp || !trackerApp.metaApp || trackerApp.metaApp.state != Shell.AppState.RUNNING || !actor) {
	        _D('<');
            return null;
		}
		let (	menu = null,
		     	actionGroup = trackerApp.metaApp.menu && trackerApp.metaApp.action_group) {
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
				// set up menu
				if (dbFinConsts.arrayAppMenuItems.length) {
					menu = new PopupMenu.PopupMenu(actor, 0.0, St.Side.TOP, 0);
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
            if (menu) {
                if (global.yawl._appQuicklists) {
                    let (mf = this._getMenuFunction('quicklists', 'setQuicklist')) {
                        if (mf) mf(trackerApp.metaApp, menu);
                    }
                }
            }
			if (menu && menu.isEmpty()) {
				if (typeof menu.destroy === 'function') menu.destroy();
				menu = null;
			}
            _D('<');
            return menu;
		} // let (menu, actionGroup)
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