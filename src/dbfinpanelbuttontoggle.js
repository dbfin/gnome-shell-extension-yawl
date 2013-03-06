/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinpanelbuttontoggle.js
 * Class to hide and restore panel buttons with roles.
 *
 * dbFinPanelButtonToggle   hides and restores panel buttons with roles
 *                          Methods:
 *                              hide(role, panelid)     hide panel button with role on panel
 *                                                      where panelid=('left', 'center', 'right')
 * 								restore(role)			restore panel button with role
 * 								restoreAll()			restore all panel buttons with roles
 *
 */

const Lang = imports.lang;

const Main = imports.ui.main;
const SessionMode = imports.ui.sessionMode;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinPanelButtonToggle    hides and restores panel buttons with roles
*/
const dbFinPanelButtonToggle = new Lang.Class({
	Name: 'dbFin.PanelButtonToggle',

	_init: function() {
        _D('>dbFinPanelButtonToggle._init()');
        this._hiddenroles = new dbFinArrayHash.dbFinArrayHash();
		this._panelIds = new dbFinArrayHash.dbFinArrayHash();
        _D('<');
	},

	destroy: function() {
        _D('>dbFinPanelButtonToggle.destroy()');
		if (this._hiddenroles) {
            this.restoreAll(); // This should restore all buttons if they were hidden
            this._hiddenroles.destroy();
            this._hiddenroles = null;
		}
		if (this._panelIds) {
			this._panelIds.destroy();
			this._panelIds = null;
		}
        _D('<');
	},

	// GNOMENEXT: ui/sessionmode.js, ui/panel.js
	hide: function(role, panelid) {
        _D('>dbFinPanelButtonToggle.hide()');
		if (!this._hiddenroles || !this._panelIds) {
			_D(!this._hiddenroles ? 'this._hiddenroles === null' : 'this._panelIds === null');
	        _D('<');
			return;
		}
		let (panel = SessionMode._modes['user'].panel) {
			if (!panel || !panel[panelid]) {
				_D('Panel "' + panelid + '" not found.');
				_D('<');
				return;
			}
			if (!this._panelIds.has(panelid)) {
				this._panelIds.set(panelid, panel[panelid].slice()); // store a copy
			}
			let (i = panel[panelid].indexOf(role)) {
				if (i == -1) {
					_D('<');
					return;
				}
				panel[panelid].splice(i, 1);
				this._hiddenroles.set(role, panelid);
				Main.panel._updatePanel();
			} // let (i)
		} // let (panel)
        _D('<');
	},

	restore: function(role) {
        _D('>dbFinPanelButtonToggle.restore()');
		if (!this._hiddenroles || !this._panelIds) {
			_D(!this._hiddenroles ? 'this._hiddenroles === null' : 'this._panelIds === null');
	        _D('<');
			return;
		}
		let (panelid = this._hiddenroles.remove(role)) {
			if (panelid === undefined) {
		        _D('<');
				return;
			}
			let (	panelRoles = SessionMode._modes['user'].panel[panelid],
			     	savedRoles = this._panelIds.get(panelid),
			     	position = 0) {
				if (savedRoles) { // try to restore position
					for (let i = 0; i < savedRoles.length; ++i) {
						if (savedRoles[i] == role) break;
						if (!this._hiddenroles.has(savedRoles[i])) ++position;
					}
				}
				if (position < panelRoles.length) panelRoles.splice(position, 0, role);
				else panelRoles.push(role);
				Main.panel._updatePanel();
			} // let (panelRoles, savedRoles, position)
		} // let (panelid)
        _D('<');
	},

	restoreAll: function() {
        _D('>dbFinPanelButtonToggle.restoreAll()');
		let (roles = this._hiddenroles.getKeys()) {
			for (let i = roles.length - 1; i >= 0; --i) {
				this.restore(roles[i]); // not optimal but stable
			}
		}
        _D('<');
	}
});
