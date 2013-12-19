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
 * dbfinsliceractor.js
 * Slicer Actor: Actor in Slicer with animated change of state.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;

const Params = imports.misc.params;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinStyle = Me.imports.dbfinstyle;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinSlicerActor = new Lang.Class({
	Name: 'dbFin.SlicerActor',

    // params:
    //     animateheight: animate height to zero and back in hide() and show()
    _init: function(actor, paramsContainer, params) { // actor will be destroyed by this class due to signal handling
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();

		paramsContainer = paramsContainer || {};
        params = params || {};
        this._animateHeight = !!params.animateheight;

		this.hovered = []; // actors "hovering" this dbFinSlicerActor

        paramsContainer = Params.parse(paramsContainer,
			   { y_expand: true, pivot_point: new Clutter.Point({ x: 0.5, y: 0.5 }), visible: true }, true);
		this.container = new Shell.Slicer(paramsContainer);
        if (this.container) {
            this._signals.connectNoId({	emitter: this.container, signal: 'notify::allocation',
                                        callback: this._updateAllocation, scope: this });
        }

        this.actor = actor || null;
        if (this.actor) {
            if (this.container) this.container.set_child(this.actor);
            this._signals.connectNoId({	emitter: this.actor, signal: 'enter-event',
										callback: this.hoverEnter, scope: this });
            this._signals.connectNoId({	emitter: this.actor, signal: 'leave-event',
										callback: this.hoverLeave, scope: this });
        }

		this.hidden = false;
		this.hiding = false;

		this._style = new dbFinStyle.dbFinStyle(this.actor);

		this._clipTop = 0; // px
		this._clipBottom = 0; // px
		this._paddingH = 0; // %
        this._paddingTop = 0; // px
        this._paddingBottom = 0; // px
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
		if (this._style) {
			this._style.destroy();
			this._style = null;
		}
		if (this.container) {
			this.container.set_child(null);
			this.container.destroy();
			this.container = null;
		}
        if (this.actor) {
            if (typeof this.actor.destroy == 'function') this.actor.destroy();
    		this.actor = null;
        }
        this.hoverLeaveAll();
		this.hidden = true;
        this.hiding = false;
		this.emit('destroy');
        _D('<');
	},

	show: function(time, callback, scope, transition) {
        _D('>' + this.__name__ + '.show()');
		if (this.container) {
			this.container.show();
			this.container.reactive = true;
		}
		this.hidden = false;
        this.hiding = false;
        let (state = { opacity: 255, natural_width: this.getNaturalWidth() }) {
            if (this._animateHeight) state.natural_height = this.getNaturalHeight();
            this.animateToState(state, callback, scope, time, transition, true);
        }
        _D('<');
	},

    hide: function(time, callback, scope, transition) {
        _D('>' + this.__name__ + '.hide()');
		this.hiding = true;
		let (state = { opacity: 0, natural_width: 0 }) {
			if (this._animateHeight) state.natural_height = 0;
			this.animateToState(state,
								function () {
									if (this.container) {
										this.container.reactive = false;
										this.container.hide();
									}
									this.hidden = true;
									this.hiding = false;
									if (callback) (scope ? Lang.bind(scope, callback) : callback)();
								},
								this,
								time,
								transition,
                                true);
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

	setPaddingTop: function(padding) {
        _D('>' + this.__name__ + '.setPaddingTop()');
		if (padding !== undefined && this._paddingTop != padding) {
			this._paddingTop = padding;
			if (this._style) {
				this._style.set({ 'padding-top': this._paddingTop + 'px' });
				this.restoreNaturalSize();
			}
		}
        _D('<');
	},

	setPaddingBottom: function(padding) {
        _D('>' + this.__name__ + '.setPaddingBottom()');
		if (padding !== undefined && this._paddingBottom != padding) {
			this._paddingBottom = padding;
			if (this._style) {
				this._style.set({ 'padding-bottom': this._paddingBottom + 'px' });
				this.restoreNaturalSize();
			}
		}
        _D('<');
	},

    setOpacity: function(opacity, time, callback, scope, transition) {
        _D('>' + this.__name__ + '.setOpacity()');
		this._opacity = dbFinUtils.inRange(opacity, 0, 255, 255);
		this.animateActorToState({ opacity: this._opacity }, callback, scope, time, transition);
        _D('<');
    },

    setOpacity100: function(opacity, time, callback, scope, transition) {
        _D('>' + this.__name__ + '.setOpacity100()');
		this._opacity = dbFinUtils.opacity100to255(dbFinUtils.inRange(opacity, 0, 100, 100));
		this.animateActorToState({ opacity: this._opacity }, callback, scope, time, transition);
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
		let (wn = this.actor && this.actor.get_stage() ? this.actor.get_preferred_width(-1)[1] : 0) {
            wn = wn || 0;
            if (wn > 0 && this._paddingH && this._paddingH > 0) {
                wn += 2 * Math.max(1, Math.round(wn * this._paddingH / 100.));
            }
	        _D('<');
            return Math.max(wn, Math.ceil(this.container.min_width));
		}
    },

    getNaturalHeight: function() {
        _D('>' + this.__name__ + '.getNaturalHeight()');
		let (hn = this.actor && this.actor.get_stage() ? this.actor.get_preferred_height(-1)[1] : 0) {
            hn = hn || 0;
	        _D('<');
            return Math.max(hn, this.container.min_height);
		}
    },

    restoreNaturalSize: function(time, callback, scope, transition) {
        _D('>' + this.__name__ + '.restoreNaturalSize()');
		let (state = { natural_width: this.getNaturalWidth() }) {
			if (this._animateHeight) state.natural_height = this.getNaturalHeight();
			this.animateToState(state, callback, scope, time, transition, true);
		}
        _D('<');
	},

	_updateAllocation: function() {
        _D('>' + this.__name__ + '._updateAllocation()');
        let (allocation = this.container.allocation) {
			if (this._clipTop > 0 || this._clipBottom > 0) {
				this.container.set_clip(0, Math.min(allocation.y2 - allocation.y1, this._clipTop),
				                        allocation.x2 - allocation.x1,
				                        Math.max(0, allocation.y2 - allocation.y1 - this._clipTop - this._clipBottom));
			}
			else {
				this.container.remove_clip();
			}
		} // let (allocation)
        _D('<');
	},

	hoverEnter: function(actor) {
        _D('>' + this.__name__ + '.hoverEnter()');
		if (!actor || !this.hovered || this.hovered.indexOf(actor) != -1) {
            _D('<');
            return;
        }
        this.hovered.push(actor);
        if (typeof actor.connect == 'function') try { actor._yawlHoverLeaveDestroyId = actor.connect('destroy', Lang.bind(this, this.hoverLeave)); } catch (e) { }
		if (this.hoverAnimation && !this.hidden && !this.hiding) {
			let (time = Math.round(this.animationTime * this.hoverAnimationTime / 100)) {
				if (this.hoverScale) this.animateToState({ scale_x: this.hoverScale, scale_y: this.hoverScale }, null, null, time, this.hoverAnimationEffect);
				if (this.hoverFit) this.animateToState({ min_width: this.getNaturalWidth() }, null, null, time, this.hoverAnimationEffect, true);
                this.animateActorToState({ opacity: this._hoverOpacity }, function () {
                    if (this.actor) this.actor.queue_relayout();
                }, this, time, this.hoverAnimationEffect);
			}
		}
        _D('<');
	},

	hoverLeave: function(actor) {
        _D('>' + this.__name__ + '.hoverLeave()');
		let (index = actor && this.hovered ? this.hovered.indexOf(actor) : -1) {
            if (index != -1) {
                this.hovered.splice(index, 1);
                if (actor._yawlHoverLeaveDestroyId && typeof actor.disconnect == 'function') try { actor.disconnect(actor._yawlHoverLeaveDestroyId); } catch (e) { }
            }
            if (index == -1 || this.hovered && this.hovered.length) {
                _D('<');
                return;
            }
        }
        let (time = Math.round(this.animationTime * this.hoverAnimationTime / 100)) {
            this.animateToState({ scale_x: 1.0, scale_y: 1.0 }, null, null, time, this.hoverAnimationEffect);
            this.animateToState({ min_width: 0 }, null, null, time, this.hoverAnimationEffect, true);
            this.animateActorToState({ opacity: this._opacity }, function () {
                if (this.actor) this.actor.queue_relayout();
            }, this, time, this.hoverAnimationEffect);
        }
        _D('<');
	},

    hoverLeaveAll: function() {
        _D('>' + this.__name__ + '.hoverLeaveAll()');
        if (this.hovered) {
            this.hovered.slice().forEach(Lang.bind(this, function (actor) { this.hoverLeave(actor); })); // not optimal but stable
        }
        _D('<');
    },

	animateToState: function(state, callback, scope, time, transition, rounded) {
        _D('>' + this.__name__ + '.animateToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (transition === undefined || transition === null) {
			transition = this.animationEffect;
		}
		dbFinAnimation.animateToState(this.container, state, callback, scope, time, transition, rounded);
        _D('<');
	},

	animateActorToState: function(state, callback, scope, time, transition, rounded) {
        _D('>' + this.__name__ + '.animateActorToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (transition === undefined || transition === null) {
			transition = this.animationEffect;
		}
		dbFinAnimation.animateToState(this.actor, state, callback, scope, time, transition, rounded);
        _D('<');
	}
});
Signals.addSignalMethods(dbFinSlicerActor.prototype);
