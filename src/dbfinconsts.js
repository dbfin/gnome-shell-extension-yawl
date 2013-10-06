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

const arrayShellVersion = imports.misc.config.PACKAGE_VERSION.split('.').map(function (v) { return parseInt(v); });

const arrayContributors = [
	[	'Jonatan Zeidler',								_("German translation")			]
];

const arrayAnimationTransitions = [
    [   _("Linear"),									'linear'						],
    [	_("Slow at the end"),							'easeOutQuad'					],
    [	_("Slow at the beginning"),						'easeInQuad'					],
    [	_("Slow on both sides"),						'easeInOutQuad'					],
    [	_("Slow in the middle"),						'easeOutInQuad'					],
    [	_("Slower at the end"),							'easeOutCubic'   				],
    [	_("Slower at the beginning"),					'easeInCubic'   				],
    [	_("Slower on both sides"),						'easeInOutCubic'   				],
    [	_("Slower in the middle"),						'easeOutInCubic'   				],
    [	_("Slowest at the end"),						'easeOutQuart'   				],
    [	_("Slowest at the beginning"),					'easeInQuart'   				],
    [	_("Slowest on both sides"),						'easeInOutQuart'   				],
    [	_("Slowest in the middle"),						'easeOutInQuart'   				],
    [	_("Bounce at the end"),							'easeOutBounce'  				],
    [	_("Bounce at the beginning"),					'easeInBounce'  				],
    [	_("Bounce on both sides"),						'easeInOutBounce'  				],
    [	_("Bounce in the middle"),						'easeOutInBounce'  				],
    [	_("Back'n'forth in the middle"),				'easeOutInBack'					],
    [	_("Elastic in the middle"),						'easeOutInElastic' 				]
];

const arrayAppClickFunctions = [
    [   _("No action"),	                            	'',                             ''                              ],
    [   _("Show next : all non-minimized windows"), 	'nextWindowNonMinimized',       'showAllWindowsNonMinimized'    ],
    [   _("Show next : all windows"),	            	'nextWindow',                   'showAllWindows'                ],
    [   _("Show all/next non-minimized : all windows"),	'showAllNextNonMinimized',      'showAllWindows'                ],
    [   _("Rotate windows forward : backward"),     	'rotateWindowsForward',         'rotateWindowsBackward'         ],
    [   _("Rotate windows backward : forward"),     	'rotateWindowsBackward',        'rotateWindowsForward'          ],
    [   _("Minimize top : all windows"),	        	'minimizeTopWindow',            'minimizeAllWindows'            ],
    [   _("(Un)Maximize top : all windows"),        	'maximizeTopWindow',            'maximizeAllWindows'            ],
    [   _("Open new window : none"),	            	'openNewWindowThisWorkspace',   ''                              ],
    [   _("Open new window (new workspace) : none"),	'openNewWindowNewWorkspace',    ''                              ],
    [   _("Open menu : none"),                       	'openMenu',                     ''                              ],
	[	_("Quit"),										'quitApplication',				''								]
];

const arrayWindowClickFunctions = [
    [   _("No action"),	                            	''                              ],
    [   _("Show and focus"),                           	'showWindow'                    ],
    [   _("Minimize"),	                            	'minimizeWindow'                ],
    [   _("(Un)Maximize"),                            	'maximizeWindowToggle'          ],
	[	_("Close"),										'closeWindow'					],
	[	_("Preview on/Thumbnail panel opacity"),		'previewWindowOn'				],
	[	_("Preview off/Thumbnail panel opacity"),		'previewWindowOff'				]
];

const arrayAppMenuItems = [
//    [   '',                         					null							],
//    [   _("New window"),            					'openNewWindowThisWorkspace'	],
    [   '',                         					null							],
    [   _("Quit"),                  					'quitApplication'				]
];

const arrayThumbnailButtons = [
	[	'window-close',									'closeWindow'					]
];

const Settings = [
	[ 'first-time', true, { }, null ],

    [ 'icons-show-all', true, { }, 'panel' ],
    [ 'yawl-panel-position', 21, { min: 0, max: 50 }, 'panel' ],
    [ 'yawl-panel-width', 100, { min: 1, max: 100 }, 'panel' ],
    [ 'move-center', true, { }, 'panel' ],
    [ 'hide-activities', false, { }, 'panel' ],
    [ 'preserve-hot-corner', true, { }, 'panel' ],
    [ 'hide-app-menu', false, { }, 'panel' ],
    [ 'panel-background', false, { }, 'panel' ],
    [ 'panel-top-color', '#212133', { }, 'panel' ],
    [ 'panel-top-opacity', 75, { min: 0, max: 100 }, 'panel' ],
    [ 'panel-color', '#000000', { }, 'panel' ],
    [ 'panel-opacity', 75, { min: 0, max: 100 }, 'panel' ],

    [ 'icons-size', 24, { min: 16, max: 128 }, 'icons' ],
    [ 'icons-faded', false, { }, 'icons' ],
    [ 'icons-opacity', 84, { min: 50, max: 100 }, 'icons' ],
    [ 'icons-opacity-inactive', 21, { min: 10, max: 100 }, 'icons' ],
    [ 'icons-clip-top', 2, { min: 0, max: 7 }, 'icons' ],
    [ 'icons-clip-bottom', 2, { min: 0, max: 7 }, 'icons' ],
    [ 'icons-align', 0, { min: 0, max: 100 }, 'icons' ],
    [ 'icons-distance', 11, { min: 0, max: 100 }, 'icons' ],

    [ 'icons-animation-time', 490, { min: 0, max: 1000 }, 'icons>animation' ],
    [ 'icons-animation-effect', 1, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'icons>animation' ],
    [ 'icons-hover-animation', true, { }, 'icons>animation' ],
    [ 'icons-hover-size', 100, { min: 100, max: 200 }, 'icons>animation' ],
    [ 'icons-hover-opacity', 100, { min: 50, max: 100 }, 'icons>animation' ],
    [ 'icons-hover-fit', false, { }, 'icons>animation' ],
    [ 'icons-hover-animation-time', 33, { min: 0, max: 200 }, 'icons>animation' ],
    [ 'icons-hover-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'icons>animation' ],

    [ 'windows-show', true, { }, 'thumbnails>panel' ],
    [ 'windows-show-interesting', false, { }, 'thumbnails>panel' ],
    [ 'windows-indicator-arrow', false, { }, 'thumbnails>panel' ],
    [ 'windows-theming', true, { }, 'thumbnails>panel' ],
    [ 'windows-background-panel', true, { }, 'thumbnails>panel' ],
    [ 'windows-background-color', '#2e3436', { }, 'thumbnails>panel' ],
    [ 'windows-background-opacity', 75, { min: 0, max: 100 }, 'thumbnails>panel' ],
    [ 'windows-text-color', 'white', { }, 'thumbnails>panel' ],
    [ 'windows-text-size', 9, { min: 6, max: 36 }, 'thumbnails>panel' ],
    [ 'windows-border-color', '#d3d7cf', { }, 'thumbnails>panel' ],
    [ 'windows-border-width', 2, { min: 0, max: 3 }, 'thumbnails>panel' ],
    [ 'windows-border-radius', 5, { min: 0, max: 10 }, 'thumbnails>panel' ],
    [ 'windows-padding', 11, { min: 0, max: 20 }, 'thumbnails>panel' ],

    [ 'windows-thumbnails-fit-height', false, { }, 'thumbnails' ],
    [ 'windows-thumbnails-width', 248, { min: 50, max: 500 }, 'thumbnails' ],
    [ 'windows-thumbnails-height', 160, { min: 40, max: 400 }, 'thumbnails' ],
    [ 'windows-thumbnails-height-visible', 160, { min: 40, max: 400 }, 'thumbnails' ],
    [ 'windows-thumbnails-opacity', 84, { min: 50, max: 100 }, 'thumbnails' ],
    [ 'windows-thumbnails-minimized-opacity', 42, { min: 10, max: 100 }, 'thumbnails' ],
    [ 'windows-thumbnails-distance', 11, { min: 0, max: 50 }, 'thumbnails' ],
    [ 'windows-thumbnails-padding-top', 7, { min: 0, max: 20 }, 'thumbnails' ],

    [ 'windows-show-delay', 400, { min: 0, max: 1000 }, 'thumbnails>animation' ],
    [ 'windows-animation-time', 300, { min: 0, max: 500 }, 'thumbnails>animation' ],
    [ 'windows-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'thumbnails>animation' ],
    [ 'windows-hover-opacity', 100, { min: 50, max: 100 }, 'thumbnails>animation' ],
    [ 'windows-hover-fit', true, { }, 'thumbnails>animation' ],
    [ 'windows-hover-animation-time', 144, { min: 0, max: 200 }, 'thumbnails>animation' ],
    [ 'windows-hover-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 }, 'thumbnails>animation' ],

    [ 'mouse-app-left', 2, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-ctrl', 8, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-shift', 6, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-left-ctrl-shift', 1, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],

    [ 'mouse-app-middle', 9, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-ctrl', 9, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-shift', 7, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-middle-ctrl-shift', 3, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-app-scroll', 4, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],

    [ 'mouse-app-right', 10, { min: 0, max: arrayAppClickFunctions.length - 1 }, 'mouse' ],

    [ 'mouse-window-left', 1, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-left-ctrl', 0, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-left-shift', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-left-ctrl-shift', 0, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-middle', 3, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-scroll-up', 5, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-scroll-down', 6, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],
    [ 'mouse-window-right', 2, { min: 0, max: arrayWindowClickFunctions.length - 1 }, 'mouse' ],

    [ 'mouse-click-release', false, { }, 'mouse' ],
    [ 'mouse-long-click', true, { }, 'mouse' ],
    [ 'mouse-scroll-timeout', 125, { min: 25, max: 1000 }, 'mouse' ],
    [ 'mouse-clicks-time-single', 400, { min: 250, max: 750 }, 'mouse' ],
    [ 'mouse-clicks-time-double', 250, { min: 100, max: 450 }, 'mouse' ],
    [ 'mouse-clicks-time-threshold', 300, { min: 150, max: 550 }, 'mouse' ],

    [ 'animation-disable', false, { }, 'animation' ],
    [ 'animation-alternative', false, { }, 'animation' ],
    [ 'animation-alternative-fps', 33, { min: 10, max: 50 }, 'animation' ],

    [ 'debug', false, { }, 'debug' ],
    [ 'debug-bottom', false, { }, 'debug' ],
    [ 'debug-width', 33, { min: 10, max: 70 }, 'debug' ],
    [ 'debug-force', false, { }, 'debug' ],

    [ 'mouse-scroll-workspace', true, { }, 'addons>scrollworkspace' ],
    [ 'mouse-scroll-workspace-search', true, { }, 'addons>scrollworkspace' ],
    [ 'icons-attention-blink', true, { }, 'addons>attention' ],
    [ 'icons-attention-blink-rate', 39, { min: 15, max: 125 }, 'addons>attention' ],
    [ 'app-quicklists', true, { }, 'addons>quicklists' ],
	[ 'windows-preview', false, { }, 'addons>preview' ],
	[ 'windows-preview-dim-color', '#01234c', { }, 'addons>preview' ],
	[ 'windows-preview-dim-opacity', 25, { min: 0, max: 75 }, 'addons>preview' ],
    [ 'windows-preview-panel-opacity', 25, { min: 5, max: 75 }, 'addons>preview' ]
];
