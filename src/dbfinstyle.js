/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
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

const _D = Me.imports.dbfindebug._D;

const dbFinStyle = new Lang.Class({
	Name: 'dbFin.Style',

    _init: function(actor) {
        _D('>' + this.__name__ + '._init()');
		this._actor = actor || null;
		this._style = new dbFinArrayHash.dbFinArrayHash();
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		this._actor = null;
		if (this._style) {
			this._style.destroy();
			this._style = null;
		}
        _D('<');
	},

	set: function(style/* = {}*/) {
        _D('>' + this.__name__ + '.set()');
		if (style) {
			this._style.setObject(style);
			this.apply();
		}
        _D('<');
	},

	get: function() {
        _D('>' + this.__name__ + '.get()');
		let (style = {}) {
			if (this._style) {
				this._style.forEach(function (p, v) {
					if (v !== undefined && v !== null && v !== '') {
						style[p] = v;
					}
				});
			}
	        _D('<');
			return style;
		}
	},

	apply: function() {
        _D('>' + this.__name__ + '.apply()');
		if (!this._actor) {
			_D('<');
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
			if ((cssNow || css) && cssNow !== css) this._actor.set_style(css);
		}
        _D('<');
	}
});
