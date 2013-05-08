/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
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
 * dbfinyawlpanel.js
 * YAWL Panel.
 *
 */

const Cairo = imports.cairo;
const Lang = imports.lang;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;
const Overview = imports.ui.overview;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinSlicerLabel = Me.imports.dbfinslicerlabel;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWLPanel = new Lang.Class({
	Name: 'dbFin.YAWLPanel',

    // GNOMENEXT: ui/panel.js: class Panel
    // params:  panelname, parent, parentproperty,
    //          hidden, showhidechildren, hideinoverview,
    //          gravity, width, maxchildheight, x, y
    //          gravityindicator, gravityindicatorcolor, gravityindicatorarrow, gravityindicatorwidth, gravityindicatorheight
	//			title, label
    _init: function(params) {
        _D('>' + this.__name__ + '._init()');
		this._signals = new dbFinSignals.dbFinSignals();
        this._panelName = params.panelname || '';
        this._parent = params.parent || null;
        this._parentProperty = params.parentproperty || '';
        this._showHideChildren = params.showhidechildren || false;
        this._gravity = dbFinUtils.inRange(parseFloat(params.gravity), 0.0, 1.0, 0.0);
        this._childrenObjects = new dbFinArrayHash.dbFinArrayHash();
        if (params.hideinoverview) {
			if (Main.overview && Main.overview.visible) this._hideInOverview();
			this._signals.connectNoId({	emitter: Main.overview, signal: 'showing',
										callback: this._hideInOverview, scope: this });
			this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
										callback: this._showOutOfOverview, scope: this });
        }

		this.container = this._panelName	? new Shell.GenericContainer({ name: this._panelName, reactive: true, visible: true })
        									: new Shell.GenericContainer({ reactive: true, visible: true });
        if (this.container) {
            if (params.width) this.container.min_width = this.container.natural_width = params.width;
            this._maxChildHeight = params.maxchildheight || 0;
			if (params.x) this.container.x = params.x;
			if (params.y) this.container.y = params.y;
            this._signals.connectNoId({ emitter: this.container, signal: 'get-preferred-width',
                                        callback: this._getPreferredWidth, scope: this });
            this._signals.connectNoId({ emitter: this.container, signal: 'get-preferred-height',
                                        callback: this._getPreferredHeight, scope: this });
            this._signals.connectNoId({ emitter: this.container, signal: 'allocate',
                                        callback: this._allocate, scope: this });
        }

		this.actor = new St.BoxLayout({ vertical: true, reactive: true, visible: true });
		if (this.actor) {
            this.actor._delegate = this;
            if (this.container) this.container.add_actor(this.actor);
            this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                        callback: this._styleChanged, scope: this });
        }

		this.labelTitle = params.title || params.title === ''
				? new dbFinSlicerLabel.dbFinSlicerLabel({ text: '' + params.title })
				: null;
		if (this.labelTitle) {
			if (this.actor && this.labelTitle.container) this.actor.add_actor(this.labelTitle.container);
		}
		this.label = params.label || params.label === ''
			? new dbFinSlicerLabel.dbFinSlicerLabel({ text: '' + params.label })
			: null;
		if (this.label) {
			this._labelText = '' + params.label;
			if (this.actor) {
				if (this.label.container) this.actor.add_actor(this.label.container);
				this._signals.connectNoId({	emitter: this.actor, signal: 'notify::allocation',
											callback: this._actorAllocationChanged, scope: this });
			}
			this.label.hide(0);
			this._updateLabelWidth(0);
			this.label.show();
		}

		this.box = new St.BoxLayout({ vertical: false, x_align: Clutter.ActorAlign.CENTER, reactive: true, visible: true });
		if (this.box) {
            this.box._delegate = this;
            if (this.actor) {
                this.actor.add_actor(this.box);
                if (this.container) this.container._box = this.box;
            }
        }

        this._gravityIndicator = params.gravityindicator && this.container && this.actor
                                        ? new St.DrawingArea({ name: 'Indicator' }) : null;
        this._gravityIndicatorColor = 0;
        this._gravityIndicatorArrow = !!params.gravityindicatorarrow;
        this._gravityIndicatorWidth = params.gravityindicatorwidth || 0;
        this._gravityIndicatorHeight = params.gravityindicatorheight || 0;
		if (this._gravityIndicator) {
            this._signals.connectNoId({	emitter: this._gravityIndicator, signal: 'repaint',
                                        callback: this._drawGravityIndicator, scope: this });
			this.container.add_actor(this._gravityIndicator);
		}

        this.animationTime = Overview.ANIMATION_TIME * 1000;
        this.animationEffect = 'easeOutQuad';

		this.hidden = false;
        this.hiding = false;
		if (params.hidden) this.hide(0);

        if (this._parent) {
            if (this._parent == Main.uiGroup) {
                Main.layoutManager.addChrome(this.container);
            }
            else if (this._parent.add_actor) {
                this._parent.add_actor(this.container);
            }
            else if (this._parent.actor && this._parent.actor.add_actor) {
                this._parent.actor.add_actor(this.container);
            }
            if (this._parentProperty) {
                this._parent[this._parentProperty] = this.container;
            }
        }

		this._styleChanged(); // just in case
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
		if (this.container) {
            let (parent = this.container.get_parent && this.container.get_parent() || this._parent) {
                if (parent) {
                    if (this._parentProperty && parent[this._parentProperty] == this.container) {
                        parent[this._parentProperty] = null;
                    }
                    if (parent == Main.uiGroup) {
                        Main.layoutManager.removeChrome(this.container);
                    }
                    else if (parent.remove_actor) {
                        parent.remove_actor(this.container);
                    }
                    else if (parent.actor && parent.actor.remove_actor) { // this might be this._parent
                        parent.actor.remove_actor(this.container);
                    }
                }
            } // let (parent)
		}
        if (this._childrenObjects) {
            this._childrenObjects.forEach(Lang.bind(this, function(childObject, signals) { this.removeChild(childObject); }));
        }
		if (this._gravityIndicator) {
			if (this.container) this.container.remove_actor(this._gravityIndicator);
			this._gravityIndicator.destroy();
			this._gravityIndicator = null;
		}
		if (this.box) {
			if (this.container) this.container._box = null;
			if (this.actor) this.actor.remove_actor(this.box);
			this.box.reactive = false;
			this.box._delegate = null;
			this.box.destroy();
			this.box = null;
		}
		if (this.label) {
			if (this.label.container && this.actor) this.actor.remove_actor(this.label.container);
			this.label.destroy();
			this.label = null;
		}
		if (this.labelTitle) {
			if (this.labelTitle.container && this.actor) this.actor.remove_actor(this.labelTitle.container);
			this.labelTitle.destroy();
			this.labelTitle = null;
		}
		if (this.actor) {
			if (this.container) {
                this.container.remove_actor(this.actor);
            }
            this.actor.reactive = false;
            this.actor._delegate = null;
			this.actor.destroy();
			this.actor = null;
		}
		if (this.container) {
			this.container.destroy();
			this.container = null;
		}
        this.hidden = true;
        this._parent = null;
        this.emit('destroy');
        _D('<');
	},

    _getPreferredWidth: function(actor, forHeight, alloc) {
        _D('@' + this.__name__ + '._getPreferredWidth()');
		[ alloc.min_size, alloc.natural_size ] = this.actor && this.actor.get_stage()
                                                        ? this.actor.get_preferred_width(forHeight)
                                                        : [ 0, 0 ];
        _D('<');
    },

    _getPreferredHeight: function(actor, forWidth, alloc) {
        _D('@' + this.__name__ + '._getPreferredHeight()');
        let ([ hm, hn ] = this.actor && this.actor.get_stage() ? this.actor.get_preferred_height(forWidth) : [ 0, 0 ],
             [ hbm, hbn ] = this.box && this.box.get_stage() ? this.box.get_preferred_height(forWidth) : [ 0, 0 ]) {
            if (this._maxChildHeight && this._maxChildHeight > 0) {
                if (hbm > this._maxChildHeight) hm -= hbm - this._maxChildHeight;
                if (hbn > this._maxChildHeight) hn -= hbn - this._maxChildHeight;
            }
            [ alloc.min_size, alloc.natural_size ] = [ hm, hn ];
        }
        _D('<');
    },

    _allocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()');
		if (!this.actor || !this.actor.get_stage()) {
			_D('<');
			return;
		}
        let (	w = box.x2 - box.x1,
                h = box.y2 - box.y1,
                x = box.x1,
                y = box.y1,
            	[ wm, wn ] = this.actor.get_preferred_width(-1),
                [ hm, hn ] = this.actor.get_preferred_height(-1),
                boxChild = new Clutter.ActorBox()) {
			let (gx = Math.floor(box.x1 + w * this._gravity)) {
                if (wn < w) x = dbFinUtils.inRange(gx - (wn >> 1), box.x1, box.x2 - wn);
                else wn = w;
                let (x2 = x + wn,
                     y2 = Math.min(box.y2, y + hn)) {
                    dbFinUtils.setBox(boxChild, x, y, x2, y2);
                    this.actor.allocate(boxChild, flags);
                    if (this._gravityIndicator) {
                        let (ix = gx - (this._gravityIndicatorWidth >> 1)) {
                            dbFinUtils.setBox(boxChild, Math.max(x, ix),
                                              			y + 1,
                                                        Math.min(x2, ix + this._gravityIndicatorWidth),
                                              			Math.min(y2 - 1, y + 1 + this._gravityIndicatorHeight));
                            this._gravityIndicator.allocate(boxChild, flags);
                        } // let (ix)
                    } // if (this._gravityIndicator)
                } // let (x2, y2)
			} // let (gx)
        } // let (w, h, x, y, [ wm, wn ], [ hm, hn ], boxChild)
        _D('<');
    },

	_drawGravityIndicator: function(area) {
        _D('@' + this.__name__ + '._drawGravityIndicator()');
		if (!area || !area.get_stage()) {
			_D('<');
			return;
		}
		let ([ w, h ] = area.get_surface_size(),
			 bc = this._gravityIndicatorColor) {
			if (w >= 1 && h >= 1 && bc && bc.alpha) {
				let (cr = area.get_context(),
					 red = bc.red / 255,
					 green = bc.green / 255,
					 blue = bc.blue / 255,
					 alpha = bc.alpha / 255,
					 gradientStop = 0) {
					if (this._gravityIndicatorArrow) {
						let (x = 1 / 2,
							 y = 1 / 2,
							 x1 = w / 2 - h + 1,
							 x2 = w / 2 + h - 1,
							 x3 = w - 1 / 2) {
							cr.moveTo(x, y);
							if (x1 > x) { cr.lineTo(x1, y); gradientStop = x1 / w; }
							cr.lineTo(w / 2, h - 1 / 2);
							if (x2 < x3) cr.lineTo(x2, y);
							cr.lineTo(x3, y);
						} // let (x, y, x1, x2, x3)
						cr.setLineWidth(1);
					}
					else {
						let (bw = Math.min(w, h)) {
							cr.moveTo(bw / 2, bw / 2);
							cr.lineTo(w - bw / 2, bw / 2);
							cr.setLineWidth(bw);
							gradientStop = 1 / 2;
						} // let (bw)
					}
					if (gradientStop > 0) {
						let (gradient = new Cairo.LinearGradient(0, 0, w, h)) {
							gradient.addColorStopRGBA(0, red, green, blue, 0);
							gradient.addColorStopRGBA(gradientStop, red, green, blue, alpha);
							gradient.addColorStopRGBA(1 - gradientStop, red, green, blue, alpha);
							gradient.addColorStopRGBA(1, red, green, blue, 0);
							cr.setSource(gradient);
						}
					}
					else {
						Clutter.cairo_set_source_color(cr, bc);
					}
					cr.stroke();
				} // let (cr, red, green, blue, alpha, gradientStop)
			} // if (w >= 1 && h >= 1 && bc && bc.alpha > 0)
		} // let ([w, h], bc)
        _D('<');
	},

    addChild: function(childObject) {
        _D('>' + this.__name__ + '.addChild()');
        if (childObject && this._childrenObjects.get(childObject) === undefined) {
            let (actor = childObject.container || childObject.actor || childObject) {
                if (actor instanceof Clutter.Actor) this.box.add_actor(actor);
            }
            let (signals = new dbFinSignals.dbFinSignals()) {
                signals.connectNoId({   emitter: childObject, signal: 'destroy',
                                        callback: this.removeChild, scope: this });
                this._childrenObjects.set(childObject, signals);
            }
			if (!this.hidden && !this.hiding && this._showHideChildren
			    && (childObject.hidden || childObject.hiding)) {
				this.showChild(childObject, false);
			}
        }
        _D('<');
    },

    removeChild: function(childObject) {
        _D('>' + this.__name__ + '.removeChild()');
        if (childObject) {
            let (signals = this._childrenObjects.remove(childObject)) {
                if (signals !== undefined) {
                    signals.destroy();
                    signals = null;
                    let (actor = childObject.container || childObject.actor || childObject) {
                        if (actor.get_parent && actor.get_parent() == this.box) this.box.remove_actor(actor);
                    }
                }
            }
        }
        _D('<');
    },

    showChild: function(childObject, showSelf, time) {
        _D('>' + this.__name__ + '.showChild()');
        if (childObject && childObject.show && this._childrenObjects && this._childrenObjects.get(childObject) !== undefined) {
            if (showSelf) this.show();
            if (!this._showHideChildren || !showSelf) childObject.show(time === undefined || time === null ? this.animationTime : time);
        }
        _D('<');
    },

    hideChild: function(childObject, hideSelf, time) {
        _D('>' + this.__name__ + '.hideChild()');
        if (childObject && childObject.hide && this._childrenObjects && this._childrenObjects.get(childObject) !== undefined) {
            hideSelf = hideSelf && !this._childrenObjects.some(function (c, s) {
                return !!c && c != childObject && !c.hidden && !c.hiding;
            });
            if (!this._showHideChildren || !hideSelf) childObject.hide(time === undefined || time === null ? this.animationTime : time);
            if (hideSelf) this.hide();
        }
        _D('<');
    },

    showChildren: function(showSelf, time) {
        _D('>' + this.__name__ + '.showChildren()');
		if (showSelf) this.show();
        if (this._childrenObjects) {
            this._childrenObjects.forEach(Lang.bind(this, function (childObject, signals) {
                if (childObject && childObject.show) childObject.show(time === undefined || time === null ? this.animationTime : time);
            }));
        }
        _D('<');
    },

    hideChildren: function(hideSelf, time) {
        _D('>' + this.__name__ + '.hideChildren()');
        if (this._childrenObjects) {
            this._childrenObjects.forEach(Lang.bind(this, function (childObject, signals) {
                if (childObject && childObject.hide) childObject.hide(time === undefined || time === null ? this.animationTime : time);
            }));
        }
        if (hideSelf) this.hide();
        _D('<');
    },

	updateLabel: function() {
		_D('>' + this.__name__ + '.updateLabel()');
		if (!this.label) {
			_D('<');
			return;
		}
		let (t = this.animationTime >> 3) {
			if (this.label.getText() === this._labelText) {
//				this.label.setOpacity(255, 0);
				this.label.setOpacity(255, this.hidden || this.label.hidden || this._labelText === '' ? 0 : t,
									  null, null, 'easeInOutQuad');
			} // if (this.label.getText() === this._labelText)
			else {
//				this.label.setOpacity(0, 0);
				this.label.setOpacity(0, this.hidden || this.label.hidden || this.label.getText() === '' ? 0 : t, function () {
					if (this.label) {
						this.label.setText(this._labelText);
						this._updateLabelWidth(0);
//						this.label.setOpacity(255, 0);
						this.label.setOpacity(255, this.hidden || this.label.hidden || this._labelText === '' ? 0 : t,
											  null, null, 'easeInOutQuad');
					} // if (this.label)
				}, this, 'easeInOutQuad'); // this.label.setOpacity(0)
			} // if (this.label.getText() === this._labelText) else
		} // let (t)
		_D('<');
	},

    show: function(time, callback, scope, transition) {
        _D('>' + this.__name__ + '.show()');
        if (Main.screenShield.locked) {
            _D('<');
            return;
        }
        if (this.container) {
            this.container.show();
            this.container.reactive = true;
        }
        this.hidden = false;
        this.hiding = false;
        if (this._showHideChildren) {
			this.showChildren(false, time);
			if (this.labelTitle) this.labelTitle.show(time === undefined || time === null ? this.animationTime : time);
			if (this.label) this.label.show(time === undefined || time === null ? this.animationTime : time);
		}
		this.animateToState({ opacity: 255 }, callback, scope, time, transition);
        _D('<');
    },

    hide: function(time, callback, scope, transition) {
        _D('>' + this.__name__ + '.hide()');
        this.hiding = true;
        if (this._showHideChildren) {
			this.hideChildren(false, time);
			if (this.labelTitle) this.labelTitle.hide(time === undefined || time === null ? this.animationTime : time);
			if (this.label) this.label.hide(time === undefined || time === null ? this.animationTime : time);
		}
		this.animateToState({ opacity: 0 },
                            function() {
                                if (this.container) {
                                    this.container.reactive = false;
                                    this.container.hide();
                                }
                                this.hidden = true;
                                this.hiding = false;
								if (callback) (scope ? Lang.bind(scope, callback) : callback)();
                            }, this, time, transition);
        _D('<');
    },

    _showOutOfOverview: function () {
        _D('>' + this.__name__ + '.showOutOfOverview()');
        if (this.container) {
            this.container.opacity = 0;
            this.container.natural_height_set = false;
            dbFinAnimation.animateToState(this.container, { opacity: 255 }, null, null, this.animationTime);
        }
        _D('<');
    },

    _hideInOverview: function () {
        _D('>' + this.__name__ + '._hideInOverview()');
        if (this.container) {
            dbFinAnimation.animateToState(this.container, { opacity: 0 }, function () {
                this.natural_height = 0;
            }, this.container, this.animationTime);
        }
        _D('<');
    },

    updatePanel: function(repaintIndicator) {
        _D('>' + this.__name__ + '.updatePanel()');
		if (repaintIndicator && this._gravityIndicator && this._gravityIndicator.get_stage()) {
            this._gravityIndicator.queue_repaint();
        }
		if (this.box) this.box.queue_relayout();
        else if (this.actor) this.actor.queue_relayout();
        else if (this.container) this.container.queue_relayout();
        _D('<');
    },

	_updateLabelWidth: function(time) {
		_D('>' + this.__name__ + '._updateLabelWidth()');
		if (this.label && this.label.actor && this.label.actor.clutter_text && this.label.actor.clutter_text.get_stage()) {
			dbFinAnimation.animateToState(
			    this.label.actor,
				{ natural_width: this.actor ? Math.min(this.label.actor.clutter_text.get_preferred_width(-1)[1],
					                          this.actor.width) || 1
											: this.label.actor.clutter_text.get_preferred_width(-1)[1] || 1 },
				null, null, time === undefined || time === null ? this.animationTime : time, 'linear'
			);
		}
		_D('<');
	},

	_styleChanged: function() {
        _D('@' + this.__name__ + '._styleChanged()');
		this.updatePanel(true);
        _D('<');
	},

	_actorAllocationChanged: function() {
		_D('@' + this.__name__ + '._actorAllocationChanged()');
		this._updateLabelWidth();
		_D('<');
	},

    // animatable properties
    get gravity() { return this._gravity; },
    set gravity(gravity) {
        gravity = dbFinUtils.inRange(parseFloat(gravity), 0.0, 1.0, 0.0);
        if (gravity !== this._gravity) {
            this._gravity = gravity;
            this.updatePanel();
        }
    },
    get gravityIndicatorColor() { return this._gravityIndicatorColor; },
    set gravityIndicatorColor(gravityIndicatorColor) {
        if (gravityIndicatorColor   && gravityIndicatorColor.red !== undefined
                                    && gravityIndicatorColor.green !== undefined
                                    && gravityIndicatorColor.blue !== undefined
                                    && gravityIndicatorColor.alpha !== undefined
            &&  (gravityIndicatorColor.red !== this._gravityIndicatorColor.red
                    || gravityIndicatorColor.green !== this._gravityIndicatorColor.green
                    || gravityIndicatorColor.blue !== this._gravityIndicatorColor.blue
                    || gravityIndicatorColor.alpha !== this._gravityIndicatorColor.alpha)) {
            this._gravityIndicatorColor = gravityIndicatorColor;
            this.updatePanel(true);
        }
    },
    get gravityIndicatorArrow() { return this._gravityIndicatorArrow; },
    set gravityIndicatorArrow(gravityIndicatorArrow) {
        gravityIndicatorArrow = !!gravityIndicatorArrow;
        if (gravityIndicatorArrow !== this._gravityIndicatorArrow) {
            this._gravityIndicatorArrow = gravityIndicatorArrow;
            this.updatePanel(true);
        }
    },
    get gravityIndicatorWidth() { return this._gravityIndicatorWidth; },
    set gravityIndicatorWidth(gravityIndicatorWidth) {
        gravityIndicatorWidth = dbFinUtils.inRange(parseInt(gravityIndicatorWidth), 0, null, 0);
        if (gravityIndicatorWidth !== this._gravityIndicatorWidth) {
            this._gravityIndicatorWidth = gravityIndicatorWidth;
            this.updatePanel(true);
        }
    },
    get gravityIndicatorHeight() { return this._gravityIndicatorHeight; },
    set gravityIndicatorHeight(gravityIndicatorHeight) {
        gravityIndicatorHeight = dbFinUtils.inRange(parseInt(gravityIndicatorHeight), 0, null, 0);
        if (gravityIndicatorHeight !== this._gravityIndicatorHeight) {
            this._gravityIndicatorHeight = gravityIndicatorHeight;
            this.updatePanel(true);
        }
    },
    get labelText() { return this._labelText; },
    set labelText(labelText) {
        if ((labelText || labelText === '') && (labelText = '' + labelText) !== this._labelText) {
			this._labelText = labelText;
			this.updateLabel();
        }
    },
	get opacity() { return this.actor && this.actor.opacity || 0; },
	set opacity(opacity) {
        if (this._gravityIndicator) this._gravityIndicator.opacity = opacity;
        if (this.actor) this.actor.opacity = opacity;
    },
    get maxChildHeight() { return this._maxChildHeight || 0; },
    set maxChildHeight(maxChildHeight) {
        maxChildHeight = dbFinUtils.inRange(parseInt(maxChildHeight), 0, null, 0);
        if (maxChildHeight !== this._maxChildHeight) {
            this._maxChildHeight = maxChildHeight;
            this.updatePanel();
        }
    },
    get x() { return this.container && this.container.x; },
    set x(x) {
        if (this.container && this.container.x !== x) {
            this.container.x = x;
            this.updatePanel();
        }
    },
	get y() { return this.container && this.container.y; },
    set y(y) {
        if (this.container && this.container.y !== y) {
            this.container.y = y;
            this.updatePanel();
        }
    },

    animateToState: function(state, callback, scope, time, transition) {
        _D('>' + this.__name__ + '.animateToState()');
		if (time === undefined || time === null) time = this.animationTime;
		if (transition === undefined || transition === null) {
			transition = this.animationEffect;
		}
		dbFinAnimation.animateToState(this, state, callback, scope, time, transition);
        _D('<');
    }
});
Signals.addSignalMethods(dbFinYAWLPanel.prototype);
