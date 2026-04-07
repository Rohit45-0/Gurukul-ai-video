const companionUrl = "/mvp/generated/companions/metals-and-non-metals.json";

const state = {
  data: null,
  activeIndex: 0,
  coachMode: "simple",
  quickAnswers: {},
  scenarioAnswers: {},
};

const refs = {
  chapterTitle: document.querySelector("#chapter-title"),
  chapterSummary: document.querySelector("#chapter-summary"),
  sourceTitle: document.querySelector("#source-title"),
  sourceCopy: document.querySelector("#source-copy"),
  openPdfLink: document.querySelector("#open-pdf-link"),
  lessonVideo: document.querySelector("#lesson-video"),
  topicTimeRange: document.querySelector("#topic-time-range"),
  activeTopicBadge: document.querySelector("#active-topic-badge"),
  activeTopicTitle: document.querySelector("#active-topic-title"),
  activeTopicMission: document.querySelector("#active-topic-mission"),
  topicStrip: document.querySelector("#topic-strip"),
  supportKicker: document.querySelector("#support-kicker"),
  supportTitle: document.querySelector("#support-title"),
  supportSource: document.querySelector("#support-source"),
  supportRecap: document.querySelector("#support-recap"),
  supportObservation: document.querySelector("#support-observation"),
  quizPrompt: document.querySelector("#quiz-prompt"),
  quizOptions: document.querySelector("#quiz-options"),
  quizFeedback: document.querySelector("#quiz-feedback"),
  coachButtons: [...document.querySelectorAll(".coach-button")],
  coachCopy: document.querySelector("#coach-copy"),
  scenarioPrompt: document.querySelector("#scenario-prompt"),
  scenarioOptions: document.querySelector("#scenario-options"),
  scenarioFeedback: document.querySelector("#scenario-feedback"),
};

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const remainder = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const getActiveTopic = () => state.data?.topics[state.activeIndex] ?? null;

const getCoachText = (topic) => {
  if (state.coachMode === "mistake") {
    const quick = state.quickAnswers[topic.id];
    const scenario = state.scenarioAnswers[topic.id];

    if (quick && !quick.isCorrect) {
      return `${topic.coach.mistake} Your last quiz answer showed this gap: ${quick.feedback}`;
    }

    if (scenario && !scenario.isCorrect) {
      return `${topic.coach.mistake} In the real-life question, the issue was this: ${scenario.feedback}`;
    }
  }

  return topic.coach[state.coachMode] ?? topic.coach.simple;
};

const renderTopicStrip = () => {
  refs.topicStrip.innerHTML = "";

  state.data.topics.forEach((topic, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `topic-jump${index === state.activeIndex ? " active" : ""}`;
    button.innerHTML = `
      <span class="topic-time">${topic.timestampLabel}</span>
      <span class="topic-label">${topic.title}</span>
      <span class="topic-mission">${topic.mission}</span>
    `;

    button.addEventListener("click", () => {
      state.activeIndex = index;
      state.coachMode = "simple";
      const active = getActiveTopic();
      refs.lessonVideo.currentTime = active.startSeconds;
      refs.lessonVideo.pause();
      renderActiveTopic();
    });

    refs.topicStrip.append(button);
  });
};

const renderQuiz = (topic) => {
  const answer = state.quickAnswers[topic.id];
  refs.quizPrompt.textContent = topic.quickCheck.prompt;
  refs.quizOptions.innerHTML = "";

  topic.quickCheck.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.label;

    if (answer?.id === option.id) {
      button.classList.add(option.isCorrect ? "correct" : "incorrect");
    }

    button.addEventListener("click", () => {
      state.quickAnswers[topic.id] = {
        id: option.id,
        isCorrect: option.isCorrect,
        feedback: option.feedback,
      };

      if (!option.isCorrect) {
        state.coachMode = "mistake";
      }

      renderActiveTopic();
    });

    refs.quizOptions.append(button);
  });

  refs.quizFeedback.textContent =
    answer?.feedback ?? "Click an answer to see how this checkpoint could work.";
};

const renderScenario = (topic) => {
  const answer = state.scenarioAnswers[topic.id];
  refs.scenarioPrompt.textContent = topic.scenario.prompt;
  refs.scenarioOptions.innerHTML = "";

  topic.scenario.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.label;

    if (answer?.id === option.id) {
      button.classList.add(option.isBest ? "correct" : "incorrect");
    }

    button.addEventListener("click", () => {
      state.scenarioAnswers[topic.id] = {
        id: option.id,
        isCorrect: option.isBest,
        feedback: option.feedback,
      };

      renderActiveTopic();
    });

    refs.scenarioOptions.append(button);
  });

  refs.scenarioFeedback.textContent =
    answer?.feedback ??
    "This is where the chapter moves from textbook knowledge to a real decision.";
};

const renderCoach = (topic) => {
  refs.coachButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.coachMode);
  });

  refs.coachCopy.textContent = getCoachText(topic);
};

const renderActiveTopic = () => {
  const topic = getActiveTopic();
  if (!topic) {
    return;
  }

  refs.topicTimeRange.textContent = `${formatTime(topic.startSeconds)} - ${formatTime(topic.endSeconds)}`;
  refs.activeTopicBadge.textContent = `Topic ${String(state.activeIndex + 1).padStart(2, "0")}`;
  refs.activeTopicTitle.textContent = topic.title;
  refs.activeTopicMission.textContent = topic.mission;
  refs.supportKicker.textContent = `Topic ${String(state.activeIndex + 1).padStart(2, "0")}`;
  refs.supportTitle.textContent = topic.title;
  refs.supportSource.textContent = topic.sourceAnchor;
  refs.supportRecap.textContent = topic.recap;
  refs.supportObservation.textContent = topic.observation;

  renderQuiz(topic);
  renderCoach(topic);
  renderScenario(topic);
  renderTopicStrip();
};

const syncTopicFromVideo = () => {
  const currentTime = refs.lessonVideo.currentTime;
  const nextIndex = state.data.topics.findIndex((topic, index, list) => {
    const isLast = index === list.length - 1;
    return currentTime >= topic.startSeconds && (isLast || currentTime < topic.endSeconds);
  });

  if (nextIndex >= 0 && nextIndex !== state.activeIndex) {
    state.activeIndex = nextIndex;
    state.coachMode = "simple";
    renderActiveTopic();
  }
};

const bindCoachModes = () => {
  refs.coachButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.coachMode = button.dataset.mode;
      renderCoach(getActiveTopic());
    });
  });
};

const boot = async () => {
  const response = await fetch(companionUrl, {cache: "no-store"});
  if (!response.ok) {
    throw new Error("Could not load lesson data.");
  }

  state.data = await response.json();
  refs.chapterTitle.textContent = state.data.chapterTitle;
  refs.chapterSummary.textContent = state.data.summary;
  refs.sourceTitle.textContent = state.data.sourcePdfLabel ?? "Chapter PDF";
  refs.sourceCopy.textContent = state.data.sourceNote;
  refs.openPdfLink.href = state.data.sourcePdfUrl ?? "#";
  refs.lessonVideo.src = state.data.videoUrl;

  bindCoachModes();
  refs.lessonVideo.addEventListener("timeupdate", syncTopicFromVideo);

  renderActiveTopic();
};

boot().catch((error) => {
  refs.chapterTitle.textContent = "Lesson view could not load";
  refs.chapterSummary.textContent =
    error instanceof Error ? error.message : "Unexpected error loading the lesson.";
});
