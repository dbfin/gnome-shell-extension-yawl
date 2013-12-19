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
 * dbfinwindowthumbnail.js
 * Window thumbnail.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinSlicerActor = Me.imports.dbfinsliceractor;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinWindowThumbnail = new Lang.Class({
	Name: 'dbFin.WindowThumbnail',

    _init: function(metaWindow, trackerWindow) {
        _D('>' + this.__name__ + '._init()');
		this._signals = new dbFinSignals.dbFinSignals();
        this.metaWindow = metaWindow;
        this._trackerWindow = trackerWindow;
		this._clone = new Clutter.Clone({ reactive: true });
		this._compositor = null;
		this._texture = null;
		[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
		this._scale = 0.0;
		this._updateClone();

        this.hidden = false;
        this.hiding = false;
        this._minimized = false;

		this.container = new St.Bin({ style_class: 'yawl-thumbnail', reactive: true, track_hover: true, y_align: St.Align.START });
		if (this.container) {
            this._signals.connectNoId({	emitter: this.container, signal: 'enter-event',
                                        callback: this._hoverEnter, scope: this });
            this._signals.connectNoId({	emitter: this.container, signal: 'leave-event',
                                        callback: this._hoverLeave, scope: this });
		}

		this.actor = new Shell.GenericContainer({ reactive: true });
		if (this.actor) {
			if (this.container) this.container.set_child(this.actor);
			this._signals.connectNoId({	emitter: this.actor, signal: 'get-preferred-width',
										callback: this._getPreferredWidth, scope: this });
			this._signals.connectNoId({	emitter: this.actor, signal: 'get-preferred-height',
										callback: this._getPreferredHeight, scope: this });
			this._signals.connectNoId({	emitter: this.actor, signal: 'allocate',
										callback: this._allocate, scope: this });
		}

		this._slicerBin = new St.Bin();
		if (this._slicerBin) {
			this._slicerBin.set_child(this._clone);
		}

		this._slicerActor = new dbFinSlicerActor.dbFinSlicerActor(this._slicerBin, { y_align: St.Align.START });
        if (this._slicerActor) {
			if (this._slicerActor.container && this.actor) this.actor.add_child(this._slicerActor.container);
		}

		this._toolbarButtonHovered = null;

		this.toolbar = new St.BoxLayout({ style_class: 'yawl-thumbnail-toolbar', vertical: false, x_align: Clutter.ActorAlign.END });
		if (this.toolbar) {
			if (this.actor) this.actor.add_child(this.toolbar);
            this._signals.connectNoId({	emitter: this.toolbar, signal: 'enter-event',
                                        callback: this._hoverEnter, scope: this });
            this._signals.connectNoId({	emitter: this.toolbar, signal: 'leave-event',
                                        callback: this._hoverLeave, scope: this });
			dbFinConsts.arrayThumbnailButtons.forEach(Lang.bind(this, function (p) {
				let (icon = new St.Icon({ icon_name: p[0] + '-symbolic', style_class: 'button-' + p[0], reactive: true, track_hover: true })) {
					icon._do = p[1];
					this.toolbar.add_child(icon);
					this._signals.connectNoId({	emitter: icon, signal: 'enter-event',
												callback: function (actor) { this._toolbarButtonHovered = actor; this._hoverEnter(actor); }, scope: this });
					this._signals.connectNoId({	emitter: icon, signal: 'leave-event',
												callback: function (actor) { this._toolbarButtonHovered = null; this._hoverLeave(actor); }, scope: this });
				}
			}));
		}

        this._updatedWindowsThumbnailsWidth =
		        this._updatedWindowsThumbnailsFitHeight =
		        this._updatedWindowsThumbnailsHeight = this._updateThumbnailSize;
        this._updatedWindowsThumbnailsOpacity = function () { if (!this.minimized && this._slicerActor) this._slicerActor.setOpacity100(global.yawl._windowsThumbnailsOpacity); };
        this._updatedWindowsThumbnailsMinimizedOpacity = function () { if (this.minimized && this._slicerActor) this._slicerActor.setOpacity100(global.yawl._windowsThumbnailsMinimizedOpacity); };
		this._updatedWindowsThumbnailsDistance = function () { if (this._slicerActor) this._slicerActor.setPaddingH((global.yawl._windowsThumbnailsDistance + 1) >> 1); };
		this._updatedWindowsThumbnailsPaddingTop = function () { if (this._slicerActor) this._slicerActor.setPaddingTop(global.yawl._windowsThumbnailsPaddingTop); };
        this._updatedWindowsAnimationTime = function () { if (this._slicerActor) this._slicerActor.animationTime = global.yawl._windowsAnimationTime; };
		this._updatedWindowsAnimationEffect = function () { if (this._slicerActor) this._slicerActor.animationEffect = global.yawl._windowsAnimationEffect; };
        if (this._slicerActor) { this._slicerActor.hoverAnimation = true; } // no settings option for this
		this._updatedWindowsHoverOpacity = function () { if (this._slicerActor) this._slicerActor.setHoverOpacity100(global.yawl._windowsHoverOpacity); };
		this._updatedWindowsHoverFit = function () { if (this._slicerActor) this._slicerActor.hoverFit = global.yawl._windowsHoverFit; };
		this._updatedWindowsHoverAnimationTime = function () { if (this._slicerActor) this._slicerActor.hoverAnimationTime = global.yawl._windowsHoverAnimationTime; };
		this._updatedWindowsHoverAnimationEffect = function () { if (this._slicerActor) this._slicerActor.hoverAnimationEffect = global.yawl._windowsHoverAnimationEffect; };

        this._clicked = null;
        this._updatedMouseDragAndDrop =
		this._updatedMouseClickRelease =
                this._updatedMouseLongClick =
                this._updatedMouseScrollTimeout = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
			this._clicked = new dbFinClicked.dbFinClicked(this.container, this._buttonClicked, this, /*clicks = */true, /*doubleClicks = */false,
							/*scroll = */true,
                            /*dragAndDrop = */false,
                            /*clickOnRelease = */global.yawl._mouseClickRelease || global.yawl._mouseDragAndDrop,
                            /*longClick = */global.yawl._mouseLongClick,
                            /*clicksTimeThreshold = */null/*global.yawl._mouseClicksTimeThreshold*/,
                            /*scrollTimeout = */global.yawl._mouseScrollTimeout);
		};

        global.yawl.watch(this);

        this.hide(0);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
		if (this._clicked) {
			this._clicked.destroy();
			this._clicked = null;
		}
		if (this.container) {
			this.container.reactive = false;
            this.container.hide();
		}
		if (this._slicerBin) {
            this._slicerBin.set_child(null);
/* destroyed by this._slicerActor
			this._slicerBin.destroy();
			this._slicerBin = null;
*/
		}
        if (this._slicerActor) {
			this._slicerActor.destroy();
			this._slicerActor = null;
		}
		if (this.toolbar) {
			this.toolbar.destroy();
			this.toolbar = null;
		}
        if (this.actor) {
            this.actor.destroy();
            this.actor = null;
        }
		if (this.container) {
			this.container.destroy();
			this.container = null;
		}
        if (this._clone) {
            this._clone.destroy();
            this._clone = null;
        }
		this.hidden = true;
		this._scale = 0.0;
		this._toolbarButtonHovered = null;
		this._compositor = null;
		this._texture = null;
		[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
        this._trackerWindow = null;
        this.metaWindow = null;
        this.emit('destroy');
        _D('<');
	},

	_getPreferredWidth: function(actor, forHeight, alloc) {
		_D('@' + this.__name__ + '._getPreferredWidth()');
		[ alloc.min_size, alloc.natural_size ] = this._slicerActor && this._slicerActor.container
                                                        && this._slicerActor.container.get_stage()
                                                        ? this._slicerActor.container.get_preferred_width(forHeight)
                                                        : [ 0, 0 ];
		_D('<');
	},

	_getPreferredHeight: function(actor, forWidth, alloc) {
		_D('@' + this.__name__ + '._getPreferredHeight()');
		[ alloc.min_size, alloc.natural_size ] = this._slicerActor && this._slicerActor.container
                                                        && this._slicerActor.container.get_stage()
														? this._slicerActor.container.get_preferred_height(forWidth)
														: [ 0, 0 ];
		_D('<');
	},

	_allocate: function(actor, box, flags) {
		_D('@' + this.__name__ + '._allocate()');
		if (!this._slicerActor || !this._slicerActor.container || !this.container || !this.container.get_stage()) {
			_D('<');
			return;
		}
        let (	w = box.x2 - box.x1,
                h = box.y2 - box.y1,
                x = box.x1,
                y = box.y1,
                [ wm, wn ] = this._slicerActor.container.get_preferred_width(-1),
                [ hm, hn ] = this._slicerActor.container.get_preferred_height(-1),
                boxChild = new Clutter.ActorBox()) {
			let (x2 = Math.min(box.x2, x + wn),
				 y2 = Math.min(box.y2, y + hn)) {
				dbFinUtils.setBox(boxChild, x, y, x2, y2);
				this._slicerActor.container.allocate(boxChild, flags);
				if (this.toolbar) {
					let ([ thm, thn ] = this.toolbar.get_preferred_height(-1) || [ 0, 0 ]) {
						dbFinUtils.setBox(boxChild, x, y, x2, Math.min(box.y2, y + thn));
						this.toolbar.allocate(boxChild, flags);
					} // let ([ thm, thn ])
				} //  if (this.toolbar && this.toolbar.get_stage())
			} // let (x2, y2)
        } // let (w, h, x, y, [ wm, wn ], [ hm, hn ], boxChild)
		_D('<');
	},

    _hoverEnter: function(actor) {
        _D('>' + this.__name__ + '._hoverEnter()');
        if (this._slicerActor) this._slicerActor.hoverEnter(actor);
        _D('<');
    },

    _hoverLeave: function(actor) {
        _D('>' + this.__name__ + '._hoverLeave()');
        if (this._slicerActor) this._slicerActor.hoverLeave(actor);
        _D('<');
    },

	show: function(time) {
        _D('>' + this.__name__ + '.show()');
		if (this.container) {
			this.container.show();
			this.container.reactive = true;
		}
		this.hidden = false;
        this.hiding = false;
		if (this._slicerActor) this._slicerActor.show(time, function () {
                                                               if (this.toolbar) this.toolbar.show();
                                                           }, this);
        _D('<');
	},

	hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (this._slicerActor) {
            this.hiding = true;
            if (this.toolbar) this.toolbar.hide();
            this._slicerActor.hide(time, function () {
                                            if (this.container) {
                                                this.container.reactive = false;
                                                this.container.hide();
                                            }
                                            this.hidden = true;
                                            this.hiding = false;
                                        }, this);
        }
        _D('<');
	},

	_update: function() {
        _D('>' + this.__name__ + '._update()');
		if (!this.hidden && !this.hiding) {
			if (this._slicerActor) this._slicerActor.restoreNaturalSize();
		}
        _D('<');
	},

    _updateClone: function(metaWindow/* = this.metaWindow*/) {
        _D('>' + this.__name__ + '._updateClone()');
		if (this._clone) {
			if (this._signals) {
                this._signals.disconnectId('window-destroy');
			    this._signals.disconnectId('window-resize');
            }
            if (metaWindow === undefined) metaWindow = this.metaWindow;
			this._clone.set_source(null);
			[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
			this._compositor =	metaWindow
								&& metaWindow.get_compositor_private
                                && metaWindow.get_compositor_private()
                                || null;
			if (this._compositor) {
				if (this._signals) {
					this._signals.connectId('window-destroy', {	emitter: this._compositor, signal: 'destroy',
																callback: function () {
                                                                    this._updateClone(null);
                                                                }, scope: this });
					this._signals.connectId('window-resize', {	emitter: this._compositor, signal: 'size-changed',
																callback: this._updateCloneTexture, scope: this });
				}
			} // if (this._compositor)
			this._updateCloneTexture();
		} // if (this._clone)
        _D('<');
    },

	_updateCloneTexture: function() {
		_D('>' + this.__name__ + '._updateCloneTexture()');
		this._texture = this._compositor && this._compositor.get_texture && this._compositor.get_texture() || null;
		this._clone.set_source(this._texture);
		[ this._cloneWidth, this._cloneHeight ] = this._texture && this._texture.get_size ? this._texture.get_size() : [ 0, 0 ];
		this._updateThumbnailSize();
		_D('<');
	},

    _updateThumbnailSize: function() {
        _D('>' + this.__name__ + '._updateThumbnailSize()');
		if (this._cloneWidth && this._cloneHeight) {
			this._scale = Math.min(1.0, global.yawl._windowsThumbnailsHeight / this._cloneHeight);
			if (!global.yawl._windowsThumbnailsFitHeight) {
				this._scale = Math.min(this._scale, global.yawl._windowsThumbnailsWidth / this._cloneWidth);
			}
		} // if (this._cloneWidth && this._cloneHeight)
		else {
			this._scale = 0.0;
		}
		this._updateThumbnailScale();
        _D('<');
    },

    _updateThumbnailScale: function() {
        _D('>' + this.__name__ + '._updateThumbnailScale()');
		if (this._clone && this._scale) {
			this._clone.set_width(Math.round(this._cloneWidth * this._scale));
			this._clone.set_height(Math.round(this._cloneHeight * this._scale));
			this._update();
		} // if (this._clone && this._scale)
        _D('<');
    },

	_buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!this._trackerWindow) {
            _D('this._trackerWindow === null');
            _D('<');
            return;
        }
        if (!name || name == '' || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
		if (this._toolbarButtonHovered) {
			if (state.left && this._toolbarButtonHovered._do
					&& this._trackerWindow[this._toolbarButtonHovered._do]) {
				Lang.bind(this._trackerWindow, this._trackerWindow[this._toolbarButtonHovered._do])();
			}
            _D('<');
			return;
		}
		if (state.scroll) {
			if (state.up) name += 'Up';
			else name += 'Down';
		}
        let (functionIndex = global.yawl && global.yawl['_mouseWindow' + name]) {
            if (functionIndex) { // functionIndex === 0 is default corresponding to no action
                let (functionRow = dbFinConsts.arrayWindowClickFunctions[functionIndex]) {
					let (functionName = functionRow[1]) {
						if (functionName && this._trackerWindow[functionName]) {
							Lang.bind(this._trackerWindow, this._trackerWindow[functionName])();
						}
					} // let (functionName)
                } // let (functionRow)
            } // if (functionIndex)
        } // let (functionIndex)
        _D('<');
	},

    get minimized() { return this._minimized; },
    set minimized(minimized) {
        if (this._minimized != minimized) {
            this._minimized = minimized;
            if (this._slicerActor) {
                if (minimized) this._slicerActor.setOpacity100(global.yawl._windowsThumbnailsMinimizedOpacity);
                else this._slicerActor.setOpacity100(global.yawl._windowsThumbnailsOpacity);
            }
        }
    }
});
Signals.addSignalMethods(dbFinWindowThumbnail.prototype);
