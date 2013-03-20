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

const Meta = imports.gi.Meta;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinMoveCenter = Me.imports.dbfinmovecenter;
const dbFinPanelEnhancements = Me.imports.dbfinpanelenhancements;
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
        this._signals = new dbFinSignals.dbFinSignals();
        this._settings = Convenience.getSettings();
		this._moveCenter = new dbFinMoveCenter.dbFinMoveCenter();
        this._panelEnhancements = new dbFinPanelEnhancements.dbFinPanelEnhancements();

        this.yawlPanelApps = new dbFinYAWLPanel.dbFinYAWLPanel({    parent: Main.panel || null,
                                                                    panelname: 'panelYAWL',
                                                                    boxname: 'panelYAWLBox',
                                                                    parentproperty: '_yawlPanel',
                                                                    hideinoverview: true });
		dbFinUtils.settingsVariable(this, 'icons-animation-time', 490, { min: 0, max: 3000 }, function () {
    		if (this.yawlPanelApps) this.yawlPanelApps.animationTime = this._iconsAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'icons-animation-effect', 1, { min: 0 }, function () {
    		if (this.yawlPanelApps) this.yawlPanelApps.animationEffect = this._iconsAnimationEffect;
        });
        dbFinUtils.settingsVariable(this, 'icons-align', 0, { min: 0, max: 100 }, function () {
            if (this.yawlPanelApps) this.yawlPanelApps.animateToState({ gravity: this._iconsAlign / 100. });
        });

        this.yawlPanelWindows = new dbFinYAWLPanel.dbFinYAWLPanel({ parent: Main.uiGroup || null,
                                                                    panelname: 'panelYAWLWindows',
                                                                    boxname: 'panelYAWLWindowsBox',
                                                                    parentproperty: '_yawlWindowsPanel',
                                                                    hidden: true,
                                                                    hideinoverview: true,
                                                                    width:  Main.layoutManager
                                                                            && Main.layoutManager.primaryMonitor
                                                                            && Main.layoutManager.primaryMonitor.width
	                                                                        ||  Main.panel && Main.panel.actor
                                                                                && Main.panel.actor.get_width()
                                                                            || 0,
                                                                    y:  Main.panel && Main.panel.actor
                                                                        && Main.panel.actor.get_height() || 0 });
        dbFinUtils.settingsVariable(this, 'windows-panel-height', 160, { min: 40, max: 400 }, this._updatePanelWindowsStyle);
        dbFinUtils.settingsVariable(this, 'windows-theming', true, null, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-background-panel', true, null, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-background-color', '#000000', null, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-background-opacity', 70, { min: 0, max: 100 }, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-padding', 7, { min: 0, max: 21 }, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-border-color', '#d3d7cf', null, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-border-width', 2, { min: 0, max: 3 }, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-border-radius', 7, { min: 0, max: 11 }, this._updatePanelWindowsStyle);
		dbFinUtils.settingsVariable(this, 'windows-animation-time', 490, { min: 0, max: 3000 }, function () {
    		if (this.yawlPanelWindows) this.yawlPanelWindows.animationTime = this._windowsAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'windows-animation-effect', 1, { min: 0 }, function () {
    		if (this.yawlPanelWindows) this.yawlPanelWindows.animationEffect = this._windowsAnimationEffect;
        });
		if (Main.panel && Main.panel.actor) {
			this._signals.connectNoId({	emitter: Main.panel.actor, signal: 'style-changed',
										callback: this._updatePanelWindowsStyle, scope: this });
		}

        this._tracker = new dbFinTracker.dbFinTracker(this.yawlPanelApps, this.yawlPanelWindows);
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
		if (this.yawlPanelWindows) {
			this.yawlPanelWindows.destroy();
			this.yawlPanelWindows = null;
		}
        if (this.yawlPanelApps) {
            this.yawlPanelApps.destroy();
            this.yawlPanelApps = null;
        }
        if (this._panelEnhancements) {
            this._panelEnhancements.destroy();
            this._panelEnhancements = null;
        }
		if (this._moveCenter) {
			this._moveCenter.destroy();
			this._moveCenter = null;
		}
        this._settings = null;
        _D('<');
    },

	_updatePanelWindowsStyle: function() {
        _D('>' + this.__name__ + '._updatePanelWindowsStyle()');
        if (this.yawlPanelWindows && this.yawlPanelWindows.actor) {
            let (style = null, height = this._windowsPanelHeight) {
                if (this._windowsTheming) {
                    let (color = '') {
                        if (this._windowsBackgroundPanel) {
                            let (node = Main.panel && Main.panel.actor && Main.panel.actor.get_theme_node
                                        && Main.panel.actor.get_theme_node()) {
                                if (node) {
                                    color = node.get_background_color();
                                    color = 'rgba(' + color.red + ', ' + color.green + ', ' + color.blue + ', ' + color.alpha / 255. + ')';
                                }
                            }
                        } // if (this._windowsBackgroundPanel)
                        if (color == '') {
                            color = dbFinUtils.stringColorOpacity100ToStringRGBA(this._windowsBackgroundColor,
                                                                                 this._windowsBackgroundOpacity);
                        }
                        style = 'background-color: ' + color;
                    } // let (color)
                    style += '; padding: ' + this._windowsPadding + 'px';
                    style += '; border: ' + this._windowsBorderWidth + 'px solid ' + this._windowsBorderColor;
					style += '; border-top-width: 0';
					style += '; border-radius: 0 0 ' + this._windowsBorderRadius + 'px ' + this._windowsBorderRadius + 'px';
                    height += (this._windowsPadding || 0) * 2 + (this._windowsBorderWidth || 0);
                } // if (this._windowsTheming)
                this.yawlPanelWindows.actor.set_style(style);
                this.yawlPanelWindows.max_height = height;
            } // let (style, height)
        }
        _D('<');
	}
});
