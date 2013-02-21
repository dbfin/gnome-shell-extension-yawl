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

const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

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
    let widget = new Gtk.Notebook();
    widget._settings = Convenience.getSettings();
	widget._settingsbinds = [];

	// Panel
	let (pagePanel = new Gtk.Grid({ margin: 7, row_spacing: 7, column_spacing: 3, column_homogeneous: true }),
	     pagePanelLabel = new Gtk.Label({ label: _("Panel") })) {

		// YAWL-panel position
		let (panelYAWLPositionLabel = new Gtk.Label({ label: _("YAWL-panel position"), halign: Gtk.Align.START, hexpand: true }),
             panelYAWLPositionScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             panelYAWLPositionScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 10, 40, 1, { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryScale()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('yawl-panel-position', panelYAWLPositionScaleEntry, panelYAWLPositionScale);
            pagePanel.attach(panelYAWLPositionLabel, 0, 0, 5, 1);
            pagePanel.attach(panelYAWLPositionScaleEntry, 5, 0, 1, 1);
            pagePanel.attach(panelYAWLPositionScale, 6, 0, 2, 1);
        } // let (panelYAWLPositionLabel, panelYAWLPositionScaleEntry, panelYAWLPositionScale, settingsbind)

		// Move central panel
		let (panelCenterLabel = new Gtk.Label({ label: _("Move central panel"), halign: Gtk.Align.START, hexpand: true }),
             panelCenterSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            panelCenterSwitch.set_active(widget._settings.get_boolean('move-center'));
			widget._settings.bind('move-center', panelCenterSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelCenterLabel, 0, 1, 7, 1);
            pagePanel.attach(panelCenterSwitch, 7, 1, 1, 1);
        } // let (panelCenterLabel, panelCenterSwitch)

		// Hide Activities button
		let (panelHideActivitiesLabel = new Gtk.Label({ label: _("Hide Activities button"), halign: Gtk.Align.START, hexpand: true }),
             panelHideActivitiesSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            panelHideActivitiesSwitch.set_active(widget._settings.get_boolean('hide-activities'));
			widget._settings.bind('hide-activities', panelHideActivitiesSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelHideActivitiesLabel, 0, 2, 7, 1);
            pagePanel.attach(panelHideActivitiesSwitch, 7, 2, 1, 1);
        } // let (panelHideActivitiesLabel, panelHideActivitiesSwitch)

		// Preserve Hot Corner
		let (panelPreserveHotCornerLabel = new Gtk.Label({ label: _("Preserve Hot Corner"), halign: Gtk.Align.START, hexpand: true }),
             panelPreserveHotCornerSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            panelPreserveHotCornerSwitch.set_active(widget._settings.get_boolean('preserve-hot-corner'));
			widget._settings.bind('preserve-hot-corner', panelPreserveHotCornerSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('hide-activities', panelPreserveHotCornerLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('hide-activities', panelPreserveHotCornerSwitch, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelPreserveHotCornerLabel, 1, 3, 6, 1);
            pagePanel.attach(panelPreserveHotCornerSwitch, 7, 3, 1, 1);
        } // let (panelPreserveHotCornerLabel, panelPreserveHotCornerSwitch)

		// Separator
		let (panelSeparator = new Gtk.Separator({ hexpand: true })) {
            pagePanel.attach(panelSeparator, 0, 4, 8, 1);
        } // let (panelSeparator)

		// Custom panel color and opacity
		let (panelBackgroundLabel = new Gtk.Label({ label: _("Custom panel background"), halign: Gtk.Align.START, hexpand: true }),
             panelBackgroundSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            panelBackgroundSwitch.set_active(widget._settings.get_boolean('panel-background'));
			widget._settings.bind('panel-background', panelBackgroundSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelBackgroundLabel, 0, 5, 7, 1);
            pagePanel.attach(panelBackgroundSwitch, 7, 5, 1, 1);
        } // let (panelBackgroundLabel, panelBackgroundSwitch)

		// Panel Color
		let (panelColorLabel = new Gtk.Label({ label: _("Panel color"), halign: Gtk.Align.START, hexpand: true }),
             panelColorButtonEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 11 }),
             panelColorButton = new Gtk.ColorButton({ halign: Gtk.Align.END, use_alpha: false, title: "Choose Panel Color" }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryColorButton()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('panel-color', panelColorButtonEntry, panelColorButton);
			widget._settings.bind('panel-background', panelColorLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('panel-background', panelColorButtonEntry, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('panel-background', panelColorButton, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelColorLabel, 1, 6, 4, 1);
            pagePanel.attach(panelColorButtonEntry, 5, 6, 2, 1);
            pagePanel.attach(panelColorButton, 7, 6, 1, 1);
        } // let (panelColorLabel, panelColorButtonEntry, panelColorButton, settingsbind)

		// Panel Opacity
		let (panelOpacityLabel = new Gtk.Label({ label: _("Panel opacity"), halign: Gtk.Align.START, hexpand: true }),
             panelOpacityScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             panelOpacityScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1, { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryScale()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('panel-opacity', panelOpacityScaleEntry, panelOpacityScale);
			widget._settings.bind('panel-background', panelOpacityLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('panel-background', panelOpacityScaleEntry, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
			widget._settings.bind('panel-background', panelOpacityScale, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelOpacityLabel, 1, 7, 4, 1);
            pagePanel.attach(panelOpacityScaleEntry, 5, 7, 1, 1);
            pagePanel.attach(panelOpacityScale, 6, 7, 2, 1);
        } // let (panelOpacityLabel, panelOpacityScaleEntry, panelOpacityScale, settingsbind)

		widget.append_page(/* child = */pagePanel, /* tab_label = */pagePanelLabel);
	} // let (pagePanel, pagePanelLabel)

	// Icons
	let (pageIcons = new Gtk.Grid({ margin: 7, row_spacing: 7, column_spacing: 3, column_homogeneous: true }),
	     pageIconsLabel = new Gtk.Label({ label: _("Icons") })) {

		// Icons Size
		let (iconsSizeLabel = new Gtk.Label({ label: _("Icon size"), halign: Gtk.Align.START, hexpand: true }),
             iconsSizeScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             iconsSizeScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 16, 96, 8, { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryScale()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('icons-size', iconsSizeScaleEntry, iconsSizeScale);
            pageIcons.attach(iconsSizeLabel, 0, 0, 5, 1);
            pageIcons.attach(iconsSizeScaleEntry, 5, 0, 1, 1);
            pageIcons.attach(iconsSizeScale, 6, 0, 2, 1);
        } // let (iconsSizeLabel, iconsSizeScaleEntry, iconsSizeScale, settingsbind)

		// Icons Distance
		let (iconsDistanceLabel = new Gtk.Label({ label: _("Distance between icons"), halign: Gtk.Align.START, hexpand: true }),
             iconsDistanceScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             iconsDistanceScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 21, 1, { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryScale()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('icons-distance', iconsDistanceScaleEntry, iconsDistanceScale);
            pageIcons.attach(iconsDistanceLabel, 0, 1, 5, 1);
            pageIcons.attach(iconsDistanceScaleEntry, 5, 1, 1, 1);
            pageIcons.attach(iconsDistanceScale, 6, 1, 2, 1);
        } // let (iconsDistanceLabel, iconsDistanceScaleEntry, iconsDistanceScale, settingsbind)

		// Separator
		let (iconsSeparator = new Gtk.Separator({ hexpand: true })) {
            pageIcons.attach(iconsSeparator, 0, 2, 8, 1);
        } // let (iconsSeparator)

		// Icons Faded
		let (iconsFadedLabel = new Gtk.Label({ label: _("Faded icons"), halign: Gtk.Align.START, hexpand: true }),
             iconsFadedSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            iconsFadedSwitch.set_active(widget._settings.get_boolean('icons-faded'));
			widget._settings.bind('icons-faded', iconsFadedSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            pageIcons.attach(iconsFadedLabel, 0, 3, 7, 1);
            pageIcons.attach(iconsFadedSwitch, 7, 3, 1, 1);
        } // let (iconsFadedLabel, iconsFadedSwitch)

		// Separator
		let (iconsSeparator = new Gtk.Separator({ hexpand: true })) {
            pageIcons.attach(iconsSeparator, 0, 4, 8, 1);
        } // let (iconsSeparator)

		// Icons Animation Time
		let (iconsAnimationTimeLabel = new Gtk.Label({ label: _("Animation Time in ms (0: no animation)"), halign: Gtk.Align.START, hexpand: true }),
             iconsAnimationTimeScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             iconsAnimationTimeScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 999, 9, { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinUtilsPrefs.dbFinSettingsBindEntryScale()) {
			widget._settingsbinds.push(settingsbind);
			settingsbind.bind('icons-animation-time', iconsAnimationTimeScaleEntry, iconsAnimationTimeScale);
            pageIcons.attach(iconsAnimationTimeLabel, 0, 5, 5, 1);
            pageIcons.attach(iconsAnimationTimeScaleEntry, 5, 5, 1, 1);
            pageIcons.attach(iconsAnimationTimeScale, 6, 5, 2, 1);
        } // let (iconsAnimationTimeLabel, iconsAnimationTimeScaleEntry, iconsAnimationTimeScale, settingsbind)

		// Separator
		let (iconsSeparator = new Gtk.Separator({ hexpand: true })) {
            pageIcons.attach(iconsSeparator, 0, 6, 8, 1);
        } // let (iconsSeparator)

		widget.append_page(/* child = */pageIcons, /* tab_label = */pageIconsLabel);
	} // let (pageIcons, pageIconsLabel)

    widget.show_all();
    return widget;
}
