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
 * dbfintrackerwindow.js
 * Window tracker.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const GLib = imports.gi.GLib;
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

    _init: function(metaWindow, tracker, metaApp, state) {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
        this.metaWindow = metaWindow;
		this._tracker = tracker;
        this.metaApp = metaApp;
        this.state = state || 0;

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
			if (this.windowThumbnail.container) {
				this._signals.connectNoId({ emitter: this.windowThumbnail.container, signal: 'enter-event',
											callback: this._enterEvent, scope: this });
				this._signals.connectNoId({ emitter: this.windowThumbnail.container, signal: 'leave-event',
											callback: this._leaveEvent , scope: this });
			}
        }

		if (this._tracker && this._tracker.hasAppWindowAttention(this.metaApp, this.metaWindow)) {
            this.attention(true);
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
		if (this.hovered) {
			if (this._tracker) this._tracker.windowEvent(this, 'leave');
			this.hovered = false;
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
        let (   focusedWindow = global.display.focus_window,
                focused = this.focused) {
            this.focused = this.metaWindow && focusedWindow
                                && (focusedWindow == this.metaWindow
								||	global.yawl && global.yawl._windowsShowInteresting
									&& focusedWindow.get_transient_for() == this.metaWindow
								);
            if (focused != this.focused) {
                if (this.windowThumbnail && this.windowThumbnail.container) {
                    if (this.focused) this.windowThumbnail.container.add_style_pseudo_class('active');
                    else this.windowThumbnail.container.remove_style_pseudo_class('active');
                }
                if (this._tracker) {
                    this._tracker.windowEvent(this, 'focused');
                }
            }
        }
        _D('<');
	},

    _focusedChanged: function() {
        _D('@' + this.__name__ + '._focusedChanged()');
        this._updateFocused();
        _D('<');
    },

	_updateMinimized: function() {
        _D('>' + this.__name__ + '._updateMinimized()');
        this.minimized =	this.metaWindow
							&& (this.metaWindow.minimized
								||	this.metaWindow.showing_on_its_workspace
									&& !this.metaWindow.showing_on_its_workspace());
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
		if (this.metaWindow && this._tracker) {
			this.metaWindow.foreach_transient(Lang.bind(this, function (metaWindow) {
				let (trackerWindow = this._tracker.getTrackerWindow(metaWindow)) {
					if (trackerWindow) trackerWindow._minimizedChanged();
				}
			}));
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

    attention: function(state) {
        _D('>' + this.__name__ + '.attention()');
        if (this.windowThumbnail && this.windowThumbnail.container) {
            if (state) this.windowThumbnail.container.add_style_pseudo_class('attention');
            else this.windowThumbnail.container.remove_style_pseudo_class('attention');
        }
        _D('<');
    },

    showWindow: function() {
        _D('>' + this.__name__ + '.showWindow()');
        if (this.metaWindow && this._tracker) {
            this._tracker.activateWindow(this.metaWindow);
        }
        _D('<');
    },

    showWindowCloseThumbnails: function() {
        _D('>' + this.__name__ + '.showWindowCloseThumbnails()');
        if (this.metaWindow && this._tracker) {
            this._tracker.activateWindow(this.metaWindow);
            if (global.yawl && global.yawl.panelWindows
                && global.yawl.panelWindows._lastWindowsGroupTrackerApp) {
                global.yawl.panelWindows._lastWindowsGroupTrackerApp.hideWindowsGroup();
            }
        }
        _D('<');
    },

    minimizeWindow: function() {
        _D('>' + this.__name__ + '.minimizeWindow()');
        if (this._tracker) this._tracker.minimizeWindow(this.metaWindow);
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
    },

	closeWindow: function() {
        _D('>' + this.__name__ + '.closeWindow()');
        if (this.metaWindow) this.metaWindow.delete(global.get_current_time && global.get_current_time() || 0);
        _D('<');
	},

	previewWindowOn: function() {
        _D('>' + this.__name__ + '.previewWindowOn()');
		if (this._tracker) this._tracker.windowEvent(this, 'preview-on');
        _D('<');
	},

	previewWindowOff: function() {
        _D('>' + this.__name__ + '.previewWindowOff()');
		if (this._tracker) this._tracker.windowEvent(this, 'preview-off');
        _D('<');
	}
});
Signals.addSignalMethods(dbFinTrackerWindow.prototype);
