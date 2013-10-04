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
 * dbfinyawl.js
 * Main class implementing the window list.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;

const Util = imports.misc.util;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinClicked = Me.imports.dbfinclicked;
const dbFinDebugView = Me.imports.dbfindebugview;
const dbFinMenuBuilder = Me.imports.dbfinmenubuilder;
const dbFinMoveCenter = Me.imports.dbfinmovecenter;
const dbFinPanelEnhancements = Me.imports.dbfinpanelenhancements;
const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinStyle = Me.imports.dbfinstyle;
const dbFinTracker = Me.imports.dbfintracker;
const dbFinUtils = Me.imports.dbfinutils;
const dbFinYAWLPanel = Me.imports.dbfinyawlpanel;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWL = new Lang.Class({
    Name: 'dbFin.YAWL',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		global.yawl = new dbFinSettings.dbFinSettings();
		if (!global.yawl) {
			_D('!YAWL: critical error "Cannot create global YAWL object."');
			_D('<');
			return;
		}

        this._signals = new dbFinSignals.dbFinSignals();

		if (global.yawl._firstTime) {
			Util.trySpawn([ 'gnome-shell-extension-prefs', 'yawl@dbfin.com' ]);
			let (settings = Me.imports.convenience2 && Me.imports.convenience2.getSettings()) {
				if (settings) settings.set_boolean('first-time', false);
			}
		}

        global.yawl.animation = new dbFinAnimation.dbFinAnimation();

        global.yawl.panelApps = new dbFinYAWLPanel.dbFinYAWLPanel({ panelname: 'panelYAWL',
                                                                    parent: Main.panel || null,
                                                                    parentproperty: '_yawlPanel',
                                                                    hideinoverview: true });
        global.yawl.panelWindows = new dbFinYAWLPanel.dbFinYAWLPanel({  panelname: 'panelYAWLWindows',
                                                                        parent: Main.uiGroup || null,
                                                                        parentproperty: '_yawlWindowsPanel',
                                                                        hidden: true,
                                                                        closeinoverview: true,
                                                                        width:  Main.layoutManager
                                                                                && Main.layoutManager.panelBox
                                                                                && Main.layoutManager.panelBox.get_stage()
                                                                                && Main.layoutManager.panelBox.get_width()
                                                                                ||  Main.panel && Main.panel.actor
                                                                                    && Main.panel.actor.get_stage()
                                                                                    && Main.panel.actor.get_width()
                                                                                || 0,
                                                                        gravityindicator: true });
        if (global.yawl.panelWindows) {
			this._style = new dbFinStyle.dbFinStyle(global.yawl.panelWindows.actor);
			this._signals.connectNoId({	emitter: global.yawl.panelWindows.actor, signal: 'enter-event',
										callback: this._hoverEnter, scope: this });
			this._signals.connectNoId({	emitter: global.yawl.panelWindows.actor, signal: 'leave-event',
										callback: this._hoverLeave, scope: this });
			this._signals.connectNoId({	emitter: global.yawl.panelWindows.actor, signal: 'style-changed',
										callback: this._panelWindowsStyleChanged, scope: this });
        }

		this._updatedIconsAnimationTime = function () { if (global.yawl.panelApps) global.yawl.panelApps.animationTime = global.yawl._iconsAnimationTime; };
		this._updatedIconsAnimationEffect = function () { if (global.yawl.panelApps) global.yawl.panelApps.animationEffect = global.yawl._iconsAnimationEffect; };
        this._updatedIconsAlign = function () { if (global.yawl.panelApps) global.yawl.panelApps.animateToState({ gravity: global.yawl._iconsAlign / 100. }); };
		this._updatedIconsSize = function () { if (global.yawl.panelWindows) global.yawl.panelWindows.gravityIndicatorWidth = global.yawl._iconsSize; };
		this._updatedWindowsIndicatorArrow = this._panelWindowsStyleChanged;
        this._updatedWindowsTheming =
                this._updatedWindowsBackgroundPanel =
                this._updatedWindowsBackgroundColor =
                this._updatedWindowsBackgroundOpacity =
				this._updatedWindowsTextColor =
				this._updatedWindowsTextSize =
                this._updatedWindowsPadding =
                this._updatedWindowsBorderColor =
                this._updatedWindowsBorderWidth =
                this._updatedWindowsBorderRadius = this._updatePanelWindowsStyle;
		this._updatedWindowsAnimationTime = function () { if (global.yawl.panelWindows) global.yawl.panelWindows.animationTime = global.yawl._windowsAnimationTime; };
		this._updatedWindowsAnimationEffect = function () { if (global.yawl.panelWindows) global.yawl.panelWindows.animationEffect = global.yawl._windowsAnimationEffect; };
        // this._updatedMouseScrollWorkspace: below

		if (Main.panel && Main.panel.actor) {
			this._signals.connectNoId({	emitter: Main.panel.actor, signal: 'style-changed',
										callback: this._mainPanelStyleChanged, scope: this });
		}

		this._moveCenter = new dbFinMoveCenter.dbFinMoveCenter();
        this._panelEnhancements = new dbFinPanelEnhancements.dbFinPanelEnhancements();

        this._tracker = new dbFinTracker.dbFinTracker();

        global.yawl.menuBuilder = new dbFinMenuBuilder.dbFinMenuBuilder();

		this._updatedDebug = function () {
			if (global.yawl._debug) {
				if (!global._yawlDebugView) {
					global._yawlDebugView = new dbFinDebugView.dbFinDebugView();
				}
			}
			else {
				if (global._yawlDebugView) {
					global._yawlDebugView.destroy();
					global._yawlDebugView = null;
				}
			}
		};
		this._updatedDebugWidth = function () { if (global._yawlDebugView) global._yawlDebugView.updatePosition(); };
		this._updatedDebugBottom = function () { if (global._yawlDebugView) global._yawlDebugView.updatePosition(); };

        this._updatedMouseScrollWorkspace =
		this._updatedMouseClickRelease =
                this._updatedMouseLongClick = function () {
		    if (this._clicked) {
			    this._clicked.destroy();
			    this._clicked = null;
		    }
            if (global.yawl && global.yawl.panelApps) {
                this._clicked = new dbFinClicked.dbFinClicked(global.yawl.panelApps.container, this._buttonClicked, this, /*clicks = */false, /*doubleClicks = */true,
                                /*scroll = */global.yawl._mouseScrollWorkspace, /*sendSingleClicksImmediately = */true,
                                /*clickOnRelease = */global.yawl._mouseClickRelease, /*longClick = */global.yawl._mouseLongClick);
            }
		};

        global.yawl.watch(this);
        _D('<');
    },

    destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		if (this._style) {
			this._style.destroy();
			this._style = null;
		}
		if (global.yawl.menuBuilder) {
			global.yawl.menuBuilder.destroy();
			global.yawl.menuBuilder = null;
		}
		if (this._tracker) {
			this._tracker.destroy();
			this._tracker = null;
		}
        if (this._panelEnhancements) {
            this._panelEnhancements.destroy();
            this._panelEnhancements = null;
        }
		if (this._moveCenter) {
			this._moveCenter.destroy();
			this._moveCenter = null;
		}
		if (global.yawl.panelWindows) {
			global.yawl.panelWindows.destroy();
			global.yawl.panelWindows = null;
		}
        if (global.yawl.panelApps) {
            global.yawl.panelApps.destroy();
            global.yawl.panelApps = null;
        }
        if (global.yawl.animation) {
            global.yawl.animation.destroy();
            global.yawl.animation = null;
        }
        if (global.yawl) { // must be destroyed last
            global.yawl.destroy();
            global.yawl = null;
        }
        this.emit('destroy');
        _D('<');
    },

    _hoverEnter: function () {
        _D('>' + this.__name__ + '._hoverEnter()');
        if (global.yawl.panelWindows && global.yawl.panelWindows._lastWindowsGroupTrackerApp) {
            global.yawl.panelWindows._lastWindowsGroupTrackerApp.showWindowsGroup();
        }
        _D('<');
    },

    _hoverLeave: function () {
        _D('>' + this.__name__ + '._hoverLeave()');
        if (global.yawl.panelWindows && global.yawl.panelWindows._lastWindowsGroupTrackerApp) {
            global.yawl.panelWindows._lastWindowsGroupTrackerApp.hideWindowsGroup();
        }
        _D('<');
    },

    changeWorkspace: function (direction) {
        _D('>' + this.__name__ + '.changeWorkspace()');
		if (!direction || !global.screen) {
			_D('<');
			return;
		}
		let (workspaceIndexNow = global.screen.get_active_workspace_index(),
             workspaceIndex = 0,
             hide = !global.yawl || !global.yawl._iconsShowAll
                    || !global.yawl._mouseScrollWorkspaceSearch,
             trackerApp = global.yawl && global.yawl.panelWindows
                        && global.yawl.panelWindows._lastWindowsGroupTrackerApp) {
            hide = hide || !trackerApp
                        || !trackerApp.metaApp
                        || !trackerApp.yawlPanelWindowsGroup
                        || trackerApp.yawlPanelWindowsGroup.hidden
                        || trackerApp.yawlPanelWindowsGroup.hiding
                        || trackerApp.yawlPanelWindowsGroup.showing;
            if (hide) {
                workspaceIndex = workspaceIndexNow + direction;
            }
            else let (windows = trackerApp.metaApp.get_windows()) {
                workspaceIndex = workspaceIndexNow;
                while ((workspaceIndex += direction) >= 0 && workspaceIndex < global.screen.n_workspaces) {
                    if (windows.some(function (metaWindow) {
                            return metaWindow && metaWindow.get_workspace().index() == workspaceIndex;
                        })) break;
                }
            }
			let (workspace = workspaceIndex >= 0
			     		  && workspaceIndex < global.screen.n_workspaces
			     		  && global.screen.get_workspace_by_index(workspaceIndex)) {
				if (workspace) {
                    if (this._tracker && this._tracker.apps) {
						this._tracker.apps.forEach(function (metaApp, trackerApp) {
							if (trackerApp) {
								trackerApp[hide ? 'hideWindowsGroup' : '_cancelShowThumbnailsTimeout'].call(trackerApp);
							}
						});
					}
                    workspace.activate(Math.round(GLib.get_monotonic_time() / 1000));
                }
			} // let (workspace)
		} // let (workspaceIndexNow, workspaceIndex, hide, trackerApp)
        _D('<');
   },

    _buttonClicked: function (state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!name || name == '' || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (!state.scroll && state.clicks > 2) {
            state.clicks = 2;
        }
        if (state.scroll) {
            if (state.up) {
				Mainloop.timeout_add(33, Lang.bind(this, function() { this.changeWorkspace(-1); }));
            }
            else {
				Mainloop.timeout_add(33, Lang.bind(this, function() { this.changeWorkspace(1); }));
            }
        }
        _D('<');
    },

	_mainPanelStyleChanged: function() {
        _D('@' + this.__name__ + '._mainPanelStyleChanged()');
		this._updatePanelWindowsStyle();
        _D('<');
	},

    _panelWindowsStyleChanged: function() {
        _D('@' + this.__name__ + '._panelWindowsStyleChanged()');
        if (global.yawl.panelWindows && global.yawl.panelWindows.actor && global.yawl.panelWindows.actor.get_stage()) {
            let (node = global.yawl.panelWindows.actor.get_theme_node()) {
                global.yawl.panelWindows.gravityIndicatorColor = node.get_border_color(1);
                global.yawl.panelWindows.gravityIndicatorArrow = global.yawl._windowsIndicatorArrow;
                global.yawl.panelWindows.gravityIndicatorHeight = dbFinUtils.inRange(
                    global.yawl._windowsIndicatorArrow ? 8 : node.get_border_width(1) || 1,
                    0, node.get_length('padding') - 2, 0
                );
            }
        } // if (global.yawl.panelWindows && global.yawl.panelWindows.actor && global.yawl.panelWindows.actor.get_stage())
        _D('<');
    },

	_updatePanelWindowsStyle: function() {
        _D('>' + this.__name__ + '._updatePanelWindowsStyle()');
		if (!this._style || !global.yawl || !global.yawl.panelWindows || !global.yawl.panelWindows.container
		    || !global.yawl.panelWindows.container.get_stage()) {
			_D('<');
			return;
		}
		let (style = {}) {
			if (global.yawl._windowsTheming) {
				let (colorRGB = { red: 0, green: 0, blue: 0 },
				     color = '') {
					if (global.yawl._windowsBackgroundPanel) {
						if (global.yawl._panelBackground) {
                            colorRGB = dbFinUtils.stringColorToRGBA(global.yawl._panelColor);
							color = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._panelColor,
							                                                     global.yawl._panelOpacity);
						} // if (global.yawl._panelBackground)
						else {
							let (node = Main.panel && Main.panel.actor && Main.panel.actor.get_stage()
										&& Main.panel.actor.get_theme_node()) {
								if (node) {
									colorRGB = node.get_background_color();
									color = 'rgba(' + colorRGB.red + ', ' + colorRGB.green + ', ' + colorRGB.blue
                                            + ', ' + colorRGB.alpha / 255. + ')';
								}
							}
						} // if (global.yawl._panelBackground) else
					} // if (global.yawl._windowsBackgroundPanel)
					if (color == '') {
                        colorRGB = dbFinUtils.stringColorToRGBA(global.yawl._windowsBackgroundColor);
						color = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._windowsBackgroundColor,
																			 global.yawl._windowsBackgroundOpacity);
					} // if (color == '')
					style['background-color'] = color;
                    if (colorRGB.red * 0.30 + colorRGB.green * 0.59 + colorRGB.blue * 0.11 >= 128) {
                        if (!global.yawl.panelWindows._light) {
							global.yawl.panelWindows.container.add_style_class_name('light');
							global.yawl.panelWindows._light = true;
						}
                    }
                    else {
                        if (global.yawl.panelWindows._light) {
							global.yawl.panelWindows.container.remove_style_class_name('light');
							global.yawl.panelWindows._light = false;
						}
                    }
				} // let (colorRGB, color)
				style['color'] = global.yawl._windowsTextColor;
				style['font-size'] = global.yawl._windowsTextSize + 'pt';
				style['padding'] = global.yawl._windowsPadding + 'px';
				style['border'] = global.yawl._windowsBorderWidth + 'px solid ' + global.yawl._windowsBorderColor;
				style['border-top-width'] = '0';
				style['border-radius'] = '0 0 ' + global.yawl._windowsBorderRadius + 'px ' + global.yawl._windowsBorderRadius + 'px';
			} // if (global.yawl._windowsTheming)
			else {
				style['background-color'] = '';
				style['color'] = '';
				style['font-size'] = '';
				style['padding'] = '';
				style['border'] = '';
				style['border-top-width'] = '';
				style['border-radius'] = '';
			} // if (global.yawl._windowsTheming) else
			this._style.set(style);
		} // let (style)
        _D('<');
	}
});
Signals.addSignalMethods(dbFinYAWL.prototype);
