/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinyawl.js
 * Main class implementing the window list.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const Meta = imports.gi.Meta;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinMoveCenter = Me.imports.dbfinmovecenter;
const dbFinPanelEnhancements = Me.imports.dbfinpanelenhancements;
const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;
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

        global.yawl.panelApps = new dbFinYAWLPanel.dbFinYAWLPanel({ panelname: 'panelYAWL',
                                                                    parent: Main.panel || null,
                                                                    parentproperty: '_yawlPanel',
                                                                    hideinoverview: true });
        global.yawl.panelWindows = new dbFinYAWLPanel.dbFinYAWLPanel({  panelname: 'panelYAWLWindows',
                                                                        parent: Main.uiGroup || null,
                                                                        parentproperty: '_yawlWindowsPanel',
                                                                        hidden: true,
                                                                        hideinoverview: true,
                                                                        width:  Main.layoutManager
                                                                                && Main.layoutManager.primaryMonitor
                                                                                && Main.layoutManager.primaryMonitor.width
                                                                                ||  Main.panel && Main.panel.actor
                                                                                    && Main.panel.actor.get_width()
                                                                                || 0,
                                                                        gravityindicator: true });
        if (global.yawl.panelWindows) {
			this._signals.connectNoId({	emitter: global.yawl.panelWindows.actor, signal: 'enter-event',
										callback: this._hoverEnter, scope: this });
			this._signals.connectNoId({	emitter: global.yawl.panelWindows.actor, signal: 'leave-event',
										callback: this._hoverLeave, scope: this });
        }

		this._updatedIconsAnimationTime = function () { if (global.yawl.panelApps) global.yawl.panelApps.animationTime = global.yawl._iconsAnimationTime; };
		this._updatedIconsAnimationEffect = function () { if (global.yawl.panelApps) global.yawl.panelApps.animationEffect = global.yawl._iconsAnimationEffect; };
        this._updatedIconsAlign = function () { if (global.yawl.panelApps) global.yawl.panelApps.animateToState({ gravity: global.yawl._iconsAlign / 100. }); };
		this._updatedWindowsPanelHeight =
                this._updatedWindowsIndicatorArrow =
				this._updatedIconsSize =
                this._updatedWindowsTheming =
                this._updatedWindowsBackgroundPanel =
                this._updatedWindowsBackgroundColor =
                this._updatedWindowsBackgroundOpacity =
                this._updatedWindowsPadding =
                this._updatedWindowsBorderColor =
                this._updatedWindowsBorderWidth =
                this._updatedWindowsBorderRadius = this._updatePanelWindowsStyle;
		this._updatedWindowsAnimationTime = function () { if (global.yawl.panelWindows) global.yawl.panelWindows.animationTime = global.yawl._windowsAnimationTime; };
		this._updatedWindowsAnimationEffect = function () { if (global.yawl.panelWindows) global.yawl.panelWindows.animationEffect = global.yawl._windowsAnimationEffect; };
		if (Main.panel && Main.panel.actor) {
			this._signals.connectNoId({	emitter: Main.panel.actor, signal: 'style-changed',
										callback: this._updatePanelWindowsStyle, scope: this });
		}

		this._moveCenter = new dbFinMoveCenter.dbFinMoveCenter();
        this._panelEnhancements = new dbFinPanelEnhancements.dbFinPanelEnhancements();

        this._tracker = new dbFinTracker.dbFinTracker();

        global.yawl.watch(this);
        _D('<');
    },

    destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
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

	_updatePanelWindowsStyle: function() {
        _D('>' + this.__name__ + '._updatePanelWindowsStyle()');
        if (global.yawl.panelWindows && global.yawl.panelWindows.actor) {
            let (style = null,
                 height = global.yawl._windowsThumbnailsHeightVisible + global.yawl._windowsThumbnailsPaddingTop) {
                if (global.yawl._windowsTheming) {
                    let (color = '') {
                        if (global.yawl._windowsBackgroundPanel) {
                            let (node = Main.panel && Main.panel.actor && Main.panel.actor.get_stage()
                                        && Main.panel.actor.get_theme_node()) {
                                if (node) {
                                    color = node.get_background_color();
                                    color = 'rgba(' + color.red + ', ' + color.green + ', ' + color.blue + ', ' + color.alpha / 255. + ')';
                                }
                            }
                        } // if (global.yawl._windowsBackgroundPanel)
                        if (color == '') {
                            color = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._windowsBackgroundColor,
                                                                                 global.yawl._windowsBackgroundOpacity);
                        }
                        style = 'background-color: ' + color;
                    } // let (color)
                    style += '; padding: ' + global.yawl._windowsPadding + 'px';
                    style += '; border: ' + global.yawl._windowsBorderWidth + 'px solid ' + global.yawl._windowsBorderColor;
					style += '; border-top-width: 0';
					style += '; border-radius: 0 0 ' + global.yawl._windowsBorderRadius + 'px ' + global.yawl._windowsBorderRadius + 'px';
                    height += (global.yawl._windowsPadding || 0) * 2 + (global.yawl._windowsBorderWidth || 0);
                } // if (global.yawl._windowsTheming)
                let (styleCurrent = global.yawl.panelWindows.actor.get_style()) {
                    if (style !== styleCurrent) global.yawl.panelWindows.actor.set_style(style);
                }
                global.yawl.panelWindows.max_height = height;
            } // let (style, height)
            global.yawl.panelWindows.gravityIndicatorArrow = global.yawl._windowsIndicatorArrow;
			global.yawl.panelWindows.gravityIndicatorWidth = global.yawl._iconsSize;
            global.yawl.panelWindows.gravityIndicatorHeight = global.yawl._windowsIndicatorArrow
                                                            ? 8 : global.yawl._windowsBorderWidth || 1;
        } // if (global.yawl.panelWindows && global.yawl.panelWindows.actor)
        _D('<');
	}
});
Signals.addSignalMethods(dbFinYAWL.prototype);
