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

      element.find('li:eq(0) div').click();
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

      element.find('li:eq(0) div').click();
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

});
