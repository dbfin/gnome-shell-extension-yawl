/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfintrackerwindow.js
 * Window tracker.
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinTrackerWindow: all stuff associated with a window
 */
const dbFinTrackerWindow = new Lang.Class({
	Name: 'dbFin.TrackerWindow',

    _init: function(metaWindow, tracker, metaApp) {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
        this.metaWindow = metaWindow;
		this._tracker = tracker;
		this.windowTitle = '?';
		this._updateTitle();
        this.metaApp = metaApp;

        this.appName = '?';
		if (this.metaApp && this.metaApp.get_name) {
			try { this.appName = this.metaApp.get_name(); } catch (e) { this.appName = '?'; }
		}

        this._signals.connectNoId({ emitter: this.metaWindow, signal: 'notify::title',
                                    callback: this._titleChanged, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this.metaWindow = null;
		this._tracker = null;
		this.windowTitle = '?';
        this.metaApp = null;
		this.appName = '?';
        _D('<');
	},

	_titleChanged: function(metaWindow) {
        _D('@' + this.__name__ + '._titleChanged()'); // This is called too often, debug will cause lots of records
		if (metaWindow != this.metaWindow) {
	        _D('<');
			return;
		}
		let (msg = '"' + this.appName + ':' + this.windowTitle + '" changed title to "') {
			this._updateTitle();
			if (this._tracker) this._tracker.update(null, msg + this.windowTitle + '".');
		}
        _D('<');
	},

	_updateTitle: function() {
        _D('>' + this.__name__ + '._updateTitle()');
		if (this.metaWindow && this.metaWindow.get_title) {
			try { this.windowTitle = this.metaWindow.get_title(); } catch (e) { this.windowTitle = '?'; }
		}
        _D('<');
	},
});
