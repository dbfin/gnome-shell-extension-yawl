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
 * dbfinstyle.js
 * Inline styles support.
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinStyle = new Lang.Class({
	Name: 'dbFin.Style',

    _init: function(actor) {
		this._actor = actor || null;
		this._style = new dbFinArrayHash.dbFinArrayHash();
    },

	destroy: function() {
		this._actor = null;
		if (this._style) {
			this._style.destroy();
			this._style = null;
		}
	},

	set: function(style/* = {}*/) {
		if (style) {
			this._style.setObject(style);
			this.apply();
		}
	},

	get: function() {
		let (style = {}) {
			if (this._style) {
				this._style.forEach(function (p, v) {
					if (v !== undefined && v !== null && v !== '') {
						style[p] = v;
					}
				});
			}
			return style;
		}
	},

	apply: function() {
		if (!this._actor) {
			return;
		}
		let (cssNow = this._actor.get_style(),
		     css = '') {
			if (this._style) {
				this._style.forEach(function (p, v) {
					if (v !== undefined && v !== null && v !== '') {
						if (css) css += '; ';
						css += p + ': ' + v;
					}
				});
			}
			if ((cssNow || css) && cssNow !== css) this._actor.set_style(css || null);
		}
	}
});
