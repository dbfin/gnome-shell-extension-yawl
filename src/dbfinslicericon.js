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
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerIcon = new Lang.Class({
	Name: 'dbFin.SlicerIcon',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this.actor = new Shell.Slicer({ y_expand: true, pivot_point: new Clutter.Point({ x: 0.5, y: 0.5 }) });
        if (this.actor) {
            this.actor._delegate = this;
            this.actor.natural_width = 0;
            this._signals.connectNoId({	emitter: this.actor, signal: 'notify::allocation',
                                        callback: this._updateAllocation, scope: this });
        }
        this.wrapper = new St.Bin({ reactive: true, track_hover: true });
        if (this.wrapper) {
            this.wrapper._delegate = this;
            if (this.actor) this.actor.set_child(this.wrapper);
            this._signals.connectNoId({	emitter: this.wrapper, signal: 'enter-event',
										callback: this._hoverEnter, scope: this });
            this._signals.connectNoId({	emitter: this.wrapper, signal: 'leave-event',
										callback: this._hoverLeave, scope: this });
        }

        this._icon = null; // icons are never destroyed when new are assigned
		this._clipTop = 0; // px
		this._clipBottom = 0; // px
		this._paddingH = 0; // %
        this._opacity = 255;

        this.animationTime = 0;
        this.animationEffect = 0;
        this.hoverAnimation = false;
        this._hoverOpacity = 255;
        this.hoverScale = 1.;
        this.hoverFit = false;
		this.hoverAnimationTime = 100; // as percentage of this.animationTime
        this.hoverAnimationEffect = 0;
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
            let (parent = this.actor.get_parent && this.actor.get_parent()) {
                if (parent && parent.remove_actor) parent.remove_actor(this.actor);
            }
			this.actor.destroy();
			this.actor = null;
		}
        if (this.wrapper) {
            this.wrapper.set_child(null);
            this.wrapper.destroy();
            this.wrapper = null;
        }
		this._icon = null;
        _D('<');
	},

	setIcon: function(icon) {
        _D('>' + this.__name__ + '.setIcon()');
		if (icon !== undefined && this._icon != icon) { // icon can be null!
			this._icon = icon;
            if (this.wrapper) this.wrapper.set_child(icon);
			this.restoreNaturalSize();
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
			this.restoreNaturalSize();
		}
        _D('<');
	},

    setOpacity: function(opacity) {
        _D('>' + this.__name__ + '.setOpacity()');
        opacity = dbFinUtils.inRange(opacity, 0, 255, undefined);
        if (opacity !== undefined && this._opacity != opacity) {
            this._opacity = opacity;
    		this.animateIconToState({ opacity: opacity });
        }
        _D('<');
    },

    setOpacity100: function(opacity) {
        _D('>' + this.__name__ + '.setOpacity100()');
        opacity = dbFinUtils.opacity100to255(dbFinUtils.inRange(opacity, 0, 100, undefined));
        if (opacity !== undefined && this._opacity != opacity) {
            this._opacity = opacity;
    		this.animateIconToState({ opacity: opacity });
        }
        _D('<');
    },

    setHoverOpacity: function(opacity) {
        _D('>' + this.__name__ + '.setHoverOpacity()');
        opacity = dbFinUtils.inRange(opacity, 0, 255, undefined);
        if (opacity !== undefined && this._hoverOpacity != opacity) {
            this._hoverOpacity = opacity;
        }
        _D('<');
    },

    setHoverOpacity100: function(opacity) {
        _D('>' + this.__name__ + '.setHoverOpacity100()');
        opacity = dbFinUtils.opacity100to255(dbFinUtils.inRange(opacity, 0, 100, undefined));
        if (opacity !== undefined && this._hoverOpacity != opacity) {
            this._hoverOpacity = opacity;
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
            return Math.max(wn, this.actor.min_width);
		}
    },

    getNaturalHeight: function() {
        _D('>' + this.__name__ + '.getNaturalHeight()');
		let (hn = this._icon && this._icon.get_preferred_height ? this._icon.get_preferred_height(-1)[1] : 0) {
            hn = hn || 0;
	        _D('<');
            return Math.max(hn, this.actor.min_height);
		}
    },

    restoreNaturalSize: function() {
        _D('>' + this.__name__ + '.restoreNaturalSize()');
		this.animateToState({ natural_width: this.getNaturalWidth(), natural_height: this.getNaturalHeight() });
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

	_hoverEnter: function() {
        _D('>' + this.__name__ + '._hoverEnter()');
		if (this.hoverAnimation) {
			let (state = {},
                 time = Math.round(this.animationTime * this.hoverAnimationTime / 100)) {
				if (this.hoverScale) state.scale_x = state.scale_y = this.hoverScale;
				if (this.hoverFit) state.min_width = this.getNaturalWidth();
				this.animateToState(state, null, null, time, this.hoverAnimationEffect);
                this.animateIconToState({ opacity: this._hoverOpacity }, null, null, time, this.hoverAnimationEffect);
			}
		}
        _D('<');
	},

	_hoverLeave: function() {
        _D('>' + this.__name__ + '._hoverLeave()');
        let (state = {},
             time = Math.round(this.animationTime * this.hoverAnimationTime / 100)) {
            state.scale_x = state.scale_y = 1.;
            state.min_width = 0;
            this.animateToState(state, null, null, time, this.hoverAnimationEffect);
            this.animateIconToState({ opacity: this._opacity }, null, null, time, this.hoverAnimationEffect);
        }
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
	},

	animateIconToState: function(state, callback, scope, time, transition) {
        _D('>' + this.__name__ + '.animateIconToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (transition === undefined || transition === null) {
			transition = this.animationEffect;
		}
		dbFinAnimation.animateToState(this.wrapper, state, callback, scope, time, transition);
        _D('<');
	}
});
