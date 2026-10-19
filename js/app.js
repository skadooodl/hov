(() => {
  "use strict";

  const LOADING_DURATION_MS = 8000;
  const CLOUDINARY_CLOUD_NAME = "nqygsmqv";
  const CLOUDINARY_VIDEO_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload`;
  const MODE_ORDER = ["easy", "average", "hard"];
  const app = document.getElementById("app");
  const screens = [...document.querySelectorAll(".screen")];
  const topbar = document.getElementById("topbar");
  const footer = document.getElementById("global-footer");
  const timerValue = document.getElementById("timer-value");
  const timerPlay = document.getElementById("timer-play");
  const timerReset = document.getElementById("timer-reset");
  const timerClock = document.getElementById("timer-clock");
  const timerDurationInput = document.getElementById("timer-duration-input");
  const timerEditForm = document.getElementById("timer-edit-form");
  const timeUpOverlay = document.getElementById("time-up-banner");
  const timeUpSound = document.getElementById("time-up-sound");
  const revealButton = document.getElementById("reveal-button");
  const markDoneButton = document.getElementById("mark-done-button");
  const answerReveal = document.getElementById("answer-reveal");
  const modal = document.getElementById("info-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const loadingVideoSource = document.querySelector("#loading-background source");
  let resizeMediaFrame = null;
  let resizeAnswerVideo = null;

  function cloudinaryVideoUrl(publicId) {
    return `${CLOUDINARY_VIDEO_BASE_URL}/${publicId}.mp4`;
  }

  const state = {
    screen: "intro",
    mode: null,
    roundIndex: 0,
    answerRevealed: false,
    timerState: "idle",
    remainingMs: 0,
    durationMs: 0,
    deadline: null,
    timerInterval: null,
    timeUpTimeout: null
  };
  let completedRounds = readStoredRounds();
  let selectedMode = null;

  function readStoredRounds() {
    try {
      const value = JSON.parse(localStorage.getItem("memeViceCompletedRounds") || "{}");
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};
      return Object.fromEntries(MODE_ORDER.map((mode) => [
        mode,
        Array.isArray(value[mode])
          ? [...new Set(value[mode].filter((round) => Number.isInteger(round) && round >= 0 && round < MODE_CONFIG[mode].rounds))]
          : []
      ]));
    } catch (error) {
      console.warn("Could not read completed rounds from local storage.", error);
      return Object.fromEntries(MODE_ORDER.map((mode) => [mode, []]));
    }
  }

  function setScreen(name) {
    if (state.screen === "round" && name !== "round" && state.timerState === "running") {
      stopTimer();
      state.timerState = "paused";
      updateTimerDisplay();
    }
    state.screen = name;
    app.dataset.screen = name;
    screens.forEach((screen) => {
      const active = screen.id === `screen-${name}`;
      screen.classList.toggle("is-active", active);
      screen.setAttribute("aria-hidden", String(!active));
    });
    if (name !== "loading") document.getElementById("screen-loading").classList.remove("is-loading");
    topbar.hidden = name === "loading";
    footer.hidden = name === "intro" || name === "loading";
    if (name !== "round") clearTimeUpOverlay();
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function beginLoading() {
    setScreen("loading");
    const loadingScreen = document.getElementById("screen-loading");
    const progressFill = loadingScreen.querySelector(".loading-progress-fill");
    loadingScreen.style.setProperty("--loading-duration", `${LOADING_DURATION_MS}ms`);
    loadingScreen.classList.remove("is-loading");
    void loadingScreen.offsetWidth;
    progressFill.addEventListener("animationend", () => {
      if (state.screen !== "loading") return;
      renderMenu();
      setScreen("menu");
    }, { once: true });
    loadingScreen.classList.add("is-loading");
    const loadingVideo = document.getElementById("loading-background");
    loadingVideo.load();
    loadingVideo.currentTime = 0;
    loadingVideo.play().catch((error) => {
      console.error("Could not play the loading background video.", error);
    });
  }

  function renderMenu(mode = null) {
    selectedMode = mode;
    const grid = document.getElementById("mode-grid");
    grid.replaceChildren();
    const backButton = document.getElementById("menu-back-button");
    backButton.hidden = !mode;
    backButton.onclick = () => renderMenu();
    const heading = document.getElementById("menu-title");
    const kicker = document.querySelector("#screen-menu .eyebrow");
    if (mode) {
      const config = MODE_CONFIG[mode];
      kicker.textContent = `${config.label} MODE`;
      heading.innerHTML = "Choose a <em>Meme</em>";
      for (let roundIndex = 0; roundIndex < config.rounds; roundIndex += 1) {
        const done = completedRounds[mode].includes(roundIndex);
        const question = QUESTIONS[mode][roundIndex];
        const card = document.createElement("button");
        card.type = "button";
        card.className = `mode-card round-card${done ? " is-completed" : ""}`;
        card.style.setProperty("--round-card-image", `url("../assets/images/${question.cardImage}")`);
        card.setAttribute("aria-label", `${config.label} round ${roundIndex + 1}: ${question.title}${done ? ", completed" : ""}`);
        card.innerHTML = `
          <span class="mode-rounds">${question.title}</span>
          ${done
            ? '<span class="round-completed-mark" aria-label="Completed">✓</span>'
            : ""}`;
        card.addEventListener("click", () => startMode(mode, roundIndex));
        grid.append(card);
      }
      return;
    }
    kicker.textContent = "CHOOSE YOUR CATEGORY";
    heading.innerHTML = "Pick your <em>vice.</em>";
    MODE_ORDER.forEach((mode) => {
      const config = MODE_CONFIG[mode];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mode-card";
      card.dataset.mode = mode;
      card.setAttribute("aria-label", `Choose ${config.label.toLowerCase()} mode`);
      card.innerHTML = `
        ${completedRounds[mode].length === config.rounds ? '<span class="completed-mark" aria-label="All rounds completed">✓</span>' : ""}
        <span class="mode-label">${config.label}</span>`;
      card.addEventListener("click", () => renderMenu(mode));
      grid.append(card);
    });
  }

  function startMode(mode, roundIndex) {
    state.mode = mode;
    state.roundIndex = roundIndex;
    state.durationMs = MODE_CONFIG[mode].duration * 1000;
    renderRound();
    setScreen("round");
  }

  function setRoundCompleted(completed) {
    const rounds = completedRounds[state.mode];
    const isCompleted = rounds.includes(state.roundIndex);
    if (isCompleted === completed) return;
    if (completed) rounds.push(state.roundIndex);
    else rounds.splice(rounds.indexOf(state.roundIndex), 1);
    try {
      localStorage.setItem("memeViceCompletedRounds", JSON.stringify(completedRounds));
    } catch (error) {
      console.warn("Could not save completed rounds to local storage.", error);
    }
  }

  function getQuestion() {
    const question = QUESTIONS[state.mode][state.roundIndex];
    if (question.type === "caption") return question;
    const filePrefix = { easy: "easy", average: "ave", hard: "hard" }[state.mode];
    const fileStem = `${filePrefix}-${state.roundIndex + 1}`;
    return {
      ...question,
      type: "video",
      video: cloudinaryVideoUrl(fileStem),
      answerVideo: cloudinaryVideoUrl(`${fileStem}-answer`),
      filenameFallback: (question.image || question.video) ? question : null
    };
  }

  function renderRound() {
    stopTimer();
    state.answerRevealed = false;
    const config = MODE_CONFIG[state.mode];
    const question = getQuestion();
    app.dataset.mode = state.mode;
    const answerMedia = document.getElementById("answer-media");
    answerMedia.querySelectorAll("video").forEach((video) => video.pause());
    answerMedia.replaceChildren();
    resizeAnswerVideo = null;
    document.getElementById("mode-eyebrow").textContent = `${config.label} MODE`;
    document.getElementById("round-heading").innerHTML = `ROUND ${state.roundIndex + 1} <span>OF ${config.rounds}</span>`;
    const roundProgress = document.getElementById("round-progress");
    roundProgress.setAttribute("aria-valuemax", String(config.rounds));
    roundProgress.setAttribute("aria-valuenow", String(state.roundIndex + 1));
    roundProgress.setAttribute("aria-valuetext", `Round ${state.roundIndex + 1} of ${config.rounds}`);
    roundProgress.style.setProperty("--round-progress", `${((state.roundIndex + 1) / config.rounds) * 100}%`);
    document.getElementById("prize-amount").textContent = `₱${config.prize}`;
    const questionCaption = document.getElementById("question-caption");
    const questionCaptionHeading = document.getElementById("question-caption-heading");
    const questionCaptionDialogue = document.getElementById("question-caption-dialogue");
    questionCaptionHeading.textContent = question.heading || "";
    questionCaptionHeading.hidden = !question.heading;
    questionCaptionDialogue.replaceChildren();
    (question.prompt || "").split("\n").forEach((phrase, phraseIndex) => {
      if (phraseIndex > 0) questionCaptionDialogue.append(document.createElement("br"));
      questionCaptionDialogue.append(document.createTextNode(": "));
      phrase.split(/(_{3,})/g).forEach((part) => {
        if (/^_{3,}$/.test(part)) {
          const blank = document.createElement("span");
          blank.className = "question-caption-blank";
          blank.textContent = part;
          questionCaptionDialogue.append(blank);
        } else {
          questionCaptionDialogue.append(document.createTextNode(part));
        }
      });
    });
    questionCaption.hidden = !question.heading && !question.prompt;
    renderQuestion(question);
    answerReveal.hidden = true;
    document.getElementById("answer-text").textContent = "";
    revealButton.hidden = false;
    updateRevealButton();
    revealButton.disabled = false;
    markDoneButton.hidden = true;
    updateMarkDoneButton();
    const acceptedAnswers = document.getElementById("accepted-answers");
    acceptedAnswers.textContent = question.accepted.join(" · ");
    acceptedAnswers.hidden = question.accepted.length === 0;
    document.getElementById("accepted-label").hidden = question.accepted.length === 0;
    document.getElementById("time-up-banner").hidden = true;
    setTimerForNewRound();
  }

  function renderQuestion(question) {
    const display = document.getElementById("meme-display");
    resizeMediaFrame = null;
    const currentVideo = display.querySelector("video");
    if (currentVideo) currentVideo.pause();
    display.replaceChildren();
    display.classList.remove("is-media");
    display.style.removeProperty("--media-frame-width");
    display.style.removeProperty("--media-frame-height");
    if (question.type === "caption") {
      const caption = document.createElement("div");
      caption.className = "caption-prompt";
      const text = question.prompt;
      const blankIndex = text.indexOf("_____");
      if (blankIndex >= 0) {
        caption.append(document.createTextNode(text.slice(0, blankIndex)));
        const blank = document.createElement("span");
        blank.className = "blank";
        blank.textContent = "_____";
        caption.append(blank, document.createTextNode(text.slice(blankIndex + 5)));
      } else {
        caption.textContent = text.replace(/_____/g, "_____");
      }
      display.append(caption);
      return;
    }
    const mediaPath = question.video || question.image;
    const isVideo = Boolean(question.video) || /\.(mp4|webm|ogv|ogg)(?:[?#].*)?$/i.test(mediaPath);
    const placeholder = document.createElement("div");
    placeholder.className = "meme-placeholder";
    placeholder.innerHTML = `<span class="meme-emoji" aria-hidden="true">${getMemeEmoji(mediaPath)}</span><span class="meme-name">${getMemeName(mediaPath)}</span>`;

    const media = document.createElement(isVideo ? "video" : "img");
    if (isVideo) {
      media.src = mediaPath;
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
      media.setAttribute("aria-label", `${getMemeName(mediaPath)} meme video`);
      media.addEventListener("loadedmetadata", fitMedia);
    } else {
      media.src = mediaPath;
      media.alt = `${getMemeName(mediaPath)} meme image`;
      media.addEventListener("load", fitMedia, { once: true });
    }

    function fitMedia() {
      const width = isVideo ? media.videoWidth : media.naturalWidth;
      const height = isVideo ? media.videoHeight : media.naturalHeight;
      if (!width || !height) return;
      resizeMediaFrame = () => {
        const stage = display.parentElement;
        const maxWidth = stage.clientWidth;
        const caption = document.getElementById("question-caption");
        const captionHeight = caption.hidden ? 0 : caption.offsetHeight;
        const maxHeight = Math.max(1, Math.min(stage.clientHeight - captionHeight - 20, window.innerHeight * (window.matchMedia("(max-width: 760px)").matches ? .42 : .68), 700));
        const scale = Math.min(maxWidth / width, maxHeight / height);
        display.style.setProperty("--media-frame-width", `${width * scale}px`);
        display.style.setProperty("--media-frame-height", `${height * scale}px`);
        display.classList.add("is-media");
      };
      resizeMediaFrame();
    }

    media.onerror = () => {
      resizeMediaFrame = null;
      if (question.filenameFallback) {
        console.warn(`Round video not found at ${mediaPath}; using the configured question media.`);
        renderQuestion(question.filenameFallback);
        return;
      }
      display.classList.remove("is-media");
      display.style.removeProperty("--media-frame-width");
      display.style.removeProperty("--media-frame-height");
      media.remove();
      display.append(placeholder);
      console.error(`Could not load meme media: ${mediaPath}`);
    };
    display.append(media);
  }

  window.addEventListener("resize", () => {
    if (resizeMediaFrame) resizeMediaFrame();
    if (resizeAnswerVideo) resizeAnswerVideo();
  });

  function getMemeName(path) {
    return path.split("/").pop().replace(/\.[^.]+$/, "").replace(/-/g, " ");
  }

  function getMemeEmoji(path) {
    const emojiByName = {
      "distracted-boyfriend": "👀",
      "expanding-brain": "🧠",
      "this-is-fine": "🔥",
      "woman-yelling-at-cat": "🙀",
      "drake-hotline-bling": "🎵",
      "roll-safe": "🤔",
      "keyboard-cat": "🐈",
      "nyan-cat": "🌈"
    };
    const slug = path.split("/").pop().replace(/\.[^.]+$/, "");
    return emojiByName[slug] || "😂";
  }

  function setTimerForNewRound() {
    state.timerState = "idle";
    state.durationMs = MODE_CONFIG[state.mode].duration * 1000;
    state.remainingMs = state.durationMs;
    state.deadline = null;
    timerEditForm.hidden = true;
    timerClock.classList.remove("is-editing");
    timerDurationInput.value = formatTimerDuration(state.remainingMs);
    clearTimeUpOverlay();
    updateTimerDisplay();
  }

  function addTimerTime(seconds) {
    const addedMs = seconds * 1000;
    if (state.timerState === "running") {
      state.deadline += addedMs;
      state.remainingMs = state.deadline - Date.now();
    } else {
      if (state.timerState === "finished") {
        state.timerState = "paused";
        state.remainingMs = addedMs;
      } else {
        state.remainingMs += addedMs;
      }
    }
    state.durationMs += addedMs;
    timerDurationInput.value = formatTimerDuration(state.durationMs);
    clearTimeUpOverlay();
    updateTimerDisplay();
  }

  function formatTimerDuration(durationMs) {
    const totalSeconds = Math.ceil(durationMs / 1000);
    const minutesText = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secondsText = String(totalSeconds % 60).padStart(2, "0");
    return `${minutesText}:${secondsText}`;
  }

  function applyTimerDuration(value) {
    const match = /^(\d{2}):([0-5]\d)$/.exec(value);
    if (!match) {
      timerDurationInput.setCustomValidity("Enter the timer as MM:SS, with seconds from 00 to 59.");
      timerDurationInput.reportValidity();
      timerDurationInput.setCustomValidity("");
      return;
    }
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const durationMs = (minutes * 60 + seconds) * 1000;
    if (durationMs === 0) {
      timerDurationInput.setCustomValidity("Enter a duration greater than 00:00.");
      timerDurationInput.reportValidity();
      timerDurationInput.setCustomValidity("");
      return;
    }
    state.durationMs = durationMs;
    state.remainingMs = state.durationMs;
    state.deadline = state.timerState === "running" ? Date.now() + state.durationMs : null;
    if (state.timerState === "finished") state.timerState = "paused";
    timerEditForm.hidden = true;
    timerClock.classList.remove("is-editing");
    timerValue.focus();
    clearTimeUpOverlay();
    updateTimerDisplay();
  }

  function openTimerEditor() {
    if (timerEditForm.hidden) {
      timerDurationInput.value = formatTimerDuration(state.remainingMs);
      timerEditForm.hidden = false;
      timerClock.classList.add("is-editing");
      timerDurationInput.focus();
      timerDurationInput.select();
    }
  }

  function clearTimeUpOverlay() {
    if (state.timeUpTimeout !== null) {
      clearTimeout(state.timeUpTimeout);
      state.timeUpTimeout = null;
    }
    timeUpOverlay.hidden = true;
    timeUpSound.pause();
    timeUpSound.currentTime = 0;
  }

  function hideTimeUpOverlay() {
    state.timeUpTimeout = null;
    timeUpOverlay.hidden = true;
  }

  function startOrPauseTimer() {
    if (state.screen !== "round" || state.timerState === "finished") return;
    if (state.timerState === "running") {
      state.remainingMs = Math.max(0, state.deadline - Date.now());
      stopTimer();
      state.timerState = "paused";
      updateTimerDisplay();
      return;
    }
    if (state.timerState === "idle" || state.timerState === "paused") {
      if (state.remainingMs <= 0) return;
      state.deadline = Date.now() + state.remainingMs;
      state.timerState = "running";
      clearInterval(state.timerInterval);
      state.timerInterval = window.setInterval(tickTimer, 100);
      tickTimer();
    }
  }

  function stopTimer() {
    if (state.timerInterval !== null) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    if (state.timerState === "running") state.remainingMs = Math.max(0, state.deadline - Date.now());
  }

  function resetTimer() {
    stopTimer();
    state.timerState = "idle";
    state.remainingMs = 0;
    state.durationMs = 0;
    state.deadline = null;
    timerEditForm.hidden = true;
    timerClock.classList.remove("is-editing");
    timerDurationInput.value = formatTimerDuration(state.remainingMs);
    clearTimeUpOverlay();
    updateTimerDisplay();
  }

  function tickTimer() {
    state.remainingMs = Math.max(0, state.deadline - Date.now());
    updateTimerDisplay();
    if (state.remainingMs <= 0) finishTimer();
  }

  function updateTimerDisplay() {
    const seconds = Math.ceil(state.remainingMs / 1000);
    const minutesText = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secondsText = String(seconds % 60).padStart(2, "0");
    if (timerEditForm.hidden) timerValue.textContent = `${minutesText}:${secondsText}`;
    const isCritical = state.timerState === "running" && state.remainingMs <= 5000 && state.remainingMs > 0;
    timerValue.classList.toggle("is-critical", isCritical);
    const isRunning = state.timerState === "running";
    timerPlay.classList.toggle("is-running", isRunning);
    timerPlay.disabled = !isRunning && state.remainingMs <= 0;
    timerPlay.setAttribute("aria-label", isRunning ? "Pause timer" : "Start timer");
    timerPlay.title = isRunning ? "Pause timer" : "Start timer";
    timerValue.setAttribute("aria-label", `Timer ${minutesText}:${secondsText}. Double-click to set the duration.`);
  }

  function finishTimer() {
    if (state.timerState !== "running" || state.deadline === null) return;
    stopTimer();
    state.remainingMs = 0;
    state.timerState = "finished";
    updateTimerDisplay();
    timeUpOverlay.hidden = false;
    timeUpSound.currentTime = 0;
    timeUpSound.play().catch((error) => {
      console.warn("The timer expired, but the time-up sound could not play.", error);
    });
    state.timeUpTimeout = window.setTimeout(hideTimeUpOverlay, 3000);
  }

  function revealAnswer() {
    if (state.screen !== "round") return;
    if (state.answerRevealed) {
      state.answerRevealed = false;
      updateRevealButton();
      answerReveal.hidden = true;
      const answerMedia = document.getElementById("answer-media");
      answerMedia.querySelectorAll("video").forEach((video) => video.pause());
      answerMedia.replaceChildren();
      resizeAnswerVideo = null;
      return;
    }
    state.answerRevealed = true;
    updateRevealButton();
    const question = getQuestion();
    const answerText = document.getElementById("answer-text");
    answerText.textContent = question.answer || "Play the answer video below.";
    const acceptedAnswers = document.getElementById("accepted-answers");
    acceptedAnswers.textContent = question.accepted.join(" · ");
    acceptedAnswers.hidden = question.accepted.length === 0;
    document.getElementById("accepted-label").hidden = question.accepted.length === 0;
    const questionMediaPath = question.video || question.image;
    const answerVideoPath = question.answerVideo || (questionMediaPath
      ? questionMediaPath.replace(/\.[^.]+$/, "-answer.mp4")
      : null);
    if (answerVideoPath) {
      const video = document.createElement("video");
      video.src = answerVideoPath;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", "Meme answer video");
      resizeAnswerVideo = () => {
        if (!video.videoWidth || !video.videoHeight) return;
        const container = video.parentElement;
        const maxHeight = Math.min(window.innerHeight * (window.matchMedia("(max-width: 760px)").matches ? .4 : .48), 480);
        const scale = Math.min(container.clientWidth / video.videoWidth, maxHeight / video.videoHeight);
        video.style.width = `${video.videoWidth * scale}px`;
        video.style.height = `${video.videoHeight * scale}px`;
      };
      video.addEventListener("loadedmetadata", resizeAnswerVideo, { once: true });
      let fallbackAttempted = false;
      video.addEventListener("error", () => {
        if (!fallbackAttempted && question.filenameFallback?.answerVideo) {
          fallbackAttempted = true;
          console.warn(`Round answer video not found at ${answerVideoPath}; using the configured answer video.`);
          video.src = question.filenameFallback.answerVideo;
          video.load();
          return;
        }
        console.warn(`No answer video found at ${answerVideoPath}.`);
        if (!question.answer) answerText.textContent = "Answer video unavailable.";
        resizeAnswerVideo = null;
        video.remove();
      }, { once: true });
      document.getElementById("answer-media").append(video);
    }
    answerReveal.hidden = false;
    updateMarkDoneButton();
  }

  function updateRevealButton() {
    const label = state.answerRevealed ? "Hide answer" : "Reveal answer";
    revealButton.setAttribute("aria-label", label);
    revealButton.title = label;
    revealButton.setAttribute("aria-pressed", String(state.answerRevealed));
    revealButton.classList.toggle("is-revealed", state.answerRevealed);
  }

  function updateMarkDoneButton() {
    const isCompleted = completedRounds[state.mode].includes(state.roundIndex);
    markDoneButton.hidden = !state.answerRevealed;
    markDoneButton.textContent = isCompleted ? "UNMARK AS DONE" : "MARK AS DONE";
    markDoneButton.setAttribute("aria-pressed", String(isCompleted));
  }

  function toggleRoundCompletion() {
    if (state.screen !== "round" || !state.answerRevealed) return;
    setRoundCompleted(!completedRounds[state.mode].includes(state.roundIndex));
    updateMarkDoneButton();
  }

  function returnToMemePicker() {
    if (state.screen !== "round" || !state.answerRevealed) return;
    renderMenu(state.mode);
    setScreen("menu");
  }

  function renderConfetti() {
    const layer = document.getElementById("confetti-layer");
    layer.replaceChildren();
    if (reduceMotion.matches) return;
    const colors = ["var(--accent)", "var(--pink-soft)", "var(--text)"];
    for (let index = 0; index < 54; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.setProperty("--x", `${Math.random() * 100}%`);
      piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
      piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
      piece.style.setProperty("--fall-delay", `${Math.random() * 1.2}s`);
      piece.style.setProperty("--fall-duration", `${2.6 + Math.random() * 2.2}s`);
      piece.style.setProperty("--confetti-color", colors[index % colors.length]);
      layer.append(piece);
    }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    document.getElementById("theme-toggle").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    document.getElementById("theme-icon").textContent = dark ? "☼" : "☾";
    try {
      localStorage.setItem("memeViceTheme", theme);
    } catch (error) {
      console.warn("Could not save theme preference to local storage.", error);
    }
  }

  function loadTheme() {
    try {
      setTheme(localStorage.getItem("memeViceTheme") === "light" ? "light" : "dark");
    } catch (error) {
      console.warn("Could not read theme preference from local storage.", error);
      setTheme("dark");
    }
  }

  const modalCopy = {
    mechanics: {
      title: "How to Play",
      content: `<ol>
        <li>The host will display a meme image or an incomplete caption with the next line missing.</li>
        <li>Players must guess the correct continuation of the meme before the timer runs out.</li>
        <li>Answers must be submitted through the designated chatbox.</li>
      </ol>`
    },
    rules: {
      title: "Answering Rules",
      content: `<ol>
        <li>The timer begins when the host starts it as the meme or incomplete caption is displayed.</li>
        <li>Players must submit their answers in the chatbox before the timer reaches zero.</li>
        <li>Answers must match the original meme line or an accepted variation determined by the host.</li>
        <li>Once an answer is submitted, it cannot be changed.</li>
        <li>Answers submitted after the timer expires will not be accepted.</li>
        <li>No searching online or receiving outside assistance is allowed during the round.</li>
      </ol>
      <div class="cash-prizes">
        <h3>CASH PRIZES</h3>
        <p>EASY MODE: ₱20 per correct answer</p>
        <p>AVERAGE MODE: ₱30 per correct answer</p>
        <p>HARDCORE MODE: ₱50 per correct answer</p>
        <p class="muted-copy">“Chatbox” refers to the Discord chat.</p>
      </div>`
    }
  };

  function openModal(name, trigger) {
    const copy = modalCopy[name];
    if (!copy) return;
    modalTitle.textContent = copy.title;
    modalContent.innerHTML = copy.content;
    modal.showModal();
    modal.dataset.returnFocus = trigger?.id || "";
    modal.querySelector(".modal-close").focus();
  }

  document.getElementById("intro-play").addEventListener("click", beginLoading);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  document.querySelectorAll("[data-modal]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.modal, button));
  });
  modal.querySelector(".modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener("close", () => {
    const triggerId = modal.dataset.returnFocus;
    if (triggerId) document.getElementById(triggerId)?.focus();
  });
  timerPlay.addEventListener("click", startOrPauseTimer);
  timerReset.addEventListener("click", resetTimer);
  timerValue.addEventListener("dblclick", openTimerEditor);
  timerValue.addEventListener("keydown", (event) => {
    if (event.key === "Enter") openTimerEditor();
  });
  timerDurationInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      timerEditForm.hidden = true;
      timerClock.classList.remove("is-editing");
      timerValue.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      applyTimerDuration(timerDurationInput.value);
    }
  });
  timerDurationInput.addEventListener("input", () => {
    const digits = timerDurationInput.value.replace(/\D/g, "").slice(0, 4);
    timerDurationInput.value = digits.length > 2
      ? `${digits.slice(0, 2)}:${digits.slice(2)}`
      : digits;
    timerDurationInput.setCustomValidity("");
    if (digits.length === 4) applyTimerDuration(timerDurationInput.value);
  });
  document.querySelectorAll(".timer-add").forEach((button) => {
    button.addEventListener("click", () => addTimerTime(Number(button.dataset.addTime)));
  });
  timerEditForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyTimerDuration(timerDurationInput.value);
  });
  document.getElementById("round-back-button").addEventListener("click", () => {
    if (!state.mode) return;
    renderMenu(state.mode);
    setScreen("menu");
  });
  revealButton.addEventListener("click", revealAnswer);
  markDoneButton.addEventListener("click", toggleRoundCompletion);
  document.getElementById("play-again").addEventListener("click", () => {
    renderMenu(state.mode);
    setScreen("menu");
  });
  document.getElementById("back-to-menu").addEventListener("click", () => {
    renderMenu();
    setScreen("menu");
  });
  document.querySelector(".wordmark").addEventListener("click", (event) => {
    event.preventDefault();
    if (state.screen === "round" && state.mode) {
      renderMenu(state.mode);
      setScreen("menu");
    }
  });
  const shortcutsToggle = document.getElementById("shortcuts-toggle");
  const shortcutsPanel = document.getElementById("shortcuts-panel");
  shortcutsToggle.addEventListener("click", () => toggleShortcuts());

  function toggleShortcuts() {
    shortcutsPanel.hidden = !shortcutsPanel.hidden;
    shortcutsToggle.setAttribute("aria-expanded", String(!shortcutsPanel.hidden));
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen could not be toggled in this browser context.", error);
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal.open) modal.close();
      return;
    }
    if (modal.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "?") {
      event.preventDefault();
      toggleShortcuts();
      return;
    }
    if (state.screen === "intro" || state.screen === "loading") return;
    const key = event.key.toLowerCase();
    if (key === " " && state.screen === "round") {
      event.preventDefault();
      startOrPauseTimer();
    } else if (key === "r" && state.screen === "round") {
      resetTimer();
    } else if (key === "a" && state.screen === "round") {
      revealAnswer();
    } else if ((key === "n" || event.key === "ArrowRight") && state.screen === "round") {
      returnToMemePicker();
    } else if (key === "f") {
      toggleFullscreen();
    }
  });

  loadingVideoSource.src = cloudinaryVideoUrl(loadingVideoSource.dataset.publicId);
  loadTheme();
  setScreen("intro");
})();
