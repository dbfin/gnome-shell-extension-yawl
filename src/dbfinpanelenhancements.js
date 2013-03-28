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
const Signals = imports.signals;

const Main = imports.ui.main;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPanelEnhancements = new Lang.Class({
	Name: 'dbFin.PanelEnhancements',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._updatedPanelColor =
        		this._updatedPanelOpacity = this._updatePanelStyle;
        this._updatedPanelBackground = function () {
            if (global.yawl._panelBackground) this._updatePanelStyle();
            else this._restorePanelStyle();
        };
		global.yawl.watch(this);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        this._restorePanelStyle();
        this.emit('destroy');
        _D('<');
	},

	_updatePanelStyle: function() {
        _D('>' + this.__name__ + '._updatePanelStyle()');
		if (!global.yawl._panelBackground) {
			_D('<');
			return;
		}
        let (style = null, stylecorner = null) {
            let (color = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._panelColor, global.yawl._panelOpacity)) {
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
Signals.addSignalMethods(dbFinPanelEnhancements.prototype);
