/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinwindowthumbnail.js
 * Window thumbnail.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSlicerIcon = Me.imports.dbfinslicericon;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinWindowThumbnail = new Lang.Class({
	Name: 'dbFin.WindowThumbnail',

    _init: function(metaWindow, trackerWindow) {
        _D('>' + this.__name__ + '._init()');
        this.metaWindow = metaWindow;
        this._trackerWindow = trackerWindow;
		this._clone = new Clutter.Clone({ reactive: true });
		[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
		this._updateClone();

        this.hidden = false;
        this.hiding = false;
        this._minimized = false;

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
        this._slicerIcon.setIcon(this._clone);

        this._updatedWindowsThumbnailsWidth =
		        this._updatedWindowsThumbnailsFitHeight =
		        this._updatedWindowsThumbnailsHeight = this._updateThumbnailSize;
        this._updatedWindowsThumbnailsOpacity = function () { if (!this.minimized && this._slicerIcon) this._slicerIcon.setOpacity100(global.yawl._windowsThumbnailsOpacity); };
        this._updatedWindowsThumbnailsMinimizedOpacity = function () { if (this.minimized && this._slicerIcon) this._slicerIcon.setOpacity100(global.yawl._windowsThumbnailsMinimizedOpacity); };
		this._updatedWindowsThumbnailsDistance = function () { if (this._slicerIcon) this._slicerIcon.setPaddingH((global.yawl._windowsThumbnailsDistance + 1) >> 1); };
		this._updatedWindowsThumbnailsPaddingTop = function () { if (this._slicerIcon) this._slicerIcon.setPaddingTop(global.yawl._windowsThumbnailsPaddingTop); };
        this._updatedWindowsAnimationTime = function () { if (this._slicerIcon) this._slicerIcon.animationTime = global.yawl._windowsAnimationTime; };
		this._updatedWindowsAnimationEffect = function () { if (this._slicerIcon) this._slicerIcon.animationEffect = global.yawl._windowsAnimationEffect; };
        if (this._slicerIcon) { this._slicerIcon.hoverAnimation = true; } // no settings option for this
		this._updatedWindowsHoverOpacity = function () { if (this._slicerIcon) this._slicerIcon.setHoverOpacity100(global.yawl._windowsHoverOpacity); };
		this._updatedWindowsHoverFit = function () { if (this._slicerIcon) this._slicerIcon.hoverFit = global.yawl._windowsHoverFit; };
		this._updatedWindowsHoverAnimationTime = function () { if (this._slicerIcon) this._slicerIcon.hoverAnimationTime = global.yawl._windowsHoverAnimationTime; };
		this._updatedWindowsHoverAnimationEffect = function () { if (this._slicerIcon) this._slicerIcon.hoverAnimationEffect = global.yawl._windowsHoverAnimationEffect; };

		// this.actor related stuff
        this.actor = new St.Bin({ y_fill: true, x_fill: true, track_hover: true,
                                  child: this._slicerIcon ? this._slicerIcon.actor : null });

        if (this.actor) {
            this.actor._delegate = this;
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
        }

        this._clicked = null;
		this._updatedMouseClickRelease =
                this._updatedMouseLongClick = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
			this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*doubleClicks = */false,
							/*scroll = */false, /*sendSingleClicksImmediately = */true,
                            /*clickOnRelease = */global.yawl._mouseClickRelease, /*longClick = */global.yawl._mouseLongClick);
		};

        global.yawl.watch(this);

        this.hide();
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this.actor) {
            this.actor.hide();
			this.actor.reactive = false;
            this.actor._delegate = null;
            if (this.actor.get_parent()) {
				let (box = this.actor.get_parent()) {
					if (box && box.remove_actor) box.remove_actor(this.actor);
				}
            }
		}
        if (this._slicerIcon) {
			if (this.actor) this.actor.remove_actor(this._slicerIcon.actor);
            this._slicerIcon.setIcon(null);
			this._slicerIcon.destroy();
			this._slicerIcon = null;
		}
		if (this.actor) {
			this.actor.destroy();
			this.actor = null;
		}
        if (this._clone) {
            this._clone.destroy();
            this._clone = null;
			[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
        }
		this._bindReactiveId = null;
		this.hidden = true;
        this._trackerWindow = null;
        this.metaWindow = null;
        this.emit('destroy');
        _D('<');
	},

	show: function(time) {
        _D('>' + this.__name__ + '.show()');
		if (this.actor) {
			this.actor.show();
			this.actor.reactive = true;
		}
        if (!this.hidden && !this.hiding) {
            _D('<');
            return;
        }
		this.hidden = false;
        this.hiding = false;
		if (this._slicerIcon) this._slicerIcon.show(time);
        _D('<');
	},

	hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (!this.hidden && !this.hiding && this._slicerIcon) {
            this.hiding = true;
            this._slicerIcon.hide(time, function () {
                                            if (this.actor) {
                                                this.actor.reactive = false;
                                                this.actor.hide();
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
			if (this._slicerIcon) this._slicerIcon.restoreNaturalSize();
		}
        _D('<');
	},

    _updateClone: function() {
        _D('>' + this.__name__ + '._updateClone()');
		if (this._clone) {
            let (compositor =   this.metaWindow && this.metaWindow.get_compositor_private
                                && this.metaWindow.get_compositor_private()) {
                let (texture = compositor && compositor.get_texture && compositor.get_texture()) {
                    if (texture && texture.get_size) {
						this._clone.set_source(null);
						this._clone.set_source(texture);
						[ this._cloneWidth, this._cloneHeight ] = texture.get_size();
                        this._update();
                    } // if (texture && texture.get_size)
                } // let (texture)
            } // let (compositor)
		} // if (this._clone)
        _D('<');
    },

    _updateThumbnailSize: function() {
        _D('>' + this.__name__ + '._updateThumbnailSize()');
		if (this._clone && this._cloneWidth && this._cloneHeight) {
			let (scale = 1.0) {
                if (global.yawl._windowsThumbnailsFitHeight) scale = Math.min(scale, global.yawl._windowsThumbnailsHeight / this._cloneHeight);
				else scale = Math.min(scale, global.yawl._windowsThumbnailsWidth / this._cloneWidth);
				this._clone.set_width(Math.round(this._cloneWidth * scale));
				this._clone.set_height(Math.round(this._cloneHeight * scale));
                this._update();
			} // let (scale)
		} // if (this._clone)
        _D('<');
    },

	_buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!this._trackerWindow) {
            _D('this._trackerWindow === null');
            _D('<');
            return;
        }
        if (!name || !state.clicks || state.clicks < 1) {
            _D('<');
            return;
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
            if (this._slicerIcon) {
                if (minimized) this._slicerIcon.setOpacity100(global.yawl._windowsThumbnailsMinimizedOpacity);
                else this._slicerIcon.setOpacity100(global.yawl._windowsThumbnailsOpacity);
            }
        }
    }
});
Signals.addSignalMethods(dbFinWindowThumbnail.prototype);
