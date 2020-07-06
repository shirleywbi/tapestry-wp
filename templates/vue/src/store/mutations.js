import Helpers from "../utils/Helpers"

export function init(state, dataset) {
  setDataset(state, dataset)
  state.selectedNodeId = dataset.rootId
  state.tapestryIsLoaded = true
  state.nodes
    .filter(n => n.mediaType === "accordion" || n.isSubAccordion)
    .forEach(n => initializeOrdering(state, n.id))
  state.visibleNodes = state.nodes.map(node => node.id)
}

export function setDataset(state, dataset) {
  Object.entries(dataset).forEach(([key, value]) => {
    state[key] = value
  })
}

export function updateSettings(state, newSettings) {
  state.settings = newSettings
}

export function updateH5pSettings(state, newSettings) {
  state.h5pSettings = newSettings
}

export function updateSelectedNode(state, newNodeId) {
  state.selectedNodeId = newNodeId
}

export function updateRootNode(state, newNodeId) {
  state.rootId = newNodeId
}

// nodes
export function addNode(state, node) {
  state.nodes.push(node)
}

export function deleteNode(state, id) {
  state.nodes = state.nodes.filter(node => node.id != id)
}

export function updateNode(state, payload) {
  const nodeIndex = Helpers.findNodeIndex(payload.id, state)
  const thisNode = state.nodes[nodeIndex]
  const copy = { ...thisNode }
  Object.entries(payload.newNode).forEach(([key, value]) => {
    copy[key] = value
  })
  state.nodes[nodeIndex] = copy
  state.nodes = [...state.nodes]
}

export function updateNodeProgress(state, payload) {
  const nodeIndex = Helpers.findNodeIndex(payload.id, state)
  state.nodes[nodeIndex].typeData.progress[0].value = payload.progress
  state.nodes[nodeIndex].typeData.progress[1].value = 1.0 - payload.progress
}

export function updateNodeCoordinates(state, payload) {
  const node = state.nodes[Helpers.findNodeIndex(payload.id, state)]
  Object.entries(payload.coordinates).forEach(([key, value]) => {
    node[key] = value
  })
}

export function fulfillNodeCondition(state, { id, condition }) {
  const node = state.nodes[Helpers.findNodeIndex(id, state)]
  const toFulfill = node.conditions.find(
    cond => cond.type === condition.type && cond.value === condition.value
  )
  if (toFulfill) {
    toFulfill.fulfilled = true
    if (node.conditions.every(cond => cond.fulfilled)) {
      node.unlocked = true
      node.accessible = true
    }
  }
}

export function select(state, id) {
  if (!state.selection.includes(id)) {
    state.selection = [...state.selection, parseInt(id)]
  }
}

export function unselect(state, id) {
  state.selection = state.selection.filter(nodeId => nodeId !== parseInt(id))
}

export function clearSelection(state) {
  state.selection = []
}

// links
export function addLink(state, link) {
  state.links.push(link)
}

export function deleteLink(state, linkIndex) {
  state.links = state.links.filter((_, i) => i !== linkIndex)
}

// quizzes
export function completeQuestion(state, { nodeId, questionId }) {
  const node = state.nodes[Helpers.findNodeIndex(nodeId, state)]
  const question = node.quiz.find(question => question.id === questionId)
  question.completed = true
}

export function updateEntry(state, { answerType, entry, nodeId, questionId }) {
  const node = state.nodes[Helpers.findNodeIndex(nodeId, state)]
  const question = node.quiz.find(question => question.id === questionId)
  const entries = question.entries || {}
  entries[answerType] = Object.values(entry)[0]
  question.entries = entries
}

// favourites
export function updateFavourites(state, { favourites }) {
  state.favourites = favourites
}

function getChildIds(state, nodeId) {
  const links = state.links
  return links
    .filter(link =>
      link.source.id == undefined ? link.source == nodeId : link.source.id == nodeId
    )
    .map(link => (link.target.id == undefined ? link.target : link.target.id))
}

export function initializeOrdering(state, id) {
  const node = state.nodes[Helpers.findNodeIndex(id, state)]
  getChildIds(state, id)
    .filter(cid => !node.childOrdering.includes(cid))
    .forEach(id => node.childOrdering.push(id))
  const children = getChildIds(state, id)
  node.childOrdering = node.childOrdering.filter(id => children.includes(id))
}

export function updateOrdering(state, payload) {
  const nodeIndex = Helpers.findNodeIndex(payload.id, state)
  state.nodes[nodeIndex].childOrdering = payload.ord
}

export function updateVisibleNodes(state, nodes) {
  state.visibleNodes = nodes
}
