(function (angular) {
    'use strict';

    angular.module('treeControl')
        .directive('treecontrol', [
            '$compile', function ($compile) {
                /**
             * @param cssClass - the css class
             * @param addClassProperty - should we wrap the class name with class=""
             */

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
                        options: "=?",
                        orderBy: "@",
                        reverseOrder: "@",
                        filterExpression: "=?",
                        filterComparator: "=?"
                    },
                    controller: [
                        '$scope', function ($scope) {

                            var ctrl = this;

                            ctrl.$scope = $scope;
                            ctrl.$compile = $compile;


                            ctrl.classIfDefined = function (cssClass, addClassProperty) {
                                if (cssClass) {
                                    if (addClassProperty)
                                        return 'class="' + cssClass + '"';
                                    else
                                        return cssClass;
                                } else
                                    return "";
                            }

                            ctrl.ensureDefault = function (obj, prop, value) {
                                if (!obj.hasOwnProperty(prop))
                                    obj[prop] = value;
                            }


                            ctrl.defaultIsLeaf = function (node) {
                                return !node[$scope.options.nodeChildren] || node[$scope.options.nodeChildren].length === 0;
                            }

                            ctrl.shallowCopy = function (src, dst) {
                                if (angular.isArray(src)) {
                                    dst = dst || [];

                                    for (var i = 0; i < src.length; i++) {
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
                            ctrl.defaultEquality = function (a, b) {
                                if (a === undefined || b === undefined)
                                    return false;
                                a = ctrl.shallowCopy(a);
                                a[$scope.options.nodeChildren] = [];
                                b = ctrl.shallowCopy(b);
                                b[$scope.options.nodeChildren] = [];
                                return angular.equals(a, b);
                            }

                            ctrl.defaultIsSelectable = function () {
                                return true;
                            }

                            $scope.options = $scope.options || {};
                            ctrl.ensureDefault($scope.options, "multiSelection", false);
                            ctrl.ensureDefault($scope.options, "nodeChildren", "children");
                            ctrl.ensureDefault($scope.options, "dirSelectable", "true");
                            ctrl.ensureDefault($scope.options, "injectClasses", {});
                            ctrl.ensureDefault($scope.options.injectClasses, "ul", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "li", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "liSelected", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "iExpanded", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "iCollapsed", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "iLeaf", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "label", "");
                            ctrl.ensureDefault($scope.options.injectClasses, "labelSelected", "");
                            ctrl.ensureDefault($scope.options, "equality", ctrl.defaultEquality);
                            ctrl.ensureDefault($scope.options, "isLeaf", ctrl.defaultIsLeaf);
                            ctrl.ensureDefault($scope.options, "allowDeselect", true);
                            ctrl.ensureDefault($scope.options, "isSelectable", ctrl.defaultIsSelectable);

                            $scope.selectedNodes = $scope.selectedNodes || [];
                            $scope.expandedNodes = $scope.expandedNodes || [];
                            $scope.expandedNodesMap = {};
                            for (var i = 0; i < $scope.expandedNodes.length; i++) {
                                $scope.expandedNodesMap["" + i] = $scope.expandedNodes[i];
                            }
                            $scope.parentScopeOfTree = $scope.$parent;


                            ctrl.isSelectedNode = function (node) {
                                if (!$scope.options.multiSelection && ($scope.options.equality(node, $scope.selectedNode)))
                                    return true;
                                else if ($scope.options.multiSelection && $scope.selectedNodes) {
                                    for (var i = 0; (i < $scope.selectedNodes.length) ; i++) {
                                        if ($scope.options.equality(node, $scope.selectedNodes[i])) {
                                            return true;
                                        }
                                    }
                                    return false;
                                }
                                return false;
                            }

                            $scope.headClass = function (node) {
                                var liSelectionClass = ctrl.classIfDefined($scope.options.injectClasses.liSelected, false);
                                var injectSelectionClass = "";
                                if (liSelectionClass && ctrl.isSelectedNode(node))
                                    injectSelectionClass = " " + liSelectionClass;
                                if ($scope.options.isLeaf(node))
                                    return "tree-leaf" + injectSelectionClass;
                                if ($scope.expandedNodesMap[this.$id])
                                    return "tree-expanded" + injectSelectionClass;
                                else
                                    return "tree-collapsed" + injectSelectionClass;
                            };

                            $scope.iBranchClass = function () {
                                if ($scope.expandedNodesMap[this.$id])
                                    return ctrl.classIfDefined($scope.options.injectClasses.iExpanded);
                                else
                                    return ctrl.classIfDefined($scope.options.injectClasses.iCollapsed);
                            };

                            $scope.nodeExpanded = function () {
                                return !!$scope.expandedNodesMap[this.$id];
                            };

                            $scope.selectNodeHead = function () {
                                var transcludedScope = this;
                                var expanding = $scope.expandedNodesMap[transcludedScope.$id] === undefined;
                                $scope.expandedNodesMap[transcludedScope.$id] = (expanding ? transcludedScope.node : undefined);
                                if (expanding) {
                                    $scope.expandedNodes.push(transcludedScope.node);
                                } else {
                                    var index;
                                    for (var i = 0; (i < $scope.expandedNodes.length) && !index; i++) {
                                        if ($scope.options.equality($scope.expandedNodes[i], transcludedScope.node)) {
                                            index = i;
                                        }
                                    }
                                    if (index != undefined)
                                        $scope.expandedNodes.splice(index, 1);
                                }
                                if ($scope.onNodeToggle) {
                                    var parentNode = (transcludedScope.$parent.node === transcludedScope.synteticRoot) ? null : transcludedScope.$parent.node;
                                    $scope.onNodeToggle({
                                        node: transcludedScope.node,
                                        $parentNode: parentNode,
                                        $index: transcludedScope.$index,
                                        $first: transcludedScope.$first,
                                        $middle: transcludedScope.$middle,
                                        $last: transcludedScope.$last,
                                        $odd: transcludedScope.$odd,
                                        $even: transcludedScope.$even,
                                        expanded: expanding
                                    });

                                }
                            };

                            $scope.selectNodeLabel = function (selectedNode) {
                                var transcludedScope = this;
                                if (!$scope.options.isLeaf(selectedNode) && (!$scope.options.dirSelectable || !$scope.options.isSelectable(selectedNode))) {
                                    // Branch node is not selectable, expand
                                    this.selectNodeHead();
                                } else if ($scope.options.isLeaf(selectedNode) && (!$scope.options.isSelectable(selectedNode))) {
                                    // Leaf node is not selectable
                                    return;
                                } else {
                                    var selected = false;
                                    if ($scope.options.multiSelection) {
                                        var pos = -1;
                                        for (var i = 0; i < $scope.selectedNodes.length; i++) {
                                            if ($scope.options.equality(selectedNode, $scope.selectedNodes[i])) {
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
                                        } else {
                                            if ($scope.options.allowDeselect) {
                                                $scope.selectedNode = undefined;
                                            } else {
                                                $scope.selectedNode = selectedNode;
                                                selected = true;
                                            }
                                        }
                                    }
                                    if ($scope.onSelection) {
                                        var parentNode = (transcludedScope.$parent.node === transcludedScope.synteticRoot) ? null : transcludedScope.$parent.node;
                                        $scope.onSelection({
                                            node: selectedNode,
                                            selected: selected,
                                            $parentNode: parentNode,
                                            $index: transcludedScope.$index,
                                            $first: transcludedScope.$first,
                                            $middle: transcludedScope.$middle,
                                            $last: transcludedScope.$last,
                                            $odd: transcludedScope.$odd,
                                            $even: transcludedScope.$even
                                        });
                                    }
                                }
                            };

                            $scope.selectedClass = function () {
                                var isThisNodeSelected = ctrl.isSelectedNode(this.node);
                                var labelSelectionClass = ctrl.classIfDefined($scope.options.injectClasses.labelSelected, false);
                                var injectSelectionClass = "";
                                if (labelSelectionClass && isThisNodeSelected)
                                    injectSelectionClass = " " + labelSelectionClass;

                                return isThisNodeSelected ? "tree-selected" + injectSelectionClass : "";
                            };

                            $scope.unselectableClass = function () {
                                var isThisNodeUnselectable = !$scope.options.isSelectable(this.node);
                                var labelUnselectableClass = ctrl.classIfDefined($scope.options.injectClasses.labelUnselectable, false);
                                return isThisNodeUnselectable ? "tree-unselectable " + labelUnselectableClass : "";
                            };

                            //tree template
                            ctrl.orderBy = $scope.orderBy ? ' | orderBy:orderBy:reverseOrder' : '';
                            var template =
                                '<ul ' + ctrl.classIfDefined($scope.options.injectClasses.ul, true) + '>' +
                                    '<li ng-repeat="node in node.' + $scope.options.nodeChildren + ' | filter:filterExpression:filterComparator ' + ctrl.orderBy + '" ng-class="headClass(node)" ' + ctrl.classIfDefined($scope.options.injectClasses.li, true) + '>' +
                                    '<i class="tree-branch-head" ng-class="iBranchClass()" ng-click="selectNodeHead(node)"></i>' +
                                    '<i class="tree-leaf-head ' + ctrl.classIfDefined($scope.options.injectClasses.iLeaf, false) + '"></i>' +
                                    '<div class="tree-label ' + ctrl.classIfDefined($scope.options.injectClasses.label, false) + '" ng-class="[selectedClass(), unselectableClass()]" ng-click="selectNodeLabel(node)" tree-transclude></div>' +
                                    '<treeitem ng-if="nodeExpanded()"></treeitem>' +
                                    '</li>' +
                                    '</ul>';

                            ctrl.template = $compile(template);
                        }
                    ],
                    compile: function (element, attrs, childTranscludeFn) {
                        return function (scope, element, attrs, treemodelCntr) {

                            scope.$watch("treeModel", function updateNodeOnRootScope(newValue) {
                                if (angular.isArray(newValue)) {
                                    if (angular.isDefined(scope.node) && angular.equals(scope.node[scope.options.nodeChildren], newValue))
                                        return;
                                    scope.node = {};
                                    scope.synteticRoot = scope.node;
                                    scope.node[scope.options.nodeChildren] = newValue;
                                } else {
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
            }
        ])
        .directive("treeitem", function () {
            return {
                restrict: 'E',
                require: "^treecontrol",
                link: function (scope, element, attrs, treemodelCntr) {
                    // Rendering template for the current node
                    treemodelCntr.template(scope, function (clone) {
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
                    if (!scope.options.multiSelection && scope.options.equality(scope.node, scope.selectedNode)) {
                        scope.selectedNode = scope.node;
                    } else if (scope.options.multiSelection) {
                        var newSelectedNodes = [];
                        for (var i = 0; (i < scope.selectedNodes.length) ; i++) {
                            if (scope.options.equality(scope.node, scope.selectedNodes[i])) {
                                newSelectedNodes.push(scope.node);
                            }
                        }
                        scope.selectedNodes = newSelectedNodes;
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
