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
 * dbfintracker.js
 * Main class to track apps and windows on current workspace.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const AppFavorites = imports.ui.appFavorites;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinPreview = Me.imports.dbfinpreview;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTimeout = Me.imports.dbfintimeout;
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
        this._timeout = new dbFinTimeout.dbFinTimeout();
        this._tracker = Shell.WindowTracker.get_default();
        this._appSystem = Shell.AppSystem.get_default();
		this.apps = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaApp, trackerApp ] ]
		this.windows = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaWindow, trackerWindow ] ]
		this.state = 0; // when refreshing we increase the state to indicate apps and windows that are no longer there
        this.stateInfo = '';
		this._refreshStateInfo = '';

        this._attentions = new dbFinArrayHash.dbFinArrayHash(); // [ [ metaApp, { signals:, metaWindows: [ metaWindow's ] } ] ]

		this.preview = new dbFinPreview.dbFinPreview();

        this._updatedIconsOrder = function () { if (this.apps) this.apps.forEach(function (metaApp, trackerApp) { if (trackerApp) trackerApp._moveToStablePosition(); }); }
        this._updatedWindowsShowInteresting = function () { this.update('Tracker: updated windows-show-interesting.'); }
		this._updatedWindowsPreview = function () { if (this.preview && !global.yawl._windowsPreview) this.preview.hide(); }
		this._updatedWindowsPreviewDimColor = function () { if (this.preview) this.preview.dimColor = global.yawl._windowsPreviewDimColor; }
		this._updatedWindowsPreviewDimOpacity = function () { if (this.preview) this.preview.dimOpacity = global.yawl._windowsPreviewDimOpacity; }
		this._updatedWindowsPreviewPanelOpacity = function () { if (this.preview) this.preview.updateWindowsPanelOpacity(); }
        this._updatedWindowsAnimationTime = function () { if (this.preview) this.preview.animationTime = global.yawl._windowsAnimationTime; }

		this.update('Tracker: initial update.');
		this._signals.connectNoId({	emitter: global.screen, signal: 'notify::n-workspaces',
									callback: this._nWorkspaces, scope: this });
		this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
									callback: this._switchWorkspace, scope: this });
		this._signals.connectNoId({ emitter: this._appSystem, signal: 'app-state-changed',
									callback: this._updateAppState, scope: this });
		this._signals.connectNoId({ emitter: global.display, signal: 'window-marked-urgent',
									callback: this._windowAttention, scope: this });
		this._signals.connectNoId({ emitter: global.display, signal: 'window-demands-attention',
									callback: this._windowAttention, scope: this });
        this._signals.connectNoId({ emitter: global.display, signal: 'notify::focus-window',
                                    callback: this._focusWindow, scope: this });
        this._signals.connectNoId({ emitter: AppFavorites.getAppFavorites(), signal: 'changed',
                                    callback: function () { this.update('Favorites changed.'); }, scope: this });
		// it seems to work just fine without this but just in case:
		this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
									callback: function () { this.update('Overview hiding.'); }, scope: this });

		global.yawl.watch(this);

        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this._timeout) {
            this._timeout.destroy();
            this._timeout = null;
        }
        if (this.preview) {
            this.preview.destroy();
            this.preview = null;
        }
        if (this._attentions) {
			this.removeAttention();
            this._attentions.destroy();
            this._attentions = null;
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

	isWindowInteresting: function(metaWindow) {
		return	!!metaWindow
				&& (!global.yawl
				    || !global.yawl._windowsShowInteresting
				    ||	!metaWindow.is_skip_taskbar()
						&& this._tracker
						&& this._tracker.is_window_interesting(metaWindow)
				    );
		// note also, that metaWindow must have app in this.apps, so that
		// it is not orphant and its app must be "interesting" as well
	},

	_refresh: function(metaWorkspace/* = global.screen.get_active_workspace()*/) {
        _D('@' + this.__name__ + '._refresh()');
		this.stateInfo = this._refreshStateInfo;
		this._refreshStateInfo = '';
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
                        trackerApp.pin = false;
					}
				} // let (trackerApp)
			})); // this._appSystem.get_running().forEach(metaApp)
            let (idApps = AppFavorites.getAppFavorites().getFavoriteMap()) {
                for (let id in idApps) {
                    let (metaApp = idApps.hasOwnProperty(id) && idApps[id]) {
                        if (!metaApp) continue;
                        let (trackerApp = this.apps.get(metaApp)) {
                            if (!trackerApp) { // new app
                                appsIn.push(metaApp);
                                this.apps.set(metaApp, trackerApp = new dbFinTrackerApp.dbFinTrackerApp(metaApp, this, this.state));
                            }
                            else {
                                trackerApp.state = this.state;
                            }
                            trackerApp.pin = true;
                        } // let (trackerApp)
                    } // let (metaApp)
                } // for (let id)
            } // let (idApps)
			metaWorkspace.list_windows().reverse().forEach(Lang.bind(this, function(metaWindow) {
				if (!metaWindow || !this.isWindowInteresting(metaWindow)) return;
				let (metaApp = this._tracker.get_window_app(metaWindow)) {
					let (trackerWindow = this.windows.get(metaWindow),
						 trackerApp = metaApp && this.apps.get(metaApp)) {
						if (!trackerApp || !trackerApp.state || trackerApp.state < this.state) return;
						if (!trackerWindow) { // new window
							windowsIn.push(metaWindow);
                            this.windows.set(metaWindow, trackerWindow = new dbFinTrackerWindow.dbFinTrackerWindow(metaWindow, this, metaApp, this.state));
							trackerApp.addWindow(metaWindow);
							if (metaWindow.demands_attention || metaWindow.urgent) {
								this.addAppWindowAttention(metaApp, metaWindow);
							}
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
                    if (trackerApp) trackerApp.pin = false;
					this._removeApp(metaApp);
				}
                else {
                    trackerApp.updateVisibility();
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
            if (trackerApp) {
                trackerApp.updateVisibility();
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

	update: function(stateInfo/* = 'update() call with no additional info.'*/) {
        _D('>' + this.__name__ + '.update()');
        if (!stateInfo) stateInfo = 'update() call with no additional info.';
		if (!this._refreshStateInfo) {
			this._refreshStateInfo = '' + stateInfo;
		}
		else {
			this._refreshStateInfo += '\n' + stateInfo;
		}
        if (this._timeout) this._timeout.add('refresh', 777, this._refresh, this, true, true);
        else this._refresh();
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

	_nWorkspaces: function () {
        _D('>' + this.__name__ + '._nWorkspaces()');
		this.update('Workspaces changed.');
        _D('<');
	},

	_switchWorkspace: function (manager, wsiOld, wsiNew) {
        _D('>' + this.__name__ + '._switchWorkspace()');
		this.update('Workspace switched from ' + (wsiOld + 1) + ' to ' + (wsiNew + 1) + '.');
        _D('<');
	},

	_updateAppState: function(appSystem, metaApp) {
        _D('>' + this.__name__ + '._updateAppState()');
        if (!metaApp) {
            _D('<');
            return;
        }
        if (this._attentions && this._attentions.length && this._attentions.get(metaApp)) {
            this.updateAppAttention(metaApp);
        }
		let (trackerApp = this.getTrackerApp(metaApp)) {
			if (trackerApp) {
                trackerApp.updateVisibility();
				trackerApp.updateMenu();
			}
			this.update('App ' + (trackerApp ? trackerApp.appName : 'unknown') + ': app state changed.');
		}
        _D('<');
	},

	_windowAttention: function(display, metaWindow) {
        _D('>' + this.__name__ + '._windowAttention()');
        let (metaApp = metaWindow && metaWindow !== (global.display && global.display.focus_window)
             && this.isWindowInteresting(metaWindow)
             && this._tracker && this._tracker.get_window_app(metaWindow)) {
            if (metaApp) this.addAppWindowAttention(metaApp, metaWindow);
		}
        _D('<');
	},

    _focusWindow: function() {
        _D('>' + this.__name__ + '._focusWindow()');
		if (this._attentions && this._attentions.length) {
			let (metaWindow = global.display.focus_window) {
				let (metaApp = metaWindow && this._tracker && this._tracker.get_window_app(metaWindow)) {
					this.removeAppWindowAttention(metaApp, metaWindow);
				}
			}
		}
        _D('<');
    },

    hasAppAttention: function(metaApp) {
        _D('>' + this.__name__ + '.hasAppAttention()');
        _D('<');
        return !!(metaApp && this._attentions && this._attentions.length && this._attentions.get(metaApp));
    },

    hasAppWindowAttention: function(metaApp, metaWindow) {
        _D('>' + this.__name__ + '.hasAppWindowAttention()');
        let (attentionProperties = metaApp
             && this._attentions && this._attentions.length && this._attentions.get(metaApp)) {
            _D('<');
            return !!(metaWindow && attentionProperties && attentionProperties.metaWindows
                      && attentionProperties.metaWindows.indexOf(metaWindow) != -1);
        }
    },

    addAppWindowAttention: function(metaApp, metaWindow) {
        _D('>' + this.__name__ + '.addAppWindowAttention()');
        if (this._attentions && metaApp && metaWindow && metaApp.state != Shell.AppState.STOPPED) {
            let (attentionProperties = this._attentions.get(metaApp)) {
                if (!attentionProperties || !attentionProperties.signals
                    	|| !attentionProperties.metaWindows) {
                    attentionProperties = {
						signals: new dbFinSignals.dbFinSignals(),
						metaWindows: [ metaWindow ]
					};
					attentionProperties.signals.connectNoId({	emitter: metaApp, signal: 'windows-changed',
																callback: this.updateAppAttention, scope: this });
					let (trackerApp = this.getTrackerApp(metaApp)) {
						if (trackerApp) trackerApp.attention(true);
					}
                }
                else if (attentionProperties.metaWindows.indexOf(metaWindow) != -1) {
                    _D('<');
                    return;
                }
				else {
	                attentionProperties.metaWindows.push(metaWindow);
				}
                this._attentions.set(metaApp, attentionProperties);
                let (trackerWindow = this.getTrackerWindow(metaWindow)) {
                    if (trackerWindow) trackerWindow.attention(true);
                }
            } // let (attentionProperties)
        } // if (this._attentions && metaApp && metaWindow)
        _D('<');
    },

    removeAppWindowAttention: function(metaApp, metaWindow) {
        _D('>' + this.__name__ + '.removeAppWindowAttention()');
        if (this._attentions && this._attentions.length && metaApp && metaWindow) {
			let (attentionProperties = this._attentions.get(metaApp)) {
				if (attentionProperties && attentionProperties.metaWindows) {
					let (i = attentionProperties.metaWindows.indexOf(metaWindow)) {
						if (i != -1) {
							if (attentionProperties.metaWindows.length == 1) {
								if (attentionProperties.signals) {
									attentionProperties.signals.destroy();
									attentionProperties.signals = null;
								}
								attentionProperties.metaWindows = [];
								this._attentions.remove(metaApp);
								let (trackerApp = this.getTrackerApp(metaApp)) {
									if (trackerApp) trackerApp.attention(false);
								}
							}
							else {
								attentionProperties.metaWindows.splice(i, 1);
								this._attentions.set(metaApp, attentionProperties);
							}
							let (trackerWindow = this.getTrackerWindow(metaWindow)) {
								if (trackerWindow) trackerWindow.attention(false);
							}
						} // if (i != -1)
					} // let (i)
				} // if (attentionProperties && attentionProperties.metaWindows)
			} // let (attentionProperties)
        } // if (this._attentions && metaApp && metaWindow)
        _D('<');
    },

	removeAppAttention: function(metaApp) {
		_D('>' + this.__name__ + '.removeAppAttention()');
        let (attentionProperties = metaApp
             && this._attentions && this._attentions.length && this._attentions.get(metaApp)) {
			if (attentionProperties && attentionProperties.metaWindows) {
				attentionProperties.metaWindows.forEach(Lang.bind(this, function (metaWindow) {
					this.removeAppWindowAttention(metaApp, metaWindow);
				}));
			}
        }
		_D('<');
	},

	removeAttention: function() {
		_D('>' + this.__name__ + '.removeAttention()');
		if (this._attentions && this._attentions.length) {
            this._attentions.forEach(Lang.bind(this, function (metaApp, attentionProperties) {
                if (attentionProperties && attentionProperties.metaWindows) {
					attentionProperties.metaWindows.forEach(Lang.bind(this, function (metaWindow) {
						this.removeAppWindowAttention(metaApp, metaWindow);
					}));
				}
            }));
		}
		_D('<');
	},

	updateAppAttention: function(metaApp) {
		_D('>' + this.__name__ + '.updateAppAttention()');
		if (metaApp && metaApp.state == Shell.AppState.STOPPED) {
			this.removeAppAttention(metaApp);
			_D('<');
			return;
		}
		let (attentionProperties = metaApp
		     && this._attentions && this._attentions.length && this._attentions.get(metaApp)) {
			if (attentionProperties && attentionProperties.metaWindows) {
				let (windows = metaApp.get_windows()) {
					attentionProperties.metaWindows.slice().forEach(Lang.bind(this, function (metaWindow) {
						if (windows.indexOf(metaWindow) == -1) {
							this.removeAppWindowAttention(metaApp, metaWindow);
						}
					}));
				}
			}
		}
		_D('<');
	},

	_windowAdded: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowAdded()');
		this.update('A window was added to workspace ' + (metaWorkspace && metaWorkspace.index ? metaWorkspace.index() + 1 : '?') + '.');
        _D('<');
	},

	_windowRemoved: function (metaWorkspace, metaWindow) {
        _D('>' + this.__name__ + '._windowRemoved()');
		let (trackerWindow = this.getTrackerWindow(metaWindow)) {
			this.update('Window "'
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
            if (global.yawl) {
			    if (global.yawl._windowsPreview) {
				    if (this.preview) this.preview.panelTransparent = true;
			    }
			    else {
                    global.yawl.set('windows-preview', true);
			    }
            }
			if (this.preview) this.preview.show(trackerWindow);
		}
		else if (event === 'preview-off') {
            if (global.yawl && global.yawl._windowsPreview) {
				if (this.preview && this.preview.panelTransparent) this.preview.panelTransparent = false;
                else global.yawl.set('windows-preview', false);
            }
            else {
                if (this.preview) this.preview.hide();
            }
		}
        _D('<');
    },

    activateWindow: function (metaWindow) {
        _D('>' + this.__name__ + '.activateWindow()');
        if (metaWindow) {
            this._timeout.remove('activate-window');
            Main.activateWindow(metaWindow);
            let (transientWindows = []) {
                metaWindow.foreach_transient(function (metaWindow) { transientWindows.push(metaWindow); });
                this.activateWindows(transientWindows);
            }
        }
        _D('<');
    },

    activateWindows: function (metaWindows) {
        _D('>' + this.__name__ + '.activateWindow()');
        if (metaWindows && metaWindows.length) {
            let (metaWindow = null) {
                for (let i = metaWindows.length; --i >= 0;) {
                    if (metaWindows[i]) {
                        metaWindow = metaWindows[i];
                        this.activateWindow(metaWindow);
                    }
                }
                // make sure the top window is focused
                if (metaWindow && this._timeout) {
                    this._timeout.add('activate-window', 0, (function (metaWindow, activateWindow) {
                            return function () { activateWindow(metaWindow); }; })(metaWindow, Lang.bind(this, this.activateWindow)), null, false, true);
                }
            }
        }
        _D('<');
    },

    minimizeWindow: function(metaWindow) {
        _D('>' + this.__name__ + '.minimizeWindow()');
        if (metaWindow) {
            metaWindow.minimize();
            let (metaWindowTransientFor = metaWindow.get_transient_for()) {
				if (metaWindowTransientFor) this.minimizeWindow(metaWindowTransientFor);
            }
        }
        _D('<');
    }
});
Signals.addSignalMethods(dbFinTracker.prototype);
