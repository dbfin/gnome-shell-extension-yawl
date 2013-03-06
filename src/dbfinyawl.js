/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinyawl.js
 * Main class implementing the window list.
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinMoveCenter = Me.imports.dbfinmovecenter;
const dbFinPanelEnhancements = Me.imports.dbfinpanelenhancements;
const dbFinYAWLPanel = Me.imports.dbfinyawlpanel;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinYAWL = new Lang.Class({
    Name: 'dbFin.YAWL',

    _init: function() {
        _D('>dbFinYAWL._init()');
		this._movecenter = new dbFinMoveCenter.dbFinMoveCenter();
        this._panelenhancements = new dbFinPanelEnhancements.dbFinPanelEnhancements();
        this._yawlpanel = new dbFinYAWLPanel.dbFinYAWLPanel();
        _D('<');
    },

    destroy: function() {
        _D('>dbFinYAWL.destroy()');
        if (this._yawlpanel) {
            this._yawlpanel.destroy();
            this._yawlpanel = null;
        }
        if (this._panelenhancements) {
            this._panelenhancements.destroy();
            this._panelenhancements = null;
        }
		if (this._movecenter) {
			this._movecenter.destroy();
			this._movecenter = null;
		}
        _D('<');
    }
});
