<template>
  <div class="container">
    <end-screen
      v-if="showEndScreen"
      :node="node"
      @rewatch="rewatch"
      @close="close"
      @show-quiz="openQuiz"
    />
    <activity-screen
      v-else-if="showActivityScreen"
      :id="node.id"
      @back="back"
      @close="close"
    />
    <loading v-if="isLoading" label="Loading H5P media..." />
    <h5p-iframe
      ref="h5pIframe"
      :autoplay="autoplay"
      :dimensions="dimensions"
      :node="node"
      :context="context"
      :settings="h5pSettings"
      @complete="$emit('complete')"
      @change:dimensions="$emit('change:dimensions', $event)"
      @is-loaded="handleLoad"
      @timeupdate="$emit('timeupdate', $event)"
      @show-end-screen="showEndScreen = true"
      @show-play-screen="showPlayScreen = $event"
      @update-settings="updateH5pSettings"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex"
import Loading from "@/components/common/Loading"
import EndScreen from "../common/EndScreen"
import H5PIframe from "./H5PIframe"
import ActivityScreen from "../common/ActivityScreen"

export default {
  name: "h5p-media",
  components: {
    EndScreen,
    "h5p-iframe": H5PIframe,
    Loading,
    ActivityScreen,
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
    dimensions: {
      type: Object,
      required: true,
    },
    context: {
      type: String,
      required: true,
    },
    autoplay: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      isLoading: true,
      showEndScreen: false,
      showActivityScreen: false,
      showPlayScreen: !this.autoplay,
    }
  },
  computed: {
    ...mapState(["h5pSettings"]),
  },
  methods: {
    ...mapActions(["updateH5pSettings"]),
    openQuiz() {
      this.showEndScreen = false
      this.showActivityScreen = true
    },
    rewatch() {
      this.showEndScreen = false
      this.$refs.h5pIframe.rewatch()
    },
    close() {
      this.showEndScreen = false
      this.$refs.h5pIframe.close()
      this.$emit("close")
    },
    back() {
      this.showActivityScreen = false
      this.showEndScreen = true
    },
    handleLoad() {
      this.isLoading = false
      this.$emit("load")
    },
  },
}
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  padding: 0;
}
</style>
