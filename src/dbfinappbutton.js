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

const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
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

    _init: function(metaApp, tracker, trackerApp) {
        _D('>dbFinAppButton._init()');
		this.parent(0.33, null, true);
        this._settings = Convenience.getSettings();
		this._signals = new dbFinUtils.Signals();
		this.metaApp = metaApp;
		this._tracker = tracker;
        this._trackerApp = trackerApp;
		this.animationTime = 0; // for now

		// this.actor and this.container related stuff
		this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor._delegate = this;
        this.actor.reactive = true;

		this._minHPadding = 0;
		this._natHPadding = 0;
        this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                    callback: this._styleChanged, scope: this },
                                  /*after = */true);

		this._signals.connectNoId({	emitter: this.actor, signal: 'enter-event',
									callback: this._hoverEnter, scope: this });
		this._signals.connectNoId({	emitter: this.actor, signal: 'leave-event',
									callback: this._hoverLeave, scope: this });

        this._clicked = null;
        this._clickRelease = false;
        this._updateClickRelease();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::mouse-click-release',
                                    callback: this._updateClickRelease, scope: this });

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
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

		this._iconOpacity = 100;
		this._updateIconOpacity();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-opacity',
                                    callback: this._updateIconOpacity, scope: this });

		this._iconHoverAnimation = 100;
		this._updateIconHoverAnimation();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-hover-animation',
                                    callback: this._updateIconHoverAnimation, scope: this });

		this._iconHoverSize = 100;
		this._updateIconHoverSize();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-hover-size',
                                    callback: this._updateIconHoverSize, scope: this });

		this._iconHoverOpacity = 100;
		this._updateIconHoverOpacity();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-hover-opacity',
                                    callback: this._updateIconHoverOpacity, scope: this });

		this._iconHoverFit = false;
		this._updateIconHoverFit();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-hover-fit',
                                    callback: this._updateIconHoverFit, scope: this });

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

        // this and this.metaApp related stuff
		this.animationTime = 490; // default animation time
		this._updateAnimationTime(); // animation time from settings
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-animation-time',
                                    callback: this._updateAnimationTime, scope: this });

		if (this.metaApp) {
			this._signals.connectNoId({	emitter: this.metaApp, signal: 'notify::menu',
										callback: this._update, scope: this });
			this._signals.connectNoId({	emitter: this.metaApp, signal: 'notify::action-group',
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
        if (this._clicked) {
            this._clicked.destroy();
            this._clicked = null;
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
		this._trackerApp = null;
		this._tracker = null;
		this.metaApp = null;
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
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: this._iconOpacity ? dbFinUtils.opacity100to255(this._iconOpacity) : 255,
																natural_width: this._slicerIcon.getNaturalWidth() });
        _D('<');
    },

    hide: function() {
        _D('>dbFinAppButton.hide()');
		this.hidden = true;
		if (this.container) {
			this.container.reactive = false;
		}
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: 0,
																natural_width: 0 },
		                                                      	function () { if (this.container) this.container.hide(); },
		                                                      	this);
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

	_hoverEnter: function() {
        _D('>dbFinAppButton._hoverEnter()');
		if (this._iconHoverAnimation && this._slicerIcon) {
			let (state = {}) {
				if (this._iconHoverOpacity) state.opacity = dbFinUtils.opacity100to255(this._iconHoverOpacity);
				if (this._iconHoverSize) state.scale_x = state.scale_y = this._iconHoverSize / 100.;
				if (this._iconHoverFit && this._iconSize) state.min_width = this._iconSize;
				this._slicerIcon.animateToState(state, null, null, this.animationTime ? this.animationTime / 3 : 0);
			}
		}
        _D('<');
	},

	_hoverLeave: function() {
        _D('>dbFinAppButton._hoverLeave()');
		if (this._slicerIcon) {
			let (state = {}) {
				if (this._iconOpacity) state.opacity = dbFinUtils.opacity100to255(this._iconOpacity);
				state.scale_x = state.scale_y = 1.;
                state.min_width = 0;
				this._slicerIcon.animateToState(state, null, null, this.animationTime ? this.animationTime / 3 : 0);
			}
		}
        _D('<');
	},

    _updateClickRelease: function() {
        _D('>dbFinAppButton._updateClickRelease()');
        this._clickRelease = dbFinUtils.settingsGetBoolean(this._settings, 'mouse-click-release', this._clickRelease);
        if (this._clicked) {
            this._clicked.destroy();
            this._clicked = null;
        }
        this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*doubleClicks = */true,
                        /*scroll = */true, /*sendSingleClicksImmediately = */true, /*clickOnRelease = */this._clickRelease);
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
		if (!this.metaApp || !this._slicerIcon) {
			_D(!this.metaApp ? 'this.metaApp === null' : 'this._slicerIcon === null');
			_D('<');
			return;
		}
		let (icon = this._slicerIcon._icon, iconnew = this._slicerIcon._icon,
		     size = this._iconSize, sizenew = this._iconSize,
		     faded = this._iconFaded, fadednew = this._iconFaded) {
			if (this._settings) {
				sizenew = dbFinUtils.settingsParseInt(this._settings, 'icons-size', 16, 128, size);
                sizenew = Math.floor((sizenew + 4) / 8) * 8; // sizes are 16, 24, ..., 128
				fadednew = dbFinUtils.settingsGetBoolean(this._settings, 'icons-faded', faded);
			}
			if (sizenew != size || fadednew != faded || !icon) {
				iconnew = this._icons.get(fadednew ? -sizenew : sizenew);
				if (iconnew === undefined || !iconnew) {
					if (fadednew) iconnew = this.metaApp.get_faded_icon(sizenew); // returns NULL sometimes
					if (!fadednew || !iconnew) iconnew = this.metaApp.create_icon_texture(sizenew);
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

	_updateIconOpacity: function() {
        _D('>dbFinAppButton._updateIconOpacity()');
        this._iconOpacity = dbFinUtils.settingsParseInt(this._settings, 'icons-opacity', 50, 100, this._iconOpacity);
		if (this._slicerIcon) this._slicerIcon.animateToState({ opacity: dbFinUtils.opacity100to255(this._iconOpacity) });
        _D('<');
	},

	_updateIconHoverAnimation: function() {
        _D('>dbFinAppButton._updateIconHoverAnimation()');
        this._iconHoverAnimation = dbFinUtils.settingsGetBoolean(this._settings, 'icons-hover-animation', this._iconHoverAnimation);
        _D('<');
	},

	_updateIconHoverSize: function() {
        _D('>dbFinAppButton._updateIconHoverSize()');
        this._iconHoverSize = dbFinUtils.settingsParseInt(this._settings, 'icons-hover-size', 100, 200, this._iconHoverSize);
        _D('<');
	},

	_updateIconHoverOpacity: function() {
        _D('>dbFinAppButton._updateIconHoverOpacity()');
        this._iconHoverOpacity = dbFinUtils.settingsParseInt(this._settings, 'icons-hover-opacity', 50, 100, this._iconHoverOpacity);
        _D('<');
	},

	_updateIconHoverFit: function() {
        _D('>dbFinAppButton._updateIconHoverFit()');
        this._iconHoverFit = dbFinUtils.settingsGetBoolean(this._settings, 'icons-hover-fit', this._iconHoverFit);
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
	},

	_buttonClicked: function(state, key) {
        _D('>dbFinAppButton._buttonClicked()');
        if (!this._trackerApp) {
            _D('this._trackerApp === null');
            _D('<');
            return;
        }
        if (!key || key == '' || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (!state.scroll && state.clicks > 2) {
            state.clicks = 2;
        }
        let (functionIndex = dbFinUtils.settingsParseInt(   this._settings, 'mouse-app-' + key,
                                                            0, dbFinConsts.arrayAppClickFunctions.length - 1, 0)) {
            if (functionIndex) { // functionIndex === 0 is default corresponding to no action
                let (functionRow = dbFinConsts.arrayAppClickFunctions[functionIndex]) {
					if (state.scroll) state.clicks = state.up ? 1 : 2;
                    if (functionRow.length && functionRow.length > state.clicks) {
                        let (functionName = functionRow[state.clicks]) {
                            if (functionName != '' && this._trackerApp[functionName]) {
                                Lang.bind(this._trackerApp, this._trackerApp[functionName])();
                            }
                        } // let (functionName)
                    } // if (functionRow.length && functionRow.length > state.clicks)
                } // let (functionRow)
            } // if (functionIndex)
        } // let (functionIndex)
        _D('<');
	}
});
