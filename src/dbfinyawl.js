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

const dbFinMoveCenter = Me.imports.dbfinmovecenter;
const dbFinPanelEnhancements = Me.imports.dbfinpanelenhancements;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTracker = Me.imports.dbfintracker;
const dbFinYAWLPanel = Me.imports.dbfinyawlpanel;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWL = new Lang.Class({
    Name: 'dbFin.YAWL',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this._moveCenter = new dbFinMoveCenter.dbFinMoveCenter();
        this._panelEnhancements = new dbFinPanelEnhancements.dbFinPanelEnhancements();
        this._yawlPanelApps = new dbFinYAWLPanel.dbFinYAWLPanel(Main.panel, 'panelYAWL', '_yawlBox',
                                                                /*hidden = */false, /*autohideinoverview = */true);
        this._yawlPanelWindows = new dbFinYAWLPanel.dbFinYAWLPanel(Main.layoutManager && Main.layoutManager.panelBox,
                                                                   'panelYAWLWindows', '_yawlWindowsBox',
                                                                   /*hidden = */false, /*autohideinoverview = */true);
        // GNOMENEXT: ui/lookingGlass.js: class LookingGlass
        if (this._yawlPanelWindows && Main.layoutManager && Main.layoutManager.panelBox) {
            this._yawlPanelWindows.actor.lower_bottom();
            this._signals.connectNoId({ emitter: Main.layoutManager.panelBox, signal: 'allocation-changed',
                                        callback: this._yawlPanelWindowsQueueResize, scope: this });
            this._signals.connectNoId({ emitter: Main.layoutManager.keyboardBox, signal: 'allocation-changed',
                                        callback: this._yawlPanelWindowsQueueResize, scope: this });
        }
        this._tracker = new dbFinTracker.dbFinTracker(this._yawlPanelApps, this._yawlPanelWindows);
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
		if (this._yawlPanelWindows) {
			this._yawlPanelWindows.destroy();
			this._yawlPanelWindows = null;
		}
        if (this._yawlPanelApps) {
            this._yawlPanelApps.destroy();
            this._yawlPanelApps = null;
        }
        if (this._panelEnhancements) {
            this._panelEnhancements.destroy();
            this._panelEnhancements = null;
        }
		if (this._moveCenter) {
			this._moveCenter.destroy();
			this._moveCenter = null;
		}
        _D('<');
    },

    _yawlPanelWindowsQueueResize: function() {
        _D('@' + this.__name__ + '._yawlPanelWindowsQueueResize()');
        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this, function () { this._yawlPanelWindowsResize(); }));
        _D('<');
    },

	_yawlPanelWindowsResize: function() {
        _D('>' + this.__name__ + '._yawlPanelWindowsResize()');
		if (this._yawlPanelWindows && this._yawlPanelWindows.actor) {
			let (pmX = Main.layoutManager.primaryMonitor.x,
				 pmY = Main.layoutManager.primaryMonitor.y,
				 w = Main.layoutManager.primaryMonitor.width,
				 h = 150) {
				this._yawlPanelWindows.actor.x = 0;
				this._yawlPanelWindows.actor.y = this._yawlPanelWindows.actor.get_parent().height;
				this._yawlPanelWindows.actor.width = w;
				this._yawlPanelWindows.actor.height = h;
			}
		}
        _D('<');
	}
});
