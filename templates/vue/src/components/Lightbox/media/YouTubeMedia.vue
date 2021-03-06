<template>
  <div class="embed-responsive embed-responsive-16by9">
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
    <youtube
      class="embed-responsive-item"
      :video-id="node.typeData.youtubeID"
      :player-width="dimensions.width - 15"
      :player-height="dimensions.height - 40"
      :player-vars="{
        autoplay: autoplay,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        enablejsapi: 1,
      }"
      @ready="ready"
      @paused="handlePause()"
      @ended="handleEnd"
    />
  </div>
</template>

<script>
import EndScreen from "./common/EndScreen"
import ActivityScreen from "./common/ActivityScreen"
import { mapState, mapActions } from "vuex"
import Helpers from "@/utils/Helpers"

const ALLOW_SKIP_THRESHOLD = 0.95

export default {
  name: "video-media",
  components: {
    EndScreen,
    ActivityScreen,
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
    autoplay: {
      type: Boolean,
      required: false,
      default: true,
    },
    dimensions: {
      type: Object,
      required: true,
      validator: val => {
        return ["width", "height"].every(prop => val.hasOwnProperty(prop))
      },
    },
  },
  data() {
    return {
      showEndScreen: this.getInitialEndScreenState(),
      showActivityScreen: false,
      videoDimensions: null,
      player: null,
    }
  },
  computed: {
    ...mapState(["h5pSettings"]),
    progress() {
      if (this.node.progress) {
        return this.node.progress
      } else if (this.node.typeData.progress) {
        return this.node.typeData.progress[0].value
      }
      return 0
    },
  },
  beforeDestroy() {
    if (this.player) {
      this.player.stopVideo()
      this.updateVideoProgress()
      this.updateSettings()
    }
  },
  methods: {
    ...mapActions(["updateH5pSettings"]),
    ready(event) {
      this.player = event.target
      this.player.seekTo(this.progress * this.player.getDuration(), true)
      this.applySettings()
    },
    openQuiz() {
      this.showEndScreen = false
      this.showActivityScreen = true
    },
    back() {
      this.showEndScreen = true
      this.showActivityScreen = false
    },
    rewatch() {
      this.showEndScreen = false
      if (this.player) {
        this.player.seekTo(0, true)
        this.player.playVideo()
      }
    },
    close() {
      if (this.player) {
        this.player.stopVideo()
        this.updateVideoProgress()
        this.updateSettings()
      }
      this.$emit("close")
    },
    getInitialEndScreenState() {
      if (this.progress >= 1) {
        return true
      }
      if (this.player) {
        const viewedAmount = this.progress * this.player.getDuration()
        return this.player.getDuration() <= viewedAmount
      }
      return false
    },
    updateVideoProgress(ended = false) {
      if (this.player) {
        let amountViewed
        if (ended) {
          amountViewed = 1
        } else {
          amountViewed = this.player.getCurrentTime() / this.player.getDuration()
        }
        this.$emit("timeupdate", amountViewed)

        if (amountViewed >= ALLOW_SKIP_THRESHOLD) {
          this.$emit("complete")
        }
        if (amountViewed >= 1) {
          this.showEndScreen = true
        }
      }
    },
    handlePause() {
      this.updateVideoProgress()
      this.updateSettings()
    },
    handleEnd() {
      // Video current time may be a few milliseconds short and so won't mark it as complete
      this.updateVideoProgress(true)
      this.updateSettings()
      this.showEndScreen = true
    },
    applySettings() {
      if (!this.h5pSettings || Object.keys(this.h5pSettings).length === 0) return
      this.h5pSettings.muted ? this.player.mute() : this.player.unMute()
      this.h5pSettings.volume
        ? this.player.setVolume(this.h5pSettings.volume)
        : false
      this.h5pSettings.playbackRate
        ? this.player.setPlaybackRate(this.h5pSettings.playbackRate)
        : false
    },
    updateSettings() {
      const newSettings = { ...this.h5pSettings }
      newSettings.muted = this.player.isMuted()
      newSettings.volume = this.player.getVolume()
      newSettings.playbackRate = this.player.getPlaybackRate()
      if (Helpers.isDifferent(this.h5pSettings, newSettings)) {
        this.updateH5pSettings(newSettings)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.embed-responsive {
  max-height: calc(100vh - 120px);
  height: 100%;
}
</style>
