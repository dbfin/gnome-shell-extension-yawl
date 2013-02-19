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
		this._box = new St.BoxLayout({ name: 'panelYAWL', vertical: false, track_hover: true });
        Main.panel._yawlBox = this._box;
        Main.panel.actor.add_actor(Main.panel._yawlBox);
        this._tracker = new dbFinTracker.dbFinTracker(Lang.bind(this, this._refresh));
        _D('<');
    },

	destroy: function() {
        _D('>dbFinYAWLPanel.destroy()');
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
        _D('<');
	},

    _refresh: function(appsIn, appsOut, windowsIn, windowsOut) {
        _D('>dbFinYAWLPanel._refresh()');
        if (!this._tracker) {
            _D('this._tracker === null');
            _D('<');
            return;
        }
        if (!Main.panel._yawlBox) {
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
        } // if (!Main.panel._yawlBox)
        if (appsIn && appsIn.forEach) {
            appsIn.forEach(Lang.bind(this, function(metaApp) {
                let (trackerApp = this._tracker.getTrackerApp(metaApp)) {
                    if (trackerApp) Main.panel._yawlBox.add_actor(trackerApp.appButton.container);
                }
            }));
        }
        _D('<');
    }
});
