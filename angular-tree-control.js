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
      return { pageWidth:pageWidth, pageHeight:pageHeight };
    };

    angular.module( 'treeControl', [] )
        .directive( 'treecontrol', ['$compile', function( $compile ) {
            /**
             * @param cssClass - the css class
             * @param addClassProperty - should we wrap the class name with class=""
             */
            function classIfDefined(cssClass, addClassProperty) {
                if (cssClass) {
                    if (addClassProperty)
                        return 'class="' + cssClass + '"';
                    else
                        return cssClass;
                }
                else
                    return "";
            }

            function ensureDefault(obj, prop, value) {
                if (!obj.hasOwnProperty(prop))
                    obj[prop] = value;
            }

            return {
                restrict: 'EA',
                require: "treecontrol",
                transclude: true,
                scope: {
                    treeModel: "=",
                    selectedNode: "=?",
                    selectedNodes: "=?",
                    expandedNodes: "=?",
                    onSelection: "&",
                    onNodeToggle: "&",
                    onRightClick: "&",
                    contextMenuId: "@",
                    options: "=?",
                    orderBy: "@",
                    reverseOrder: "@",
                    filterExpression: "=?",
                    filterComparator: "=?"
                },
                controller: ['$scope', '$attrs', function( $scope, $attrs) {

                    function defaultIsLeaf(node) {
                        return !node[$scope.options.nodeChildren] || node[$scope.options.nodeChildren].length === 0;
                    }

                    function shallowCopy(src, dst) {
                        if (angular.isArray(src)) {
                            dst = dst || [];

                            for ( var i = 0; i < src.length; i++) {
                                dst[i] = src[i];
                            }
                        } else if (angular.isObject(src)) {
                            dst = dst || {};

                            for (var key in src) {
                                if (hasOwnProperty.call(src, key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                                    dst[key] = src[key];
                                }
                            }
                        }

                        return dst || src;
                    }
                    function defaultEquality(a, b) {
                        if (a === undefined || b === undefined)
                            return false;
                        a = shallowCopy(a);
                        a[$scope.options.nodeChildren] = [];
                        b = shallowCopy(b);
                        b[$scope.options.nodeChildren] = [];
                        return angular.equals(a, b);
                    }

                    $scope.options = $scope.options || {};
                    ensureDefault($scope.options, "multiSelection", false);
                    ensureDefault($scope.options, "nodeChildren", "children");
                    ensureDefault($scope.options, "dirSelectable", "true");
                    ensureDefault($scope.options, "injectClasses", {});
                    ensureDefault($scope.options.injectClasses, "ul", "");
                    ensureDefault($scope.options.injectClasses, "li", "");
                    ensureDefault($scope.options.injectClasses, "liSelected", "");
                    ensureDefault($scope.options.injectClasses, "iExpanded", "");
                    ensureDefault($scope.options.injectClasses, "iCollapsed", "");
                    ensureDefault($scope.options.injectClasses, "iLeaf", "");
                    ensureDefault($scope.options.injectClasses, "label", "");
                    ensureDefault($scope.options.injectClasses, "labelSelected", "");
                    ensureDefault($scope.options, "equality", defaultEquality);
                    ensureDefault($scope.options, "isLeaf", defaultIsLeaf);

                    $scope.selectedNodes = $scope.selectedNodes || [];
                    $scope.expandedNodes = $scope.expandedNodes || [];
                    $scope.expandedNodesMap = {};
                    for (var i=0; i < $scope.expandedNodes.length; i++) {
                        $scope.expandedNodesMap[""+i] = $scope.expandedNodes[i];
                    }
                    $scope.parentScopeOfTree = $scope.$parent;


                    function isSelectedNode(node) {
                        if (!$scope.options.multiSelection && ($scope.options.equality(node, $scope.selectedNode)))
                            return true;
                        else if ($scope.options.multiSelection && $scope.selectedNodes) {
                            for (var i = 0; (i < $scope.selectedNodes.length); i++) {
                                if ($scope.options.equality(node, $scope.selectedNodes[i])) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    }

                    $scope.headClass = function(node) {
                        var liSelectionClass = classIfDefined($scope.options.injectClasses.liSelected, false);
                        var injectSelectionClass = "";
                        if (liSelectionClass && isSelectedNode(node))
                            injectSelectionClass = " " + liSelectionClass;
                        if ($scope.options.isLeaf(node))
                            return "tree-leaf" + injectSelectionClass;
                        if ($scope.expandedNodesMap[this.$id])
                            return "tree-expanded" + injectSelectionClass;
                        else
                            return "tree-collapsed" + injectSelectionClass;
                    };

                    $scope.iBranchClass = function() {
                        if ($scope.expandedNodesMap[this.$id])
                            return classIfDefined($scope.options.injectClasses.iExpanded);
                        else
                            return classIfDefined($scope.options.injectClasses.iCollapsed);
                    };

                    $scope.nodeExpanded = function() {
                        return !!$scope.expandedNodesMap[this.$id];
                    };

                    $scope.selectNodeHead = function() {
                        var expanding = $scope.expandedNodesMap[this.$id] === undefined;
                        $scope.expandedNodesMap[this.$id] = (expanding ? this.node : undefined);
                        if (expanding) {
                            $scope.expandedNodes.push(this.node);
                        }
                        else {
                            var index;
                            for (var i=0; (i < $scope.expandedNodes.length) && !index; i++) {
                                if ($scope.options.equality($scope.expandedNodes[i], this.node)) {
                                    index = i;
                                }
                            }
                            if (index !== undefined)
                                $scope.expandedNodes.splice(index, 1);
                        }
                        if ($scope.onNodeToggle)
                            $scope.onNodeToggle({node: this.node, expanded: expanding});
                    };

                    $scope.selectNodeLabel = function( selectedNode ){
                        if(!$scope.options.isLeaf(selectedNode) && !$scope.options.dirSelectable) {
                            this.selectNodeHead();
                        }
                        else {
                            var selected = false;
                            if ($scope.options.multiSelection) {
                                var pos = -1;
                                for (var i=0; i < $scope.selectedNodes.length; i++) {
                                    if($scope.options.equality(selectedNode, $scope.selectedNodes[i])) {
                                        pos = i;
                                        break;
                                    }
                                }
                                if (pos === -1) {
                                    $scope.selectedNodes.push(selectedNode);
                                    selected = true;
                                } else {
                                    $scope.selectedNodes.splice(pos, 1);
                                }
                            } else {
                                if (!$scope.options.equality(selectedNode, $scope.selectedNode)) {
                                    $scope.selectedNode = selectedNode;
                                    selected = true;
                                }
                                else {
                                    $scope.selectedNode = undefined;
                                }
                            }
                            if ($scope.onSelection)
                                $scope.onSelection({node: selectedNode, selected: selected});
                        }
                    };

                    $scope.rightClickNodeLabel = function( targetNode ) {

                        // Are are we changing the 'selected' node (as well)?
                        if ($scope.selectedNode != targetNode) {
                            this.selectNodeLabel( targetNode);
                        }

                        // ...and do the rightClick
                        if($scope.onRightClick) {
                            $scope.onRightClick({node: targetNode});
                        }
                    };

                    $scope.selectedClass = function() {
                        var isThisNodeSelected = isSelectedNode(this.node);
                        var labelSelectionClass = classIfDefined($scope.options.injectClasses.labelSelected, false);
                        var injectSelectionClass = "";
                        if (labelSelectionClass && isThisNodeSelected)
                            injectSelectionClass = " " + labelSelectionClass;

                        return isThisNodeSelected?"tree-selected" + injectSelectionClass:"";
                    };

                    //tree template
                    var orderBy = $scope.orderBy ? ' | orderBy:orderBy:reverseOrder' : '';
                    var rcLabel = $attrs.onRightClick ? ' tree-right-click="rightClickNodeLabel(node)"' : '';
                    var ctxMenuId = $attrs.contextMenuId ? ' tree-context-menu-id="'+ $attrs.contextMenuId+'"' : '';

                    var template =
                        '<ul '+classIfDefined($scope.options.injectClasses.ul, true)+'>' +
                            '<li ng-repeat="node in node.' + $scope.options.nodeChildren + ' | filter:filterExpression:filterComparator ' + orderBy + '" ng-class="headClass(node)" '+classIfDefined($scope.options.injectClasses.li, true)+'>' +
                            '<i class="tree-branch-head" ng-class="iBranchClass()" ng-click="selectNodeHead(node)"></i>' +
                            '<i class="tree-leaf-head '+classIfDefined($scope.options.injectClasses.iLeaf, false)+'"></i>' +
                            '<div class="tree-label '+classIfDefined($scope.options.injectClasses.label, false)+'"' +
                                   ' ng-class="selectedClass()"' +
                                   ' ng-click="selectNodeLabel(node)"' + rcLabel + ctxMenuId +

                                   ' tree-transclude></div>' +
                            '<treeitem ng-if="nodeExpanded()"></treeitem>' +
                            '</li>' +
                            '</ul>';

                    this.template = $compile(template);
                }],


                compile: function(element, attrs, childTranscludeFn) {
                    return function ( scope, element, attrs, treemodelCntr ) {

                        scope.$watch("treeModel", function updateNodeOnRootScope(newValue) {
                            if (angular.isArray(newValue)) {
                                if (angular.isDefined(scope.node) && angular.equals(scope.node[scope.options.nodeChildren], newValue))
                                    return;
                                scope.node = {};
                                scope.synteticRoot = scope.node;
                                scope.node[scope.options.nodeChildren] = newValue;
                            }
                            else {
                                if (angular.equals(scope.node, newValue))
                                    return;
                                scope.node = newValue;
                            }
                        });

                        scope.$watchCollection('expandedNodes', function(newValue) {
                            var notFoundIds = 0;
                            var newExpandedNodesMap = {};
                            var $liElements = element.find('li');
                            var existingScopes = [];
                            // find all nodes visible on the tree and the scope $id of the scopes including them
                            angular.forEach($liElements, function(liElement) {
                                var $liElement = angular.element(liElement);
                                var liScope = $liElement.scope();
                                existingScopes.push(liScope);
                            });
                            // iterate over the newValue, the new expanded nodes, and for each find it in the existingNodesAndScopes
                            // if found, add the mapping $id -> node into newExpandedNodesMap
                            // if not found, add the mapping num -> node into newExpandedNodesMap
                            angular.forEach(newValue, function(newExNode) {
                                var found = false;
                                for (var i=0; (i < existingScopes.length) && !found; i++) {
                                    var existingScope = existingScopes[i];
                                    if (scope.options.equality(newExNode, existingScope.node)) {
                                        newExpandedNodesMap[existingScope.$id] = existingScope.node;
                                        found = true;
                                    }
                                }
                                if (!found)
                                    newExpandedNodesMap[notFoundIds++] = newExNode;
                            });
                            scope.expandedNodesMap = newExpandedNodesMap;
                        });

//                        scope.$watch('expandedNodesMap', function(newValue) {
//
//                        });

                        //Rendering template for a root node
                        treemodelCntr.template( scope, function(clone) {
                            element.html('').append( clone );
                        });
                        // save the transclude function from compile (which is not bound to a scope as apposed to the one from link)
                        // we can fix this to work with the link transclude function with angular 1.2.6. as for angular 1.2.0 we need
                        // to keep using the compile function
                        scope.$treeTransclude = childTranscludeFn;
                    };
                }
            };
        }])

        .directive('treeRightClick', function($parse) {
            return function(scope, element, attrs) {
                var fn = $parse(attrs.treeRightClick);
                element.bind('contextmenu', function(event) {
                    scope.$apply(function() {
                        event.preventDefault();     // Don't show the browser's normal context menu
                        fn(scope, {$event:event});  // go do our stuff
                    });
                });
            };
        })

        .directive('treeContextMenuId', ['$document', function($document) {

            return {
                restrict    : 'A',
                scope       : '@&',
                compile: function compile(tElement, tAttrs, transclude) {
                    return {
                        post: function postLink(scope, iElement, iAttrs, controller) {

                            var ul = angular.element(document.querySelector('#' + iAttrs.treeContextMenuId));

                            ul.css({ 'display' : 'none'});

                            // right-click on context-menu will show the menu
                            iElement.bind('contextmenu', function showContextMenu(event) {

                                // don't do the normal browser right-click context menu
                                event.preventDefault();
                                var pgDim = getPageDimensions();

                                // will ctxMenu fit on screen (height-wise) ?
                                // TODO: figure out why we need the fudge-factor of 14
                                var ulTop = event.clientY + ul.height() <= pgDim.pageHeight - 14
                                          ? event.clientY
                                          : pgDim.pageHeight - ul.height() - 14;

                                // will ctxMenu fit on screen (width-wise) ?
                                var ulLeft = event.clientX + ul.width() <= pgDim.pageWidth - 2
                                           ? event.clientX
                                           : pgDim.pageWidth - ul.width() - 2;

                                // use CSS to move and show the dropdown-menu
                                ul.css({
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

                                  // Will the ctxMenu fit on the right of the parent menu ??
                                  var pgDim = getPageDimensions();

                                  // will ctxMenu (height-wise) ?
                                  // TODO: figure out why we need the fudge-factor of 14
                                  var ulTop = event.clientY + ul.height() <= pgDim.pageHeight - 14
                                            ? event.clientY
                                            : pgDim.pageHeight - ul.height() - 14;

                                  // will ctxMenu (width-wise) ?
                                  var ulLeft =
                                    (event.target.offsetParent.offsetLeft +
                                     event.target.clientWidth +
                                     ul.width() < pgDim.pageWidth) ? event.target.offsetParent.offsetLeft +
                                                                     event.target.clientWidth

                                                                    : event.target.offsetParent.offsetLeft -
                                                                      ul.width();

                                    ul.css({
                                        position: "fixed",
                                        display: "block",
                                        left: ulLeft + 'px',
                                        top:  ulTop + 'px'
                                    })

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
        }])

        .directive("treeitem", function() {
            return {
                restrict: 'E',
                require: "^treecontrol",
                link: function( scope, element, attrs, treemodelCntr) {
                    // Rendering template for the current node
                    treemodelCntr.template(scope, function(clone) {
                        element.html('').append(clone);
                    });
                }
            };
        })
        .directive("treeTransclude", function() {
            return {
                link: function(scope, element, attrs, controller) {
                    if (!scope.options.isLeaf(scope.node)) {
                        angular.forEach(scope.expandedNodesMap, function (node, id) {
                            if (scope.options.equality(node, scope.node)) {
                                scope.expandedNodesMap[scope.$id] = scope.node;
                                scope.expandedNodesMap[id] = undefined;
                            }
                        });
                    }
                    if (!scope.options.multiSelection && scope.options.equality(scope.node, scope.selectedNode)) {
                        scope.selectedNode = scope.node;
                    } else if (scope.options.multiSelection) {
                        var newSelectedNodes = [];
                        for (var i = 0; (i < scope.selectedNodes.length); i++) {
                            if (scope.options.equality(scope.node, scope.selectedNodes[i])) {
                                newSelectedNodes.push(scope.node);
                            }
                        }
                        scope.selectedNodes = newSelectedNodes;
                    }

                    // create a scope for the transclusion, whos parent is the parent of the tree control
                    scope.transcludeScope = scope.parentScopeOfTree.$new();
                    scope.transcludeScope.node = scope.node;
                    scope.transcludeScope.$parentNode = (scope.$parent.node === scope.synteticRoot)?null:scope.$parent.node;
                    scope.transcludeScope.$index = scope.$index;
                    scope.transcludeScope.$first = scope.$first;
                    scope.transcludeScope.$middle = scope.$middle;
                    scope.transcludeScope.$last = scope.$last;
                    scope.transcludeScope.$odd = scope.$odd;
                    scope.transcludeScope.$even = scope.$even;
                    scope.$on('$destroy', function() {
                        scope.transcludeScope.$destroy();
                    });

                    scope.$treeTransclude(scope.transcludeScope, function(clone) {
                        element.empty();
                        element.append(clone);
                    });
                }
            };
        });
})( angular );
