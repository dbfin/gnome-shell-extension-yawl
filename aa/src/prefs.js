/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL GNOME Shell Extensions
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * YAWL, a group of GNOME Shell extensions, is provided as
 * free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License (GPL)
 * as published by the Free Software Foundation, version 3
 * of the License, or any later version.
 *
 * YAWL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY: without even implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the License (in file
 * GNUGPLv3) along with the program. A copy of the License
 * is also available at <http://www.gnu.org/licenses/>.
 *
 * prefs.js
 * Extension preferences interface and stuff.
 *
 */

const Lang = imports.lang;

const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinUtilsPrefs = Me.imports.dbfinutilsprefs;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

function init() {
    Convenience.initTranslations();
}

function buildPrefsWidget() {
    _D('@'); // supress all debugging
    let (builder = new dbFinUtilsPrefs.dbFinSettingsWidgetBuilder(),
         widgets = null) {

        builder.addNotebook();

        builder.addActions();
            widgets = builder.addCheckBox(_("Advanced settings") + ' <span color="red">*</span>', 'advanced');
            if (widgets && widgets.length) {
                widgets[0].set_line_wrap(false);
            }

        builder.addPageWelcome('aa', 'Alternative Activities');

        builder.addPage(_("Fine-tuning") + ' <span color="red">*</span>', null, '@advanced');
            builder.addLabel(_("Scroll timeout: the time after one scroll event during which other scroll events are rejected."));
            builder.shift();
                builder.addScale(_("Mouse scroll timeout"), 'mouse-scroll-timeout', 25, 1000, 25);
            builder.unshift();

        builder.addPageREI('aa');

 		_D('<');
       return builder.getWidget();
    } // let (builder, widgets)
}
