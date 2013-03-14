/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinanimation.js
 * Actor animation.
 *
 */

const Lang = imports.lang;

const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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
 *              transition  can be an index in the array dbFinConsts.arrayAnimationTransitions or a string
 */
function animateToState(actor, state, callback, scope, time, transition) {
    if (!actor || !state) return;
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
    if (time > 0) {
        let (_state = {}, was = false) {
            for (let p in state) { // animate only those that are already defined and different
                p = '' + p;
                if (actor[p] !== undefined) {
                    Tweener.removeTweens(actor, p);
                    if (actor[p] !== state[p]) {
                        _state[p] = state[p];
                        was = true;
                    }
                }
            } // for (let p)
            if (was) { // anything to animate?
                _state.time = time / 1000.;
                _state.transition = transition;
                if (callback) _state.onComplete = callback;
                if (scope) _state.onCompleteScope = scope;
                Tweener.addTween(actor, _state);
            } // if (was)
            else if (callback) {
                if (scope) Lang.bind(scope, callback)();
                else callback();
            } // if (was) else
        } // let (_state, was)
    } // if (time > 0)
    else {
        for (let p in state) {
            p = '' + p;
            if (actor[p] !== undefined) {
                Tweener.removeTweens(actor, p);
                if (actor[p] !== state[p]) {
                    actor[p] = state[p];
                }
            }
        } // for (let p)
        if (callback) {
            if (scope) Lang.bind(scope, callback)();
            else callback();
        }
    } // if (time > 0) else
}
