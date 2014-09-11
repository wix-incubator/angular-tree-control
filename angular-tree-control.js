(function (angular) {
    'use strict';

    angular.module('treeControl', [])
        .directive('treecontrol', ['$compile', function ($compile) {
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

            function findMapIndex(nodeId, node, scopeId) {
                return nodeId ? node[nodeId] : scopeId;
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
                    onToggleSelection: "&",
                    onNodeToggle: "&",
                    options: "=?",
                    orderBy: "@",
                    reverseOrder: "@"
                },
                controller: ['$scope', function ($scope) {

                    function defaultIsLeaf(node) {
                        return !node[$scope.options.nodeChildren] || node[$scope.options.nodeChildren].length === 0;
                    }

                    function defaultEquality(a, b) {
                        if (a === undefined || b === undefined)
                            return false;
                        a = angular.copy(a);
                        a[$scope.options.nodeChildren] = [];
                        b = angular.copy(b);
                        b[$scope.options.nodeChildren] = [];
                        return angular.equals(a, b);
                    }

                    $scope.options = $scope.options || {};
                    ensureDefault($scope.options, "nodeChildren", "children");
                    //ensureDefault($scope.options, "nodeId", ""); // default to current scope.$id for clicked node
                    ensureDefault($scope.options, "dirSelectable", true);
                    ensureDefault($scope.options, "multiSelectable", false);
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

                    var i= 0, mapIndex=0;
                    $scope.expandedNodes = $scope.expandedNodes || [];
                    $scope.expandedNodesMap = {};
                    for (i = 0; i < $scope.expandedNodes.length; i++) {
                        var expandedNode = $scope.expandedNodes[i];
                        mapIndex = $scope.options.nodeId ? expandedNode[$scope.options.nodeId] : "" + i;
                        $scope.expandedNodesMap[mapIndex] = expandedNode;
                    }

                    if ( $scope.options.multiSelectable ) {
                        $scope.selectedNode = undefined;
                        $scope.selectedNodes = $scope.selectedNodes || [];
                        $scope.selectedNodesMap = {};
                        for (i = 0; i < $scope.selectedNodes.length; i++) {
                            var selectedNode = $scope.selectedNodes[i];
                            mapIndex = $scope.options.nodeId ? selectedNode[$scope.options.nodeId] : "" + i;
                            $scope.selectedNodesMap[mapIndex] = selectedNode;
                        }
                    }
                    $scope.parentScopeOfTree = $scope.$parent;

                    $scope.isNodeExpanded = function (node) {
                        var mapIndex = findMapIndex($scope.options.nodeId, node, this.$id);
                        return !!$scope.expandedNodesMap[mapIndex];
                    };

                    $scope.isNodeSelected = function (node) {
                        if ($scope.options.multiSelectable) {
                            var mapIndex = findMapIndex($scope.options.nodeId, node, this.$id);
                            return !!$scope.selectedNodesMap[mapIndex];
                        } else {
                            return $scope.options.equality($scope.selectedNode, node)
                        }
                    };

                    function removeNode(nodeMap, nodeArray, node, scopeId) {
                        var mapIndex =  findMapIndex($scope.options.nodeId, node, scopeId);
                        delete nodeMap[mapIndex];

                        var index;
                        for (var i = 0; (i < nodeArray.length) && !index; i++) {
                            if ($scope.options.equality(nodeArray[i], node)) {
                                index = i;
                            }
                        }
                        if (index != undefined) {
                            nodeArray.splice(index, 1);
                        }
                    }
                    $scope.toggleNodeExpansion = function (node) {
                        var mapIndex = findMapIndex($scope.options.nodeId, node, this.$id);
                        var expanding = $scope.expandedNodesMap[mapIndex] === undefined;
                        if (expanding) {
                            $scope.expandedNodesMap[mapIndex] = node;
                            $scope.expandedNodes.push(node);

                        } else {
                            removeNode($scope.expandedNodesMap, $scope.expandedNodes, node, this.$id);
                        }
                        if ($scope.onNodeToggle)
                            $scope.onNodeToggle({node: node, expanded: expanding});
                    };

                    $scope.selectNodeLabel = function (node) {

                        if ($scope.options.dirSelectable || $scope.options.isLeaf(node)) {
                            if ($scope.options.multiSelectable) {
                                var mapIndex =  findMapIndex($scope.options.nodeId, node, this.$id);
                                var selecting = $scope.selectedNodesMap[mapIndex] === undefined;
                                if (selecting) {
                                    $scope.selectedNodesMap[mapIndex] = node;
                                    $scope.selectedNodes.push(node);

                                    if ($scope.onSelection) {
                                        $scope.onSelection({node: node, selected: true});
                                    }
                                } else {
                                    removeNode($scope.selectedNodesMap, $scope.selectedNodes, node, this.$id);
                                }

                                if ($scope.onToggleSelection) {
                                    $scope.onToggleSelection({node: node, selected: selecting});
                                }
                            } else {
                                if (false === $scope.isNodeSelected(node)) {
                                    $scope.selectedNode = node;
                                    if ($scope.onSelection) {
                                        $scope.onSelection({node: node, selected: true});
                                    }
                                }
                            }
                        } else {
                            this.toggleNodeExpansion(node);
                        }
                    };

                    $scope.headClass = function (node) {
                        var liSelectionClass = classIfDefined($scope.options.injectClasses.liSelected, false);
                        var injectSelectionClass = "";

                        var mapIndex = findMapIndex($scope.options.nodeId, node, this.$id);
                        var isSelected = false;
                        if ($scope.options.multiSelectable) {
                            isSelected = ($scope.selectedNodes && $scope.selectedNodes[mapIndex] !== undefined )
                        } else {
                            isSelected = $scope.options.equality(node, $scope.selectedNode)
                        }

                        if (liSelectionClass && isSelected) {
                            injectSelectionClass = " " + liSelectionClass;
                        }

                        if ($scope.options.isLeaf(node)) {
                            return "tree-leaf" + injectSelectionClass;
                        }


                        if ($scope.expandedNodesMap[mapIndex] !== undefined ) {
                            return "tree-expanded" + injectSelectionClass;
                        } else {
                            return "tree-collapsed" + injectSelectionClass;
                        }
                    };

                    $scope.iBranchClass = function (node) {
                        var index = findMapIndex($scope.options.nodeId, node, this.$id);
                        if ($scope.expandedNodesMap[index])
                            return classIfDefined($scope.options.injectClasses.iExpanded);
                        else
                            return classIfDefined($scope.options.injectClasses.iCollapsed);
                    };

                    $scope.selectedClass = function (node) {

                        var labelSelectionClass = classIfDefined($scope.options.injectClasses.labelSelected, false);
                        var injectSelectionClass = "";

                        var mapIndex =  findMapIndex($scope.options.nodeId, node, this.$id);

                        var isSelected = false;
                        if ($scope.options.multiSelectable) {
                            isSelected = $scope.selectedNodesMap[mapIndex] !== undefined;
                        } else {
                            isSelected = $scope.options.equality(node, $scope.selectedNode);
                        }

                        if (isSelected) {
                            injectSelectionClass = "tree-selected";
                            if (labelSelectionClass) {
                                injectSelectionClass += " " + labelSelectionClass;
                            }
                        }
                        return injectSelectionClass;
                    };

                    //tree template
                    var template =
                        '<ul ' + classIfDefined($scope.options.injectClasses.ul, true) + '>' +
                            '<li ng-repeat="node in node.' + $scope.options.nodeChildren + ' | orderBy:orderBy:reverseOrder" ng-class="headClass(node)" ' + classIfDefined($scope.options.injectClasses.li, true) + '>' +
                                '<i class="tree-branch-head" ng-class="iBranchClass(node)" ng-click="toggleNodeExpansion(node)"></i>' +
                                '<i class="tree-leaf-head ' + classIfDefined($scope.options.injectClasses.iLeaf, false) + '"></i>' +
                                '<div class="tree-label ' + classIfDefined($scope.options.injectClasses.label, false) + '" ng-class="selectedClass(node)" ng-click="selectNodeLabel(node)" tree-transclude></div>' +
                                '<treeitem ng-if="isNodeExpanded(node)"></treeitem>' +
                            '</li>' +
                        '</ul>';

                    return {
                        template: $compile(template)
                    }
                }],

                compile: function (element, attrs, childTranscludeFn) {
                    return function (scope, element, attrs, treemodelCntr) {

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

                        scope.$watchCollection('expandedNodes', function (newValue) {
                            var notFoundIds = 0;
                            var newExpandedNodesMap = {};
                            var $liElements = element.find('li');
                            var existingScopes = [];
                            // find all nodes visible on the tree and the scope $id of the scopes including them
                            angular.forEach($liElements, function (liElement) {
                                var $liElement = angular.element(liElement);
                                var liScope = $liElement.scope();
                                existingScopes.push(liScope);
                            });
                            // iterate over the newValue, the new expanded nodes, and for each find it in the existingNodesAndScopes
                            // if found, add the mapping $id -> node into newExpandedNodesMap
                            // if not found, add the mapping num -> node into newExpandedNodesMap
                            angular.forEach(newValue, function (newExNode) {
                                var found = false;
                                for (var i = 0; (i < existingScopes.length) && !found; i++) {
                                    var existingScope = existingScopes[i];
                                    if (scope.options.equality(newExNode, existingScope.node)) {
                                        var mapIndex = findMapIndex(scope.options.nodeId, existingScope.node, existingScope.$id);
                                        newExpandedNodesMap[mapIndex] = existingScope.node;
                                        found = true;
                                    }
                                }
                                if (!found)
                                    newExpandedNodesMap[notFoundIds++] = newExNode;
                            });
                            scope.expandedNodesMap = newExpandedNodesMap;
                        });

                        scope.$watchCollection('selectedNodes', function (newValue) {
//                            var notFoundIds = 0;
//                            var newExpandedNodesMap = {};
//                            var $liElements = element.find('li');
//                            var existingScopes = [];
//                            // find all nodes visible on the tree and the scope $id of the scopes including them
//                            angular.forEach($liElements, function (liElement) {
//                                var $liElement = angular.element(liElement);
//                                var liScope = $liElement.scope();
//                                existingScopes.push(liScope);
//                            });
//                            // iterate over the newValue, the new expanded nodes, and for each find it in the existingNodesAndScopes
//                            // if found, add the mapping $id -> node into newExpandedNodesMap
//                            // if not found, add the mapping num -> node into newExpandedNodesMap
//                            angular.forEach(newValue, function (newExNode) {
//                                var found = false;
//                                for (var i = 0; (i < existingScopes.length) && !found; i++) {
//                                    var existingScope = existingScopes[i];
//                                    if (scope.options.equality(newExNode, existingScope.node)) {
//                                        var index = findMapIndex(scope.options.nodeId, existingScope.node, existingScope.$id);
//                                        newExpandedNodesMap[index /*existingScope.$id*/] = existingScope.node;
//                                        found = true;
//                                    }
//                                }
//                                if (!found)
//                                    newExpandedNodesMap[notFoundIds++] = newExNode;
//                            });
//                            scope.expandedNodesMap = newExpandedNodesMap;
                        });

                        //Rendering template for a root node
                        treemodelCntr.template(scope, function (clone) {
                            element.html('').append(clone);
                        });
                        // save the transclude function from compile (which is not bound to a scope as apposed to the one from link)
                        // we can fix this to work with the link transclude function with angular 1.2.6. as for angular 1.2.0 we need
                        // to keep using the compile function
                        scope.$treeTransclude = childTranscludeFn;
                    }
                }
            };
        }])
        .directive("treeitem", function () {
            return {
                restrict: 'E',
                require: "^treecontrol",
                link: function (scope, element, attrs, treemodelController) {
                    // Rendering template for the current node
                    treemodelController.template(scope, function (clone) {
                        element.html('').append(clone);
                    });
                }
            }
        })
        .directive("treeTransclude", function () {
            return {
                link: function (scope, element, attrs, controller) {
                    if (!scope.options.isLeaf(scope.node)) {
                        angular.forEach(scope.expandedNodesMap, function (node, id) {
                            if (scope.options.equality(node, scope.node)) {
                                scope.expandedNodesMap[scope.$id] = scope.node;
                                scope.expandedNodesMap[id] = undefined;
                            }
                        });
                    }
                    if (scope.options.equality(scope.node, scope.selectedNode)) {
                        scope.selectNodeLabel(scope.node);
                    }

                    // create a scope for the transclusion, whos parent is the parent of the tree control
                    scope.transcludeScope = scope.parentScopeOfTree.$new();
                    scope.transcludeScope.node = scope.node;
                    scope.transcludeScope.$parentNode = (scope.$parent.node === scope.synteticRoot) ? null : scope.$parent.node;
                    scope.transcludeScope.$index = scope.$index;
                    scope.transcludeScope.$first = scope.$first;
                    scope.transcludeScope.$middle = scope.$middle;
                    scope.transcludeScope.$last = scope.$last;
                    scope.transcludeScope.$odd = scope.$odd;
                    scope.transcludeScope.$even = scope.$even;
                    scope.$on('$destroy', function () {
                        scope.transcludeScope.$destroy();
                    });

                    scope.$treeTransclude(scope.transcludeScope, function (clone) {
                        element.empty();
                        element.append(clone);
                    });
                }
            }
        });
})(angular);
