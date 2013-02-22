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
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinTracker = Me.imports.dbfintracker;
const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWLPanel = new Lang.Class({
	Name: 'dbFin.YAWLPanel',

    // GNOMENEXT: ui/panel.js: class Panel
    _init: function() {
        _D('>dbFinYAWLPanel._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinUtils.Signals();
		this._box = new St.BoxLayout({ name: 'panelYAWL', vertical: false, track_hover: true });
        Main.panel._yawlBox = this._box;
        Main.panel.actor.add_actor(Main.panel._yawlBox);
        this._tracker = new dbFinTracker.dbFinTracker(Lang.bind(this, this._refresh));

		this.hidden = Main.overview.visible;
		if (this.hidden) this._box.hide();
		this._signals.connectNoId({	emitter: Main.overview, signal: 'showing',
									callback: this.hide, scope: this });
		this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
									callback: this.show, scope: this });
        _D('<');
    },

	destroy: function() {
        _D('>dbFinYAWLPanel.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this._tracker) {
            this._tracker.destroy();
            this._tracker = null;
        }
		if (this._box) {
            if (Main.panel._yawlBox == this._box) {
                Main.panel.actor.remove_actor(Main.panel._yawlBox);
                Main.panel._yawlBox = null;
            }
			this._box.destroy();
			this._box = null;
		}
        this._settings = null;
        _D('<');
	},

    show: function() {
        _D('>dbFinYAWLPanel.show()');
        if (!this.hidden || Main.screenShield.locked) {
            _D('<');
            return;
        }
		Tweener.removeTweens(this._box);
        this._box.show();
        this.hidden = false;
		Tweener.addTween(this._box, { opacity: 255, time: Overview.ANIMATION_TIME, transition: 'easeOutQuad' });
        _D('<');
    },

    hide: function() {
        _D('>dbFinYAWLPanel.hide()');
        if (this.hidden) {
            _D('<');
            return;
        }
        this.hidden = true;
		Tweener.removeTweens(this._box);
		Tweener.addTween(this._box, {	opacity: 0, time: Overview.ANIMATION_TIME, transition: 'easeOutQuad',
										onComplete: function() { this._box.hide(); }, onCompleteScope: this });
        _D('<');
    },

    _refresh: function(appsIn, appsOut, windowsIn, windowsOut) {
        _D('>dbFinYAWLPanel._refresh()');
        if (!this._tracker) {
            _D('this._tracker === null');
            _D('<');
            return;
        }
        if (!Main.panel._yawlBox || Main.panel._yawlBox != this._box) {
            log('');
            log('State:      ' + this._tracker.state);
            log('State info: ' + this._tracker.stateInfo);
            log('');
            log('Apps: -' + appsOut.length + ' +' + appsIn.length + ' =' + this._tracker.apps.length
                    + ' Windows: -' + windowsOut.length + ' +' + windowsIn.length + ' =' + this._tracker.windows.length);
            log('');
            this._tracker.apps.forEach(Lang.bind(this, function(metaApp, appProperties) {
                if (!appProperties) return;
                let (trackerApp = appProperties.trackerApp) {
					if (!trackerApp) return;
					log(trackerApp.appName + ':');
					trackerApp.windows.forEach(Lang.bind(this, function(metaWindow) {
						let (trackerWindow = this._tracker.getTrackerWindow(metaWindow)) {
							if (!trackerWindow) return;
							log('\t' + trackerWindow.windowTitle);
						} // let (trackerWindow)
					})); // trackerApp.windows.forEach
				} // let (trackerApp)
            })); // this._tracker.apps.forEach
            _D('<');
            return;
        } // if (!Main.panel._yawlBox || Main.panel._yawlBox != this._box)
        if (appsIn && appsIn.forEach) {
            appsIn.forEach(Lang.bind(this, function(metaApp) {
                let (trackerApp = this._tracker.getTrackerApp(metaApp)) {
                    if (trackerApp) {
                        this._box.add_actor(trackerApp.appButton.container);
                        trackerApp.appButton.show();
                    }
                }
            }));
        }
        _D('<');
    }
});
