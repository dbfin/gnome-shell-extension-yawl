/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
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

const arrayAnimationTransitions = [
    [   'Linear',										'linear'						],
    [	'Slow at the end',								'easeOutQuad'					],
    [	'Slow at the beginning',						'easeInQuad'					],
    [	'Slow on both sides',							'easeInOutQuad'					],
    [	'Slow in the middle',							'easeOutInQuad'					],
    [	'Slower at the end',							'easeOutCubic'   				],
    [	'Slower at the beginning',						'easeInCubic'   				],
    [	'Slower on both sides',							'easeInOutCubic'   				],
    [	'Slower in the middle',							'easeOutInCubic'   				],
    [	'Slowest at the end',							'easeOutQuart'   				],
    [	'Slowest at the beginning',						'easeInQuart'   				],
    [	'Slowest on both sides',						'easeInOutQuart'   				],
    [	'Slowest in the middle',						'easeOutInQuart'   				],
    [	'Bounce at the end',							'easeOutBounce'  				],
    [	'Bounce at the beginning',						'easeInBounce'  				],
    [	'Bounce on both sides',							'easeInOutBounce'  				],
    [	'Bounce in the middle',							'easeOutInBounce'  				],
    [	'Back\'n\'force in the middle',					'easeOutInBack'					],
    [	'Elastic in the middle',						'easeOutInElastic' 				]
];

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

const arrayWindowClickFunctions = [
    [   _("No action"),	                            	''                              ],
    [   _("Show and focus"),                           	'showWindow'                    ],
    [   _("Minimize"),	                            	'minimizeWindow'                ],
    [   _("Maximize"),	                            	'maximizeWindowToggle'          ]
];

const arrayAppMenuItems = [
    [   _("New window"),            					'openNewWindowThisWorkspace'	],
    [   '',                         					null							],
    [   _("Quit"),                  					'quitApplication'				]
];

const Settings = [
    [ 'yawl-panel-position', 21, { min: 0, max: 50 } ],
    [ 'yawl-panel-width', 100, { min: 1, max: 100 } ],
    [ 'move-center', true, { } ],
    [ 'hide-activities', true, { } ],
    [ 'preserve-hot-corner', true, { } ],
    [ 'hide-app-menu', false, { } ],
    [ 'panel-background', false, { } ],
    [ 'panel-top-color', '#000000', { } ],
    [ 'panel-top-opacity', 77, { min: 0, max: 100 } ],
    [ 'panel-color', '#000000', { } ],
    [ 'panel-opacity', 77, { min: 0, max: 100 } ],

    [ 'icons-size', 48, { min: 16, max: 128 } ],
    [ 'icons-faded', true, { } ],
    [ 'icons-opacity', 84, { min: 50, max: 100 } ],
    [ 'icons-clip-top', 3, { min: 0, max: 7 } ],
    [ 'icons-clip-bottom', 3, { min: 0, max: 7 } ],
    [ 'icons-align', 0, { min: 0, max: 100 } ],
    [ 'icons-distance', 21, { min: 0, max: 100 } ],

    [ 'icons-animation-time', 490, { min: 0, max: 1000 } ],
    [ 'icons-animation-effect', 1, { min: 0, max: arrayAnimationTransitions.length - 1 } ],
    [ 'icons-hover-animation', true, { } ],
    [ 'icons-hover-size', 100, { min: 100, max: 200 } ],
    [ 'icons-hover-opacity', 100, { min: 50, max: 100 } ],
    [ 'icons-hover-fit', false, { } ],
    [ 'icons-hover-animation-time', 33, { min: 0, max: 200 } ],
    [ 'icons-hover-animation-effect', 0, { min: 0, max: arrayAnimationTransitions.length - 1 } ],

    [ 'windows-indicator-arrow', false, { } ],
    [ 'windows-theming', true, { } ],
    [ 'windows-background-panel', true, { } ],
    [ 'windows-background-color', '#000000', { } ],
    [ 'windows-background-opacity', 70, { min: 0, max: 100 } ],
    [ 'windows-text-color', 'white', { } ],
    [ 'windows-text-size', 9, { min: 6, max: 36 } ],
    [ 'windows-padding', 7, { min: 0, max: 20 } ],
    [ 'windows-border-color', '#d3d7cf', { } ],
    [ 'windows-border-width', 2, { min: 0, max: 3 } ],
    [ 'windows-border-radius', 7, { min: 0, max: 10 } ],

    [ 'windows-thumbnails-width', 248, { min: 50, max: 500 } ],
    [ 'windows-thumbnails-fit-height', true, { } ],
    [ 'windows-thumbnails-height', 160, { min: 40, max: 400 } ],
    [ 'windows-thumbnails-height-visible', 160, { min: 40, max: 400 } ],
    [ 'windows-thumbnails-opacity', 84, { min: 50, max: 100 } ],
    [ 'windows-thumbnails-minimized-opacity', 40, { min: 10, max: 100 } ],
    [ 'windows-thumbnails-distance', 11, { min: 0, max: 50 } ],
    [ 'windows-thumbnails-padding-top', 7, { min: 0, max: 20 } ],

    [ 'windows-show-delay', 400, { min: 0, max: 1000 } ],
    [ 'windows-animation-time', 400, { min: 0, max: 1000 } ],
    [ 'windows-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 } ],
    [ 'windows-hover-opacity', 100, { min: 50, max: 100 } ],
    [ 'windows-hover-fit', true, { } ],
    [ 'windows-hover-animation-time', 77, { min: 0, max: 200 } ],
    [ 'windows-hover-animation-effect', 0, { min: 0, max: arrayAnimationTransitions.length - 1 } ],

    [ 'mouse-app-left', 1, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-ctrl', 8, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-shift', 6, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-ctrl-shift', 2, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-long-click', true, {} ],

    [ 'mouse-app-middle', 9, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-ctrl', 3, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-shift', 7, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-ctrl-shift', 0, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-scroll', 4, { min: 0, max: arrayAppClickFunctions.length - 1 } ],

    [ 'mouse-app-right', 10, { min: 0, max: arrayAppClickFunctions.length - 1 } ],

    [ 'mouse-window-left', 1, { min: 0, max: arrayWindowClickFunctions.length - 1 } ],
    [ 'mouse-window-left-shift', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 } ],
    [ 'mouse-window-middle', 3, { min: 0, max: arrayWindowClickFunctions.length - 1 } ],
    [ 'mouse-window-right', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 } ],

    [ 'mouse-click-release', false, { } ],
    [ 'mouse-clicks-time-single', 400, { min: 250, max: 750 } ],
    [ 'mouse-clicks-time-double', 250, { min: 100, max: 450 } ],
    [ 'mouse-clicks-time-threshold', 300, { min: 150, max: 550 } ],

    [ 'debug', false, { } ],
    [ 'debug-bottom', false, { } ],
    [ 'debug-width', 33, { min: 10, max: 70 } ],
    [ 'debug-force', false, { } ]
];
