/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfindebug.js
 * Debugging: Logging to file (or standard system log).
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
 *
 * Messages of level 0 are also reported to the standard system log.
 *
 */

const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

var dbfinyawldebug = null;

const dbFinYAWLDebug = new Lang.Class({
    Name: 'dbFin.YAWL.Debug',

    _init: function(debugfilename) {
        this._prefix = '';
        this._stoplevel = 0;
		this._lastlength = 0;
		this._lastlengthlog = 0;
		this.logfilename = debugfilename;
    },

    destroy: function() {
    },

    log: function(msg) {
        msg = '' + msg;
		if (!msg.length) return;
		let (msgs = []) {
			msg.split('\n').forEach(Lang.bind(this, function (s) {
				if (!s.length) return;
				let (shift = 0) {
					if (s[0] == '>') {
						shift = +1;
						if (this._stoplevel) this._stoplevel++;
						s = String.fromCharCode(0x250d) + s.substring(1);
					}
					else if (s[0] == '@') {
						shift = +1;
						this._stoplevel++;
						s = String.fromCharCode(0x250d) + s.substring(1);
					}
					else if (s[0] == '<') {
						shift = -1;
						if (this._prefix.length) this._prefix = this._prefix.substring(4);
						s = String.fromCharCode(0x2514) + dbFinUtils.stringRepeat(String.fromCharCode(0x2500), 7) + s.substring(1);
					}
					if (!this._stoplevel && s.length) {
						if (!this._prefix.length) {
							let (slog = s) {
								if (shift == -1 && slog.length < this._lastlengthlog)
									slog += dbFinUtils.stringRepeat(String.fromCharCode(0x2500), this._lastlengthlog - slog.length);
								log(slog);
								this._lastlengthlog = slog.length;
							}
						}
						s = this._prefix + s;
						if (shift == -1 && s.length < this._lastlength) {
							s += dbFinUtils.stringRepeat(String.fromCharCode(0x2500), this._lastlength - s.length);
						}
						msgs.push(s);
						this._lastlength = s.length;
					}
					if (shift == -1) {
						if (this._stoplevel) this._stoplevel--;
					}
					else if (shift == +1) {
						this._prefix = String.fromCharCode(0x2502) + '   ' + this._prefix;
					}
				} // let (shift)
			})); // msg.split('\n').forEach
			if (!msgs.length) return;
			let (gfLog = null, gfosLog = null, gbosLog = null) {
				if (	   !(gfLog = Gio.file_new_for_path(this.logfilename))
						|| !(gfosLog = gfLog.append_to(/* flags = */Gio.FileCreateFlags.NONE,
													   /* cancellable = */null))
						|| !(gbosLog = Gio.DataOutputStream.new(/* base_stream = */gfosLog))) {
					log('Cannot append to file ' + this.logfilename + '.');
				}
				msgs.forEach(function (s) {
					if (	   !gbosLog
							|| !gbosLog.put_string(/* str = */s + '\n',
												   /* cancellable = */null)) {
						log(s);
					}
				}); // msgs.forEach
				if (gbosLog) {
					gbosLog.close(null);
				}
			} // let gfLog, gfosLog, gbosLog
		} // let (msgs)
    } // log: function
});

function ensuredbFinYAWLDebug() {
    if (!dbfinyawldebug) {
		let subdir = '/logs';
        if (GLib.mkdir_with_parents(/* filename = */Me.path + subdir,
				                	/* mode = */parseInt('755', 8)) != 0) {
			subdir = '';
		}
		dbfinyawldebug = new dbFinYAWLDebug(Me.path + subdir + '/debug_' + dbFinUtils.now(true) + '.log');
		if (!dbfinyawldebug) {
			log('Cannot create dbFinYAWLDebug object.');
			return false;
		}
		dbfinyawldebug.log('dbFinYAWLDebug initialized.');
    } // if (!dbfinyawldebug)
	return true;
}

function _D(msg) {
    if (!msg || (msg = '' + msg) == '') return;
	ensuredbFinYAWLDebug() ? dbfinyawldebug.log(msg) : log(msg);
}
