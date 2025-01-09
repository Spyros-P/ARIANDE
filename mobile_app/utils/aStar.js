class Node {
  constructor(val, priority) {
    this.val = val;
    this.priority = priority;
  }
}

class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(val, priority) {
    let newNode = new Node(val, priority);
    this.values.push(newNode);
    this.bubbleUp();
  }

  bubbleUp() {
    let idx = this.values.length - 1;
    const element = this.values[idx];
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2);
      let parent = this.values[parentIdx];
      if (element.priority >= parent.priority) break;
      this.values[parentIdx] = element;
      this.values[idx] = parent;
      idx = parentIdx;
    }
  }

  dequeue() {
    const min = this.values[0];
    const end = this.values.pop();
    if (this.values.length > 0) {
      this.values[0] = end;
      this.sinkDown();
    }
    return min;
  }

  sinkDown() {
    let idx = 0;
    const length = this.values.length;
    const element = this.values[0];
    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      this.values[idx] = this.values[swap];
      this.values[swap] = element;
      idx = swap;
    }
  }
}

export class WeightedGraph {
  constructor() {
    this.adjacencyList = {};
    this.nodeCoordinates = {}; // Store node coordinates
  }

  addVertex(vertex, x = null, y = null) {
    if (!this.adjacencyList[vertex]) this.adjacencyList[vertex] = [];
    if (x !== null && y !== null) this.nodeCoordinates[vertex] = [x, y];
  }

  addEdge(vertex1, vertex2, weight) {
    this.adjacencyList[vertex1].push({ node: vertex2, weight });
    this.adjacencyList[vertex2].push({ node: vertex1, weight });
  }

  constructGraph(floorPlanGraph, distancePerPixel) {
    // Create a map for fast lookup of node coordinates
    const nodeMap = {};
    floorPlanGraph.forEach((node) => {
      nodeMap[node.id] = node;
      this.addVertex(node.id.toString(), node.imageX, node.imageY); // Add vertex with coordinates
    });

    // Add edges with weights in a single pass
    floorPlanGraph.forEach((node) => {
      const currentNodeId = node.id.toString();

      node.edges.forEach((edgeId) => {
        // Directly lookup the edge node in the nodeMap
        const edgeNode = nodeMap[edgeId];

        if (edgeNode) {
          // Calculate the Euclidean distance between nodes and create the edge
          const weight =
            distancePerPixel *
            Math.sqrt(
              (node.imageX - edgeNode.imageX) ** 2 +
                (node.imageY - edgeNode.imageY) ** 2
            );
          this.addEdge(currentNodeId, edgeNode.id.toString(), weight);
        }
      });
    });
  }

  // Euclidean heuristic function
  heuristic(node1, node2) {
    const [x1, y1] = this.nodeCoordinates[node1];
    const [x2, y2] = this.nodeCoordinates[node2];
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  // A* algorithm
  AStar(start, finish) {
    const nodes = new PriorityQueue();
    const distances = {};
    const previous = {};
    const fScore = {};
    let path = [];
    let smallest;

    // Build up initial state
    for (let vertex in this.adjacencyList) {
      if (vertex === start) {
        distances[vertex] = 0;
        fScore[vertex] = this.heuristic(vertex, finish);
        nodes.enqueue(vertex, fScore[vertex]);
      } else {
        distances[vertex] = Infinity;
        fScore[vertex] = Infinity;
        nodes.enqueue(vertex, Infinity);
      }
      previous[vertex] = null;
    }

    // As long as there is something to visit
    while (nodes.values.length) {
      smallest = nodes.dequeue().val;

      if (smallest === finish) {
        // We are done, build the path
        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        break;
      }

      if (smallest || distances[smallest] !== Infinity) {
        for (let neighbor in this.adjacencyList[smallest]) {
          let nextNode = this.adjacencyList[smallest][neighbor];
          let nextNeighbor = nextNode.node;

          // Calculate tentative gScore
          let gScore = distances[smallest] + nextNode.weight;

          if (gScore < distances[nextNeighbor]) {
            distances[nextNeighbor] = gScore;
            previous[nextNeighbor] = smallest;

            // Calculate fScore
            fScore[nextNeighbor] =
              gScore + this.heuristic(nextNeighbor, finish);

            // Enqueue in priority queue with updated fScore
            nodes.enqueue(nextNeighbor, fScore[nextNeighbor]);
          }
        }
      }
    }

    return { path: path.concat(smallest).reverse(), length: distances[finish] };
  }
}
