/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfindebug.js
 * Debugging: Logging to file.
 *
 */

const DEBUGLEVEL = 255; // 0: only 0-level messages go to standard log
						// n=1,2,3,...: 0-to-n level messages go to debug.log
const DEBUGSPLIT = true; // true: separate debug file for each session and preferences
						 // false: put date/time header in one file

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
        this.level = 0;
		this.logfilename = debugfilename;
    },

    destroy: function() {
    },

    _log: function(msg) {
        msg = '' + msg;
		if (!msg.length) return;
		let msgs = [];
		let (level = this.level, levelnew = this.level) {
			msg.split('\n').forEach(function (s) {
				while (s.length) {
					if (s[0] == '>') {
                        levelnew++;
						s = s.substring(1);
					}
					else if (s[0] == '<') {
						if (level > 0) {
							level--;
							levelnew--;
						}
						else if (levelnew > 0) {
							levelnew--;
						}
						s = s.substring(1); // in any case, whether level has been decreased or not
					}
					else {
						msgs.push([ level, s ]);
                        level = levelnew;
						break;
					}
				} // while (s.length)
			}); // msg.split().forEach
			this.level = level;
		} // let (level, levelnew)
		if (!msgs.length) return;
		let (gfLog = null, gfosLog = null, gbosLog = null) {
			if (DEBUGLEVEL) {
				if (	   !(gfLog = Gio.file_new_for_path(this.logfilename))
					    || !(gfosLog = gfLog.append_to(/* flags = */Gio.FileCreateFlags.NONE,
													   /* cancellable = */null))
					    || !(gbosLog = Gio.DataOutputStream.new(/* base_stream = */gfosLog))) {
					log('Cannot append to file ' + this.logfilename + '.');
				}
			}
			msgs.forEach(function (ls) {
				let l, s;
				[ l, s ] = ls;
				if (l <= DEBUGLEVEL) {
					if (!DEBUGLEVEL) {
						log(s);
					}
					else {
						while (l-- > 0) {
							s = '.   ' + s;
						}
						if (	   !gbosLog
							    || !gbosLog.put_string(/* str = */s + '\n',
													   /* cancellable = */null)) {
							log(s);
						}
					} // if (!DEBUGLEVEL) else
				} // if (l <= DEBUGLEVEL)
			}); // msgs.forEach
			if (DEBUGLEVEL && gbosLog) {
				gbosLog.close(null);
			}
		} // let gfLog, gfosLog, gbosLog
    } // _log: function
});

function _D(msg) {
    if (!msg || (msg = '' + msg) == '') return;
    if (!dbfinyawldebug) {
		let subdir = '/logs';
        if (GLib.mkdir_with_parents(/* filename = */Me.path + subdir,
				                	/* mode = */parseInt('755', 8)) != 0) {
			subdir = '';
		}
		if (DEBUGSPLIT) {
			dbfinyawldebug = new dbFinYAWLDebug(Me.path + subdir + '/debug_' + dbFinUtils.now(true) + '.log');
		}
		else {
	        dbfinyawldebug = new dbFinYAWLDebug(Me.path + subdir + '/debug.log');
		}
		if (!dbfinyawldebug) {
			log('Cannot create dbFinYAWLDebug object.');
			log(msg);
			return;
		}
		msg = 'dbFinYAWLDebug initialized\n' + msg;
		if (!DEBUGSPLIT) {
			msg = dbFinUtils.now(false) + '\n' + msg;
		}
    } // if (!dbfinyawldebug)
    dbfinyawldebug._log(msg);
}
