/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * extension.js
 * Main extension file.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinDebugView = Me.imports.dbfindebugview;
const dbFinYAWL = Me.imports.dbfinyawl;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

var dbfinyawl = null;

function init() {
    _D('>Initializing YAWL extension...');
    Convenience.initTranslations();
    _D('<YAWL extension initialized.');
}

function enable() {
	if (!global._yawlDebugView) {
		global._yawlDebugView = new dbFinDebugView.dbFinDebugView();
	}
    _D('>Enabling YAWL extension...');
    dbfinyawl = new dbFinYAWL.dbFinYAWL();
    _D('<YAWL extension enabled.\n>YAWL is up and running...');
}

function disable() {
	if (global._yawlDebugView) {
		global._yawlDebugView.destroy();
		global._yawlDebugView = null;
	}
    _D('<\n>Disabling YAWL extension...');
    if (dbfinyawl) {
        dbfinyawl.destroy();
        dbfinyawl = null;
    }
    _D('<YAWL extension disabled.');
}
