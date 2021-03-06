<template>
  <div>
    <b-form-group>
      <b-form-checkbox v-model="canAddQuestion" data-testid="add-question-checkbox">
        Add Question
      </b-form-checkbox>
    </b-form-group>
    <div v-if="canAddQuestion" class="quiz">
      <b-card
        v-for="(question, index) in questions"
        :key="question.id"
        bg-variant="secondary"
        text-variant="light"
        class="mb-3"
      >
        <b-form-group class="mb-0">
          <b-row align-v="center" class="mb-2 mx-0">
            <p class="font-weight-bold p-0 m-0 question-text">
              {{ getGroupTitle(question, index) }}
            </p>
            <b-button
              class="ml-auto del-button"
              size="sm"
              variant="danger"
              text-variant="white"
              @click="deleteQuestion(question.id)"
            >
              Delete
            </b-button>
          </b-row>
          <b-card
            sub-title="Show Answer to a Previous Activity First"
            bg-variant="light"
            text-variant="dark"
            class="mb-3"
          >
            <b-form-group>
              <b-form-checkbox v-model="question.isFollowUp" switch>
                {{ question.isFollowUp ? "Yes" : "No" }}
              </b-form-checkbox>
            </b-form-group>
            <b-form-group v-if="question.isFollowUp" label="Show this text first:">
              <b-form-input v-model="question.followUpText"></b-form-input>
            </b-form-group>
            <b-form-group
              v-if="question.isFollowUp"
              label="Then show user answer to the following activity:"
            >
              <combobox
                v-model="question.previousEntry"
                class="mb-0"
                :options="getPreviousOptions(question)"
                item-text="text"
                item-value="id"
                empty-message="There are no activities yet."
              >
                <template v-slot="slotProps">
                  <p>
                    {{ slotProps.option.text }}
                  </p>
                </template>
              </combobox>
            </b-form-group>
          </b-card>
          <b-card
            sub-title="Question Details"
            bg-variant="light"
            text-variant="dark"
            class="mb-3"
          >
            <b-form-group label="Question text">
              <b-form-input
                v-model="question.text"
                :data-testid="`question-title-${index}`"
              />
            </b-form-group>
            <b-form-group label="Answer options" class="mb-0">
              <b-row>
                <b-col cols="12" md="4">
                  <b-form-checkbox
                    :checked="question.answers.audioId.length > 0"
                    :data-testid="`question-answer-audio-${index}`"
                    switch
                    @input="question.answers.audioId = $event ? '1' : ''"
                  >
                    Audio Recorder
                  </b-form-checkbox>
                </b-col>
                <b-col cols="12" md="4">
                  <b-form-group label="Textbox Gravity Form" class="mb-0">
                    <b-form-input
                      v-if="!gravityFormExists"
                      :disabled="true"
                      title="Gravity Forms plugin is not installed. You need to install Gravity Forms before being able to use it here."
                      value="Not Available"
                    />
                    <combobox
                      v-else
                      v-model="question.answers.textId"
                      :data-testid="`question-answer-text-${index}`"
                      :options="formOptions"
                      item-text="title"
                      item-value="id"
                      empty-message="There are no Gravity Forms available. You need to first create a Gravity Form to use here."
                      @focus="wasFocused = true"
                    >
                      <template v-slot="slotProps">
                        <p>
                          <code>{{ slotProps.option.id }}</code>
                          {{ slotProps.option.title }}
                        </p>
                      </template>
                    </combobox>
                  </b-form-group>
                </b-col>
                <b-col cols="12" md="4">
                  <b-form-group label="Checklist Gravity Form" class="mb-0">
                    <b-form-input
                      v-if="!gravityFormExists"
                      :disabled="true"
                      title="Gravity Forms plugin is not installed. You need to install Gravity Forms before being able to use it here."
                      value="Not Available"
                    />
                    <combobox
                      v-else
                      v-model="question.answers.checklistId"
                      :data-testid="`question-answer-checklist-${index}`"
                      :options="formOptions"
                      item-text="title"
                      item-value="id"
                      empty-message="There are no forms available. Please add one in your WP dashboard."
                      @focus="wasFocused = true"
                    >
                      <template v-slot="slotProps">
                        <p>
                          <code>{{ slotProps.option.id }}</code>
                          {{ slotProps.option.title }}
                        </p>
                      </template>
                    </combobox>
                  </b-form-group>
                </b-col>
              </b-row>
            </b-form-group>
            <b-form-invalid-feedback :state="isAnswerValid(question)">
              Please enter an ID in at least one of the answer types.
            </b-form-invalid-feedback>
          </b-card>
          <b-card
            sub-title="Confirmation Page Customization"
            bg-variant="light"
            text-variant="dark"
          >
            <b-form-group label="Title">
              <b-form-input
                v-model="question.confirmationTitle"
                :data-testid="`question-confirmation-title-${index}`"
                placeholder="Thanks!"
              />
            </b-form-group>
            <rich-text-form
              v-model="question.confirmationMessage"
              :data-testid="`question-confirmation-message-${index}`"
              placeholder="Your response has been recorded."
            />
          </b-card>
        </b-form-group>
      </b-card>
    </div>
    <b-row v-if="canAddQuestion" class="mx-0">
      <b-button variant="primary" @click="addQuestion">
        <i class="fas fa-plus icon"></i>
        Add Question
      </b-button>
    </b-row>
  </div>
</template>

<script>
import { mapState } from "vuex"
import Combobox from "@/components/modals/common/Combobox"
import GravityFormsApi from "@/services/GravityFormsApi"
import Helpers from "@/utils/Helpers"
import RichTextForm from "./RichTextForm"

const defaultQuestion = {
  text: "",
  answers: {
    textId: "",
    audioId: "",
    checklistId: "",
  },
}

export default {
  components: {
    Combobox,
    RichTextForm,
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      canAddQuestion: Boolean(this.node.quiz && this.node.quiz.length),
      gravityFormExists: false,
      formOptions: [],
      h5pOptions: [],
      questions: this.node.quiz,
      typeOptions: ["H5P Audio Recorder"],
      icons: ["microphone"],
      wasFocused: false,
    }
  },
  computed: {
    ...mapState(["nodes"]),
    activities() {
      const questions = Object.values(this.nodes)
        .filter(node => Boolean(node.quiz))
        .flatMap(node => node.quiz)
      this.questions.forEach(q => {
        if (!questions.find(qn => qn.id === q.id)) {
          questions.push(q)
        }
      })
      return questions
    },
  },
  watch: {
    canAddQuestion(isAdding) {
      if (isAdding && !this.questions.length) {
        this.addQuestion()
      } else if (!isAdding && this.questions.length) {
        this.questions = []
      }
    },
    questions(newQuestions) {
      this.$set(this.node, "quiz", newQuestions)
    },
  },
  async mounted() {
    this.gravityFormExists = await GravityFormsApi.exists()
    this.formOptions = await GravityFormsApi.getAllForms()
  },
  methods: {
    getPreviousOptions(currentQuestion) {
      return this.activities.filter(qn => qn !== currentQuestion)
    },
    addQuestion() {
      this.questions = [
        ...this.questions,
        {
          id: Helpers.createUUID(),
          isFollowUp: false,
          previousEntry: null,
          followUpText: "Previously, you said:",
          text: "",
          answers: { ...defaultQuestion.answers },
          completed: false,
        },
      ]
    },
    deleteQuestion(id) {
      this.questions = this.questions.filter(question => question.id !== id)
    },
    getGroupTitle(question, index) {
      return `Question #${index + 1}: ${question.text || "Untitled"}`
    },
    isAnswerValid(question) {
      if (!this.wasFocused) {
        return null
      }
      return Object.values(question.answers).some(value => value && value.length > 0)
    },
  },
}
</script>

<style scoped>
.icon {
  margin-right: 4px;
}

.icon-form {
  margin-right: 1em;
}

.quiz {
  margin-bottom: 1em;
}

.question-text {
  flex: 10;
}

.del-button {
  flex: 1;
}
</style>
