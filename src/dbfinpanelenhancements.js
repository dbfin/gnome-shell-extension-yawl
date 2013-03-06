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

const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPanelEnhancements = new Lang.Class({
	Name: 'dbFin.PanelEnhancements',

    _init: function() {
        _D('>dbFinPanelEnhancements._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinSignals.dbFinSignals();
		this._panelBackground = false;
		this._panelColor = '#000000';
		this._panelOpacity = 100;
        this._updatePanelBackground();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::panel-background',
                                    callback: this._updatePanelBackground, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>dbFinPanelEnhancements.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this._restorePanelStyle();
        this._settings = null;
        _D('<');
	},

    _updatePanelBackground: function() {
        _D('>dbFinPanelEnhancements._updatePanelBackground()');
		this._panelBackground = dbFinUtils.settingsGetBoolean(this._settings, 'panel-background', this._panelBackground);
        if (this._panelBackground) {
			this._updatePanelColor();
            this._signals.connectId('panel-color', {    emitter: this._settings, signal: 'changed::panel-color',
                                                        callback: this._updatePanelColor, scope: this });
			this._updatePanelOpacity();
            this._signals.connectId('panel-opacity', {    emitter: this._settings, signal: 'changed::panel-opacity',
                                                        callback: this._updatePanelOpacity, scope: this });
        }
		else {
			this._signals.disconnectId('panel-color');
			this._signals.disconnectId('panel-opacity');
			this._restorePanelStyle();
		}
        _D('<');
    },

	_updatePanelColor: function() {
        _D('>dbFinPanelEnhancements._updatePanelColor()');
		this._panelColor = dbFinUtils.settingsGetString(this._settings, 'panel-color', this._panelColor);
		this._updatePanelStyle();
        _D('<');
	},

	_updatePanelOpacity: function() {
        _D('>dbFinPanelEnhancements._updatePanelOpacity()');
        this._panelOpacity = dbFinUtils.settingsParseInt(this._settings, 'panel-opacity', 0, 100, this._panelOpacity);
		this._updatePanelStyle();
        _D('<');
	},

	_updatePanelStyle: function() {
        _D('>dbFinPanelEnhancements._updatePanelStyle()');
        let (style = null, stylecorner = null) {
			let (rgba = new Gdk.RGBA(),
				 opacity = this._panelOpacity / 100.) {
				rgba.parse(this._panelColor);
				let (color = rgba.to_string().replace(/rgba?(\s*\(\s*[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+).*?(\))/, 'rgba$1, ' + opacity + '$2')) {
					style = 'background-color: ' + color;
					stylecorner = '-panel-corner-border-width: 0; -panel-corner-border-color: ' + color + '; -panel-corner-background-color: ' + color;
				} // let (color)
			} // let (rgba)
    		Main.panel.actor.set_style(style);
    		Main.panel._leftCorner.actor.set_style(stylecorner);
    		Main.panel._rightCorner.actor.set_style(stylecorner);
		} // let (style, stylecorner)
        _D('<');
	},

	_restorePanelStyle: function() {
        _D('>dbFinPanelEnhancements._restorePanelStyle()');
		Main.panel.actor.set_style(null);
        Main.panel._leftCorner.actor.set_style(null);
        Main.panel._rightCorner.actor.set_style(null);
        _D('<');
	},

	_updatePanel: function() {
        _D('>dbFinPanelEnhancements._updatePanel()');
		Main.panel.actor.queue_relayout();
        _D('<');
	}
});
