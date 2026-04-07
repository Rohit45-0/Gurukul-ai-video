const companionUrl = "/mvp/generated/companions/metals-and-non-metals.json";

const state = {
  data: null,
  activeIndex: 0,
  coachMode: "simple",
  coachUses: 0,
  autoPause: true,
  pausedCheckpointId: null,
  quickAnswers: {},
  scenarioAnswers: {},
  puzzleAnswers: {},
  puzzleSequences: {},
  teachBack: {},
};

const refs = {
  chapterTitle: document.querySelector("#chapter-title"),
  chapterSummary: document.querySelector("#chapter-summary"),
  sourceNote: document.querySelector("#source-note"),
  masteryRing: document.querySelector("#mastery-ring"),
  masteryScore: document.querySelector("#mastery-score"),
  topicsCompleted: document.querySelector("#topics-completed"),
  coachUses: document.querySelector("#coach-uses"),
  topicsRevisit: document.querySelector("#topics-revisit"),
  lessonVideo: document.querySelector("#lesson-video"),
  autoPauseToggle: document.querySelector("#autopause-toggle"),
  playTopicButton: document.querySelector("#play-topic-button"),
  checkpointBar: document.querySelector("#checkpoint-bar"),
  journeyNote: document.querySelector("#journey-note"),
  topicList: document.querySelector("#topic-list"),
  revisionList: document.querySelector("#revision-list"),
  overlayTime: document.querySelector("#overlay-time"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayMission: document.querySelector("#overlay-mission"),
  topicKicker: document.querySelector("#topic-kicker"),
  topicTitle: document.querySelector("#topic-title"),
  topicRange: document.querySelector("#topic-range"),
  topicSource: document.querySelector("#topic-source"),
  topicMission: document.querySelector("#topic-mission"),
  topicRecap: document.querySelector("#topic-recap"),
  topicObservation: document.querySelector("#topic-observation"),
  quickCheckTitle: document.querySelector("#quick-check-title"),
  quickCheckPrompt: document.querySelector("#quick-check-prompt"),
  quickCheckOptions: document.querySelector("#quick-check-options"),
  quickCheckFeedback: document.querySelector("#quick-check-feedback"),
  quickCheckStatus: document.querySelector("#quick-check-status"),
  puzzleTitle: document.querySelector("#puzzle-title"),
  puzzleInstruction: document.querySelector("#puzzle-instruction"),
  puzzleZone: document.querySelector("#puzzle-zone"),
  puzzleControls: document.querySelector("#puzzle-controls"),
  puzzleFeedback: document.querySelector("#puzzle-feedback"),
  puzzleStatus: document.querySelector("#puzzle-status"),
  coachButtons: [...document.querySelectorAll(".coach-button")],
  coachResponse: document.querySelector("#coach-response"),
  coachStatus: document.querySelector("#coach-status"),
  scenarioTitle: document.querySelector("#scenario-title"),
  scenarioPrompt: document.querySelector("#scenario-prompt"),
  scenarioOptions: document.querySelector("#scenario-options"),
  scenarioFeedback: document.querySelector("#scenario-feedback"),
  scenarioStatus: document.querySelector("#scenario-status"),
  teachBackPrompt: document.querySelector("#teachback-prompt"),
  teachBackInput: document.querySelector("#teachback-input"),
  teachBackSubmit: document.querySelector("#teachback-submit"),
  teachBackFeedback: document.querySelector("#teachback-feedback"),
  teachBackStatus: document.querySelector("#teachback-status"),
};

const formatTime = (value) => {
  const seconds = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const getActiveTopic = () => state.data?.topics[state.activeIndex] ?? null;

const getTopicAnswerState = (topicId) => {
  const quick = state.quickAnswers[topicId];
  const puzzle = state.puzzleAnswers[topicId];
  const scenario = state.scenarioAnswers[topicId];
  const teachBack = state.teachBack[topicId];

  const answeredCount = [quick, puzzle, scenario, teachBack].filter(Boolean).length;
  const strengthCount = [
    quick?.isCorrect,
    puzzle?.isCorrect,
    scenario?.isCorrect,
    teachBack?.isStrong,
  ].filter(Boolean).length;

  const hasMistake =
    [quick, puzzle, scenario].some((answer) => answer && !answer.isCorrect) ||
    (teachBack && !teachBack.isStrong);

  let stateLabel = "Not started";
  let stateClass = "";

  if (answeredCount > 0 && strengthCount === 4) {
    stateLabel = "Strong";
    stateClass = "strong";
  } else if (hasMistake) {
    stateLabel = "Revisit";
    stateClass = "revisit";
  } else if (answeredCount > 0) {
    stateLabel = "In progress";
    stateClass = "progress";
  }

  return {
    answeredCount,
    strengthCount,
    hasMistake,
    stateLabel,
    stateClass,
    progressPercent: Math.round((answeredCount / 4) * 100),
  };
};

const updateMastery = () => {
  const topics = state.data?.topics ?? [];
  const totalSignals = topics.length * 4 || 1;

  let masteredSignals = 0;
  let completedTopics = 0;
  let revisitTopics = 0;

  topics.forEach((topic) => {
    const summary = getTopicAnswerState(topic.id);
    masteredSignals += summary.strengthCount;

    if (summary.answeredCount > 0) {
      completedTopics += 1;
    }

    if (summary.hasMistake) {
      revisitTopics += 1;
    }
  });

  const masteryPercent = Math.round((masteredSignals / totalSignals) * 100);
  const degrees = Math.round((masteryPercent / 100) * 360);

  refs.masteryRing.style.background = `conic-gradient(var(--amber) 0deg, var(--amber) ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg)`;
  refs.masteryScore.textContent = `${masteryPercent}%`;
  refs.topicsCompleted.textContent = `${completedTopics} / ${topics.length}`;
  refs.coachUses.textContent = String(state.coachUses);
  refs.topicsRevisit.textContent = String(revisitTopics);
};

const renderRevisionQueue = () => {
  refs.revisionList.innerHTML = "";
  const weakTopics = (state.data?.topics ?? []).filter(
    (topic) => getTopicAnswerState(topic.id).hasMistake,
  );

  if (weakTopics.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "revision-chip";
    placeholder.textContent =
      "No weak checkpoints yet. Once a learner slips on a concept, this queue can guide revision.";
    refs.revisionList.append(placeholder);
    return;
  }

  weakTopics.forEach((topic) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timeline-card";
    button.innerHTML = `
      <div class="timeline-top">
        <span class="timeline-time">${topic.timestampLabel}</span>
        <span class="timeline-state revisit">Revisit</span>
      </div>
      <div class="timeline-title">${topic.title}</div>
      <div class="timeline-copy">${topic.mission}</div>
    `;
    button.addEventListener("click", () => setActiveTopicById(topic.id, true));
    refs.revisionList.append(button);
  });
};

const renderTimeline = () => {
  refs.topicList.innerHTML = "";

  state.data.topics.forEach((topic, index) => {
    const summary = getTopicAnswerState(topic.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `timeline-card${index === state.activeIndex ? " active" : ""}`;
    button.innerHTML = `
      <div class="timeline-top">
        <span class="timeline-time">${topic.timestampLabel}</span>
        <span class="timeline-state ${summary.stateClass}">${summary.stateLabel}</span>
      </div>
      <div class="timeline-title">${topic.title}</div>
      <div class="timeline-copy">${topic.mission}</div>
      <div class="timeline-progress"><span style="width: ${summary.progressPercent}%"></span></div>
    `;

    button.addEventListener("click", () => setActiveTopicById(topic.id, true));
    refs.topicList.append(button);
  });
};

const renderCheckpointBar = () => {
  refs.checkpointBar.innerHTML = "";

  state.data.topics.forEach((topic, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `checkpoint-segment${index === state.activeIndex ? " active" : ""}`;
    button.innerHTML = `
      <span class="checkpoint-time">${topic.timestampLabel}</span>
      <span class="checkpoint-title">${topic.title}</span>
    `;
    button.addEventListener("click", () => setActiveTopicById(topic.id, true));
    refs.checkpointBar.append(button);
  });
};

const renderQuickCheck = (topic) => {
  const answer = state.quickAnswers[topic.id];

  refs.quickCheckTitle.textContent = topic.quickCheck.title;
  refs.quickCheckPrompt.textContent = topic.quickCheck.prompt;
  refs.quickCheckOptions.innerHTML = "";

  topic.quickCheck.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
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

    refs.quickCheckOptions.append(button);
  });

  refs.quickCheckStatus.textContent = answer
    ? answer.isCorrect
      ? "Strong"
      : "Needs review"
    : "Not started";
  refs.quickCheckFeedback.textContent =
    answer?.feedback ?? "Answer a checkpoint question.";
};

const renderPickPuzzle = (topic, puzzle, answer) => {
  refs.puzzleZone.innerHTML = "";
  refs.puzzleControls.innerHTML = "";

  puzzle.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pick-card";
    button.textContent = option.label;

    if (answer?.id === option.id) {
      button.classList.add(option.isCorrect ? "correct" : "incorrect");
    }

    button.addEventListener("click", () => {
      state.puzzleAnswers[topic.id] = {
        id: option.id,
        isCorrect: option.isCorrect,
        feedback: option.feedback,
      };
      renderActiveTopic();
    });

    refs.puzzleZone.append(button);
  });
};

const renderOrderPuzzle = (topic, puzzle, answer) => {
  refs.puzzleZone.innerHTML = "";
  refs.puzzleControls.innerHTML = "";

  const sequence = state.puzzleSequences[topic.id] ?? [];
  const selected = new Set(sequence);

  const wrapper = document.createElement("div");
  wrapper.className = "order-stage";
  wrapper.innerHTML = `
    <div class="card-kicker">Build your order</div>
    <div class="order-picked" id="order-picked"></div>
    <div class="card-kicker">Available cards</div>
    <div class="order-bank" id="order-bank"></div>
  `;

  const picked = wrapper.querySelector("#order-picked");
  const bank = wrapper.querySelector("#order-bank");

  if (sequence.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "feedback-box";
    placeholder.textContent = "Tap the cards in the order you think is correct.";
    picked.append(placeholder);
  } else {
    sequence.forEach((entry, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "puzzle-chip selected";
      chip.textContent = `${index + 1}. ${entry}`;
      chip.addEventListener("click", () => {
        state.puzzleSequences[topic.id] = sequence.filter((item) => item !== entry);
        renderActiveTopic();
      });
      picked.append(chip);
    });
  }

  puzzle.options.forEach((option) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "puzzle-chip";
    chip.textContent = option;
    chip.disabled = selected.has(option);
    chip.addEventListener("click", () => {
      state.puzzleSequences[topic.id] = [...sequence, option];
      renderActiveTopic();
    });
    bank.append(chip);
  });

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "chip-button";
  resetButton.textContent = "Reset order";
  resetButton.addEventListener("click", () => {
    state.puzzleSequences[topic.id] = [];
    state.puzzleAnswers[topic.id] = null;
    renderActiveTopic();
  });

  const checkButton = document.createElement("button");
  checkButton.type = "button";
  checkButton.className = "chip-button chip-button-solid";
  checkButton.textContent = "Check order";
  checkButton.addEventListener("click", () => {
    const current = state.puzzleSequences[topic.id] ?? [];

    if (current.length !== puzzle.correctOrder.length) {
      refs.puzzleFeedback.textContent =
        "Finish all cards before checking the sequence.";
      refs.puzzleStatus.textContent = "In progress";
      return;
    }

    const isCorrect = current.every((entry, index) => entry === puzzle.correctOrder[index]);
    state.puzzleAnswers[topic.id] = {
      id: current.join("|"),
      isCorrect,
      feedback: isCorrect
        ? puzzle.feedback
        : "Close, but the order still needs work. Think about which end of the idea is strongest or least reactive.",
    };

    renderActiveTopic();
  });

  refs.puzzleZone.append(wrapper);
  refs.puzzleControls.append(resetButton, checkButton);

  if (answer) {
    refs.puzzleStatus.textContent = answer.isCorrect ? "Strong" : "Needs review";
  } else if (sequence.length > 0) {
    refs.puzzleStatus.textContent = "In progress";
  } else {
    refs.puzzleStatus.textContent = "Not started";
  }
};

const renderPuzzle = (topic) => {
  const puzzle = topic.puzzle;
  const answer = state.puzzleAnswers[topic.id];

  refs.puzzleTitle.textContent =
    puzzle.kind === "order" ? "Sequence Builder" : "Concept Spotter";
  refs.puzzleInstruction.textContent = puzzle.instruction;
  refs.puzzleFeedback.textContent =
    answer?.feedback ?? "Solve the concept puzzle to lock the idea in memory.";

  if (puzzle.kind === "order") {
    renderOrderPuzzle(topic, puzzle, answer);
    return;
  }

  renderPickPuzzle(topic, puzzle, answer);
  refs.puzzleStatus.textContent = answer
    ? answer.isCorrect
      ? "Strong"
      : "Needs review"
    : "Not started";
};

const getCoachCopy = (topic) => {
  if (state.coachMode === "mistake") {
    const quick = state.quickAnswers[topic.id];
    const scenario = state.scenarioAnswers[topic.id];

    if (quick && !quick.isCorrect) {
      return `${topic.coach.mistake} Your last quick-check answer shows this gap: ${quick.feedback}`;
    }

    if (scenario && !scenario.isCorrect) {
      return `${topic.coach.mistake} In the real-life scenario, the miss was this: ${scenario.feedback}`;
    }

    return `${topic.coach.mistake} Try the question or scenario first and this coach mode becomes more personalized.`;
  }

  return topic.coach[state.coachMode] ?? topic.coach.simple;
};

const renderCoach = (topic) => {
  refs.coachButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.coachMode === state.coachMode);
  });

  refs.coachResponse.textContent = getCoachCopy(topic);
  refs.coachStatus.textContent = "Ready";
};

const renderScenario = (topic) => {
  const answer = state.scenarioAnswers[topic.id];

  refs.scenarioTitle.textContent = topic.scenario.title;
  refs.scenarioPrompt.textContent = topic.scenario.prompt;
  refs.scenarioOptions.innerHTML = "";

  topic.scenario.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
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
      if (!option.isBest) {
        state.coachMode = "realLife";
      }
      renderActiveTopic();
    });

    refs.scenarioOptions.append(button);
  });

  refs.scenarioStatus.textContent = answer
    ? answer.isCorrect
      ? "Strong"
      : "Needs review"
    : "Not started";
  refs.scenarioFeedback.textContent =
    answer?.feedback ??
    "Choose the best action and see why it matters outside the textbook.";
};

const reviewTeachBack = (topic) => {
  const raw = refs.teachBackInput.value.trim();
  const words = raw.split(/\s+/).filter(Boolean);
  const normalized = raw.toLowerCase();
  const matched = topic.teachBack.keywords.filter((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
  const missing = topic.teachBack.keywords.filter((keyword) => !matched.includes(keyword));

  let isStrong = false;
  let feedback =
    "Add one more sentence so your explanation sounds like real teaching, not just a short memory line.";

  if (words.length >= 14 && matched.length >= 2) {
    isStrong = true;
    feedback = `Strong explanation. You brought in ${matched.join(", ")} and sounded like you were actually teaching the idea.`;
  } else if (words.length >= 9 && matched.length >= 1) {
    feedback = `Almost there. You have the core idea, but add one more concrete clue such as ${missing.slice(0, 2).join(" or ")}.`;
  } else if (words.length > 0) {
    feedback = `You started well, but this still feels thin. Try using at least two idea words like ${topic.teachBack.keywords.slice(0, 3).join(", ")}.`;
  }

  state.teachBack[topic.id] = {
    text: raw,
    isStrong,
    feedback,
  };

  renderActiveTopic();
};

const renderTeachBack = (topic) => {
  const answer = state.teachBack[topic.id];

  refs.teachBackPrompt.textContent = topic.teachBack.prompt;
  refs.teachBackInput.value = answer?.text ?? "";
  refs.teachBackStatus.textContent = answer
    ? answer.isStrong
      ? "Strong"
      : "Needs review"
    : "Not started";
  refs.teachBackFeedback.textContent =
    answer?.feedback ??
    "This MVP uses keyword-aware local feedback as a stand-in for a future AI tutor.";
};

const renderActiveTopic = () => {
  const topic = getActiveTopic();
  if (!topic) {
    return;
  }

  refs.overlayTime.textContent = topic.timestampLabel;
  refs.overlayTitle.textContent = topic.title;
  refs.overlayMission.textContent = topic.mission;

  refs.topicKicker.textContent = `Checkpoint ${String(state.activeIndex + 1).padStart(2, "0")}`;
  refs.topicTitle.textContent = topic.title;
  refs.topicRange.textContent = `${formatTime(topic.startSeconds)} - ${formatTime(topic.endSeconds)}`;
  refs.topicSource.textContent = topic.sourceAnchor;
  refs.topicMission.textContent = topic.mission;
  refs.topicRecap.textContent = topic.recap;
  refs.topicObservation.textContent = topic.observation;

  refs.journeyNote.textContent = state.autoPause
    ? "Auto-pause is on. The video will stop at the end of this checkpoint so the learner can act."
    : "Auto-pause is off. The learner can keep watching and still jump back into any checkpoint.";

  renderQuickCheck(topic);
  renderPuzzle(topic);
  renderCoach(topic);
  renderScenario(topic);
  renderTeachBack(topic);
  renderTimeline();
  renderCheckpointBar();
  renderRevisionQueue();
  updateMastery();
};

const setActiveTopicById = (topicId, shouldPause = false) => {
  const nextIndex = state.data.topics.findIndex((topic) => topic.id === topicId);
  if (nextIndex < 0) {
    return;
  }

  state.activeIndex = nextIndex;
  state.coachMode = "simple";
  state.pausedCheckpointId = null;
  renderActiveTopic();

  const topic = getActiveTopic();
  refs.lessonVideo.currentTime = topic.startSeconds;
  if (shouldPause) {
    refs.lessonVideo.pause();
  }
};

const syncTopicWithVideo = () => {
  const currentTime = refs.lessonVideo.currentTime;
  const topic =
    state.data.topics.find(
      (entry) =>
        currentTime >= entry.startSeconds &&
        (currentTime < entry.endSeconds ||
          entry.id === state.data.topics[state.data.topics.length - 1].id),
    ) ?? state.data.topics[state.data.topics.length - 1];

  if (topic && topic.id !== getActiveTopic()?.id) {
    state.activeIndex = state.data.topics.findIndex((entry) => entry.id === topic.id);
    state.coachMode = "simple";
    renderActiveTopic();
  }

  if (
    state.autoPause &&
    topic &&
    currentTime >= topic.endSeconds - 0.05 &&
    state.pausedCheckpointId !== topic.id
  ) {
    state.pausedCheckpointId = topic.id;
    refs.lessonVideo.pause();
    refs.journeyNote.textContent = `Video paused at ${topic.timestampLabel}. This is where the learner should do the checkpoint mission.`;
  }
};

const bindCoachButtons = () => {
  refs.coachButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.coachMode = button.dataset.coachMode;
      state.coachUses += 1;
      renderActiveTopic();
    });
  });
};

const bindVideo = () => {
  refs.autoPauseToggle.addEventListener("change", (event) => {
    state.autoPause = event.currentTarget.checked;
    state.pausedCheckpointId = null;
    renderActiveTopic();
  });

  refs.playTopicButton.addEventListener("click", () => {
    const topic = getActiveTopic();
    refs.lessonVideo.currentTime = topic.startSeconds;
    state.pausedCheckpointId = null;
    void refs.lessonVideo.play();
  });

  refs.lessonVideo.addEventListener("timeupdate", syncTopicWithVideo);
};

const boot = async () => {
  const response = await fetch(companionUrl, {cache: "no-store"});
  if (!response.ok) {
    throw new Error("Could not load the student companion package.");
  }

  state.data = await response.json();
  refs.chapterTitle.textContent = state.data.chapterTitle;
  refs.chapterSummary.textContent = state.data.summary;
  refs.sourceNote.textContent = state.data.sourceNote;
  refs.lessonVideo.src = state.data.videoUrl;

  bindCoachButtons();
  bindVideo();

  refs.teachBackSubmit.addEventListener("click", () => {
    reviewTeachBack(getActiveTopic());
  });

  renderActiveTopic();
};

boot().catch((error) => {
  refs.chapterTitle.textContent = "Student companion could not load";
  refs.chapterSummary.textContent =
    error instanceof Error ? error.message : "Unexpected error loading the prototype.";
});
