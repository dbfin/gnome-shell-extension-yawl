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
        this.metaApp = metaApp;

        this.appName = '?';
		if (this.metaApp && this.metaApp.get_name) {
			try { this.appName = this.metaApp.get_name(); } catch (e) { this.appName = '?'; }
		}

		this.title = '?';
		this._updateTitle();
        this._signals.connectNoId({ emitter: this.metaWindow, signal: 'notify::title',
                                    callback: this._titleChanged, scope: this });

        this.focused = false;
        this._updateFocused();
        this._signals.connectNoId({ emitter: global.display.connect, signal: 'notify::focus-window',
                                    callback: this._updateFocused, scope: this });

        this.minimized = false;
        this._updateMinimized();
        this._signals.connectNoId({ emitter: this.metaWindow, signal: 'notify::minimized',
                                    callback: this._minimizedChanged, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this.minimized = false;
        this.focused = false;
		this.title = '?';
		this.appName = '?';
        this.metaApp = null;
		this._tracker = null;
        this.metaWindow = null;
        _D('<');
	},

	_updateTitle: function() {
        _D('>' + this.__name__ + '._updateTitle()');
		if (this.metaWindow && this.metaWindow.get_title) {
			try { this.title = this.metaWindow.get_title(); } catch (e) { this.title = '?'; }
		}
        _D('<');
	},

	_titleChanged: function() {
        _D('@' + this.__name__ + '._titleChanged()'); // This is called too often, debug will cause lots of records
        let (title = this.title) {
			this._updateTitle();
			if (this._tracker && title !== this.title) {
                this._tracker.update(null, '"' + this.appName + ':' + title + '" changed title to "' + this.title + '".');
            }
        }
        _D('<');
	},

	_updateFocused: function() {
        _D('>' + this.__name__ + '._updateFocused()');
        let (focusedWindow = global.display.focus_window) {
            this.focused = this.metaWindow && focusedWindow
                                && (focusedWindow == this.metaWindow
                                    || focusedWindow.get_transient_for() == this.metaWindow);
        }
        _D('<');
	},

	_updateMinimized: function() {
        _D('>' + this.__name__ + '._updateMinimized()');
        this.minimized = this.metaWindow
                && (this.metaWindow.showing_on_its_workspace && !this.metaWindow.showing_on_its_workspace()
                    || this.metaWindow.minimized);
        _D('<');
	},

	_minimizedChanged: function() {
        _D('@' + this.__name__ + '._minimizedChanged()'); // This is called too often, debug will cause lots of records
        let (minimized = this.minimized) {
			this._updateMinimized();
			if (this._tracker && minimized !== this.minimized) {
                this._tracker.update(null, '"' + this.appName + ':' + this.title + '" was '
                                     + (this.minimized ? '' : 'un') + 'minimized.');
            }
        }
        _D('<');
	}
});
