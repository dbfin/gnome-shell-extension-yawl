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

const Convenience = Me.imports.convenience2;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinSlicerIcon = Me.imports.dbfinslicericon;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinWindowThumbnail = new Lang.Class({
	Name: 'dbFin.WindowThumbnail',

    _init: function(metaWindow, trackerWindow) {
        _D('>' + this.__name__ + '._init()');
        this._settings = Convenience.getSettings();
        this._signals = new dbFinSignals.dbFinSignals();
        this.metaWindow = metaWindow;
        this._trackerWindow = trackerWindow;
		this._clone = new Clutter.Clone({ reactive: true });
		[ this._cloneWidth, this._cloneHeight ] = [ 0, 0 ];
		this._updateClone();

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
        this._slicerIcon.setIcon(this._clone);

        dbFinUtils.settingsVariable(this, 'windows-width', 248, { min: 50, max: 500 }, this._updateThumbnailSize);
        dbFinUtils.settingsVariable(this, 'windows-fit-height', true, null, this._updateThumbnailSize);
        dbFinUtils.settingsVariable(this, 'windows-height', 160, { min: 40, max: 400 }, this._updateThumbnailSize);
        dbFinUtils.settingsVariable(this, 'windows-opacity', 84, { min: 50, max: 100 }, function () {
            if (this._slicerIcon) this._slicerIcon.setOpacity100(this._windowsOpacity);
        });
		dbFinUtils.settingsVariable(this, 'windows-distance', 11, { min: 0, max: 50 }, function () {
    		if (this._slicerIcon) this._slicerIcon.setPaddingH((this._windowsDistance + 1) >> 1);
        });
        dbFinUtils.settingsVariable(this, 'windows-animation-time', 490, { min: 0, max: 3000 }, function () {
    		if (this._slicerIcon) this._slicerIcon.animationTime = this._windowsAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'windows-animation-effect', 1, { min: 0 }, function () {
    		if (this._slicerIcon) this._slicerIcon.animationEffect = this._windowsAnimationEffect;
        });
        if (this._slicerIcon) {
            this._slicerIcon.hoverAnimation = true; // no settings option for this
        }
		dbFinUtils.settingsVariable(this, 'windows-hover-opacity', 100, { min: 50, max: 100 }, function () {
            if (this._slicerIcon) this._slicerIcon.setHoverOpacity100(this._windowsHoverOpacity);
        });
		dbFinUtils.settingsVariable(this, 'windows-hover-fit', true, null, function () {
            if (this._slicerIcon) this._slicerIcon.hoverFit = this._windowsHoverFit;
        });
		dbFinUtils.settingsVariable(this, 'windows-hover-animation-time', 77, { min: 0, max: 100 }, function () {
            if (this._slicerIcon) this._slicerIcon.hoverAnimationTime = this._windowsHoverAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'windows-hover-animation-effect', 0, { min: 0 }, function () {
            if (this._slicerIcon) this._slicerIcon.hoverAnimationEffect = this._windowsHoverAnimationEffect;
        });

		// this.actor related stuff
        this.actor = new St.Bin({ y_fill: true, x_fill: true, child: this._slicerIcon.actor });

        this.hidden = false;
        this.hiding = false;

        if (this.actor) {
            this.actor._delegate = this;
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
        }

        this.hide();
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
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
        this._settings = null;
        this.emit('destroy');
        _D('<');
	},

	show: function(time) {
        _D('>' + this.__name__ + '.show()');
		if (this.actor) {
			this.actor.show();
            this.actor.raise_top();
			this.actor.reactive = true;
		}
        if (!this.hidden && !this.hiding) {
            _D('<');
            return;
        }
		this.hidden = false;
        this.hiding = false;
		if (this._slicerIcon) {
            this._slicerIcon.animateToState({ opacity: 255, natural_width: this._slicerIcon.getNaturalWidth() },
                                            null, null, time);
        }
        _D('<');
	},

	hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (!this.hidden && this._slicerIcon) {
            this.hiding = true;
            this._slicerIcon.animateToState({ opacity: 0, natural_width: 0, min_width: 0 },
                                            function () {
                                                if (this.actor) {
                                                    this.actor.reactive = false;
                                                    this.actor.hide();
                                                }
                                                this.hidden = true;
                                                this.hiding = false;
                                            },
                                            this,
                                            time);
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
                if (this._windowsFitHeight) scale = Math.min(scale, this._windowsHeight / this._cloneHeight);
				else scale = Math.min(scale, this._windowsWidth / this._cloneWidth);
				this._clone.set_width(Math.round(this._cloneWidth * scale));
				this._clone.set_height(Math.round(this._cloneHeight * scale));
			} // let (scale)
		} // if (this._clone)
        _D('<');
    }
});
Signals.addSignalMethods(dbFinWindowThumbnail.prototype);
