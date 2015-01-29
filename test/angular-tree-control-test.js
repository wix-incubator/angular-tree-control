describe('treeControl', function() {
    var $compile, $rootScope, element, num;

    beforeEach(function () {
        module('treeControl');
        inject(function ($injector) {
            $compile = $injector.get('$compile');
            $rootScope = $injector.get('$rootScope');
        });
        num = 1;
    });

    function createSubTree(levels, children) {
        var currentLevel = [];
        for (var i = 0; i < children && levels > 0; i++) {
            currentLevel.push({label: 'node ' + (num++), children: createSubTree(levels-1, children)});
        }
        return currentLevel;
    }

    describe('rendering', function () {
        beforeEach(function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            element = $compile('<treecontrol tree-model="treedata" selected-node="selected">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should render only first level of the tree thanks to ng-if', function () {
            expect(element.find('ul').length).toBe(1);
        });

        it('should render all the children of the first level', function () {
            expect(element.find('li').length).toBe(3);
        });

        it('should display first level parents as collapsed', function () {
            expect(element.find('li.tree-collapsed').length).toBe(2);
        });

        it('should display elements with 0 children as leafs', function () {
            expect(element.find('li.tree-leaf').length).toBe(1);
        });

        it('should render sub tree once an item is expanded thanks to ng-if', function () {
            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0) li').length).toBe(2);
        });

        it('should display expanded items as expanded', function () {
            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();
        });

        it('should not have any nodes selected initially', function () {
            expect(element.find('.tree-selected').length).toBe(0);
            expect($rootScope.selected).toBeUndefined();
        });

        it('should select node when clicked', function () {
            element.find('li:eq(0) div').click();
            expect(element.find('li:eq(0) div').hasClass('tree-selected')).toBeTruthy();
            expect($rootScope.selected).toBeDefined();
        });

        it('should transclude tree labels', function () {
            expect(element.find('li:eq(0) span').text()).toBe('node 1');
            expect(element.find('li:eq(1) span').text()).toBe('node 4');
        });

        it('should update tree rendering once model changes', function () {
            $rootScope.treedata[2].children = [{}];
            $rootScope.$digest();
            expect(element.find('li.tree-leaf').length).toBe(0);
        });
    });

    describe('customising using options.isLeaf', function () {
        it('should display first level parents as collapsed nodes, including the leaf', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            $rootScope.treeOptions = {isLeaf: function(node) {return false;}};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li.tree-collapsed').length).toBe(3);
            expect(element.find('li.tree-leaf').length).toBe(0);
        });

        it('should display first level parents as leafs, including the actual branches', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            $rootScope.treeOptions = {isLeaf: function(node) {return true;}};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li.tree-collapsed').length).toBe(0);
            expect(element.find('li.tree-leaf').length).toBe(3);
        });

    });

    describe('rendering using external scope data', function () {
        beforeEach(function () {
            $rootScope.label = "exLabel";
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata">{{label}} - {{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should transclude tree labels', function () {
            expect(element.find('li:eq(0) span').text()).toBe('exLabel - node 1');
            expect(element.find('li:eq(1) span').text()).toBe('exLabel - node 4');
        });
    });

    describe('support special members in label scope', function () {
        beforeEach(function () {
            $rootScope.label = "exLabel";
            $rootScope.treedata = createSubTree(2, 4);
        });

        it('should render $parentNode for a tree with multiple roots', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} parent:{{$parentNode?$parentNode.label:"N/A"}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 parent:N/A');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 parent:N/A');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 parent:N/A');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 parent:N/A');
            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0) li:eq(0) span').text()).toBe('node 2 parent:node 1');
        });

        it('should render $parentNode for a tree with a single root', function () {
            num = 1;
            $rootScope.treedata = createSubTree(2, 1);
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} parent:{{$parentNode?$parentNode.label:"N/A"}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 parent:N/A');
            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0) li:eq(0) span').text()).toBe('node 2 parent:node 1');
        });

        it('should render $index', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} index:{{$index}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 index:0');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 index:1');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 index:2');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 index:3');
        });

        it('should render $first', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} first:{{$first}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 first:true');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 first:false');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 first:false');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 first:false');
        });

        it('should render $middle', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} middle:{{$middle}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 middle:false');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 middle:true');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 middle:true');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 middle:false');
        });

        it('should render $last', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} last:{{$last}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 last:false');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 last:false');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 last:false');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 last:true');
        });

        it('should render $even', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} even:{{$even}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 even:true');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 even:false');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 even:true');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 even:false');
        });

        it('should render $odd', function () {
            element = $compile('<treecontrol tree-model="treedata">{{node.label}} odd:{{$odd}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0) span').text()).toBe('node 1 odd:false');
            expect(element.find('li:eq(1) span').text()).toBe('node 6 odd:true');
            expect(element.find('li:eq(2) span').text()).toBe('node 11 odd:false');
            expect(element.find('li:eq(3) span').text()).toBe('node 16 odd:true');
        });
    });

    describe('selection', function() {
        it('should publish the currently selected node on scope', function () {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" selected-node="selectedItem">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect($rootScope.selectedItem.label).toBe('node 1');
        });

        it('should update the tree selection if the external scope selected-node changes', function() {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" selected-node="selectedItem">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.selectedItem = $rootScope.treedata[1];
            $rootScope.$digest();

            expect(element.find('li:eq(1) div.tree-selected').length).toBe(1);
        });

        it('should invoke on-selection callback when item is selected and selected==true', function () {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" on-selection="itemSelected(node.label, selected)">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            $rootScope.itemSelected = jasmine.createSpy('itemSelected');
            element.find('li:eq(0) div').click();
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, true);
        });

        it('should call on-selection callback on item unselection with the node and selected==false', function () {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" on-selection="itemSelected(node.label, selected)">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            $rootScope.itemSelected = jasmine.createSpy('itemSelected');
            element.find('li:eq(0) div').click();
            element.find('li:eq(0) div').click();
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, true);
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, false);
            expect($rootScope.itemSelected.calls.length).toBe(2);
        });

        it('should un-select a node after second click', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.selectedItem = $rootScope.treedata[0];
            element = $compile('<treecontrol tree-model="treedata" selected-node="selectedItem">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect($rootScope.selectedItem).toBeUndefined()
        });

        it('should retain selection after full model refresh', function () {
            var testTree = createSubTree(2, 2);
            $rootScope.treedata = angular.copy(testTree);
            element = $compile('<treecontrol tree-model="treedata">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect(element.find('.tree-selected').length).toBe(1);

            $rootScope.treedata = angular.copy(testTree);
            $rootScope.$digest();
            expect(element.find('.tree-selected').length).toBe(1);
        });
    });

    describe('multi-selection', function() {
        it('should publish the currently selected nodes on scope', function () {
            $rootScope.treeOptions = {multiSelection: true};
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" selected-nodes="selectedItems" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect($rootScope.selectedItems.length).toBe(1);
            expect($rootScope.selectedItems[0].label).toBe('node 1');
            element.find('li:eq(1) div').click();
            expect($rootScope.selectedItems.length).toBe(2);
        });

        it('should update the tree selection if the external scope selected-node changes', function() {
            $rootScope.treeOptions = {multiSelection: true};
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" selected-nodes="selectedItems" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.selectedItems = [$rootScope.treedata[0], $rootScope.treedata[1].children[0]];
            $rootScope.$digest();

            expect(element.find('li:eq(0) div.tree-selected').length).toBe(1);
            element.find('li:eq(1) .tree-branch-head').click();
            expect(element.find('li:eq(1) li:eq(0) div.tree-selected').length).toBe(1);
        });

        it('should invoke on-selection callback when item is selected and selected==true', function () {
            $rootScope.treeOptions = {multiSelection: true};
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" on-selection="itemSelected(node.label, selected)" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            $rootScope.itemSelected = jasmine.createSpy('itemSelected');
            element.find('li:eq(0) div').click();
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, true);
        });

        it('should call on-selection callback on item unselection with the node and selected==false', function () {
            $rootScope.treeOptions = {multiSelection: true};
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" on-selection="itemSelected(node.label, selected)" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            $rootScope.itemSelected = jasmine.createSpy('itemSelected');
            element.find('li:eq(0) div').click();
            element.find('li:eq(0) div').click();
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, true);
            expect($rootScope.itemSelected).toHaveBeenCalledWith($rootScope.treedata[0].label, false);
            expect($rootScope.itemSelected.calls.length).toBe(2);
        });

        it('should un-select a node after second click', function () {
            $rootScope.treeOptions = {multiSelection: true};
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.selectedItems = [$rootScope.treedata[0]];
            element = $compile('<treecontrol tree-model="treedata" selected-nodes="selectedItems" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect($rootScope.selectedItems.length).toBe(0);
        });

        it('should retain selection after full model refresh', function () {
            $rootScope.treeOptions = {multiSelection: true};
            var testTree = createSubTree(2, 2);
            $rootScope.treedata = angular.copy(testTree);
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            element.find('li:eq(1) .tree-branch-head').click();
            element.find('li:eq(1) li:eq(0) div').click();
            expect(element.find('.tree-selected').length).toBe(2);

            $rootScope.treedata = angular.copy(testTree);
            $rootScope.$digest();
            expect(element.find('.tree-selected').length).toBe(2);
        });
    });

    describe('options usage', function () {

        it('should not reorder nodes if no order-by is provided', function() {
            $rootScope.treedata = [
                { label: "a", children: [] },
                { label: "c", children: [] },
                { label: "b", children: [] }
            ];

            element = $compile('<treecontrol tree-model="treedata" reverse-order="{{reverse}}">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('a');
            expect(element.find('li:eq(1)').text()).toBe('c');
            expect(element.find('li:eq(2)').text()).toBe('b');
        });

        it('should order sibling nodes in normal order', function() {
            $rootScope.treedata = [
                { label: "a", children: [] },
                { label: "c", children: [] },
                { label: "b", children: [] }
            ];
            $rootScope.predicate = 'label';
            $rootScope.reverse = false;
            element = $compile('<treecontrol tree-model="treedata" order-by="{{predicate}}" reverse-order="{{reverse}}">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('a');
            expect(element.find('li:eq(1)').text()).toBe('b');
            expect(element.find('li:eq(2)').text()).toBe('c');
        });

        it('should order sibling nodes in reverse order', function() {
            $rootScope.treedata = [
                { label: "a", children: [] },
                { label: "c", children: [] },
                { label: "b", children: [] }
            ];
            $rootScope.predicate = 'label';
            $rootScope.reverse = true;
            element = $compile('<treecontrol tree-model="treedata" order-by="{{predicate}}" reverse-order="{{reverse}}">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('c');
            expect(element.find('li:eq(1)').text()).toBe('b');
            expect(element.find('li:eq(2)').text()).toBe('a');
        });

        it('should be able to accept alternative children variable name', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({kinder: [{}]});
            $rootScope.treeOptions = {nodeChildren: 'kinder'};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            expect(element.find('li.tree-collapsed').length).toBe(1);
        });

        it('should be able to make directories not selectable', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treeOptions = {dirSelectable: false};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();
            expect(element.find('.tree-selected').length).toBe(0);

            element.find('li:eq(0) li:eq(0) div').click();
            expect(element.find('.tree-selected').length).toBe(1);
        });

        it('should be able to accept alternative equality function', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata[0].id = 'id0';
            $rootScope.treeOptions = {equality: function(a, b) {
                if (a === undefined || b === undefined || a.id === undefined || b.id === undefined)
                    return false;
                else
                    return angular.equals(a.id, b.id);
            }};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();

            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata[0].id = 'id0';
            $rootScope.$digest();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();
        });

        it('should be able to accept additional class names', function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treeOptions = {injectClasses: {ul: 'ulcls', li: 'licls', iExpanded: 'expandcls',
                iCollapsed: 'collapsecls', iLeaf: 'leafcls', label: 'labelcls'}};
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            expect(element.find('ul.ulcls').length).toBe(1);
            expect(element.find('li.licls').length).toBe(2);
            expect(element.find('li .tree-leaf-head.leafcls').length).toBe(2);
            expect(element.find('div.tree-label.labelcls').length).toBe(2);

            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0) .tree-branch-head').hasClass('expandcls')).toBeTruthy();
            expect(element.find('li:eq(1) .tree-branch-head').hasClass('collapsecls')).toBeTruthy();
        });

        it('should filter sibling nodes based on filter expression which is a string', function() {
            $rootScope.treedata = [
                { label: "a", children: [] },
                { label: "c", children: [] },
                { label: "b", children: [] }
            ];
            $rootScope.predicate = 'b';
            element = $compile('<treecontrol tree-model="treedata" filter-expression="predicate">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('b');
            expect(element.find('li').length).toBe(1);
        });

        it('should filter sibling nodes based on filter expression which is an object', function() {
            $rootScope.treedata = [
                { label: "a", age: 12, children: [] },
                { label: "c", age: 12, children: [] },
                { label: "b", age: 14, children: [] }
            ];
            $rootScope.predicate = {age:12};
            element = $compile('<treecontrol tree-model="treedata" filter-expression="predicate">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('a');
            expect(element.find('li:eq(1)').text()).toBe('c');
            expect(element.find('li').length).toBe(2);
        });

        it('should filter sibling nodes based on filter expression which is a function', function() {
            $rootScope.treedata = [
                { label: "a", age: 12, children: [] },
                { label: "c", age: 12, children: [] },
                { label: "b", age: 14, children: [] }
            ];
            $rootScope.predicate = function(node) {
                return node.age == 12;
            };
            element = $compile('<treecontrol tree-model="treedata" filter-expression="predicate">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('a');
            expect(element.find('li:eq(1)').text()).toBe('c');
            expect(element.find('li').length).toBe(2);
        });

        it('should filter sibling nodes based on filter expression in non prefix match', function() {
            $rootScope.treedata = [
                { label: "abcd", age: 12, children: [] },
                { label: "abef", age: 12, children: [] },
                { label: "bcde", age: 14, children: [] }
            ];
            $rootScope.predicate = "ab";
            $rootScope.comparator = false;
            element = $compile('<treecontrol tree-model="treedata" filter-expression="predicate" filter-comparator="comparator">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('abcd');
            expect(element.find('li:eq(1)').text()).toBe('abef');
            expect(element.find('li').length).toBe(2);
        });

        it('should filter sibling nodes based on filter expression in non prefix match', function() {
            $rootScope.treedata = [
                { label: "abcd", age: 12, children: [] },
                { label: "abef", age: 12, children: [] },
                { label: "bcde", age: 14, children: [] }
            ];
            $rootScope.predicate = "ab";
            $rootScope.comparator = true;
            element = $compile('<treecontrol tree-model="treedata" filter-expression="predicate" filter-comparator="comparator">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
            expect(element.find('li').length).toBe(0);

            $rootScope.predicate = "abcd";
            $rootScope.$digest();
            expect(element.find('li:eq(0)').text()).toBe('abcd');
            expect(element.find('li').length).toBe(1);
        });
    });

    describe('customizations', function () {
        beforeEach(function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            $rootScope.treeOptions = {
                injectClasses: {
                    ul: "ulClass",
                    li: "liClass",
                    liSelected: "liSelectedClass",
                    iExpanded: "iExpandClass",
                    iCollapsed: "iCollapsedClass",
                    iLeaf: "iLeafClass",
                    label: "labelClass",
                    labelSelected: "labelSelectedClass"
                }
            };

            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should render the ulClass on the ul Element', function () {
            expect(element.find("ul").hasClass("ulClass")).toBeTruthy();
        });

        it('should render the liClass on the li Element', function () {
            expect(element.find("li").hasClass("liClass")).toBeTruthy();
        });

        it('should not render the liSelectedClass initially on the li Element', function () {
            expect(element.find('li:eq(0)').hasClass('liSelectedClass')).toBeFalsy();
        });

        it('should render the liSelectedClass on the a selected li Element', function () {
            element.find('li:eq(0) div').click();
            expect(element.find('li:eq(0)').hasClass('liSelectedClass')).toBeTruthy();
        });

        it('should render the iCollapsedClass on the i head element when collapsed', function () {
            expect(element.find('li:eq(0) i:eq(0)').hasClass('iCollapsedClass')).toBeTruthy();
        });

        it('should render the iLeafClass on leafs', function () {
            expect(element.find('li:eq(2) i:eq(1)').hasClass('iLeafClass')).toBeTruthy();
        });

        it('should render the iExpandClass on expanded nodes', function () {
            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0) i:eq(0)').hasClass('iExpandClass')).toBeTruthy();
        });

        it('should render the labelClass on the label div element', function () {
            expect(element.find('li:eq(0) div').hasClass('labelClass')).toBeTruthy();
        });

        it('should not render the labelSelectedClass on the label div element when it is not selected', function () {
            expect(element.find('li:eq(0) div').hasClass('labelSelectedClass')).toBeFalsy();
        });

        it('should render the labelSelectedClass on the label div element when it is selected', function () {
            element.find('li:eq(0) div').click();
            expect(element.find('li:eq(0) div').hasClass('labelSelectedClass')).toBeTruthy();
        });
    });

    describe('expanded-nodes binding', function () {
        beforeEach(function () {
            $rootScope.treedata = createSubTree(3, 2);
            $rootScope.expandedNodes = [$rootScope.treedata[1], $rootScope.treedata[1].children[1]];
            element = $compile('<treecontrol tree-model="treedata" expanded-nodes="expandedNodes" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should be used for default expansion of nodes', function () {
            expect(element.find('li:eq(0)').hasClass('tree-collapsed')).toBeTruthy();
            expect(element.find('li:eq(1)').hasClass('tree-expanded')).toBeTruthy();
            expect(element.find('li:eq(1) li:eq(0)').hasClass('tree-collapsed')).toBeTruthy();
            expect(element.find('li:eq(1) li:eq(1)').hasClass('tree-expanded')).toBeTruthy();
        });

        it('should update the tree as expandedNodes changes', function () {
            $rootScope.expandedNodes = [$rootScope.treedata[0]];
            $rootScope.$digest();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();
            expect(element.find('li:eq(1)').hasClass('tree-collapsed')).toBeTruthy();
        });

        it('should add to expandedNodes expanding node', function () {
            element.find('li:eq(0) .tree-branch-head').click();
            expect($rootScope.expandedNodes).toContain($rootScope.treedata[0]);
        });

        it('should remove from expandedNodes collapsing node', function () {
            element.find('li:eq(1) .tree-branch-head').click();
            expect($rootScope.expandedNodes).not.toContain($rootScope.treedata[1]);
        });

        it('should retain expansions after full model refresh', function () {
            var testTree = createSubTree(2, 2);
            $rootScope.treedata = angular.copy(testTree);
            element = $compile('<treecontrol tree-model="treedata">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) .tree-branch-head').click();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();

            $rootScope.treedata = angular.copy(testTree);
            $rootScope.$digest();
            expect(element.find('li:eq(0)').hasClass('tree-expanded')).toBeTruthy();
        });

    });

});
