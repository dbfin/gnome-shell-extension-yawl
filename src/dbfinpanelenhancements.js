/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinpanelenhancements.js
 * Some visual and other panel improvements.
 *
 */

const Lang = imports.lang;

const Main = imports.ui.main;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPanelEnhancements = new Lang.Class({
	Name: 'dbFin.PanelEnhancements',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinSignals.dbFinSignals();
        dbFinUtils.settingsVariable(this, 'panel-color', '#000000', null, this._updatePanelStyle);
        dbFinUtils.settingsVariable(this, 'panel-opacity', 100, { min: 0, max: 100 }, this._updatePanelStyle);
        dbFinUtils.settingsVariable(this, 'panel-background', false, null, function () {
            if (this._panelBackground) this._updatePanelStyle();
            else this._restorePanelStyle();
        });
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this._restorePanelStyle();
        this._settings = null;
        _D('<');
	},

	_updatePanelStyle: function() {
        _D('>' + this.__name__ + '._updatePanelStyle()');
		if (!this._panelBackground) {
			_D('<');
			return;
		}
        let (style = null, stylecorner = null) {
            let (color = dbFinUtils.stringColorOpacity100ToStringRGBA(this._panelColor, this._panelOpacity)) {
                style = 'background-color: ' + color;
                stylecorner = '-panel-corner-border-width: 0; -panel-corner-border-color: ' + color + '; -panel-corner-background-color: ' + color;
            }
    		Main.panel.actor.set_style(style);
    		Main.panel._leftCorner.actor.set_style(stylecorner);
    		Main.panel._rightCorner.actor.set_style(stylecorner);
		} // let (style, stylecorner)
        _D('<');
	},

	_restorePanelStyle: function() {
        _D('>' + this.__name__ + '._restorePanelStyle()');
		Main.panel.actor.set_style(null);
        Main.panel._leftCorner.actor.set_style(null);
        Main.panel._rightCorner.actor.set_style(null);
        _D('<');
	}
});
