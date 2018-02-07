(function ( angular ) {
    'use strict';

    /* Figure out page (viewport) dimensions of current page, by
     * putting an empty DIV in the bottom right, and checking its offset.
     */
    function getPageDimensions() {
      var bttmRight = document.createElement("div");
      bttmRight.setAttribute("style" , "visibility:hidden;position:fixed;bottom:0px;right:0px;");
      document.getElementsByTagName("body")[0].appendChild(bttmRight);
      var pageWidth = bttmRight.offsetLeft;
      var pageHeight = bttmRight.offsetTop;
      bttmRight.parentNode.removeChild(bttmRight);
      return { width:pageWidth, height:pageHeight };
    }

    angular.module( 'contextMenu', [] )

        .directive('contextMenuId', ['$document', function($document) {

            return {
                restrict    : 'A',
                scope       : '@&',
                compile: function compile(tElement, tAttrs, transclude) {

                    return {
                        post: function postLink(scope, iElement, iAttrs, controller) {

                            var ul = angular.element(document.querySelector('#' + iAttrs.contextMenuId));

                            ul.css({ 'display' : 'none'});

                            // right-click on context-menu will show the menu
                            iElement.bind('contextmenu', function showContextMenu(event) {

                                // don't do the normal browser right-click context menu
                                event.preventDefault();

                                // Organise to show off the menu (in roughly the right place)
                                ul.css({
                                    visibility:"hidden",
                                    position: "fixed",
                                    display: "block",
                                    left: event.clientX + 'px',
                                    top: event.clientY + 'px'
                                });

                                var ulDim = { height: ul.prop("clientHeight"),
                                              width:  ul.prop("cientWidth")
                                            };

                                var pgDim = getPageDimensions();

                                // will ctxMenu fit on screen (height-wise) ?
                                // TODO: figure out why we need the fudge-factor of 14
                                var ulTop = event.clientY + ulDim.height <= pgDim.height - 14
                                          ? event.clientY
                                          : pgDim.height - ulDim.height - 14;

                                // will ctxMenu fit on screen (width-wise) ?
                                var ulLeft = event.clientX + ulDim.width <= pgDim.width - 2
                                           ? event.clientX
                                           : pgDim.width - ulDim.width - 2;

                                // Ok, now show it off in the right place
                                ul.css({
                                    visibility:"visible",
                                    position: "fixed",
                                    display: "block",
                                    left: ulLeft + 'px',
                                    top:  ulTop  + 'px'
                                });

                                // setup a one-time click event on the document to hide the dropdown-menu
                                $document.one('click', function hideContextMenu(event) {
                                    ul.css({
                                        'display' : 'none'
                                    });
                                });
                            });
                        }
                    };
                }
            };
        }])

        .directive('contextSubmenuId', ['$document', function($document) {
            return {
                restrict    : 'A',
                scope       : '@&',
                compile: function compile(tElement, tAttrs, transclude) {
                    return {
                        post: function postLink(scope, iElement, iAttrs, controller) {

                            var ul = angular.element(document.querySelector('#' + iAttrs.contextSubmenuId));

                            ul.css({ 'display' : 'none'});


                            iElement.bind('mouseover', function showSubContextMenu(event) {
                                // use CSS to move and show the sub dropdown-menu
                                if(ul.css("display") == 'none') {

                                    // Organise to show off the sub-menu (in roughly the right place)
                                    ul.css({
                                        visibility:"hidden",
                                        position: "fixed",
                                        display: "block",
                                        left: event.clientX + 'px',
                                        top: event.clientY + 'px'
                                    });

                                    var ulDim = { height: ul.prop("clientHeight"),
                                                  width:  ul.prop("clientWidth")
                                                };

                                    var pgDim = getPageDimensions();


                                  // Will ctxSubMenu fit (height-wise) ?
                                  // TODO: figure out why we need the fudge-factor of 14
                                  var ulTop = event.clientY + ulDim.height <= pgDim.height - 14
                                            ? event.clientY
                                            : pgDim.height - ulDim.height - 14;

                                  // Will ctxSubMenu fit (on the right of parent menu) ?
                                  var ulLeft =
                                    (event.target.offsetParent.offsetLeft +
                                     event.target.clientWidth + ulDim.width < pgDim.width)
                                              ? event.target.offsetParent.offsetLeft +
                                                event.target.clientWidth

                                              : event.target.offsetParent.offsetLeft - ulDim.width;

                                    // OK, now show it off in the right place
                                    ul.css({
                                        visibility:"visible",
                                        position: "fixed",
                                        display: "block",
                                        left: ulLeft + 'px',
                                        top:  ulTop + 'px'
                                    });

                                    // Each uncle/aunt menu item needs a mouseover event to make the subContext menu disappear
                                    angular.forEach(iElement[0].parentElement.parentElement.children, function(child, ndx) {
                                        if(child !== iElement[0].parentElement) {
                                            angular.element(child).one('mouseover', function(event) {
                                                if(ul.css("display") == 'block') {
                                                    ul.css({
                                                        'display' : 'none'
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }

                                // setup a one-time click event on the document to hide the sub dropdown-menu
                                $document.one('click', function hideContextMenu(event) {
                                    if(ul.css("display") == 'block') {
                                        ul.css({
                                            'display' : 'none'
                                        });
                                    }
                                });
                            });
                        }
                    };
                }
            };
        }]);

})( angular );
