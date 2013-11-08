/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Config = imports.misc.config;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

/**
 * initTranslations:
 *
 * Initialize Gettext to load translations.
 * The domain is taken from metadata['gettext-domain']
 *
 */
function initTranslations() {
    let domain = Me.metadata['gettext-domain'];
    let localePath = Me.dir.get_child('locale').get_path();
    let localePath2 = Me.dir.get_parent().get_parent().get_parent().get_child('locale').get_path();
    if (GLib.file_test(localePath, GLib.FileTest.EXISTS))
        Gettext.bindtextdomain(domain, localePath);
    else if (GLib.file_test(localePath2, GLib.FileTest.EXISTS))
        Gettext.bindtextdomain(domain, localePath2);
    else
        Gettext.bindtextdomain(domain, Config.LOCALEDIR);
}

/**
 * getSettings:
 *
 * Builds and return a GSettings schema for metadata['settings-schema'].
 */
function getSettings() {
    let gschemaName = Me.metadata['settings-schema'];
    let gschemaPath = Me.dir.get_child('schemas').get_path();
    let gschemaPath2 = Me.dir.get_parent().get_parent().get_parent().get_child('glib-2.0').get_child('schemas').get_path();
    let gschemaSource;
    if (GLib.file_test(gschemaPath + '/' + gschemaName + '.gschema.xml', GLib.FileTest.EXISTS)) {
		if (GLib.file_test(gschemaPath + '/gschemas.compiled', GLib.FileTest.EXISTS))
	        gschemaSource = Gio.SettingsSchemaSource.new_from_directory(
	                gschemaPath, Gio.SettingsSchemaSource.get_default(), false);
		else
			throw new Error('GSettings schema ' + gschemaName + ' for extension ' + Me.metadata['uuid'] + ' found in '
			        + gschemaPath + ' but gschemas.compiled is missing. Please check your installation.');
	}
    else if (GLib.file_test(gschemaPath2 + '/' + gschemaName + '.gschema.xml', GLib.FileTest.EXISTS)) {
		if (GLib.file_test(gschemaPath2 + '/gschemas.compiled', GLib.FileTest.EXISTS))
	        gschemaSource = Gio.SettingsSchemaSource.new_from_directory(
	                gschemaPath2, Gio.SettingsSchemaSource.get_default(), false);
		else
			throw new Error('GSettings schema ' + gschemaName + ' for extension ' + Me.metadata['uuid'] + ' found in '
			        + gschemaPath2 + ' but gschemas.compiled is missing. Please check your installation.');
	}
    else {
        gschemaSource = Gio.SettingsSchemaSource.get_default();
	}
    let gschemaObject = gschemaSource.lookup(gschemaName, true);
    if (!gschemaObject)
        throw new Error('GSettings schema ' + gschemaName + ' could not be found for extension '
                + Me.metadata['uuid'] + '. Please check your installation.');
    return new Gio.Settings({ settings_schema: gschemaObject });
}
