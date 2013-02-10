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

const Gdk = imports.gi.Gdk;

const Main = imports.ui.main;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinDebug = Me.imports.dbfindebug;
const _D = dbFinDebug._D;

const dbFinPanelEnhancements = new Lang.Class({
	Name: 'dbFin.PanelEnhancements',

    _init: function() {
        _D('>dbFinPanelEnhancements._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinUtils.Signals();
        this._updateSignals();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::panel-background',
                                    callback: this._updateSignals, scope: this });
        _D('<. . .');
    },

	destroy: function() {
        _D('>dbFinPanelEnhancements.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this._restorePanelStyle();
        this._settings = null;
        _D('<. . .');
	},

    _updateSignals: function() {
        _D('>dbFinPanelEnhancements._updateSignals()');
		this._updatePanelStyle();
        if (this._settings.get_boolean('panel-background')) {
            this._signals.connectId('panel-color', {    emitter: this._settings, signal: 'changed::panel-color',
                                                        callback: this._updatePanelStyle, scope: this });
            this._signals.connectId('panel-opacity', {    emitter: this._settings, signal: 'changed::panel-opacity',
                                                        callback: this._updatePanelStyle, scope: this });
        }
		else {
			this._signals.disconnectId('panel-color');
			this._signals.disconnectId('panel-opacity');
		}
        _D('<. . .');
    },

	_updatePanelStyle: function() {
        _D('>dbFinPanelEnhancements._updatePanelStyle()');
        let (style = null) {
			if (this._settings.get_boolean('panel-background')) {
				let (rgba = new Gdk.RGBA(),
                     opacity = parseInt(this._settings.get_string('panel-opacity')) / 100.) {
                    rgba.parse(this._settings.get_string('panel-color'));
    				style = 'background-color: ' + rgba.to_string().replace(/rgba?(\s*\(\s*[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+).*?(\))/, 'rgba$1, ' + opacity + '$2');
                } // let (rgba)
			}
    		Main.panel.actor.set_style(style);
		} // let (style)
        _D('<. . .');
	},

	_restorePanelStyle: function() {
        _D('>dbFinPanelEnhancements._restorePanelStyle()');
		Main.panel.actor.set_style(null);
        _D('<. . .');
	},

	// GNOMENEXT: ui/panel.js: class Panel
	_updatePanel: function() {
        _D('>dbFinPanelEnhancements._updatePanel()');
		Main.panel._updatePanel();
        _D('<. . .');
	}
});
