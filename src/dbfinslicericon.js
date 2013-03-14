/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinslicericon.js
 * Slicer Icon: Icon in Slicer with animated change of state.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerIcon = new Lang.Class({
	Name: 'dbFin.SlicerIcon',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this.actor = new Shell.Slicer({ y_expand: true, pivot_point: new Clutter.Point({ x: 0.5, y: 0.5 }) });
		this._icon = null; // icons are never destroyed when new are assigned
		this._clipTop = 0; // px
		this._clipBottom = 0; // px
		this._paddingH = 0; // %
		this.animationTime = 0;
        this.animationEffect = 0;
        this.actor.natural_width = 0;
        this._signals.connectNoId({	emitter: this.actor, signal: 'notify::allocation',
									callback: this._updateAllocation, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		if (this.actor) {
			this.actor.set_child(null);
			this.actor.destroy();
			this.actor = null;
		}
		this._icon = null;
        _D('<');
	},

	setIcon: function(icon) {
        _D('>' + this.__name__ + '.setIcon()');
		if (icon !== undefined && this._icon != icon) {
			this._icon = icon;
            this.actor.set_child(icon);
			this.restoreNaturalWidth();
		}
        _D('<');
	},

	setClipTop: function(clip) {
        _D('>' + this.__name__ + '.setClipTop()');
		if (clip !== undefined && this._clipTop != clip) {
			this._clipTop = clip;
			this._updateAllocation();
		}
        _D('<');
	},

	setClipBottom: function(clip) {
        _D('>' + this.__name__ + '.setClipBottom()');
		if (clip !== undefined && this._clipBottom != clip) {
			this._clipBottom = clip;
			this._updateAllocation();
		}
        _D('<');
	},

	setPaddingH: function(padding) {
        _D('>' + this.__name__ + '.setPaddingH()');
		if (padding !== undefined && this._paddingH != padding) {
			this._paddingH = padding;
			this.restoreNaturalWidth();
		}
        _D('<');
	},

    getNaturalWidth: function() {
        _D('>' + this.__name__ + '.getNaturalWidth()');
		let (wn = this._icon && this._icon.get_preferred_width ? this._icon.get_preferred_width(-1)[1] : 0) {
            wn = wn || 0;
            if (wn > 0 && this._paddingH > 0) {
                wn += 2 * Math.max(1, Math.round(wn * this._paddingH / 100.));
            }
	        _D('<');
            return wn;
		}
    },

    restoreNaturalWidth: function() {
        _D('>' + this.__name__ + '.restoreNaturalWidth()');
		this.animateToState({ natural_width: this.getNaturalWidth() });
        _D('<');
	},

	_updateAllocation: function() {
        _D('>' + this.__name__ + '._updateAllocation()');
        let (allocation = this.actor.allocation) {
			if (this._clipTop > 0 || this._clipBottom > 0) {
				this.actor.set_clip(0, Math.min(allocation.y2 - allocation.y1, this._clipTop),
				                       allocation.x2 - allocation.x1,
				                       Math.max(0, allocation.y2 - allocation.y1 - this._clipTop - this._clipBottom));
			}
			else {
				this.actor.remove_clip();
			}
		} // let (allocation)
        _D('<');
	},

	animateToState: function(state, callback, scope, time, transition) {
        _D('>' + this.__name__ + '.animateToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (transition === undefined || transition === null) {
			transition = this.animationEffect;
		}
		dbFinAnimation.animateToState(this.actor, state, callback, scope, time, transition);
        _D('<');
	}
});
