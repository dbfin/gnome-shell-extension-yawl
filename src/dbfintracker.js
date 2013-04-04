/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfintracker.js
 * Main class to track apps and windows on current workspace.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
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
		this._signals = new dbFinSignals.dbFinSignals();
        this._tracker = Shell.WindowTracker.get_default();
		this.apps = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaApp, { state:, trackerApp: } ] ]
		this.windows = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaWindow, { state:, trackerWindow: } ] ]
		this.state = 0; // when refreshing we increase the state to indicate apps and windows that are no longer there
        this.stateInfo = '';
		this.update(null, 'Tracker: initial update.');
		this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
									callback: this._switchWorkspace, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        this.state++;
		if (this.apps) {
			this.apps.forEach(Lang.bind(this, function(metaApp, appProperties) {
				if (appProperties) {
					if (appProperties.trackerApp) appProperties.trackerApp.destroy();
					appProperties.trackerApp = null;
				}
			}));
			this.apps.destroy();
			this.apps = null;
		}
		if (this.windows) {
			this.windows.forEach(Lang.bind(this, function(metaWindow, windowProperties) {
				if (windowProperties) {
					if (windowProperties.trackerWindow) windowProperties.trackerWindow.destroy();
					windowProperties.trackerWindow = null;
				}
			}));
			this.windows.destroy();
			this.windows = null;
		}
        this._tracker = null;
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
		let (appProperties = this.apps.get(metaApp)) {
			if (appProperties !== undefined && appProperties && appProperties.trackerApp) {
		        _D('<');
				return appProperties.trackerApp;
			}
			else {
                _D(appProperties ? 'appProperties.trackerApp === null' : 'appProperties === null');
		        _D('<');
				return null;
			}
		} // let (appProperties)
	},

	getTrackerWindow: function(metaWindow) {
        _D('>' + this.__name__ + '.getTrackerWindow()');
		let (windowProperties = this.windows.get(metaWindow)) {
			if (windowProperties !== undefined && windowProperties && windowProperties.trackerWindow) {
		        _D('<');
				return windowProperties.trackerWindow;
			}
			else {
                _D(windowProperties ? 'windowProperties.trackerWindow === null' : 'windowProperties === null');
		        _D('<');
				return null;
			}
		} // let (windowProperties)
	},

	_refresh: function(metaWorkspace/* = global.screen.get_active_workspace()*/, stateInfo/* = '_refresh() call with no additional info.'*/) {
        _D('@' + this.__name__ + '._refresh()');
		if (!this.apps || !this.windows) {
			_D(!this.apps ? 'this.apps == null' : 'this.windows == null');
	        _D('<');
			return;
		}
        if (!this._tracker) {
            _D('this._tracker == null');
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
			metaWorkspace.list_windows().forEach(Lang.bind(this, function(metaWindow) {
				if (!metaWindow || !this._tracker.is_window_interesting(metaWindow)) return;
				let (metaApp = this._tracker.get_window_app(metaWindow)) {
					if (!metaApp || metaApp.state == Shell.AppState.STOPPED) return;
					let (	windowProperties = this.windows.get(metaWindow),
							appProperties = this.apps.get(metaApp)) {
						if (windowProperties === undefined || !windowProperties || !windowProperties.trackerWindow) { // new window
							windowsIn.push(metaWindow);
							windowProperties = {};
							windowProperties.trackerWindow = new dbFinTrackerWindow.dbFinTrackerWindow(
                                                                        metaWindow, this, metaApp);
                            windowProperties.state = this.state;
                            this.windows.set(metaWindow, windowProperties);
							if (appProperties !== undefined && appProperties && appProperties.trackerApp) {
								appProperties.trackerApp.addWindow(metaWindow);
							}
						}
                        else {
                            windowProperties.state = this.state;
                            this.windows.set(metaWindow, windowProperties);
                        }
						if (appProperties === undefined || !appProperties || !appProperties.trackerApp) { // new app
							appsIn.push(metaApp);
							appProperties = {};
							appProperties.trackerApp = new dbFinTrackerApp.dbFinTrackerApp(metaApp, this, metaWindow, true);
                            appProperties.state = this.state;
                            this.apps.set(metaApp, appProperties);
						}
                        else {
                            appProperties.state = this.state;
                            this.apps.set(metaApp, appProperties);
                        }
					} // let (windowProperties, appProperties)
				} // let (metaApp)
			})); // metaWorkspace.list_windows().forEach
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
			this.apps.forEach(Lang.bind(this, function (metaApp, appProperties) {
				if (!appProperties || !appProperties.state || appProperties.state < this.state
					    || !appProperties.trackerApp || !appProperties.trackerApp.windows || !appProperties.trackerApp.windows.length) {
					if (appProperties && appProperties.trackerApp && appProperties.trackerApp.windows) {
						appProperties.trackerApp.windows.forEach(Lang.bind(this, function (metaWindow) { windowsOut.push(metaWindow); }));
					}
					appsOut.push(metaApp);
					this._removeApp(metaApp);
				}
			})); // this.apps.forEach
			this.windows.forEach(Lang.bind(this, function (metaWindow, windowProperties) {
				if (!windowProperties || !windowProperties.state || windowProperties.state < this.state
				        || !windowProperties.trackerWindow || !windowProperties.trackerWindow.metaApp) {
					windowsOut.push(metaWindow);
					this._removeWindow(metaWindow);
				}
			})); // this.windows.forEach
			_D('<');
			return [ appsOut, windowsOut ];
		} // let (appsOut, windowsOut)
	},

	_removeApp: function(metaApp) { // calls _removeWindow if there are any windows belonging to app
        _D('>' + this.__name__ + '._removeApp()');
		let (appProperties = this.apps.get(metaApp)) {
			if (appProperties === undefined || !appProperties) {
				_D('appProperties === null');
			}
			else if (appProperties.trackerApp && appProperties.trackerApp.windows/* && appProperties.trackerApp.windows.length*/) {
                let (windows = appProperties.trackerApp.windows.slice()) {
    				windows.forEach(Lang.bind(this, function (metaWindow) { this._removeWindow(metaWindow); }));
                }
			}
            else { // if (appProperties && (!appProperties.trackerApp || !appProperties.trackerApp.windows/* || !appProperties.trackerApp.windows.length*/))
                if (appProperties.trackerApp) {
                    appProperties.trackerApp.destroy();
                    appProperties.trackerApp = null;
                }
				this.apps.remove(metaApp);
            }
		} // let (appProperties)
        _D('<');
	},

	_removeWindow: function(metaWindow) { // not the case anymore: calls _removeApp if no more windows belong to app
        _D('>' + this.__name__ + '._removeWindow()');
		let (windowProperties = this.windows.remove(metaWindow)) {
			if (windowProperties === undefined || !windowProperties) {
				_D('windowProperties === null');
                _D('<');
                return;
			}
			if (windowProperties.trackerWindow) {
				let (metaApp = windowProperties.trackerWindow.metaApp) {
					windowProperties.trackerWindow.destroy();
					windowProperties.trackerWindow = null;
					// this.windows.remove(metaWindow); // no need as we use remove instead of get above
					let (appProperties = this.apps.get(metaApp)) {
						if (appProperties !== undefined && appProperties) {
							if (appProperties.trackerApp) {
								appProperties.trackerApp.removeWindow(metaWindow);
							}
							if (!appProperties.trackerApp || !appProperties.trackerApp.windows/* || !appProperties.trackerApp.windows.length*/) {
								this._removeApp(metaApp);
							}
						} // if (appProperties !== undefined && appProperties)
					} // let (appProperties)
				} // let (metaApp)
			} // if (windowProperties.trackerWindow)
		} // let (windowProperties)
        _D('<');
	},

	update: function(metaWorkspace/* = null*/, stateInfo/* = 'update() call with no additional info.'*/) {
        _D('@' + this.__name__ + '.update()');
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
            this.apps.forEach(Lang.bind(this, function(metaApp, appProperties) {
                if (!appProperties) return;
                let (trackerApp = appProperties.trackerApp) {
					if (!trackerApp) return;
					log(trackerApp.appName + ':');
					trackerApp.windows.forEach(Lang.bind(this, function(metaWindow) {
						let (trackerWindow = this.getTrackerWindow(metaWindow)) {
							if (!trackerWindow) return;
							log('\t' + trackerWindow.title);
						} // let (trackerWindow)
					})); // trackerApp.windows.forEach
				} // let (trackerApp)
            })); // this.apps.forEach
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

	_windowAdded: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowAdded()');
		this.update(null, 'A window was added to workspace ' + (metaWorkspace && metaWorkspace.index ? metaWorkspace.index() + 1 : '?') + '.');
        _D('<');
	},

	_windowRemoved: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowRemoved()');
		let (windowProperties = this.windows.get(metaWindow)) {
			this.update(null, 'Window "'
			            + (windowProperties && windowProperties.trackerWindow
			            	? windowProperties.trackerWindow.appName + ':' + windowProperties.trackerWindow.title
			            	: '?:?')
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
                                        : trackerWindow.title);
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
        if (event === 'enter' || event === 'leave' || event === 'title'
	            || event === 'minimized') {
			this.updateTrackerAppLabel(trackerWindow);
        }
		else if (event === 'focused') {
        }
        _D('<');
    }
});
Signals.addSignalMethods(dbFinTracker.prototype);
