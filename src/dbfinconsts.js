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

const arrayAnimationTransitions = [
    [   'Linear',   									'linear'						],
    [	'Quad: slower at the end', 						'easeOutQuad'					],
    [	'Quad: slower at the beginning',  				'easeInQuad'					],
    [	'Quad: effect on both sides',   				'easeInOutQuad'					],
    [	'Cubic: slower at the end',   					'easeOutCubic'   				],
    [	'Cubic: slower at the beginning',				'easeInCubic'   				],
    [	'Cubic: effect on both sides',      			'easeInOutCubic'   				],
    [	'Expo: slower at the end',						'easeOutExpo'					],
    [	'Expo: slower at the beginning',   				'easeInExpo'					],
    [	'Expo: effect on both sides',      				'easeInOutExpo'					],
    [	'Circ: slower at the end',						'easeOutCirc'					],
    [	'Circ: slower at the beginning',   				'easeInCirc'					],
    [	'Circ: effect on both sides',      				'easeInOutCirc'					],
    [	'Bounce: effect at the end',  					'easeOutBounce'  				],
    [	'Bounce: effect at the beginning',     			'easeInBounce'  				],
    [	'Bounce: effect on both sides',     			'easeInOutBounce'  				]//,
//    [	'Back: effect at the end',						'easeOutBack'					],
//    [	'Back: effect at the beginning',   				'easeInBack'					],
//    [	'Back: effect on both sides',      				'easeInOutBack'					],
//    [	'Elastic: slower at the end', 					'easeOutElastic' 				],
//    [	'Elastic: slower at the beginning',    			'easeInElastic' 				],
//    [	'Elastic: effect on both sides',    			'easeInOutElastic' 				]
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
    [ 'panel-color', '#000000', { } ],
    [ 'panel-opacity', 100, { min: 0, max: 100 } ],

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
    [ 'windows-padding', 7, { min: 0, max: 20 } ],
    [ 'windows-border-color', '#d3d7cf', { } ],
    [ 'windows-border-width', 2, { min: 0, max: 3 } ],
    [ 'windows-border-radius', 7, { min: 0, max: 10 } ],

    [ 'windows-width', 248, { min: 50, max: 500 } ],
    [ 'windows-fit-height', true, { } ],
    [ 'windows-height', 160, { min: 40, max: 400 } ],
    [ 'windows-panel-height', 160, { min: 40, max: 400 } ],
    [ 'windows-opacity', 84, { min: 50, max: 100 } ],
    [ 'windows-distance', 11, { min: 0, max: 50 } ],

    [ 'windows-show-delay', 333, { min: 0, max: 1000 } ],
    [ 'windows-animation-time', 490, { min: 0, max: 1000 } ],
    [ 'windows-animation-effect', 3, { min: 0, max: arrayAnimationTransitions.length - 1 } ],
    [ 'windows-hover-opacity', 100, { min: 50, max: 100 } ],
    [ 'windows-hover-fit', true, { } ],
    [ 'windows-hover-animation-time', 77, { min: 0, max: 200 } ],
    [ 'windows-hover-animation-effect', 0, { min: 0, max: arrayAnimationTransitions.length - 1 } ],

    [ 'mouse-app-left', 1, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-ctrl', 8, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-shift', 6, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-left-ctrl-shift', 2, { min: 0, max: arrayAppClickFunctions.length - 1 } ],

    [ 'mouse-app-middle', 9, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-ctrl', 3, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-shift', 7, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-middle-ctrl-shift', 0, { min: 0, max: arrayAppClickFunctions.length - 1 } ],
    [ 'mouse-app-scroll', 4, { min: 0, max: arrayAppClickFunctions.length - 1 } ],

    [ 'mouse-app-right', 10, { min: 0, max: arrayAppClickFunctions.length - 1 } ],

    [ 'mouse-click-release', false, { } ],
    [ 'mouse-clicks-time-single', 400, { min: 250, max: 750 } ],
    [ 'mouse-clicks-time-double', 250, { min: 100, max: 450 } ],
    [ 'mouse-clicks-time-threshold', 300, { min: 150, max: 550 } ]
];
