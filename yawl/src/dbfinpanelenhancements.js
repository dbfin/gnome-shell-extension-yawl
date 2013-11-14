/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL GNOME Shell Extensions
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * YAWL, a group of GNOME Shell extensions, is provided as
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

const dbFinStyle = Me.imports.dbfinstyle;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPanelEnhancements = new Lang.Class({
	Name: 'dbFin.PanelEnhancements',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		if (Main.panel) {
			this._style = new dbFinStyle.dbFinStyle(Main.panel.actor);
		}
		if (Main.panel._leftCorner) {
			this._styleLeftCorner = new dbFinStyle.dbFinStyle(Main.panel._leftCorner.actor);
		}
		if (Main.panel._rightCorner) {
			this._styleRightCorner = new dbFinStyle.dbFinStyle(Main.panel._rightCorner.actor);
		}
        this._updatedPanelTopColor =
        		this._updatedPanelTopOpacity =
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
		if (this._style) {
			this._style.destroy();
			this._style = null;
		}
		if (this._styleLeftCorner) {
			this._styleLeftCorner.destroy();
			this._styleLeftCorner = null;
		}
		if (this._styleRightCorner) {
			this._styleRightCorner.destroy();
			this._styleRightCorner = null;
		}
        this.emit('destroy');
        _D('<');
	},

	_updatePanelStyle: function() {
        _D('>' + this.__name__ + '._updatePanelStyle()');
		if (!global.yawl || !global.yawl._panelBackground) {
			_D('<');
			return;
		}
        let (style = {},
			 styleCorner = {}) {
            let (color = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._panelColor, global.yawl._panelOpacity),
                 colorTop = dbFinUtils.stringColorOpacity100ToStringRGBA(global.yawl._panelTopColor, global.yawl._panelTopOpacity)) {
                style['background-color'] = color;
				style['background-gradient-start'] = colorTop;
				style['background-gradient-end'] = color;
				style['background-gradient-direction'] = 'vertical';
                styleCorner['-panel-corner-border-width'] = '0';
                styleCorner['-panel-corner-border-color'] = color;
                styleCorner['-panel-corner-background-color'] = color;
            }
			if (this._style) this._style.set(style);
			if (this._styleLeftCorner) this._styleLeftCorner.set(styleCorner);
			if (this._styleRightCorner) this._styleRightCorner.set(styleCorner);
		} // let (style, styleCorner)
        _D('<');
	},

	_restorePanelStyle: function() {
        _D('>' + this.__name__ + '._restorePanelStyle()');
        let (style = {},
			 styleCorner = {}) {
			style['background-color'] = '';
			style['background-gradient-start'] = '';
			style['background-gradient-end'] = '';
			style['background-gradient-direction'] = '';
			styleCorner['-panel-corner-border-width'] = '';
			styleCorner['-panel-corner-border-color'] = '';
			styleCorner['-panel-corner-background-color'] = '';
			if (this._style) this._style.set(style);
			if (this._styleLeftCorner) this._styleLeftCorner.set(styleCorner);
			if (this._styleRightCorner) this._styleRightCorner.set(styleCorner);
		} // let (style, styleCorner)
        _D('<');
	}
});
Signals.addSignalMethods(dbFinPanelEnhancements.prototype);
