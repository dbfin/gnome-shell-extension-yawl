/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinyawlpanel.js
 * YAWL Panel.
 *
 */

const Lang = imports.lang;

const St = imports.gi.St;

const Main = imports.ui.main;
const Overview = imports.ui.overview;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWLPanel = new Lang.Class({
	Name: 'dbFin.YAWLPanel',

    // GNOMENEXT: ui/panel.js: class Panel
    _init: function(parent, name, boxname, hidden/* = false*/, autohideinoverview/* = false*/) { // e.g. Main.panel, 'panelYAWL', '_yawlBox'
        _D('>' + this.__name__ + '._init()');
        this._parent = parent || null;
        this._name = name || '';
        this._boxName = boxname || '';
        hidden = hidden || false;
		autohideinoverview = autohideinoverview || false;
		this._signals = new dbFinSignals.dbFinSignals();

		this.actor = this._name	? new St.BoxLayout({ name: this._name, vertical: false, reactive: true, track_hover: true })
								: new St.BoxLayout({ vertical: false, reactive: true, track_hover: true });

		this.hidden = false;
		if (hidden || (autohideinoverview && Main.overview && Main.overview.visible)) this.hide();

        if (this._parent) {
            if (this._boxName) this._parent[this._boxName] = this.actor;
            if (this._parent.add_actor) {
                this._parent.add_actor(this.actor);
            }
            else if (this._parent.actor && this._parent.actor.add_actor) {
                this._parent.actor.add_actor(this.actor);
            }
        }

		if (autohideinoverview) {
			this._signals.connectNoId({	emitter: Main.overview, signal: 'showing',
										callback: this.hide, scope: this });
			this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
										callback: this.show, scope: this });
		}
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
		if (this.actor) {
            if (this._parent) {
                if (this._boxName && this._parent[this._boxName] == this.actor) this._parent[this._boxName] = null;
                if (this._parent.remove_actor) {
                    this._parent.remove_actor(this.actor);
                }
                else if (this._parent.actor && this._parent.actor.remove_actor) {
                    this._parent.actor.remove_actor(this.actor);
                }
            }
            // just in case parent was not set up initially or was changed
            let (parent = this.actor.get_parent && this.actor.get_parent()) {
                if (parent && parent.remove_actor) {
                    parent.remove_actor(this.actor);
                }
            }
			this.actor.destroy();
			this.actor = null;
		}
        this.hidden = true;
        this._parent = null;
        _D('<');
	},

    show: function() {
        _D('>' + this.__name__ + '.show()');
        if (!this.hidden || Main.screenShield.locked) {
            _D('<');
            return;
        }
        if (this.actor) {
            this.actor.show();
            this.actor.reactive = true;
        }
        this.hidden = false;
		this.animateToState({ opacity: 255 });
        _D('<');
    },

    hide: function() {
        _D('>' + this.__name__ + '.hide()');
        if (this.hidden) {
            _D('<');
            return;
        }
        this.hidden = true;
        if (this.actor) {
            this.actor.reactive = false;
        }
		this.animateToState({ opacity: 0 }, function() { this.actor.hide(); }, this);
        _D('<');
    },

    animateToState: function(state, callback, scope, time, transition) {
        _D('>' + this.__name__ + '.hide()');
		if (time === undefined || time === null) time = Overview.ANIMATION_TIME * 3000;
		if (transition === undefined || transition === null) {
			transition = 'easeOutQuad'/* this.animationEffect*/;
		}
		dbFinAnimation.animateToState(this.actor, state, callback, scope, time, transition);
        _D('<');
    }
});
