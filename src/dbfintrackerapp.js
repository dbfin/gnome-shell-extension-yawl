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
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAppButton = Me.imports.dbfinappbutton;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinYAWLPanel = Me.imports.dbfinyawlpanel;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* class dbFinTrackerApp: all stuff associated with an app
 */
const dbFinTrackerApp = new Lang.Class({
	Name: 'dbFin.TrackerApp',

    _init: function(metaApp, tracker, metaWindow, autoHideShow/* = false*/) {
        _D('>' + this.__name__ + '._init()');
		this._signals = new dbFinSignals.dbFinSignals();
		this.metaApp = metaApp;
		this._tracker = tracker;
        this.windows = []; // add metaWindow later

        this.appName = '?';
		if (this.metaApp && this.metaApp.get_name) {
			try { this.appName = this.metaApp.get_name(); } catch (e) { this.appName = '?'; }
		}
		this._autohideshow = autoHideShow || false;

        this.yawlPanelWindowsGroup = new dbFinYAWLPanel.dbFinYAWLPanel({    hidden: true,
                                                                            showhidechildren: true,
                                                                            title: this.appName,
                                                                            label: '' });
        if (this.yawlPanelWindowsGroup) {
            if (global.yawl.panelWindows) global.yawl.panelWindows.addChild(this.yawlPanelWindowsGroup);
            this._updatedWindowsThumbnailsHeightVisible =
                    this._updatedWindowsThumbnailsPaddingTop = function () {
                if (this.yawlPanelWindowsGroup) {
                    this.yawlPanelWindowsGroup.maxChildHeight = global.yawl._windowsThumbnailsHeightVisible
                            + global.yawl._windowsThumbnailsPaddingTop;
                }
            };
        }

        this._updatedWindowsAnimationTime = function () { if (this.yawlPanelWindowsGroup) this.yawlPanelWindowsGroup.animationTime = global.yawl._windowsAnimationTime; };
		this._updatedWindowsAnimationEffect = function () { if (this.yawlPanelWindowsGroup) this.yawlPanelWindowsGroup.animationEffect = global.yawl._windowsAnimationEffect; };

        this.appButton = new dbFinAppButton.dbFinAppButton(metaApp, this);
		if (this.appButton) {
            if (!metaWindow && this._autohideshow) this.appButton.hide();
            if (global.yawl.panelApps) {
                global.yawl.panelApps.addChild(this.appButton);
                if (global.yawl.panelApps.container) {
                    this._signals.connectNoId({	emitter: global.yawl.panelApps.container, signal: 'notify::allocation',
                                                callback: this._appButtonAllocationChanged, scope: this });
                }
                if (global.yawl.panelApps.actor) {
                    this._signals.connectNoId({	emitter: global.yawl.panelApps.actor, signal: 'notify::allocation',
                                                callback: this._appButtonAllocationChanged, scope: this });
                }
            }
			if (this.appButton.container) {
				this._signals.connectNoId({	emitter: this.appButton.container, signal: 'notify::allocation',
											callback: this._appButtonAllocationChanged, scope: this });
			}
			if (this.appButton.actor) {
				this._signals.connectNoId({ emitter: this.appButton.actor, signal: 'enter-event',
											callback: this._enterEvent, scope: this });
				this._signals.connectNoId({ emitter: this.appButton.actor, signal: 'leave-event',
											callback: this._leaveEvent, scope: this });
			}
        }

        this.addWindow(metaWindow);

		this.focused = false;
		this._updateFocused();
		if (this._tracker && this._tracker.getTracker) {
			this._signals.connectNoId({	emitter: this._tracker.getTracker(), signal: 'notify::focus-app',
										callback: this._updateFocused, scope: this });
		}

        this._nextWindowsTimeout = null;
        this._showThumbnailsTimeout = null;
		this._resetNextWindows();

        global.yawl.watch(this);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        this._resetNextWindows();
        this._cancelShowThumbnailsTimeout();
        if (this.appButton) {
            this.appButton.destroy();
            this.appButton = null;
        }
        if (this.yawlPanelWindowsGroup) {
            this.yawlPanelWindowsGroup.destroy();
            this.yawlPanelWindowsGroup = null;
        }
		this.focused = false;
		this.appName = '?';
        this.windows = [];
		this._tracker = null;
		this.metaApp = null;
        this.emit('destroy');
        _D('<');
	},

	_updateFocused: function() {
        _D('@' + this.__name__ + '._updateFocused()');
        if (!this._tracker || !this._tracker.getTracker) {
            _D(!this._tracker ? 'this._tracker === null' : 'this._tracker.getTracker === null');
            _D('<');
            return;
        }
		let (focused = (this.metaApp == this._tracker.getTracker().focus_app)) {
            this.focused = focused;
            if (this.appButton && this.appButton.actor) {
                if (this.focused) this.appButton.actor.add_style_pseudo_class('active');
                else this.appButton.actor.remove_style_pseudo_class('active');
            }
            //this._resetNextWindows(); // commented out: gets called when a window of the same application is changed
		} // let (focused)
        _D('<');
	},

	_enterEvent: function() {
		_D('>' + this.__name__ + '._enterEvent()');
		this.setLabel('');
		this.showWindowsGroup();
		_D('<');
	},

	_leaveEvent: function() {
		_D('>' + this.__name__ + '._leaveEvent()');
		this.hideWindowsGroup();
		_D('<');
	},

    setLabel: function(text) {
        _D('>' + this.__name__ + '.setLabel()');
        if (this.yawlPanelWindowsGroup) this.yawlPanelWindowsGroup.labelText = text;
        _D('<');
    },

    addWindow: function(metaWindow) {
        _D('>' + this.__name__ + '.addWindow()');
        if (metaWindow && this.windows && this.windows.indexOf(metaWindow) == -1) {
            if (this._autohideshow && !this.windows.length && this.appButton) this.appButton.show();
			this.windows.push(metaWindow);
            if (this._tracker && this._tracker.getTrackerWindow) {
                let (trackerWindow = this._tracker.getTrackerWindow(metaWindow)) {
                    if (trackerWindow && trackerWindow.windowThumbnail && this.yawlPanelWindowsGroup) {
                        this.yawlPanelWindowsGroup.addChild(trackerWindow.windowThumbnail);
                    }
                }
            }
			this._resetNextWindows();
		}
        _D('<');
    },

    removeWindow: function(metaWindow) {
        _D('>' + this.__name__ + '.removeWindow()');
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

	_appButtonAllocationChanged: function() {
        _D('>' + this.__name__ + '._appButtonAllocationChanged()');
		if (this.yawlPanelWindowsGroup && !this.yawlPanelWindowsGroup.hidden && !this.yawlPanelWindowsGroup.hiding) {
			this.positionWindowsGroup();
		}
        _D('<');
	},

	positionWindowsGroup: function() {
        _D('>' + this.__name__ + '.positionWindowsGroup()');
		if (global.yawl.panelWindows) {
			global.yawl.panelWindows.y = Main.layoutManager && Main.layoutManager.panelBox
                    && Main.layoutManager.panelBox.get_stage()
					&& Main.layoutManager.panelBox.get_y() + Main.layoutManager.panelBox.get_height() || 0;
			if (this.yawlPanelWindowsGroup) {
				let (container = this.appButton && this.appButton.container) {
					if (container && container.get_stage()) {
						let (w = Main.layoutManager && Main.layoutManager.primaryMonitor
								         && Main.layoutManager.primaryMonitor.width
								 || global.yawl.panelWindows.container && global.yawl.panelWindows.container.get_stage()
                                         && global.yawl.panelWindows.container.get_width()
								 || 0) {
							global.yawl.panelWindows.animateToState({
									gravity: w && Math.round(container.get_transformed_position()[0]
											 + container.get_width() / 2) / w
							}, null, null, global.yawl.panelWindows.hidden ? 0 : null);
						} // let (w, y)
					} // if (container)
				} // let (container)
			} // if (this.yawlPanelWindowsGroup)
		} // if (global.yawl.panelWindows)
        _D('<');
	},

    showWindowsGroup: function() {
        _D('>' + this.__name__ + '.showWindowsGroup()');
		this._cancelShowThumbnailsTimeout();
        if (this.appButton && this.appButton.menu && this.appButton.menu.isOpen) {
            _D('<');
            return;
        }
		if (this.yawlPanelWindowsGroup && global.yawl.panelWindows) {
			this._showThumbnailsTimeout = Mainloop.timeout_add(
                    Math.max(33, global.yawl.panelWindows.hidden && global.yawl._windowsShowDelay || 0),
                    Lang.bind(this, function() {
                        this._cancelShowThumbnailsTimeout();
                        this.positionWindowsGroup(); // position it before showing if it is hidden
                        global.yawl.panelWindows.showChild(this.yawlPanelWindowsGroup, true);
                        global.yawl.panelWindows._lastWindowsGroupTrackerApp = this;
                    })
            );
        } // if (this.yawlPanelWindowsGroup && global.yawl.panelWindows)
        _D('<');
    },

    hideWindowsGroup: function() {
        _D('>' + this.__name__ + '.hideWindowsGroup()');
		this._cancelShowThumbnailsTimeout();
		if (this.yawlPanelWindowsGroup && global.yawl.panelWindows) {
			this._showThumbnailsTimeout = Mainloop.timeout_add(
			        77,
			        Lang.bind(this, function() {
						this._cancelShowThumbnailsTimeout();
						global.yawl.panelWindows.hideChild(this.yawlPanelWindowsGroup, true);
					})
			);
		} // if (this.yawlPanelWindowsGroup && global.yawl.panelWindows)
        _D('<');
    },

	_listWindowsFresh: function(minimized/* = false*/) {
        _D('>' + this.__name__ + '._listWindowsFresh()');
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
        _D('>' + this.__name__ + '._resetNextWindows()');
        this._cancelNextWindowsTimeout();
		this._nextWindowsWorkspace = null;
        this._nextWindowsLength = 0;
        this._nextWindowsIndex = 0;
        _D('<');
    },

    _cancelNextWindowsTimeout: function() {
        _D('>' + this.__name__ + '._cancelNextWindowsTimeout()');
        if (this._nextWindowsTimeout) {
            Mainloop.source_remove(this._nextWindowsTimeout);
            this._nextWindowsTimeout = null;
        }
        _D('<');
    },

    _cancelShowThumbnailsTimeout: function() {
        _D('>' + this.__name__ + '._cancelShowThumbnailsTimeout()');
        if (this._showThumbnailsTimeout) {
            Mainloop.source_remove(this._showThumbnailsTimeout);
            this._showThumbnailsTimeout = null;
        }
        _D('<');
    },

    _nextWindow: function(minimized/* = false*/) {
        _D('>' + this.__name__ + '._nextWindow()');
		let (windows = this._listWindowsFresh(minimized)) {
			if (windows.length) {
				if (!this.focused) {
					Main.activateWindow(windows[0]);
                    this._resetNextWindows();
				} // if (!this.focused)
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
				} // if (!this.focused) else
			} // if (windows.length)
		} // let (windows)
        _D('<');
    },

    nextWindowNonMinimized: function() {
        _D('>' + this.__name__ + '.nextWindowNonMinimized()');
        this._nextWindow();
        _D('<');
    },

    nextWindow: function() {
        _D('>' + this.__name__ + '.nextWindow()');
        this._nextWindow(true);
        _D('<');
    },

	_showAllWindows: function(minimized/* = false*/) {
        _D('>' + this.__name__ + '._showAllWindows()');
		let (windows = this._listWindowsFresh(minimized)) {
            if (windows.length) { // not necessary, but for consistency
    			for (let i = windows.length - 1; i >= 0; --i) Main.activateWindow(windows[i]);
            } // if (windows.length)
		} // let (windows)
        _D('<');
	},

    showAllWindowsNonMinimized: function() {
        _D('>' + this.__name__ + '.showAllWindowsNonMinimized()');
		this._showAllWindows();
        _D('<');
    },

    showAllWindows: function() {
        _D('>' + this.__name__ + '.showAllWindows()');
		this._showAllWindows(true);
        _D('<');
    },

	_rotateWindows: function(backward/* = false*/) {
        _D('>' + this.__name__ + '._rotateWindows()');
		let (windows = this._listWindowsFresh()) {
            if (windows.length) {
				if (!this.focused) {
					Main.activateWindow(windows[0]);
				} // if (!this.focused)
				else {
                    if (backward) {
                        if (windows.length > 1) Main.activateWindow(windows[windows.length - 1]);
                    }
                    else {
                        for (let i = windows.length - 1; i > 0; --i) Main.activateWindow(windows[i]);
                    }
				} // if (!this.focused) else
            } // if (windows.length)
		} // let (windows)
        _D('<');
	},

    rotateWindowsForward: function() {
        _D('>' + this.__name__ + '.rotateWindowsForward()');
		this._rotateWindows();
        _D('<');
    },

    rotateWindowsBackward: function() {
        _D('>' + this.__name__ + '.rotateWindowsBackward()');
		this._rotateWindows(true);
        _D('<');
    },

	_minimizeWindows: function(topOnly/* = false*/) {
        _D('>' + this.__name__ + '._minimizeWindows()');
		let (windows = this._listWindowsFresh()) {
			if (windows.length) {
				if (topOnly) windows[0].minimize();
				else windows.forEach(function(window) { window.minimize(); });
			} // if (windows.length)
		} // let (windows)
        _D('<');
	},

    minimizeTopWindow: function() {
        _D('>' + this.__name__ + '.minimizeTopWindow()');
		this._minimizeWindows(true);
        _D('<');
    },

    minimizeAllWindows: function() {
        _D('>' + this.__name__ + '.minimizeAllWindows()');
		this._minimizeWindows();
        _D('<');
    },

    _maximizeToggle: function(window) {
        _D('>' + this.__name__ + '._maximizeToggle()');
        if (window) {
            if ((window.get_maximized() & (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL))
                                        == (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL)) {
                window.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
            else {
                window.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
        } // if (window)
        _D('<');
    },

	_maximizeWindows: function(topOnly/* = false*/) {
        _D('>' + this.__name__ + '._maximizeWindows()');
		let (windows = this._listWindowsFresh()) {
			if (windows.length) {
				if (topOnly) this._maximizeToggle(windows[0]);
				else windows.forEach(Lang.bind(this, function(window) { this._maximizeToggle(window); }));
			} // if (windows.length)
		} // let (windows)
        _D('<');
	},

    maximizeTopWindow: function() {
        _D('>' + this.__name__ + '.maximizeTopWindow()');
		this._maximizeWindows(true);
        _D('<');
    },

    maximizeAllWindows: function() {
        _D('>' + this.__name__ + '.maximizeAllWindows()');
		this._maximizeWindows();
        _D('<');
    },

	_openNewWindow: function(workspaceIndex/* = -1*/) {
        _D('>' + this.__name__ + '._openNewWindow()');
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
        _D('>' + this.__name__ + '.openNewWindowThisWorkspace()');
		this._openNewWindow();
        _D('<');
    },

    openNewWindowNewWorkspace: function() {
        _D('>' + this.__name__ + '.openNewWindowNewWorkspace()');
		this._openNewWindow(global.screen.n_workspaces ? global.screen.n_workspaces - 1 : 0); // just in case
        _D('<');
    },

    openMenu: function() {
        _D('>' + this.__name__ + '.openMenu()');
        if (this.appButton) {
            this.hideWindowsGroup();
            this.appButton.menuToggle();
        }
        _D('<');
    },

    quitApplication: function() {
        _D('>' + this.__name__ + '.quitApplication()');
        if (this.metaApp) this.metaApp.request_quit();
        _D('<');
    }
});
Signals.addSignalMethods(dbFinTrackerApp.prototype);
