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
 * dbfinpopupmenu.js
 * PopupMenu related stuff.
 *
 */

const Lang = imports.lang;

const Gtk = imports.gi.Gtk;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPopupMenuScrollableSection = new Lang.Class({
    Name: 'dbFin.PopupMenuScrollableSection',
    Extends: PopupMenu.PopupMenuSection,

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this.parent();
		this.actor = new St.ScrollView({ style_class: 'popup-menu-section-scroll' });
		if (this.actor) {
            this._scroll = true;
            this.actor.hscrollbar_policy = Gtk.PolicyType.NEVER;
            this.actor.vscrollbar_policy = Gtk.PolicyType.AUTOMATIC;
            this.actor.overlay_scrollbars = true;
			if (this.box) this.actor.add_actor(this.box);
			this.actor._delegate = this;
			this.actor.clip_to_allocation = true;
		}
		else {
            this._scroll = false;
			this.actor = this.box;
		}
        if (this.box) this.box._delegate = this;
        _D('<');
    },

    destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this.actor && this._scroll) {
            if (this.box) this.actor.remove_actor(this.box);
            let (parent = this.actor.get_parent()) {
                if (parent) {
                    parent.remove_actor(this.actor);
                    if (this.box) parent.add_actor(this.box);
                }
            }
			this.actor.destroy();
			this.actor = this.box;
		}
        this.parent();
        _D('<');
    }
});
