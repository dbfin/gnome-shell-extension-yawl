/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * prefs.js
 * Extension preferences interface and stuff.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinUtilsPrefs = Me.imports.dbfinutilsprefs;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init() {
    Convenience.initTranslations();
}

function buildPrefsWidget() {
    let (builder = new dbFinUtilsPrefs.dbFinSettingsWidgetBuilder()) {

        builder.addPage(_("Panel"));
        builder.addScale(_("YAWL-panel position"), 'yawl-panel-position', 10, 40, 1);
        builder.addCheckBox(_("Move central panel"), 'move-center');
        builder.addCheckBox(_("Hide Activities button"), 'hide-activities');
        builder.addCheckBox(_("Preserve Hot Corner"), 'preserve-hot-corner', 'hide-activities');
		builder.addSeparator();
        builder.addCheckBox(_("Custom panel background"), 'panel-background');
        builder.addColorButton(_("Panel color"), 'panel-color', _("Choose Panel Color"), 'panel-background');
        builder.addScale(_("Panel opacity"), 'panel-opacity', 0, 100, 1, 'panel-background');

        builder.addPage(_("Icons"));
        builder.addScale(_("Icon size"), 'icons-size', 16, 96, 8);
        builder.addCheckBox(_("Faded icons"), 'icons-faded');
		builder.addSeparator();
        builder.addScale(_("Distance between icons (% of icon size)"), 'icons-distance', 0, 100, 1);
        builder.addScale(_("Clip icons: top (px)"), 'icons-clip-top', 0, 7, 1);
        builder.addScale(_("Clip icons: bottom (px)"), 'icons-clip-bottom', 0, 7, 1);
		builder.addSeparator();
        builder.addScale(_("Animation Time in ms (0: no animation)"), 'icons-animation-time', 0, 999, 9);

        builder.widget.show_all();
        return builder.widget;
    } // let (builder)
}
