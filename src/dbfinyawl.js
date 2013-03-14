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
        this.yawlPanelApps = new dbFinYAWLPanel.dbFinYAWLPanel(Main.panel, 'panelYAWL', 'panelYAWLBox', '_yawlPanel',
                                                               /*hidden = */false, /*autohideinoverview = */true);
		dbFinUtils.settingsVariable(this, 'icons-animation-time', 490, { min: 0, max: 3000 }, function () {
    		if (this.yawlPanelApps) this.yawlPanelApps.animationTime = this._iconsAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'icons-animation-effect', 1, { min: 0 }, function () {
    		if (this.yawlPanelApps) this.yawlPanelApps.animationEffect = this._iconsAnimationEffect;
        });
        dbFinUtils.settingsVariable(this, 'icons-align', 0, { min: 0, max: 100 }, function () {
            if (this.yawlPanelApps) this.yawlPanelApps.animateToState({ gravity: this._iconsAlign / 100. });
        });

        this.yawlPanelWindows = new dbFinYAWLPanel.dbFinYAWLPanel(Main.layoutManager && Main.layoutManager.panelBox,
                                                                  'panelYAWLWindows', 'panelYAWLWindowsBox', '_yawlWindowsPanel',
                                                                  /*hidden = */false, /*autohideinoverview = */true);
        // GNOMENEXT: ui/lookingGlass.js: class LookingGlass
        if (this.yawlPanelWindows && this.yawlPanelWindows.container && Main.layoutManager && Main.layoutManager.panelBox) {
            this.yawlPanelWindows.container.lower_bottom();
            this._signals.connectNoId({ emitter: Main.layoutManager.panelBox, signal: 'allocation-changed',
                                        callback: this._yawlPanelWindowsQueueResize, scope: this });
            this._signals.connectNoId({ emitter: Main.layoutManager.keyboardBox, signal: 'allocation-changed',
                                        callback: this._yawlPanelWindowsQueueResize, scope: this });
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

    _yawlPanelWindowsQueueResize: function() {
        _D('@' + this.__name__ + '._yawlPanelWindowsQueueResize()');
        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this, function () { this._yawlPanelWindowsResize(); }));
        _D('<');
    },

	_yawlPanelWindowsResize: function() {
        _D('>' + this.__name__ + '._yawlPanelWindowsResize()');
		if (this.yawlPanelWindows && this.yawlPanelWindows.container) {
			let (pmX = Main.layoutManager.primaryMonitor.x,
				 pmY = Main.layoutManager.primaryMonitor.y,
				 w = Main.layoutManager.primaryMonitor.width,
				 h = 150) {
				this.yawlPanelWindows.container.x = 0;
				this.yawlPanelWindows.container.y = this.yawlPanelWindows.container.get_parent().height;
				this.yawlPanelWindows.container.width = w;
				this.yawlPanelWindows.container.height = h;
			}
		}
        _D('<');
	}
});
