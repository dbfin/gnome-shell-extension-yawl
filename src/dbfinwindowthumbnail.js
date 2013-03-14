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

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
		this._slicerIcon.natural_width = 150;
		this._slicerIcon.natural_height = 150;

        this._updateThumbnail();

		// this.actor related stuff
        this.actor = new St.Bin({ y_fill: true, x_fill: true, child: this._slicerIcon.actor });
		this.actor._delegate = this;

        this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor.reactive = true;

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
			this._slicerIcon.destroy();
			this._slicerIcon = null;
		}
		this._bindReactiveId = null;
		this.hidden = true;
        this._trackerWindow = null;
        this.metaWindow = null;
        this._settings = null;
        _D('<');
	},

	show: function() {
        _D('>' + this.__name__ + '.show()');
		if (this.actor) {
			this.actor.show();
			this.actor.reactive = true;
		}
		this.hidden = false;
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: this._iconsOpacity ? dbFinUtils.opacity100to255(this._iconsOpacity) : 255,
																natural_width: this._slicerIcon.getNaturalWidth() });
        _D('<');
	},

	hide: function() {
        _D('>' + this.__name__ + '.hide()');
		if (this.actor) {
			this.actor.reactive = false;
		}
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: 0,
																natural_width: 0 },
		                                                      	function () { if (this.actor) this.actor.hide(); this.hidden = true; },
		                                                      	this);
        _D('<');
	},

    _updateThumbnail: function() {
        _D('>' + this.__name__ + '._updateThumbnail()');
		let (icon = null) {
            let (compositor =   this.metaWindow && this.metaWindow.get_compositor_private
                                && this.metaWindow.get_compositor_private()) {
                let (texture = compositor && compositor.get_texture && compositor.get_texture()) {
                    if (texture && texture.get_size) {
                        let ([ w, h ] = texture.get_size(),
                             scale = 1.0) {
                            scale = Math.min(scale, 150 / w, 150 / h);
                            icon = new Clutter.Clone({  source: texture, reactive: true,
                                                        width: w * scale, height: h * scale });
                        } // let ([ w, h ], scale)
                    } // if (texture && texture.get_size)
                } // let (texture)
            } // let (compositor)
			if (icon && this._slicerIcon) {
				this._slicerIcon.setIcon(icon);
			}
		} // let (icon)
        _D('<');
    }
});
