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

const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerIcon = new Lang.Class({
	Name: 'dbFin.SlicerIcon',

    _init: function() {
        _D('>dbFinSlicerIcon._init()');
        this._signals = new dbFinUtils.Signals();
		this.actor = new Shell.Slicer({ y_expand: true, pivot_point: new Clutter.Point({ x: 0.5, y: 0.5 }) });
		this._icon = null; // icons are never destroyed when new are assigned
		this._clipTop = 0; // px
		this._clipBottom = 0; // px
		this._paddingH = 0; // %
		this.animationTime = 0;
        this.actor.natural_width = 0;
        this._signals.connectNoId({	emitter: this.actor, signal: 'notify::allocation',
									callback: this._updateAllocation, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>dbFinSlicerIcon.destroy()');
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
        _D('>dbFinSlicerIcon.setIcon()');
		if (icon !== undefined && this._icon != icon) {
			this._icon = icon;
            this.actor.set_child(icon);
			this.restoreNaturalWidth();
		}
        _D('<');
	},

	setClipTop: function(clip) {
        _D('>dbFinSlicerIcon.setClipTop()');
		if (clip !== undefined && this._clipTop != clip) {
			this._clipTop = clip;
			this._updateAllocation();
		}
        _D('<');
	},

	setClipBottom: function(clip) {
        _D('>dbFinSlicerIcon.setClipBottom()');
		if (clip !== undefined && this._clipBottom != clip) {
			this._clipBottom = clip;
			this._updateAllocation();
		}
        _D('<');
	},

	setPaddingH: function(padding) {
        _D('>dbFinSlicerIcon.setPaddingH()');
		if (padding !== undefined && this._paddingH != padding) {
			this._paddingH = padding;
			this.restoreNaturalWidth();
		}
        _D('<');
	},

    getNaturalWidth: function() {
        _D('>dbFinSlicerIcon.getNaturalWidth()');
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
        _D('>dbFinSlicerIcon.restoreNaturalWidth()');
		this.animateToState({ natural_width: this.getNaturalWidth() });
        _D('<');
	},

	_updateAllocation: function() {
        _D('>dbFinSlicerIcon._updateAllocation()');
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
        _D('>dbFinSlicerIcon.animateToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (time > 0 && this.actor.get_stage()) { // we do not schedule animation for actors not in stage
            let (_state = {}, was = false) {
                for (let p in state) { // animate only those that are already defined and new
					p = '' + p;
                    if (this.actor[p] !== undefined) {
						Tweener.removeTweens(this.actor, p);
                        if (this.actor[p] !== state[p]) {
							_state[p] = state[p];
	                        was = true;
						}
                    }
                } // for (let p)
                if (was) { // anything to animate?
                    if (transition === undefined || transition === null) transition = 'easeOutQuad';
                    _state.time = time / 1000.;
                    _state.transition = transition;
                    if (callback) _state.onComplete = callback;
                    if (scope) _state.onCompleteScope = scope;
                    Tweener.addTween(this.actor, _state);
                } // if (was)
				else if (callback) {
					if (scope) Lang.bind(scope, callback)();
					else callback();
				} // if (was) else
            } // let (_state, was)
		} // if (time > 0 && this.actor.get_stage())
		else {
			for (let p in state) {
				p = '' + p;
                if (this.actor[p] !== undefined) {
					Tweener.removeTweens(this.actor, p);
					if (this.actor[p] !== state[p]) {
	                    this.actor[p] = state[p];
					}
				}
			} // for (let p)
			if (callback) {
				if (scope) Lang.bind(scope, callback)();
				else callback();
			}
		} // if (time > 0 && this.actor.get_stage()) else
        _D('<');
	}
});
