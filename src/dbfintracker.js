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
 * dbfintracker.js
 * Main class to track apps and windows on current workspace.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinPreview = Me.imports.dbfinpreview;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTrackerApp = Me.imports.dbfintrackerapp;
const dbFinTrackerWindow = Me.imports.dbfintrackerwindow;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinTracker: main class to track all apps and windows
 */
const dbFinTracker = new Lang.Class({
	Name: 'dbFin.Tracker',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		this._settings = Convenience.getSettings();
		this._signals = new dbFinSignals.dbFinSignals();
        this._tracker = Shell.WindowTracker.get_default();
        this._appSystem = Shell.AppSystem.get_default();
		this.apps = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaApp, trackerApp ] ]
		this.windows = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaWindow, trackerWindow ] ]
		this.state = 0; // when refreshing we increase the state to indicate apps and windows that are no longer there
        this.stateInfo = '';

		this.preview = new dbFinPreview.dbFinPreview();
		this._updatedWindowsPreview = function () { if (this.preview && !global.yawl._windowsPreview) this.preview.hide(); }
		this._updatedWindowsPreviewDimColor = function () { if (this.preview) this.preview.dimColor = global.yawl._windowsPreviewDimColor; }
		this._updatedWindowsPreviewDimOpacity = function () { if (this.preview) this.preview.dimOpacity = global.yawl._windowsPreviewDimOpacity; }
		this._updatedWindowsPreviewPanelOpacity = function () { if (this.preview) this.preview.updateWindowsPanelOpacity(); }
        this._updatedWindowsAnimationTime = function () { if (this.preview) this.preview.animationTime = global.yawl._windowsAnimationTime; }

		this.update(null, 'Tracker: initial update.');
		this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
									callback: this._switchWorkspace, scope: this });
		this._signals.connectNoId({ emitter: this._appSystem, signal: 'app-state-changed',
									callback: this._updateAppState, scope: this });
		this._signals.connectNoId({ emitter: global.display, signal: 'window-marked-urgent',
									callback: this._windowAttention, scope: this });
		this._signals.connectNoId({ emitter: global.display, signal: 'window-demands-attention',
									callback: this._windowAttention, scope: this });
		// it seems to work just fine without this but just in case:
		this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
									callback: function () { this.update(null, 'Overview hiding.'); }, scope: this });

		global.yawl.watch(this);

        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this.preview) {
            this.preview.destroy();
            this.preview = null;
        }
        this.state++;
		if (this.apps) {
			this.apps.forEach(Lang.bind(this, function(metaApp, trackerApp) {
				if (trackerApp) {
					trackerApp.destroy();
					trackerApp = null;
				}
			}));
			this.apps.destroy();
			this.apps = null;
		}
		if (this.windows) {
			this.windows.forEach(Lang.bind(this, function(metaWindow, trackerWindow) {
				if (trackerWindow) {
					trackerWindow.destroy();
					trackerWindow = null;
				}
			}));
			this.windows.destroy();
			this.windows = null;
		}
        this._appSystem = null;
        this._tracker = null;
		this._settings = null;
        this.emit('destroy');
        _D('<');
	},

    getTracker: function() {
        _D('>' + this.__name__ + '.getTracker()');
        _D('<');
        return this._tracker;
    },

	getTrackerApp: function(metaApp) {
        _D('>' + this.__name__ + '.getTrackerApp()');
		_D('<');
		return this.apps && this.apps.get(metaApp) || null;
	},

	getTrackerWindow: function(metaWindow) {
        _D('>' + this.__name__ + '.getTrackerWindow()');
		_D('<');
		return this.windows && this.windows.get(metaWindow) || null;
	},

	_refresh: function(metaWorkspace/* = global.screen.get_active_workspace()*/, stateInfo/* = '_refresh() call with no additional info.'*/) {
        _D('@' + this.__name__ + '._refresh()');
		if (!this.apps || !this.windows) {
			_D(!this.apps ? 'this.apps == null' : 'this.windows == null');
	        _D('<');
			return;
		}
        if (!this._tracker || !this._appSystem) {
            _D(!this._tracker ? 'this._tracker == null' : 'this._appSystem == null');
            _D('<');
            return;
        }
		if (!metaWorkspace || !metaWorkspace.list_windows) {
			metaWorkspace = global.screen.get_active_workspace();
		}
		if (this._signals) {
	        this._signals.disconnectId('tracker-window-added');
	        this._signals.disconnectId('tracker-window-removed');
		}
		this.state ? this.state++ : (this.state = 1);
        this.stateInfo = (!stateInfo || stateInfo == '' ? '_refresh() call with no additional info.' : stateInfo);
		let (appsIn = [], appsOut = [], windowsIn = [], windowsOut = []) {
			this._appSystem.get_running().forEach(Lang.bind(this, function (metaApp) {
				if (!metaApp || metaApp.state == Shell.AppState.STOPPED) return;
				let (trackerApp = this.apps.get(metaApp)) {
					if (!trackerApp) { // new app
						appsIn.push(metaApp);
						this.apps.set(metaApp, trackerApp = new dbFinTrackerApp.dbFinTrackerApp(metaApp, this, this.state));
					}
					else {
                        trackerApp.state = this.state;
					}
				} // let (trackerApp)
			})); // this._appSystem.get_running().forEach(metaApp)
			metaWorkspace.list_windows().forEach(Lang.bind(this, function(metaWindow) {
				if (!metaWindow || !this._tracker.is_window_interesting(metaWindow)) return;
				let (metaApp = this._tracker.get_window_app(metaWindow)) {
					let (trackerWindow = this.windows.get(metaWindow),
						 trackerApp = this.apps.get(metaApp)) {
						if (!trackerApp || !trackerApp.state || trackerApp.state < this.state) return;
						if (!trackerWindow) { // new window
							windowsIn.push(metaWindow);
                            this.windows.set(metaWindow, trackerWindow = new dbFinTrackerWindow.dbFinTrackerWindow(metaWindow, this, metaApp, this.state));
							trackerApp.addWindow(metaWindow);
						}
                        else {
                            trackerWindow.state = this.state;
                        }
					} // let (trackerWindow, trackerApp)
				} // let (metaApp)
			})); // metaWorkspace.list_windows().forEach(metaWindow)
			[ appsOut, windowsOut ] = this._clean();
			if (this._signals) {
				this._signals.connectId('tracker-window-added', {	emitter: metaWorkspace, signal: 'window-added',
																	callback: this._windowAdded, scope: this },
										/*after = */true);
				this._signals.connectId('tracker-window-removed', {	emitter: metaWorkspace, signal: 'window-removed',
																	callback: this._windowRemoved, scope: this },
										/*after = */true);
			}
            this._updatePanels(appsIn, appsOut, windowsIn, windowsOut);
		} // let (appsIn, appsOut, windowsIn, windowsOut)
        _D('<');
	},

	_clean: function() { // returns [ appsOut, windowsOut ]
        _D('>' + this.__name__ + '._clean()');
		if (!this.apps || !this.windows) {
			_D(!this.apps ? 'this.apps == null' : 'this.windows == null');
	        _D('<');
			return [ [], [] ];
		}
		let (appsOut = [], windowsOut = []) {
			this.apps.forEach(Lang.bind(this, function (metaApp, trackerApp) {
				if (!trackerApp || !trackerApp.state || trackerApp.state < this.state) {
					if (trackerApp && trackerApp.windows) {
						trackerApp.windows.forEach(Lang.bind(this, function (metaWindow) { windowsOut.push(metaWindow); }));
					}
					appsOut.push(metaApp);
					this._removeApp(metaApp);
				}
			})); // this.apps.forEach(metaApp, trackerApp)
			this.windows.forEach(Lang.bind(this, function (metaWindow, trackerWindow) {
				if (!trackerWindow || !trackerWindow.state || trackerWindow.state < this.state) {
					windowsOut.push(metaWindow);
					this._removeWindow(metaWindow);
				}
			})); // this.windows.forEach(metaWindow, trackerWindow)
			_D('<');
			return [ appsOut, windowsOut ];
		} // let (appsOut, windowsOut)
	},

	_removeApp: function(metaApp) { // calls _removeWindow for all app's windows
        _D('>' + this.__name__ + '._removeApp()');
		let (trackerApp = this.getTrackerApp(metaApp)) {
			if (!trackerApp) {
				_D('trackerApp === null');
			}
			else if (trackerApp.windows) {
				trackerApp.windows.slice().forEach(Lang.bind(this, function (metaWindow) {
					this._removeWindow(metaWindow);
				}));
			}
            else { // if (trackerApp && !trackerApp.windows)
				trackerApp.destroy();
				trackerApp = null;
				this.apps.remove(metaApp);
            }
		} // let (trackerApp)
        _D('<');
	},

	_removeWindow: function(metaWindow) {
        _D('>' + this.__name__ + '._removeWindow()');
		let (trackerWindow = this.windows && this.windows.remove(metaWindow)) {
			if (!trackerWindow) {
				_D('trackerWindow === null');
			}
			else {
				let (metaApp = trackerWindow.metaApp) {
					trackerWindow.destroy();
					trackerWindow = null;
					// this.windows.remove(metaWindow); // no need as we use remove instead of get above
					let (trackerApp = this.getTrackerApp(metaApp)) {
						if (trackerApp) {
							trackerApp.removeWindow(metaWindow);
							if (/*trackerApp && */!trackerApp.windows) {
								this._removeApp(metaApp);
							}
						}
					} // let (trackerApp)
				} // let (metaApp)
			} // if (!trackerWindow) else
		} // let (trackerWindow)
        _D('<');
	},

	update: function(metaWorkspace/* = null*/, stateInfo/* = 'update() call with no additional info.'*/) {
        _D('>' + this.__name__ + '.update()');
		metaWorkspace = metaWorkspace || null;
        if (!stateInfo || stateInfo == '') stateInfo = 'update() call with no additional info.';
		Mainloop.idle_add(Lang.bind(this, this._refresh, metaWorkspace, stateInfo));
        _D('<');
	},

    _updatePanels: function(appsIn, appsOut, windowsIn, windowsOut) {
        _D('>' + this.__name__ + '._updatePanels()');
        if (!global.yawl.panelApps || !global.yawl.panelWindows) {
            log('');
            log('State:      ' + this.state);
            log('State info: ' + this.stateInfo);
            log('');
            log('Apps: -' + appsOut.length + ' +' + appsIn.length + ' =' + this.apps.length
                    + ' Windows: -' + windowsOut.length + ' +' + windowsIn.length + ' =' + this.windows.length);
            log('');
            this.apps.forEach(Lang.bind(this, function(metaApp, trackerApp) {
				if (!trackerApp) return;
				log(trackerApp.appName + ':');
				if (!trackerApp.windows) return;
				trackerApp.windows.forEach(Lang.bind(this, function(metaWindow) {
					let (trackerWindow = this.getTrackerWindow(metaWindow)) {
						if (!trackerWindow) return;
						log('\t' + trackerWindow.title);
					} // let (trackerWindow)
				})); // trackerApp.windows.forEach(metaWindow)
            })); // this.apps.forEach(metaApp, trackerApp)
            _D('<');
            return;
        } // if (!global.yawl.panelApps || !global.yawl.panelWindows)
/*        if (appsIn && appsIn.forEach) {
            appsIn.forEach(Lang.bind(this, function(metaApp) {
                let (trackerApp = this.getTrackerApp(metaApp)) {
                    if (trackerApp) {
                    }
                }
            }));
        }
		if (windowsIn && windowsIn.forEach) {
            windowsIn.forEach(Lang.bind(this, function(metaWindow) {
                let (trackerWindow = this.getTrackerWindow(metaWindow)) {
                    if (trackerWindow) {
						let (trackerApp = this.getTrackerApp(trackerWindow.metaApp)) {
                            if (trackerApp) {
                            }
						}
                    }
                }
            }));
		}*/
        _D('<');
    },

	_switchWorkspace: function (manager, wsiOld, wsiNew) {
        _D('>' + this.__name__ + '._switchWorkspace()');
		this.update(global.screen.get_workspace_by_index(wsiNew), 'Workspace switched from ' + (wsiOld + 1) + ' to ' + (wsiNew + 1) + '.');
        _D('<');
	},

	_updateAppState: function(appSystem, metaApp) {
        _D('>' + this.__name__ + '._updateAppState()');
		let (trackerApp = this.getTrackerApp(metaApp)) {
			if (trackerApp) {
                if (metaApp.state == Shell.AppState.STOPPED) trackerApp.updateVisibility();
				trackerApp.updateMenu();
			}
			this.update(null, 'App ' + (trackerApp ? trackerApp.appName : 'unknown') + ': app state changed.');
		}
        _D('<');
	},

	_windowAttention: function(display, metaWindow) {
        _D('>' + this.__name__ + '._windowAttention()');
        _D('<');
	},

	_windowAdded: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowAdded()');
		this.update(null, 'A window was added to workspace ' + (metaWorkspace && metaWorkspace.index ? metaWorkspace.index() + 1 : '?') + '.');
        _D('<');
	},

	_windowRemoved: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowRemoved()');
		let (trackerWindow = this.getTrackerWindow(metaWindow)) {
			this.update(null, 'Window "'
			            + (trackerWindow ? trackerWindow.appName + ':' + trackerWindow.title : '?:?')
			            + '" was removed from workspace '
			            + (metaWorkspace && metaWorkspace.index ? metaWorkspace.index() + 1 : '?') + '.');
		}
        _D('<');
	},

	updateTrackerAppLabel: function (trackerWindow) {
        _D('>' + this.__name__ + '.updateTrackerAppLabel()');
		if (trackerWindow && trackerWindow.metaApp && trackerWindow.hovered) {
            let (trackerApp = this.getTrackerApp(trackerWindow.metaApp)) {
                if (trackerApp) {
                    trackerApp.setLabel(trackerWindow.minimized
                            ? '[ ' + trackerWindow.title + ' ]'
                            : trackerWindow.title)
				} // if (trackerApp)
            } // let (trackerApp)
		} // if (trackerWindow && trackerWindow.metaApp && trackerWindow.hovered)
        _D('<');
	},

    windowEvent: function (trackerWindow, event, params) {
        _D('>' + this.__name__ + '.windowEvent()');
        if (!trackerWindow || !event) {
            _D('<');
            return;
        }
		if (event === 'enter') {
			this.updateTrackerAppLabel(trackerWindow);
			if (this.preview && global.yawl && global.yawl._windowsPreview) this.preview.show(trackerWindow);
		}
		else if (event === 'leave') {
			if (this.preview) this.preview.hide(trackerWindow);
		}
        else if (event === 'title' || event === 'minimized') {
			this.updateTrackerAppLabel(trackerWindow);
        }
		else if (event === 'focused') {
        }
		else if (event === 'preview-on') {
			if (global.yawl && global.yawl._windowsPreview) {
				if (this.preview) this.preview.panelTransparent = true;
			}
			else {
				if (this._settings) this._settings.set_boolean('windows-preview', true);
			}
			if (this.preview) this.preview.show(trackerWindow);
		}
		else if (event === 'preview-off') {
            if (global.yawl && global.yawl._windowsPreview) {
				if (this.preview && this.preview.panelTransparent) this.preview.panelTransparent = false;
                else if (this._settings) this._settings.set_boolean('windows-preview', false);
                else if (this.preview) this.preview.hide();
            }
		}
        _D('<');
    }
});
Signals.addSignalMethods(dbFinTracker.prototype);
