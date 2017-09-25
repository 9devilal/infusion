/*
Copyright 2017 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

var fluid_3_0_0 = fluid_3_0_0 || {};

(function ($, fluid) {
    "use strict";

    /************************************************************************************
     * Scrolling Panel Prefs Editor:                                                    *
     * This is a mixin grade to be applied to a fluid.prefs.prefsEditor type component. *
     * Typically used for responsive small screen presentations of the separated panel  *
     * to allow for scrolling by clicking on left/right arrows                          *
     ************************************************************************************/

    fluid.defaults("fluid.prefs.arrowScrolling", {
        gradeNames: ["fluid.modelComponent"],
        selectors: {
            // panels: "", // should be supplied by the fluid.prefs.prefsEditor grade.
            scrollContainer: ".flc-prefsEditor-scrollContainer"
        },
        model: {
            // panelMaxIndex: null, // determined by the number of panels calculated after the onPrefsEditorMarkupReady event fired
            // scrollToIndex: null, // the raw index set by eventToScrollIndex, will be transformed to the panelIndex
            panelIndex: 0
        },
        events: {
            beforeReset: null, // should be fired by the fluid.prefs.prefsEditor grade
            afterScroll: null
        },
        modelRelay: {
            target: "panelIndex",
            forward: {excludeSource: "init"},
            namespace: "limitPanelIndex",
            singleTransform: {
                type: "fluid.transforms.limitRange",
                input: "{that}.model.scrollToIndex",
                min: 0,
                max: "{that}.model.panelMaxIndex"
            }
        },
        modelListeners: {
            "panelIndex": {
                listener: "fluid.prefs.arrowScrolling.scrollToPanel",
                args: ["{that}", "{change}.value"],
                excludeSource: ["manualScroll"],
                namespace: "scrollToPanel"
            }
        },
        listeners: {
            "onReady.scrollEvent": {
                "listener": "fluid.prefs.arrowScrolling.scrollDebounce",
                args: ["{that}.dom.scrollContainer", "{that}.events.afterScroll.fire"]
            },
            "onReady.windowResize": {
                "this": window,
                method: "addEventListener",
                args: ["resize", "{that}.events.onSignificantDOMChange.fire"]
            },
            "onDestroy.removeWindowResize": {
                "this": window,
                method: "removeEventListener",
                args: ["resize", "{that}.events.onSignificantDOMChange.fire"]
            },
            // Need to set panelMaxIndex after onPrefsEditorMarkupReady to ensure that the template has been
            // rendered before we try to get the number of panels.
            "onPrefsEditorMarkupReady.setPanelMaxIndex": {
                changePath: "panelMaxIndex",
                value: {
                    expander: {
                        funcName: "fluid.prefs.arrowScrolling.calculatePanelMaxIndex",
                        args: ["{that}.dom.panels"]
                    }
                }
            },
            "beforeReset.resetPanelIndex": {
                listener: "{that}.applier.fireChangeRequest",
                args: {path: "panelIndex", value: 0, type: "ADD", source: "reset"}
            },
            "afterScroll.setPanelIndex": {
                changePath: "panelIndex",
                value: {
                    expander: {
                        funcName: "fluid.prefs.arrowScrolling.getClosesPanelIndex",
                        args: "{that}.dom.panels"
                    }
                },
                source: "manualScroll"
            }
        },
        invokers: {
            eventToScrollIndex: {
                funcName: "fluid.prefs.arrowScrolling.eventToScrollIndex",
                args: ["{that}", "{arguments}.0"]
            }
        },
        distributeOptions: [{
            record: {
                "afterRender.bindScrollArrows": {
                    "this": "{that}.dom.header",
                    method: "click",
                    args: ["{prefsEditor}.eventToScrollIndex"]
                }
            },
            target: "{that > fluid.prefs.panel}.options.listeners"
        }]

    });

    fluid.prefs.arrowScrolling.calculatePanelMaxIndex = function (panels) {
        return Math.max(0, panels.length - 1);
    };

    fluid.prefs.arrowScrolling.eventToScrollIndex = function (that, event) {
        event.preventDefault();
        var target = $(event.target);
        var midPoint = target.width() / 2;
        var scrollToIndex = that.model.panelIndex + (event.offsetX < midPoint ? -1 : 1);
        that.applier.change("scrollToIndex", scrollToIndex, "ADD", "eventToScrollIndex");
    };

    fluid.prefs.arrowScrolling.scrollToPanel = function (that, panelIndex) {
        var panels = that.locate("panels");
        var scrollContainer = that.locate("scrollContainer");
        if (panels.length) {
            scrollContainer.scrollLeft(scrollContainer.scrollLeft() + panels.eq(panelIndex).offset().left);
        }
    };

    fluid.prefs.arrowScrolling.getClosesPanelIndex = function (panels) {
        var panelArray = [];
        panels.each(function (idx, panel) {
            panelArray.push({
                index: idx,
                offset: Math.abs($(panel).offset().left)
            });
        });
        panelArray.sort(function (a, b) {
            return a.offset - b.offset;
        });
        return panelArray[0].index;
    };

    // Based on scrollStop.js ( https://github.com/cferdinandi/scrollStop ),
    // which is licensed under: MIT License.
    fluid.prefs.arrowScrolling.scrollDebounce = function (elm, callback, delay) {
        var timeoutID;
        delay = delay || 66;

        $(elm).scroll(function () {
            window.clearTimeout(timeoutID);
            timeoutID = setTimeout(callback, delay);
        });
    };

})(jQuery, fluid_3_0_0);
