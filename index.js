var $ = go.GraphObject.make;
var diagram = $(go.Diagram, "master", { hoverDelay: 0 });

var getBridgeLinkHeights = function (count) {
  if (count == 1) return [0];
  else if (count == 2) return [21, 20];
  else if (count == 3) return [42, 0, 39];
  else if (count == 4) return [61, 21, 19, 59];
  else if (count == 5) return [82, 41, 0, 40, 80];
  else throw "Please update getBridgeLinkHeights()";
};

function evaluateExpression(links, nodes, root) {
  var exp = []
  var currentNode = root
  while(!(currentNode.operator && currentNode.operator === "=")) {
    if (currentNode.number != undefined) {
      exp.push(currentNode.number)
    } else if (currentNode.operator != undefined) {
      exp.push(currentNode.operator)
    }
    var nextN = links.find(_l => _l.from === currentNode.key) || {}
    var nextNKey = nextN.to
    
    if (nextNKey) {
      var nextNode = nodes.find(_n => _n.key === nextNKey)
      currentNode = nextNode
    } else {
      currentNode = {operator: '='}
    }
  }
  
  var expression = exp.join('')
  var res
  try {
    res = eval(expression)
  } catch (err) {
    res = "Invalid expression"
  }
  return res
}

var printResForRoot = function (root) {
  var links = diagram.model.linkDataArray
  var nodes = diagram.model.nodeDataArray
  var result = evaluateExpression(links, nodes, root)
  
  document.querySelector('#calc_result').innerHTML = result
}

var createResultNode = function (root, selnode) {
  var links = diagram.model.linkDataArray
  var nodes = diagram.model.nodeDataArray
  var result = evaluateExpression(links, nodes, root)
  var linksOutOf = selnode.findLinksOutOf().count

  if (Number.isInteger(result) && linksOutOf === 0) {
    diagram.commit(function(d) {
      var newnode = { key: result + '', number: parseInt(result), text: result };
      d.model.addNodeData(newnode);
      // var newlink = { from: selnode.data.key, to: newnode.key };
      // d.model.addLinkData(newlink);
    }, "adding result node");
  }
}

var nodeHoverAdornment =
  $(go.Adornment, "Spot",
    { background: "transparent",
      mouseLeave: function(e, obj) {
        var ad = obj.part;
        ad.adornedPart.removeAdornment("mouseHover");
      }
    },
    $(go.Placeholder,{
      background: "transparent"
    }),
    $(go.Panel, "Spot",
      {
        name: "button_panel",
        background: 'transparent',
        width: 156,
        alignment: new go.Spot(1, 0, 0, 36),
        alignmentFocus: go.Spot.LeftCenter,
        shadowVisible: false
      }
    ),
    $("Button",
      { alignment: new go.Spot(1, 0, 35), alignmentFocus: go.Spot.Left },
      {
        click: function(e, obj) { 
          var clickedKey = obj.part.data.key
          var currEqualsNode = diagram.findNodeForKey(clickedKey)
          var currRoot = currEqualsNode.findTreeRoot().data
          printResForRoot(currRoot)
        }
      },
      $(go.TextBlock, "Emit")
    ),
    $("Button",
      { alignment: new go.Spot(1, 1, 35), alignmentFocus: go.Spot.Left },
      { click: function(e, obj) { 
          var clickedKey = obj.part.data.key
          var currEqualsNode = diagram.findNodeForKey(clickedKey)
          var currRoot = currEqualsNode.findTreeRoot().data
          createResultNode(currRoot, currEqualsNode)
      } },
      $(go.TextBlock, "Create Node")
    )
  );

diagram.nodeTemplate = $(go.Node, "Auto",
  $(go.Shape, "Circle", 
    {
      width: 50, height: 50,
      fill: "lightblue", portId: '', cursor: 'pointer',
      fromMaxLinks: 1, toMaxLinks: 1,
      fromLinkable: true, toLinkable: true,
      fromLinkableSelfNode: false, toLinkableSelfNode: false
    },
    new go.Binding("width", "width"),
    new go.Binding("height", "height"),
    new go.Binding("fill", "color")
  ),
  $(go.TextBlock, { margin: 5 }, new go.Binding("text", "text")),
  {
    mouseHover: function (e, obj) {
      var node = obj.part
      if (node.data.operator && node.data.operator === '=') {
        // obj.findTreeRoot().data
        nodeHoverAdornment.adornedObject = node;
        node.addAdornment("mouseHover", nodeHoverAdornment);
      }
    }
  }
);

function validateLinks (fromnode, fromport, tonode, toport) {
  return !(fromnode.data.operator && tonode.data.operator)
}
diagram.toolManager.linkingTool.linkValidation = validateLinks;
diagram.toolManager.dragSelectingTool.isEnabled = false
diagram.validCycle = go.Diagram.CycleDestinationTree;

// diagram.toolManager.dragSelectingTool.box = $(
//   go.Part, 
//   {layerName: "Tool"}, 
//   $(go.Shape, "Rectangle", { fill: null, strokeWidth: 5, stroke: "lime" })
// )

// diagram.toolManager.linkingTool.temporaryLink = $(
//   go.Link,
//   {layerName: "Tool"},
//   $(go.Shape, { strokeWidth: 2, stroke: "red" })
// )

var nodeDataArray = [];
var linkDataArray = [];
diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);


var palette = $(go.Palette, "operators-palette");
palette.nodeTemplate = $(go.Node, "Vertical",
  $(go.Panel, "Spot",
    $(go.Shape, 'Circle', { width: 60, height: 60, fill: "white" }),
    $(go.TextBlock, new go.Binding("text", "operator"), {margin: 20})
  ),
  $(go.TextBlock, new go.Binding("text", "text"))
);


palette.model.nodeDataArray = [
  { key: 'add', operator: '+', text: 'Add', width: 80, height: 80 },
  { key: 'subtract', operator: '-', text: 'Subtract', width: 80, height: 80 },
  { key: 'division', operator: '/', text: 'Division', width: 80, height: 80 },
  { key: 'multiply', operator: '*', text: 'Multiply', width: 80, height: 80 },
  { key: 'equals', operator: '=', text: 'Equals', color: "green", width: 80, height: 80 }
]


var numbersPalette = $(go.Palette, "numbers-palette");
numbersPalette.nodeTemplate = $(go.Node, "Horizontal",  
  $(go.Panel, "Spot",
    $(go.Shape, 'RoundedRectangle', { width: 50, height: 50, fill: "white" }),
    $(go.TextBlock, new go.Binding("text", "number"), {margin: 20})
  )
);


numbersPalette.model.nodeDataArray = [
  { key: '0', number: 0, text: 0 },
  { key: '1', number: 1, text: 1 },
  { key: '2', number: 2, text: 2 },
  { key: '3', number: 3, text: 3 },
  { key: '4', number: 4, text: 4 },
  { key: '5', number: 5, text: 5 },
  { key: '6', number: 6, text: 6 },
  { key: '7', number: 7, text: 7 },
  { key: '8', number: 8, text: 8 },
  { key: '9', number: 9, text: 9 }
]