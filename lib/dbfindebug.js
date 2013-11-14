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
 * dbfindebug.js
 * Debugging: Logging to global._yawlDebugView.log(level, message)
 * 					  and to the standard system log.
 *
 * Use			const _D = Me.imports.dbfindebug._D;	to initialize debugging
 *				_D(msg)									to report a message
 *
 * Messages may have submessages divided by '\n'.
 *
 * The first symbol of every (sub)message may have one of the following special meanings:
 *				'>function_name'			report entrance into a function, this will increase the level
 * 				'@function_name'			report entrance into a 'silent' function, this will increase the level
 * 											no messages will be reported until exiting from the function
 * 				'<'							report exiting from a function, this will decrease the level
 * 				'!'							report in system log (regardless of current level and whether in a silent function)
 *
 * If global.yawl._debugForce == true then everything is reported even in silent functions.
 *
 * Messages of level 0 are also reported to the standard system log.
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinDebug = new Lang.Class({
    Name: 'dbFin.Debug',

    _init: function() {
		this._level = 0;
        this._stoplevel = 0;
    },

    destroy: function() {
    },

    log: function(msg) {
        msg = '' + msg;
		if (!msg.length) return;
		let (msgs = [],
		     force = global.yawl && global.yawl._debugForce) {
			msg.split('\n').forEach(Lang.bind(this, function (s) {
				if (!s.length) return;
				let (shift = 0) {
					if (s[0] == '>') {
						shift = +1;
						if (this._stoplevel) this._stoplevel++;
						s = s.substring(1);
					}
					else if (s[0] == '@') {
						shift = +1;
						this._stoplevel++;
						s = s.substring(1);
					}
					else if (s[0] == '<') {
						shift = -1;
						if (this._level) this._level--;
						s = s.substring(1);
					}
					else if (s[0] == '!') {
						s = s.substring(1);
						if (this._level && s.length) log(s);
					}
					if (s.length
							&& (!this._level && (log(s), true) || !this._stoplevel || force)
							&& global._yawlDebugView && !global._yawlDebugView.paused) {
						msgs.push([ this._level, s ]);
					}
					if (shift == -1) {
						if (this._stoplevel) this._stoplevel--;
					}
					else if (shift == +1) {
						this._level++;
					}
				} // let (shift)
			})); // msg.split('\n').forEach
			if (!msgs.length || !global._yawlDebugView || typeof global._yawlDebugView.log !== 'function') return;
			msgs.forEach(function ([ l, s ]) { Lang.bind(global._yawlDebugView, global._yawlDebugView.log)(l, s); });
		} // let (msgs, force)
    } // log: function
});

let dbfindebug = null;

function _D(msg) {
    if (!msg || (msg = '' + msg) == '') return;
	dbfindebug	? dbfindebug.log(msg)
				: (dbfindebug = new dbFinDebug())
					? dbfindebug.log(msg)
					: log(msg);
}
