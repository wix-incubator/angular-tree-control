describe('unit testing angular tree control directive', function() {
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

    describe('testing that tree is rendered correctly', function () {
        beforeEach(function () {
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            element = $compile('<treecontrol tree-model="treedata">{{node.label}}</treecontrol>')($rootScope);
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
        });

        it('should select node when clicked', function () {
            element.find('li:eq(0) div').click();
            expect(element.find('li:eq(0) div').hasClass('tree-selected')).toBeTruthy();
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

    describe('testing customising tree leaf / branches using options.isLeaf', function () {
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

    describe('testing that tree label rendering uses external scope data', function () {
        beforeEach(function () {
            $rootScope.label = "exLabel";
            $rootScope.treedata = createSubTree(2, 2);
            $rootScope.treedata.push({});
            element = $compile('<treecontrol tree-model="treedata">{{label}} - {{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should transclude tree labels', function () {
            expect(element.find('li:eq(0) span').text()).toBe('exLabel - node 1');
            expect(element.find('li:eq(1) span').text()).toBe('exLabel - node 4');
        });
    });

    describe('testing that all options are handled correctly', function () {
        it('should publish the currently selected node on scope', function () {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" selected-node="selectedItem">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            element.find('li:eq(0) div').click();
            expect($rootScope.selectedItem.label).toBe('node 1');
        });

        it('should invoke callback when item is selected', function () {
            $rootScope.treedata = createSubTree(2, 2);
            element = $compile('<treecontrol tree-model="treedata" on-selection="itemSelected(node.label)">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();

            $rootScope.itemSelected = jasmine.createSpy('itemSelected');
            element.find('li:eq(0) div').click();
            expect($rootScope.itemSelected).toHaveBeenCalledWith('node 1');
        });

        it('should order sibling nodes in normal order', function() {
            $rootScope.treedata = [
                { label: "a", children: [] },
                { label: "c", children: [] },
                { label: "b", children: [] },
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
                { label: "b", children: [] },
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
    });

    describe('testing that tree customizations work properly', function () {
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

    describe('testing that tree nodes can be rendered expanded on tree creation', function () {
        beforeEach(function () {
            $rootScope.treedata = createSubTree(3, 2);
            $rootScope.treedata.push({});
            $rootScope.treeOptions = {
                defaultExpanded: [$rootScope.treedata[1], $rootScope.treedata[1].children[1]]
            };
            element = $compile('<treecontrol tree-model="treedata" options="treeOptions">{{node.label}}</treecontrol>')($rootScope);
            $rootScope.$digest();
        });

        it('should display first level parents - one expanded and one collapsed', function () {
            expect(element.find('li:eq(0)').hasClass('tree-collapsed')).toBeTruthy();
            expect(element.find('li:eq(1)').hasClass('tree-expanded')).toBeTruthy();
            expect(element.find('li:eq(1) li:eq(0)').hasClass('tree-collapsed')).toBeTruthy();
            expect(element.find('li:eq(1) li:eq(1)').hasClass('tree-expanded')).toBeTruthy();
        });

    });

});
