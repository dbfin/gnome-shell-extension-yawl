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
 * dbfinanimation.js
 * Actor animation.
 *
 */

const Lang = imports.lang;

const GLib = imports.gi.GLib;

const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinConsts = Me.imports.dbfinconsts;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

/* function animateToState(actor, state, callback, scope, time, transition): animate actor to state
 *          Parameters:
 *              actor       the actor to animate
 *              state       the final state to animate to, e.g. { opacity: 255 }
 *              callback    the callback to call at the end of animation
 *              scope       the scope for callback
 *              time        animation time
 *              transition  can be an index in the array dbFinConsts.arrayAnimationTransitions or a string, or a function
 */
function animateToState(actor, state, callback, scope, time, transition) {
    if (!actor || !state) return;
    if (!global.yawl
        || (!global.yawl.animationActors
            && !(global.yawl.animationActors = new dbFinArrayHash.dbFinArrayHash()))) return;
    time = time || 0;
    let (transitionIndex = parseInt(transition)) {
        if (!isNaN(transitionIndex)) {
            if (transitionIndex >= dbFinConsts.arrayAnimationTransitions.length) {
                transitionIndex = dbFinConsts.arrayAnimationTransitions.length - 1;
            }
            else if (transitionIndex < 0) {
                transitionIndex = 0;
            }
            transition = dbFinConsts.arrayAnimationTransitions[transitionIndex][1];
        }
    }
    transition = transition || 'linear';
    // we do not schedule animation for actors not in stage
    if (actor.get_stage) { if (!actor.get_stage()) time = 0; }
    else if (actor.actor && actor.actor.get_stage) { if (!actor.actor.get_stage()) time = 0; }
    else if (actor.container && actor.container.get_stage) { if (!actor.container.get_stage()) time = 0; }
    if (time > 0) {
        let (timeCurrent = Math.ceil(GLib.get_monotonic_time() / 1000),
             _state = {},
             properties = global.yawl.animationActors.get(actor)
                          || new dbFinArrayHash.dbFinArrayHash()) {
            for (let p in state) { // animate only those that are already defined and different
                p = '' + p;
                if (actor[p] !== undefined) {
                    Tweener.removeTweens(actor, p);
                    // check if it is already being animated to the same value
                    if (actor[p] !== state[p]) {
                        _state[p] = state[p];
                        let (st = properties && properties.get(p)) {
                            if (st  && st.state === state[p]
                                    && st.time > timeCurrent
                                    && st.time < timeCurrent + time) {
                                time = st.time - timeCurrent;
                            }
                        } // let (st)
                    } // if (actor[p] !== state[p])
                    else if (properties) {
                        properties.set(p, { state: state[p], time: timeCurrent });
                    } // if (actor[p] !== state[p]) else
                } // if (actor[p] !== undefined)
            } // for (let p)
            if (Object.keys(_state).length) { // anything to animate?
                if (properties) {
                    for (let p in _state) {
                        properties.set(p, { state: state[p], time: timeCurrent + time });
                    }
                }
                _state.time = time / 1000.;
                _state.transition = transition;
                if (callback) _state.onComplete = callback;
                if (scope) _state.onCompleteScope = scope;
                Tweener.addTween(actor, _state);
            }
            else if (callback) {
                if (scope) Lang.bind(scope, callback)();
                else callback();
            }
            if (properties) global.yawl.animationActors.set(actor, properties);
        } // let (timeCurrent, _state, properties)
    } // if (time > 0)
    else {
        let (timeCurrent = Math.ceil(GLib.get_monotonic_time() / 1000),
             properties = global.yawl.animationActors.get(actor)
                          || new dbFinArrayHash.dbFinArrayHash()) {
            for (let p in state) { // animate only those that are already defined and different
                p = '' + p;
                if (actor[p] !== undefined) {
                    Tweener.removeTweens(actor, p);
                    if (actor[p] !== state[p]) {
                        actor[p] = state[p];
                    }
                    if (properties) properties.set(p, { state: state[p], time: timeCurrent });
                } // if (actor[p] !== undefined)
            } // for (let p)
            if (callback) {
                if (scope) Lang.bind(scope, callback)();
                else callback();
            }
            if (properties) global.yawl.animationActors.set(actor, properties);
        } // let (timeCurrent, properties)
    } // if (time > 0) else
}
