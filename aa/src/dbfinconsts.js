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
 * dbfinconsts.js
 * Constants shared between different modules.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const arrayShellVersion = imports.misc.config.PACKAGE_VERSION.split('.').map(function (v) { return parseInt(v); });

const arrayContributors = [
    [   'Svitozar Cherepii',                _("Ukrainian translation") + ', ' + _("quality testing")    ],
    [   'Jonatan Zeidler',                  _("German translation")                                     ]
];

const arrayStyleBackgrounds = [
    [   _("Default"),                       ''                              ],
    [   _("Frame"),                         'frame'                         ],
    [   _("Transparent"),                   'transparent'                   ],
    [   _("Custom css file"),               'custom'                        ]
];

const arrayExtensionSortMethods = [
    [   _("No sort"),                       ''                              ],
    [   _("Sort by frequency of access"),   '_sortExtensionsByFrequency'    ],
    [   _("Sort by name"),                  '_sortExtensionsByName'         ]
];
const EXTENSIONSORTMETHODS_FREQUENCY = 1;

const Settings = [
	[ 'first-time', true, { }, null ],

    [ 'extension-frequencies', '[]', { }, 'extensions' ],
    [ 'extension-favorites', '[]', { }, 'extensions' ],

    [ 'style-force-default', true, { }, 'style' ],
    [ 'style-background', 1, { min: 0, max: arrayStyleBackgrounds.length - 1 }, 'style' ],
    [ 'style-custom-css', '~/.local/share/gnome-shell/extensions/aa@dbfin.com/stylesheet_custom.css', { }, 'style' ],

    [ 'submenu-extension-manager', true, { }, 'extensions' ],
    [ 'extension-manager-sort', 2, { min: 0, max: arrayExtensionSortMethods.length - 1 }, 'extensions' ],
    [ 'extension-manager-show-favorites', false, { }, 'extensions' ],

    [ 'submenu-additional', true, { }, 'additional' ],

    [ 'mouse-scroll-timeout', 125, { min: 25, max: 1000 }, 'mouse' ]
];
