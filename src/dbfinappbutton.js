/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinappbutton.js
 * Application button.
 *
 */

const Lang = imports.lang;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSlicerIcon = Me.imports.dbfinslicericon;
const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

// GNOMENEXT: ui/panel.js: class AppMenuButton, ui/panelMenu.js: classes ButtonBox, Button
const dbFinAppButton = new Lang.Class({
	Name: 'dbFin.AppButton',
    Extends: PanelMenu.Button,

    _init: function(metaApp, tracker) {
        _D('>dbFinAppButton._init()');
		this.parent(0.33, null, true);
        this._settings = Convenience.getSettings();
		this._signals = new dbFinUtils.Signals();
		this.app = metaApp;
		this._tracker = tracker;
		this.animationTime = 0; // for now

		// this.actor and this.container related stuff
		this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor.reactive = true;

		this._focused = false;
		this._updateFocused();
		if (this._tracker && this._tracker.getTracker) {
			this._signals.connectNoId({	emitter: this._tracker.getTracker(), signal: 'notify::focus-app',
										callback: this._updateFocused, scope: this });
		}

		this._minHPadding = 0;
		this._natHPadding = 0;
        this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                    callback: this._styleChanged, scope: this },
                                  /*after = */true);

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon(this);
		this.actor.add_actor(this._slicerIcon.actor);
        if (Main.panel) this._slicerIcon.actor.natural_height = Main.panel.actor.get_height();

		this._icons = new dbFinUtils.ArrayHash();
        this._iconSize = 48;
		this._iconFaded = false;

		this._updateIcon();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-size',
                                    callback: this._updateIcon, scope: this });
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-faded',
                                    callback: this._updateIcon, scope: this });

		this._iconsDistance = 40; // default
        this._updateIconsDistance();
        this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-distance',
                                    callback: this._updateIconsDistance, scope: this });

		this._clipTop = 0;
		this._clipBottom = 1;
		this._updateClips();
        this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-clip-top',
                                    callback: this._updateClips, scope: this });
        this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-clip-bottom',
                                    callback: this._updateClips, scope: this });

		this.hide(); // to set the width of this._slicerIcon to 0

        // this and this.app related stuff
		this.animationTime = 490; // default animation time
		this._updateAnimationTime(); // animation time from settings
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-animation-time',
                                    callback: this._updateAnimationTime, scope: this });

		if (this.app) {
			this._signals.connectNoId({	emitter: this.app, signal: 'notify::menu',
										callback: this._update, scope: this });
			this._signals.connectNoId({	emitter: this.app, signal: 'notify::action-group',
										callback: this._update, scope: this });
		}
		_D('<');
    },

	destroy: function() {
        _D('>dbFinAppButton.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
		if (this.actor) {
			this.actor.reactive = false;
		}
		if (this.container) {
			this.container.hide();
			if (this.container.get_parent) {
				let (box = this.container.get_parent()) {
					if (box && box.remove_actor) box.remove_actor(this.container);
				}
			}
		}
        if (this._slicerIcon) {
			if (this.actor) this.actor.remove_actor(this._slicerIcon.actor);
			this._slicerIcon.destroy();
			this._slicerIcon = null;
		}
		if (this._icons) {
			this._icons.forEach(Lang.bind(this, function(size, icon) { this._icons.set(size, null); icon.destroy(); }));
			this._icons.destroy();
			this._icons = null;
		}
		this._bindReactiveId = null;
		this.hidden = true;
		this._focused = false;
		this._tracker = null;
		this.app = null;
		this._settings = null;
		this.parent();
        _D('<');
	},

    show: function() {
        _D('>dbFinAppButton.show()');
		if (this.container) {
			this.container.show();
			this.container.reactive = true;
		}
		this.hidden = false;
		if (this._slicerIcon) this._slicerIcon.animateToState({ opacity: 255, natural_width: this._slicerIcon.getNaturalWidth() });
        _D('<');
    },

    hide: function() {
        _D('>dbFinAppButton.hide()');
		this.hidden = true;
		if (this.container) {
			this.container.reactive = false;
		}
		if (this._slicerIcon) this._slicerIcon.animateToState({ opacity: 0, natural_width: 0 }, function () { if (this.container) this.container.hide(); }, this);
        _D('<');
    },

	_updateFocused: function() {
        _D('>dbFinAppButton._updateFocused()');
        if (!this._tracker || !this._tracker.getTracker) {
            _D(!this._tracker ? 'this._tracker === null' : 'this._tracker.getTracker === null');
            _D('<');
            return;
        }
		let (focused = (this.app == this._tracker.getTracker().focus_app)) {
			if (this._focused !== focused) {
		        this._focused = focused;
                if (this._focused) this.actor.add_style_pseudo_class('active');
                else this.actor.remove_style_pseudo_class('active');
			}
		} // let (focused)
        _D('<');
	},

    _updateIconsDistance: function() {
        _D('>dbFinAppButton._updateIconsDistance()');
        this._iconsDistance = dbFinUtils.settingsParseInt(this._settings, 'icons-distance', 0, 100, this._iconsDistance);
		if (this._slicerIcon) this._slicerIcon.setPaddingH((this._iconsDistance + 1) >> 1);
        _D('<');
    },

	_updateClips: function() {
        _D('>dbFinAppButton._updateClips()');
		this._clipTop = dbFinUtils.settingsParseInt(this._settings, 'icons-clip-top', 0, 11, this._clipTop);
		this._clipBottom = dbFinUtils.settingsParseInt(this._settings, 'icons-clip-bottom', 0, 11, this._clipBottom);
		if (this._slicerIcon) {
            this._slicerIcon.setClipTop(this._clipTop);
            this._slicerIcon.setClipBottom(this._clipBottom);
        }
        _D('<');
	},

	_updateAnimationTime: function() {
        _D('>dbFinAppButton._updateAnimationTime()');
        this.animationTime = dbFinUtils.settingsParseInt(this._settings, 'icons-animation-time', 0, 3000, this.animationTime);
		if (this._slicerIcon) this._slicerIcon.animationTime = this.animationTime;
        _D('<');
	},

	_updateIcon: function() {
        _D('>dbFinAppButton._updateIcon()');
		if (!this.app || !this._slicerIcon) {
			_D(!this.app ? 'this.app === null' : 'this._slicerIcon === null');
			_D('<');
			return;
		}
		let (icon = this._slicerIcon._icon, iconnew = this._slicerIcon._icon,
		     size = this._iconSize, sizenew = this._iconSize,
		     faded = this._iconFaded, fadednew = this._iconFaded) {
			if (this._settings) {
				sizenew = dbFinUtils.settingsParseInt(this._settings, 'icons-size', 16, 128, size);
                sizenew = Math.floor((sizenew + 4) / 8) * 8; // sizes are 16, 24, ..., 128
				fadednew = this._settings.get_boolean('icons-faded');
			}
			if (sizenew != size || fadednew != faded || !icon) {
				iconnew = this._icons.get(fadednew ? -sizenew : sizenew);
				if (iconnew === undefined || !iconnew) {
					if (fadednew) iconnew = this.app.get_faded_icon(sizenew); // returns NULL sometimes
					if (!fadednew || !iconnew) iconnew = this.app.create_icon_texture(sizenew);
					if (iconnew) this._icons.set(fadednew ? -sizenew : sizenew, iconnew);
				}
				if (iconnew && iconnew != icon) {
					this._iconSize = sizenew;
					this._iconFaded = fadednew;
					this._slicerIcon.setIcon(iconnew);
				}
			} // if (sizenew != size || fadednew != faded || !icon)
		} // let (icon, iconnew, size, sizenew, faded, fadednew)
        _D('<');
	},

	_update: function() {
        _D('>dbFinAppButton._update()');
//		if (this._slicerIcon) this._slicerIcon.actor.queue_relayout();
        _D('<');
	},

	_styleChanged: function() {
        _D('>dbFinAppButton._styleChanged()');
		this._minHPadding = 0;
		this._natHPadding = 0;
        _D('<');
	}
});
