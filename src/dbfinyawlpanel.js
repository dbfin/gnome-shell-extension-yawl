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

    _init: function() {
        _D('>dbFinYAWLPanel._init()');
        this._tracker = new dbFinTracker.dbFinTracker(Lang.bind(this, this._refresh));
        _D('<');
    },

	destroy: function() {
        _D('>dbFinYAWLPanel.destroy()');
        if (this._tracker) {
            this._tracker.destroy();
            this._tracker = null;
        }
        _D('<');
	},

    _refresh: function(appsIn, appsOut, windowsIn, windowsOut) {
        _D('>dbFinYAWLPanel._refresh()');
		log('');
		log('State:      ' + this._tracker.state);
		log('State info: ' + this._tracker.stateInfo);
		log('');
        log('Apps: -' + appsOut.length + ' +' + appsIn.length + ' =' + this._tracker.apps.length
                + ' Windows: -' + windowsOut.length + ' +' + windowsIn.length + ' =' + this._tracker.windows.length);
		log('');
        this._tracker.apps.forEach(Lang.bind(this, function(metaApp, appProperties) {
            log(metaApp.get_name() + ':');
            appProperties.trackerApp.windows.forEach(Lang.bind(this, function(metaWindow) {
                log('\t' + metaWindow.get_title());
            }));
        }));
        _D('<');
    }
});
