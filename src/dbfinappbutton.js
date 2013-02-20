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
		this._signals = new dbFinUtils.Signals();
		this.app = metaApp;
		this._tracker = tracker;
		this._focused = this.isFocused();

		this._iconBox = new Shell.Slicer();
		this._iconBoxClip = 0;
		this._signals.connectNoId({	emitter: this._iconBox, signal: 'style-changed',
									callback: this._iconBoxStyleChanged, scope: this });
		this._signals.connectNoId({	emitter: this._iconBox, signal: 'notify::allocation',
									callback: this._iconBoxAllocation, scope: this });
        this.actor.add_actor(this._iconBox);
		this._updateIcon();

		this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor.reactive = true;

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
			let (box =  this.container.get_parent()) {
				if (box) box.remove_actor(this.container);
			}
		}
		if (this._iconBox) {
			this._iconBox = null;
		}
		if (this.actor) {
			this.actor.hide();
			this.actor.reactive = false;
			this.actor.destroy_all_children();
		}
		this.hidden = true;
		this._bindReactiveId = null;
		this._focused = false;
		this._tracker = null;
		this.app = null;
		this.parent();
        _D('<');
	},

    show: function() {
        _D('>dbFinAppButton.show()');
        if (!this.hidden) {
            _D('<');
            return;
        }
		Tweener.removeTweens(this.container);
        this.container.show();
        this.container.reactive = true;
        this.hidden = false;
		Tweener.addTween(this.container, {	opacity: 255, time: .777, transition: 'easeOutQuad' });
        _D('<');
    },

    hide: function() {
        _D('>dbFinAppButton.hide()');
        if (this.hidden) {
            _D('<');
            return;
        }
        this.hidden = true;
		Tweener.removeTweens(this.container);
        this.container.reactive = false;
		Tweener.addTween(this.container, {	opacity: 0, time: .777, transition: 'easeOutQuad',
										    onComplete: function() { this.container.hide(); }, onCompleteScope: this });
        _D('<');
    },

	_iconBoxStyleChanged: function() {
        _D('>dbFinAppButton._iconBoxStyleChanged()');
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
				this._update();
			}
		} // let (focused)
        _D('<');
	},

	isFocused: function() {
        _D('>dbFinAppButton._notifyFocusApp()');
        _D('<');
		return this._tracker && (this.app == this._tracker.getTracker().focus_app);
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
		this._iconBox.set_child(this.app.create_icon_texture(32));
        _D('<');
	}
});
