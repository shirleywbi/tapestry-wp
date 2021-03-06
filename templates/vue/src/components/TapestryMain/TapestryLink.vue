<template>
  <transition name="fade">
    <line
      v-show="show"
      :data-qa="`link-${source.id}-${target.id}`"
      :class="{
        opaque:
          !visibleNodes.includes(source.id) || !visibleNodes.includes(target.id),
        disabled: !isLoggedIn,
      }"
      :x1="source.coordinates.x"
      :x2="target.coordinates.x"
      :y1="source.coordinates.y"
      :y2="target.coordinates.y"
      @click="remove"
    ></line>
  </transition>
</template>

<script>
import { mapActions, mapGetters, mapState } from "vuex"
import * as wp from "@/services/wp"

export default {
  name: "tapestry-link",
  props: {
    source: {
      type: Object,
      required: true,
    },
    target: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapState(["visibleNodes", "rootId"]),
    ...mapGetters(["getNeighbours", "isAccordion", "isVisible"]),
    show() {
      return this.isVisible(this.source.id) && this.isVisible(this.target.id)
    },
    isLoggedIn() {
      return wp.isLoggedIn()
    },
  },
  methods: {
    ...mapActions(["deleteLink"]),
    isConnectedToRoot(source, target) {
      let queue = []
      let visited = new Set()
      queue.push(source)
      visited.add(source)
      while (queue.length > 0) {
        const node = queue.shift()
        if (node == this.rootId) {
          return true
        }
        const neighbours = this.getNeighbours(node)
        for (const neighbour of neighbours) {
          if (
            !visited.has(neighbour) &&
            !(node === source && neighbour === target)
          ) {
            visited.add(neighbour)
            queue.push(neighbour)
          }
        }
      }
      return false
    },
    canDelete() {
      return (
        this.isConnectedToRoot(this.source.id, this.target.id) &&
        this.isConnectedToRoot(this.target.id, this.source.id)
      )
    },
    async remove() {
      if (event.target.classList.contains("disabled")) {
        return
      }
      const userConfirmDelete = confirm(
        `Are you sure you want to delete the link between ${this.source.title} and ${this.target.title}?`
      )
      if (userConfirmDelete) {
        if (this.canDelete()) {
          await this.deleteLink({ source: this.source.id, target: this.target.id })
          if (this.isAccordion(this.source.id)) {
            this.source.childOrdering = this.source.childOrdering.filter(
              id => id !== this.target.id
            )
          }
        } else {
          alert("You cannot delete this link")
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
line {
  stroke: #999;
  stroke-width: 6;

  &:hover {
    cursor: pointer;
    stroke: red;
    stroke-width: 11;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.opaque {
  opacity: 0.2;
}

.disabled {
  &:hover {
    cursor: not-allowed;
    stroke: #999;
    stroke-width: 6;
  }
}
</style>
