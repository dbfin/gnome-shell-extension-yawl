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

const arrayThumbnailButtons = [
	[	'window-close',									'closeWindow'					]
];

const Settings = [
	[ 'first-time', true, { }, null ],

    [ 'yawl-panel-position', 21, { min: 0, max: 50 }, 'panel' ],
    [ 'yawl-panel-width', 100, { min: 1, max: 100 }, 'panel' ],
    [ 'move-center', true, { }, 'panel' ],
    [ 'hide-activities', true, { }, 'panel' ],
    [ 'preserve-hot-corner', true, { }, 'panel' ],
    [ 'hide-app-menu', false, { }, 'panel' ],
    [ 'panel-background', false, { }, 'panel' ],
    [ 'panel-top-color', '#000000', { }, 'panel' ],
    [ 'panel-top-opacity', 77, { min: 0, max: 100 }, 'panel' ],
    [ 'panel-color', '#000000', { }, 'panel' ],
    [ 'panel-opacity', 77, { min: 0, max: 100 }, 'panel' ],

    [ 'icons-size', 48, { min: 16, max: 128 }, 'icons' ],
    [ 'icons-faded', true, { }, 'icons' ],
    [ 'icons-opacity', 84, { min: 50, max: 100 }, 'icons' ],
    [ 'icons-clip-top', 3, { min: 0, max: 7 }, 'icons' ],
    [ 'icons-clip-bottom', 3, { min: 0, max: 7 }, 'icons' ],
    [ 'icons-align', 0, { min: 0, max: 100 }, 'icons' ],
    [ 'icons-distance', 21, { min: 0, max: 100 }, 'icons' ],

    [ 'icons-animation-time', 490, { min: 0, max: 1000 }, 'icons>animation' ],
    [ 'icons-animation-effect', 1, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'icons>animation' ],
    [ 'icons-hover-animation', true, { }, 'icons>animation' ],
    [ 'icons-hover-size', 100, { min: 100, max: 200 }, 'icons>animation' ],
    [ 'icons-hover-opacity', 100, { min: 50, max: 100 }, 'icons>animation' ],
    [ 'icons-hover-fit', false, { }, 'icons>animation' ],
    [ 'icons-hover-animation-time', 33, { min: 0, max: 200 }, 'icons>animation' ],
    [ 'icons-hover-animation-effect', 0, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'icons>animation' ],

    [ 'windows-indicator-arrow', false, { }, 'thumbnails>panel' ],
    [ 'windows-theming', true, { }, 'thumbnails>panel' ],
    [ 'windows-background-panel', true, { }, 'thumbnails>panel' ],
    [ 'windows-background-color', '#000000', { }, 'thumbnails>panel' ],
    [ 'windows-background-opacity', 70, { min: 0, max: 100 }, 'thumbnails>panel' ],
    [ 'windows-text-color', 'white', { }, 'thumbnails>panel' ],
    [ 'windows-text-size', 9, { min: 6, max: 36 }, 'thumbnails>panel' ],
    [ 'windows-padding', 7, { min: 0, max: 20 }, 'thumbnails>panel' ],
    [ 'windows-border-color', '#d3d7cf', { }, 'thumbnails>panel' ],
    [ 'windows-border-width', 2, { min: 0, max: 3 }, 'thumbnails>panel' ],
    [ 'windows-border-radius', 7, { min: 0, max: 10 }, 'thumbnails>panel' ],

    [ 'windows-thumbnails-width', 248, { min: 50, max: 500 }, 'thumbnails' ],
    [ 'windows-thumbnails-fit-height', true, { }, 'thumbnails' ],
    [ 'windows-thumbnails-height', 160, { min: 40, max: 400 }, 'thumbnails' ],
    [ 'windows-thumbnails-height-visible', 160, { min: 40, max: 400 }, 'thumbnails' ],
    [ 'windows-thumbnails-opacity', 84, { min: 50, max: 100 }, 'thumbnails' ],
    [ 'windows-thumbnails-minimized-opacity', 40, { min: 10, max: 100 }, 'thumbnails' ],
    [ 'windows-thumbnails-distance', 11, { min: 0, max: 50 }, 'thumbnails' ],
    [ 'windows-thumbnails-padding-top', 7, { min: 0, max: 20 }, 'thumbnails' ],

    [ 'windows-show-delay', 400, { min: 0, max: 1000 }, 'thumbnails>animation' ],
    [ 'windows-animation-time', 400, { min: 0, max: 1000 }, 'thumbnails>animation' ],
    [ 'windows-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'thumbnails>animation' ],
    [ 'windows-hover-opacity', 100, { min: 50, max: 100 }, 'thumbnails>animation' ],
    [ 'windows-hover-fit', true, { }, 'thumbnails>animation' ],
    [ 'windows-hover-animation-time', 77, { min: 0, max: 200 }, 'thumbnails>animation' ],
    [ 'windows-hover-animation-effect', 0, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'thumbnails>animation' ],

    [ 'mouse-app-left', 1, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-ctrl', 8, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-shift', 6, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-ctrl-shift', 2, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-long-click', true, { }, 'mouse' ],

    [ 'mouse-app-middle', 9, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-ctrl', 3, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-shift', 7, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-ctrl-shift', 0, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-scroll', 4, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],

    [ 'mouse-app-right', 10, { min: 0, max: arrayAppClickFunctions.length - 1 }, null ],

    [ 'mouse-window-left', 1, { min: 0, max: arrayWindowClickFunctions.length - 1 }, null ],
    [ 'mouse-window-left-shift', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 }, null ],
    [ 'mouse-window-middle', 3, { min: 0, max: arrayWindowClickFunctions.length - 1 }, null ],
    [ 'mouse-window-right', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 }, null ],

    [ 'mouse-click-release', false, { }, 'mouse' ],
    [ 'mouse-clicks-time-single', 400, { min: 250, max: 750 }, 'mouse' ],
    [ 'mouse-clicks-time-double', 250, { min: 100, max: 450 }, 'mouse' ],
    [ 'mouse-clicks-time-threshold', 300, { min: 150, max: 550 }, 'mouse' ],

    [ 'debug', false, { }, 'debug' ],
    [ 'debug-bottom', false, { }, 'debug' ],
    [ 'debug-width', 33, { min: 10, max: 70 }, 'debug' ],
    [ 'debug-force', false, { }, 'debug' ]
];
