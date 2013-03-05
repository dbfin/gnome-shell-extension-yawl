/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfintrackerapp.js
 * App tracker.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAppButton = Me.imports.dbfinappbutton;
const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinTrackerApp: all stuff associated with an app
 */
const dbFinTrackerApp = new Lang.Class({
	Name: 'dbFin.TrackerApp',

    _init: function(metaApp, tracker, metaWindow, autoHideShow/* = false*/) {
        _D('>dbFinTrackerApp._init()');
		this._signals = new dbFinUtils.Signals();
		this.metaApp = metaApp;
		this._tracker = tracker;
        this.windows = (metaWindow ? [ metaWindow ] : []);

        this.appName = '?';
		if (this.metaApp && this.metaApp.get_name) {
			try { this.appName = this.metaApp.get_name(); } catch (e) { this.appName = '?'; }
		}
		this._autohideshow = autoHideShow || false;

        this.appButton = new dbFinAppButton.dbFinAppButton(metaApp, this._tracker, this);
		if (this.appButton && !metaWindow && this._autohideshow) this.appButton.hide();

		this._focused = false;
		this._updateFocused();
		if (this._tracker && this._tracker.getTracker) {
			this._signals.connectNoId({	emitter: this._tracker.getTracker(), signal: 'notify::focus-app',
										callback: this._updateFocused, scope: this });
		}

        this._nextWindowsTimeout = null;
		this._resetNextWindows();
        _D('<');
    },

	destroy: function() {
        _D('>dbFinTrackerApp.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        this._resetNextWindows();
        if (this.appButton) {
            this.appButton.destroy();
            this.appButton = null;
        }
		this.metaApp = null;
		this._tracker = null;
        this.windows = [];
		this.appName = '?';
		this._focused = false;
        _D('<');
	},

	_updateFocused: function() {
        _D('@dbFinTrackerApp._updateFocused()'); // This is called too often, debug will cause lots of records
        if (!this._tracker || !this._tracker.getTracker) {
            _D(!this._tracker ? 'this._tracker === null' : 'this._tracker.getTracker === null');
            _D('<');
            return;
        }
		let (focused = (this.metaApp == this._tracker.getTracker().focus_app)) {
			if (this._focused !== focused) {
		        this._focused = focused;
                if (this.appButton && this.appButton.actor) {
                    if (this._focused) this.appButton.actor.add_style_pseudo_class('active');
                    else this.appButton.actor.remove_style_pseudo_class('active');
                }
				//this._resetNextWindows(); // this gets called every time a window of the same application is changed
			} // if (this._focused !== focused)
		} // let (focused)
        _D('<');
	},

    addWindow: function(metaWindow) {
        _D('>dbFinTrackerApp.addWindow()');
        if (metaWindow && this.windows && this.windows.indexOf(metaWindow) == -1) {
            if (this._autohideshow && !this.windows.length && this.appButton) this.appButton.show();
			this.windows.push(metaWindow);
			this._resetNextWindows();
		}
        _D('<');
    },

    removeWindow: function(metaWindow) {
        _D('>dbFinTrackerApp.removeWindow()');
        if (metaWindow && this.windows) {
            let (i = this.windows.indexOf(metaWindow)) {
                if (i != -1) {
					this.windows.splice(i, 1);
					this._resetNextWindows();
				}
            }
            if (this._autohideshow && !this.windows.length && this.appButton) this.appButton.hide();
        }
        _D('<');
    },

	_listWindowsFresh: function(minimized/* = false*/) {
        _D('>dbFinTrackerApp._listWindowsFresh()');
		if (!this.metaApp || this.metaApp.state == Shell.AppState.STOPPED) {
			_D('<');
			return [];
		}
		let (windows = []) {
			let (workspace = global.screen.get_active_workspace()) {
				windows = this.metaApp.get_windows().slice().filter(function (window) {
					return window.get_workspace() == workspace && (minimized || window.showing_on_its_workspace());
                });
			} // let (workspace)
	        _D('<');
			return windows;
		} // let (windows)
	},

    _resetNextWindows: function() {
        _D('>dbFinTrackerApp._resetNextWindows()');
        this._cancelNextWindowsTimeout();
		this._nextWindowsWorkspace = null;
        this._nextWindowsLength = 0;
        this._nextWindowsIndex = 0;
        _D('<');
    },

    _cancelNextWindowsTimeout: function() {
        _D('>dbFinTrackerApp._cancelNextWindowsTimeout()');
        if (this._nextWindowsTimeout) {
            Mainloop.source_remove(this._nextWindowsTimeout);
            this._nextWindowsTimeout = null;
        }
        _D('<');
    },

    _nextWindow: function(minimized/* = false*/) {
        _D('>dbFinTrackerApp._nextWindow()');
		let (windows = this._listWindowsFresh(minimized)) {
			if (windows.length) {
				if (!this._focused) {
					Main.activateWindow(windows[0]);
                    this._resetNextWindows();
				} // if (!this._focused)
				else {
					if (!this._nextWindowsIndex || !this._nextWindowsLength
					    	|| this._nextWindowsLength != windows.length
					    	|| this._nextWindowsWorkspace != global.screen.get_active_workspace()) {
						this._nextWindowsWorkspace = global.screen.get_active_workspace();
						this._nextWindowsLength = windows.length
						this._nextWindowsIndex = 0;
					}
					Main.activateWindow(windows[Math.min(++this._nextWindowsIndex, this._nextWindowsLength - 1)]);
					this._cancelNextWindowsTimeout();
					this._nextWindowsTimeout = Mainloop.timeout_add(3333, Lang.bind(this, this._resetNextWindows));
				} // if (!this._focused) else
			} // if (windows.length)
		} // let (windows)
        _D('<');
    },

    nextWindowNonMinimized: function() {
        _D('>dbFinTrackerApp.nextWindowNonMinimized()');
        this._nextWindow();
        _D('<');
    },

    nextWindow: function() {
        _D('>dbFinTrackerApp.nextWindow()');
        this._nextWindow(true);
        _D('<');
    },

	_showAllWindows: function(minimized/* = false*/) {
        _D('>dbFinTrackerApp._showAllWindows()');
		let (windows = this._listWindowsFresh(minimized)) {
            if (windows.length) { // not necessary, but for consistency
    			for (let i = windows.length - 1; i >= 0; --i) Main.activateWindow(windows[i]);
            } // if (windows.length)
		} // let (windows)
        _D('<');
	},

    showAllWindowsNonMinimized: function() {
        _D('>dbFinTrackerApp.showAllWindowsNonMinimized()');
		this._showAllWindows();
        _D('<');
    },

    showAllWindows: function() {
        _D('>dbFinTrackerApp.showAllWindows()');
		this._showAllWindows(true);
        _D('<');
    },

	_rotateWindows: function(backward/* = false*/) {
        _D('>dbFinTrackerApp._rotateWindows()');
		let (windows = this._listWindowsFresh()) {
            if (windows.length) {
				if (!this._focused) {
					Main.activateWindow(windows[0]);
				} // if (!this._focused)
				else {
                    if (backward) {
                        if (windows.length > 1) Main.activateWindow(windows[windows.length - 1]);
                    }
                    else {
                        for (let i = windows.length - 1; i > 0; --i) Main.activateWindow(windows[i]);
                    }
				} // if (!this._focused) else
            } // if (windows.length)
		} // let (windows)
        _D('<');
	},

    rotateWindowsForward: function() {
        _D('>dbFinTrackerApp.rotateWindowsForward()');
		this._rotateWindows();
        _D('<');
    },

    rotateWindowsBackward: function() {
        _D('>dbFinTrackerApp.rotateWindowsBackward()');
		this._rotateWindows(true);
        _D('<');
    },

	_minimizeWindows: function(topOnly/* = false*/) {
        _D('>dbFinTrackerApp._minimizeWindows()');
		let (windows = this._listWindowsFresh()) {
			if (windows.length) {
				if (topOnly) windows[0].minimize();
				else windows.forEach(function(window) { window.minimize(); });
			} // if (windows.length)
		} // let (windows)
        _D('<');
	},

    minimizeTopWindow: function() {
        _D('>dbFinTrackerApp.minimizeTopWindow()');
		this._minimizeWindows(true);
        _D('<');
    },

    minimizeAllWindows: function() {
        _D('>dbFinTrackerApp.minimizeAllWindows()');
		this._minimizeWindows();
        _D('<');
    },

    _maximizeToggle: function(window) {
        _D('>dbFinTrackerApp._maximizeToggle()');
        if (window) {
            if (window.get_maximized() == (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL)) {
                window.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
            else {
                window.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
        } // if (window)
        _D('<');
    },

	_maximizeWindows: function(topOnly/* = false*/) {
        _D('>dbFinTrackerApp._maximizeWindows()');
		let (windows = this._listWindowsFresh()) {
			if (windows.length) {
				if (topOnly) this._maximizeToggle(windows[0]);
				else windows.forEach(Lang.bind(this, function(window) { this._maximizeToggle(window); }));
			} // if (windows.length)
		} // let (windows)
        _D('<');
	},

    maximizeTopWindow: function() {
        _D('>dbFinTrackerApp.maximizeTopWindow()');
		this._maximizeWindows(true);
        _D('<');
    },

    maximizeAllWindows: function() {
        _D('>dbFinTrackerApp.maximizeAllWindows()');
		this._maximizeWindows();
        _D('<');
    },

	_openNewWindow: function(workspaceIndex/* = -1*/) {
        _D('>dbFinTrackerApp._openNewWindow()');
		if (!this.metaApp) {
			_D('this.metaApp === null');
			_D('<');
			return;
		}
		if (workspaceIndex !== undefined) {
			if (workspaceIndex < 0 || workspaceIndex >= global.screen.n_workspaces) {
				_D('workspaceIndex === ' + workspaceIndex + ', n_workspaces === ' + global.screen.n_workspaces);
				_D('<');
				return;
			}
			let (workspace = global.screen.get_workspace_by_index(workspaceIndex)) {
				if (workspace) workspace.activate(global.get_current_time());
			}
		} // if (workspaceIndex !== undefined)
		if (this.metaApp.state != Shell.AppState.STOPPED) this.metaApp.open_new_window(-1);
		else this.metaApp.activate();
        _D('<');
	},

    openNewWindowThisWorkspace: function() {
        _D('>dbFinTrackerApp.openNewWindowThisWorkspace()');
		this._openNewWindow();
        _D('<');
    },

    openNewWindowNewWorkspace: function() {
        _D('>dbFinTrackerApp.openNewWindowNewWorkspace()');
		this._openNewWindow(global.screen.n_workspaces ? global.screen.n_workspaces - 1 : 0); // just in case
        _D('<');
    },
});
