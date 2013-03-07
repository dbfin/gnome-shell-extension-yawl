/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinconsts.js
 * Constants shared between different modules.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const arrayAppClickFunctions = [
    [   _("No action"),	                            	'',                             ''                              ],
    [   _("Show next : all non-minimized windows"), 	'nextWindowNonMinimized',       'showAllWindowsNonMinimized'    ],
    [   _("Show next : all windows"),	            	'nextWindow',                   'showAllWindows'                ],
    [   _("Show non-minimized : all windows"),      	'showAllWindowsNonMinimized',   'showAllWindows'                ],
    [   _("Rotate windows forward : backward"),     	'rotateWindowsForward',         'rotateWindowsBackward'         ],
    [   _("Rotate windows backward : forward"),     	'rotateWindowsBackward',        'rotateWindowsForward'          ],
    [   _("Minimize top : all windows"),	        	'minimizeTopWindow',            'minimizeAllWindows'            ],
    [   _("(Un)Maximize top : all windows"),        	'maximizeTopWindow',            'maximizeAllWindows'            ],
    [   _("Open new window : none"),	            	'openNewWindowThisWorkspace',   ''                              ],
    [   _("Open new window (new workspace) : none"),	'openNewWindowNewWorkspace',    ''                              ],
    [   _("Open menu : none"),                       	'openMenu',                     ''                              ]
];

const arrayAppMenuItems = [
    [   _("New window"),            					'openNewWindowThisWorkspace'	],
    [   '',                         					null							],
    [   _("Quit"),                  					'quitApplication'				]
];
