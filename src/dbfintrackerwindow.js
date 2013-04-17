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
const Signals = imports.signals;

const Meta = imports.gi.Meta;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSignals = Me.imports.dbfinsignals;
const dbFinWindowThumbnail = Me.imports.dbfinwindowthumbnail;

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

        this.windowThumbnail = new dbFinWindowThumbnail.dbFinWindowThumbnail(metaWindow, this);

        this.minimized = false;
        this._updateMinimized();
        this._signals.connectNoId({ emitter: this.metaWindow, signal: 'notify::minimized',
                                    callback: this._minimizedChanged, scope: this });

        this.focused = false;
        this._updateFocused();
        this._signals.connectNoId({ emitter: global.display, signal: 'notify::focus-window',
                                    callback: this._focusedChanged, scope: this });

        if (this.metaWindow) {
            this._signals.connectNoId({ emitter: this.metaWindow, signal: 'notify::title',
                                        callback: this._titleChanged, scope: this });
        }

        this.hovered = false;
		if (this.windowThumbnail) {
			if (this.windowThumbnail.actor) {
				this._signals.connectNoId({ emitter: this.windowThumbnail.actor, signal: 'enter-event',
											callback: this._enterEvent, scope: this });
				this._signals.connectNoId({ emitter: this.windowThumbnail.actor, signal: 'leave-event',
											callback: this._leaveEvent , scope: this });
			}
        }
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        if (this.windowThumbnail) {
            this.windowThumbnail.destroy();
            this.windowThumbnail = null;
        }
        this.minimized = false;
        this.focused = false;
		this.title = '?';
		this.appName = '?';
        this.metaApp = null;
		this._tracker = null;
        this.metaWindow = null;
        this.emit('destroy');
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
        _D('@' + this.__name__ + '._titleChanged()');
        let (title = this.title) {
			this._updateTitle();
			if (this._tracker && title !== this.title) {
                this._tracker.windowEvent(this, 'title', { titleWas: title });
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

    _focusedChanged: function() {
        _D('@' + this.__name__ + '._focusedChanged()');
        let (focused = this.focused) {
            this._updateFocused();
            if (this._tracker && focused !== this.focused) {
                this._tracker.windowEvent(this, 'focused');
            }
        }
        _D('<');
    },

	_updateMinimized: function() {
        _D('>' + this.__name__ + '._updateMinimized()');
        this.minimized = this.metaWindow
                && (this.metaWindow.showing_on_its_workspace && !this.metaWindow.showing_on_its_workspace()
                    || this.metaWindow.minimized);
        if (this.windowThumbnail) this.windowThumbnail.minimized = this.minimized;
        _D('<');
	},

	_minimizedChanged: function() {
        _D('@' + this.__name__ + '._minimizedChanged()');
        let (minimized = this.minimized) {
			this._updateMinimized();
			if (this._tracker && minimized !== this.minimized) {
                this._tracker.windowEvent(this, 'minimized');
            }
        }
        _D('<');
	},

    _enterEvent: function(text) {
        _D('>' + this.__name__ + '._enterEvent()');
        this.hovered = true;
		if (this._tracker) this._tracker.windowEvent(this, 'enter');
        _D('<');
    },

    _leaveEvent: function(text) {
        _D('>' + this.__name__ + '._leaveEvent()');
        this.hovered = false;
		if (this._tracker) this._tracker.windowEvent(this, 'leave');
        _D('<');
    },

    showWindow: function() {
        _D('>' + this.__name__ + '.showWindow()');
        if (this.metaWindow && !this.focused) Main.activateWindow(this.metaWindow);
        _D('<');
    },

    minimizeWindow: function() {
        _D('>' + this.__name__ + '.minimizeWindow()');
        if (this.metaWindow) this.metaWindow.minimize();
        _D('<');
    },

    maximizeWindowToggle: function() {
        _D('>' + this.__name__ + '.maximizeWindowToggle()');
        if (this.metaWindow) {
            if ((this.metaWindow.get_maximized() & (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL))
                                                == (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL)) {
                this.metaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
            else {
                this.metaWindow.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
        }
        _D('<');
    }
});
Signals.addSignalMethods(dbFinTrackerWindow.prototype);
