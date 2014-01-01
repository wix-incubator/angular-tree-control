Angular Tree Controll
================

Pure [AngularJS](http://www.angularjs.org) based tree control component.

[![ScreenShot](https://raw.github.com/wix/angular-tree-control/master/images/sample.png)](http://jsfiddle.net/8ApLX/5/)

Running sample on [jsFiddle](http://jsfiddle.net/8ApLX/5/)

## Why yet another tree control

We have tried a number of tree controls built for angular and experience a of issues with each. As a result we decided
to build a new tree control with the following design guidelines

- Isolated scope - the tree control should not pollute the scope it is rendered at
- Does not change the tree data - some tree implementations mark on the tree data the selection and expansion of nodes
- Allows customization of the tree node label using the angular way - as an angular template
- Supports large trees with minimal overhead
- Reacts to changes in the tree data, updating the tree as required
- Supports css styling, with three built in styles

## Installation

Copy the script and css into your project and add a script and link tag to your page.

```html
<script type="text/javascript" src="/tree-control.js"></script>
<link rel="stylesheet" type="text/css" href="css/tree-control.css">
```

Add a dependency to your application module.

```javascript
angular.module('myApp', ['treeControl']);
```

Add tree elements to your Angular template

```html
<treecontrol class="tree-classic"
   tree-model="dataForTheTree"
   options="treeOptions"
   on-selection="showSelected(node)"
   selected-node="node1">
   employee: {{node.name}} age {{node.age}}
</treecontrol>
```

and add the data for the tree

```javascript
$scope.treeOptions = {
    nodeChildren: "children",
    dirSelectable: true
}
$scope.dataForTheTree =
[
	{ "name" : "Joe", "age" : "21", "children" : [
		{ "name" : "Smith", "age" : "42", "children" : [] },
		{ "name" : "Gary", "age" : "21", "children" : [
			{ "name" : "Jenifer", "age" : "23", "children" : [
				{ "name" : "Dani", "age" : "32", "children" : [] },
				{ "name" : "Max", "age" : "34", "children" : [] }
			]}
		]}
	]},
	{ "name" : "Albert", "age" : "33", "children" : [] },
	{ "name" : "Ron", "age" : "29", "children" : [] }
];
```


## Usage

Attributes of angular treecontrol

- treecontrol: the treeview element.
- element content: the template to evaluate against each node for the node label.
- tree-model : the tree data on the $scope. This can be an array of nodes or a single node.
- options : different options to customize the tree control.
  - nodeChildren : the name of the property of each node that holds the node children. Defaults to 'children'.
  - dirSelection : are directories (nodes with children) selectable? If not, clicking on the dir label will expand and contact the dir. Defaults to true.
- on-selection : function to call on the current $scope on node selection.
- selected-node : parameter on the $scope to update with the current selection.


## Reference

This tree control is based in part on the angular.treeview component
* angular.treeview: http://ngmodules.org/modules/angular.treeview

## License

The MIT License.

See [LICENSE](https://github.com/wix/angular-tree-control/blob/master/LICENSE)
