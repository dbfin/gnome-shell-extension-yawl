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

const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinDebug = Me.imports.dbfindebug;
const _D = dbFinDebug._D;

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
		this._focused = this.isFocused();

		this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor.reactive = true;

		this._minHPadding = 0;
		this._natHPadding = 0;
		this._styleChanged();
		this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
									callback: this._styleChanged, scope: this },
		                          	/*after = */true);

		this._iconBox = new Shell.Slicer();
		this._icons = new dbFinUtils.ArrayHash();
		this._icon = null;
        this._iconSize = Panel.PANEL_ICON_SIZE; // default size (if no settings)
		this._iconFaded = false;

		this._animationTime = 0; // no animation to hide
		this.hide();
		this._updateIcon();
		this.hide(); // to set the width of this._iconBox back to 0
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-size',
                                    callback: this._updateIcon, scope: this });
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-faded',
                                    callback: this._updateIcon, scope: this });

		this._iconBoxClip = 0;
		this._iconBoxStyleChanged();
		this._signals.connectNoId({	emitter: this._iconBox, signal: 'style-changed',
									callback: this._iconBoxStyleChanged, scope: this },
                                    /*after = */true);
		this._signals.connectNoId({	emitter: this._iconBox, signal: 'notify::allocation',
									callback: this._iconBoxAllocation, scope: this });

		this.actor.add_actor(this._iconBox);

		this._signals.connectNoId({ emitter: this.actor, signal: 'get-preferred-width',
									callback: this._iconBoxPreferredWidth, scope: this });

		this._animationTime = 490; // default animation time
		this._updateAnimationTime(); // animation time from settings
		this.show(); // appear properly animated
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::icons-animation-time',
                                    callback: this._updateAnimationTime, scope: this });

		if (this._tracker) {
			this._signals.connectNoId({	emitter: this._tracker.getTracker(), signal: 'notify::focus-app',
										callback: this._notifyFocusApp, scope: this });
		}

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
		if (this.container) {
			if (this.container.get_parent) {
				let (box = this.container.get_parent()) {
					if (box && box.remove_actor) box.remove_actor(this.container);
				}
			}
			this.container.hide();
		}
		if (this._iconBox) {
			this._iconBox.set_child(null);
			this._iconBox = null;
		}
		this._icon = null;
		if (this._icons) {
			this._icons.forEach(Lang.bind(this, function(size, icon) { this._icons.set(size, null); icon.destroy(); }));
			this._icons.destroy();
			this._icons = null;
		}
		if (this.actor) {
			this.actor.hide();
			this.actor.reactive = false;
			this.actor.destroy_all_children();
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
		this._iconAnimateToState(255);
        _D('<');
    },

    hide: function() {
        _D('>dbFinAppButton.hide()');
		this._iconAnimateToState(0, 0);
        _D('<');
    },

	_styleChanged: function(actor) {
        _D('@dbFinAppButton._styleChanged()'); // This is called whenever the style of the button changes, debug will cause lots of records
		this._minHPadding = 0;
		this._natHPadding = 0;
		_D('<');
	},

	_iconBoxStyleChanged: function() {
        _D('@dbFinAppButton._iconBoxStyleChanged()'); // This is called whenever the style of this._iconBox changes, debug will cause lots of records
		let (themesource = (Main.panel.statusArea['appMenu'] ? Main.panel.statusArea['appMenu']._iconBox : this._iconBox)) {
			if (themesource) {
				let (node = themesource.get_theme_node()) {
					this._iconBoxClip = node.get_length('app-icon-bottom-clip') || 0;
					this._iconBoxAllocation();
				}
			}
		}
        _D('<');
	},

	_iconBoxAllocation: function() {
        _D('>dbFinAppButton._iconBoxAllocation()');
        if (!this._iconBox) {
            _D('this._iconBox === null');
            _D('<');
            return;
        }
        let (allocation = this._iconBox.allocation) {
			if (this._iconBoxClip > 0) {
				this._iconBox.set_clip(0, 0, allocation.x2 - allocation.x1,
				                       allocation.y2 - allocation.y1 - this._iconBoxClip);
			}
			else {
				this._iconBox.remove_clip();
			}
		} // let (allocation)
        _D('<');
	},

	_notifyFocusApp: function() {
        _D('>dbFinAppButton._notifyFocusApp()');
        if (!this._tracker) {
            _D('this._tracker === null');
            _D('<');
            return;
        }
		let (focused = this.isFocused()) {
			if (this._focused !== focused) {
		        this._focused = focused;
                if (this._focused) this.actor.add_style_pseudo_class('active');
                else this.actor.remove_style_pseudo_class('active');
			}
		} // let (focused)
        _D('<');
	},

	isFocused: function() {
        _D('>dbFinAppButton._notifyFocusApp()');
        _D('<');
		if (this._tracker)
			return this.app == this._tracker.getTracker().focus_app;
		else
			return false;
	},

	_iconAnimateToState: function(opacity, width) {
        _D('>dbFinAppButton._iconAnimateToState()');
		if (opacity === undefined || opacity === null) {
			opacity = this._iconBox ? this._iconBox.opacity : 255;
		}
		if (width === undefined || width === null) {
			width = this._iconSize;
		}
		Tweener.removeTweens(this._iconBox);
		let (visible = !!(opacity && width)) {
			if (visible) {
				if (this.container) {
					this.container.show();
			        this.container.reactive = true;
				}
		        this.hidden = false;
				if (this._animationTime) {
					Tweener.addTween(this._iconBox, {	opacity: opacity, width: width,
														time: this._animationTime / 1000., transition: 'easeOutQuad',
														onComplete: function() { }, onCompleteScope: this });
				}
				else {
					this._iconBox.opacity = opacity;
					this._iconBox.width = width;
				}
			} // if (visible)
			else {
		        this.hidden = true;
				if (this.container) {
			        this.container.reactive = false;
				}
				if (this._animationTime) {
					Tweener.addTween(this._iconBox, {	opacity: opacity, width: width || 1,
														time: this._animationTime / 1000., transition: 'easeOutQuad',
														onComplete: function() { if (this.container) this.container.hide(); }, onCompleteScope: this });
				}
				else {
					this._iconBox.opacity = opacity;
					this._iconBox.width = width || 1;
					if (this.container) this.container.hide();
				}
			} // if (visible) else
		} // let (visible)
        _D('<');
	},

	_update: function() {
        _D('>dbFinAppButton._update()');
        _D('<');
	},

	_updateIcon: function() {
        _D('>dbFinAppButton._updateIcon()');
		if (!this.app || !this._iconBox) {
			_D(!this.app ? 'this.app === null' : 'this._iconBox === null');
			_D('<');
			return;
		}
		let (icon = this._icon, iconnew = this._icon,
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
					this._icon = iconnew;
					this._iconSize = sizenew;
					this._iconFaded = fadednew;
					this._iconBox.set_child(this._icon);
					this._iconAnimateToState();
				}
			} // if (sizenew != size || fadednew != faded || !icon)
		} // let (icon, iconnew, size, sizenew, faded, fadednew)
        _D('<');
	},

	_updateAnimationTime: function() {
        _D('>dbFinAppButton._updateAnimationTime()');
        this._animationTime = dbFinUtils.settingsParseInt(this._settings, 'icons-animation-time', 0, 3000, this._animationTime);
        _D('<');
	},

    _iconBoxPreferredWidth: function(actor, forHeight, alloc) {
        _D('>dbFinAppButton._iconBoxPreferredWidth()');
		let (wn = this._iconBox ? this._iconBox.get_preferred_width(forHeight)[1] : this._iconSize || 24) {
			[ alloc.min_size, alloc.natural_size ] = [ 1, wn ];
		}
        _D('<');
    }
});
