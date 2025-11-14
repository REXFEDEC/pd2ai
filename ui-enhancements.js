'use strict';

(function () {
  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(() => {
    const timelineElement = document.getElementById('progressTimeline');
    const timelineStatus = document.getElementById('timelineStatus');
    const progressTrackFill = document.getElementById('progressTrackFill');
    const timelineSteps = Array.from(document.querySelectorAll('.progress-step'));
    const summaryContent = document.getElementById('summaryContent');
    const resetButton = document.getElementById('resetButton');
    const uploadSection = document.getElementById('uploadSection');
    const processingHeading = document.getElementById('processingHeading');

    if (
      !timelineElement ||
      !timelineStatus ||
      !progressTrackFill ||
      timelineSteps.length === 0 ||
      !summaryContent ||
      !resetButton ||
      !uploadSection ||
      !processingHeading
    ) {
      return;
    }

    console.log('[UI] Enhancements initialized');

    const STEP_COUNT = timelineSteps.length;
    const stageProgress = {
      1: { base: 6, range: 32 },
      2: { base: 44, range: 28 },
      3: { base: 76, range: 18 }
    };

    const summaryController = (() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&';
      let scrambleTimer = null;
      let sourceText = 'Processing summary';

      function randomize(base) {
        if (!base) {
          base = 'Processing summary';
        }
        return base.replace(/\S/g, () => chars[Math.floor(Math.random() * chars.length)]);
      }

      function startTimer() {
        stopTimer();
        scrambleTimer = window.setInterval(() => {
          if (!summaryContent.classList.contains('is-obscured')) {
            stopTimer();
            return;
          }
          summaryContent.dataset.placeholder = randomize(sourceText);
        }, 320);
      }

      function stopTimer() {
        if (scrambleTimer) {
          window.clearInterval(scrambleTimer);
          scrambleTimer = null;
        }
      }

      return {
        obscure(initialText) {
          sourceText = initialText || sourceText;
          summaryContent.classList.add('is-obscured');
          summaryContent.dataset.placeholder = randomize(sourceText);
          startTimer();
        },
        update(statusText) {
          if (!summaryContent.classList.contains('is-obscured')) {
            return;
          }
          if (statusText) {
            sourceText = statusText;
          }
          summaryContent.dataset.placeholder = randomize(sourceText);
        },
        reveal() {
          if (!summaryContent.classList.contains('is-obscured')) {
            return;
          }
          summaryContent.classList.add('revealing');
          requestAnimationFrame(() => {
            summaryContent.classList.remove('is-obscured');
            summaryContent.dataset.placeholder = '';
            stopTimer();
            window.setTimeout(() => {
              summaryContent.classList.remove('revealing');
            }, 280);
          });
        },
        reset() {
          stopTimer();
          summaryContent.classList.remove('is-obscured', 'revealing');
          summaryContent.dataset.placeholder = '';
        }
      };
    })();

    const timelineState = {
      active: false,
      stage: 0,
      completed: false
    };

    function updateProcessingHeading(stage) {
      const headingCopy = stage === 3 ? 'Generating AI summary…' : 'Processing your PDF…';
      processingHeading.textContent = headingCopy;
    }

    function setResetAvailability(isEnabled) {
      resetButton.disabled = !isEnabled;
      resetButton.setAttribute('aria-disabled', String(!isEnabled));
      resetButton.classList.toggle('is-disabled', !isEnabled);
    }

    function resetStepVisuals() {
      timelineSteps.forEach((step) => {
        step.classList.remove('is-active', 'is-complete');
        step.classList.add('is-upcoming');
      });
    }

    function setStepState(stage) {
      timelineSteps.forEach((step, index) => {
        const position = index + 1;
        const isComplete = stage > STEP_COUNT;
        if (isComplete) {
          step.classList.add('is-complete');
          step.classList.remove('is-active', 'is-upcoming');
          return;
        }
        step.classList.toggle('is-complete', position < stage);
        step.classList.toggle('is-active', position === stage);
        step.classList.toggle('is-upcoming', position >= stage ? position !== stage : false);
      });
    }

    function parsePageProgress(statusText) {
      const match = /page\s+(\d+)\s+of\s+(\d+)/i.exec(statusText);
      if (!match) {
        return null;
      }
      const current = Number.parseInt(match[1], 10);
      const total = Number.parseInt(match[2], 10);
      if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
        return null;
      }
      return Math.max(0, Math.min(1, current / total));
    }

    function computeProgress(stage, statusText) {
      const config = stageProgress[stage];
      if (!config) {
        return 0;
      }
      const ratio = parsePageProgress(statusText);
      if (ratio === null) {
        return config.base + config.range * 0.25;
      }
      return config.base + config.range * ratio;
    }

    function updateLinearProgress(percent) {
      const clamped = Math.max(0, Math.min(100, percent));
      progressTrackFill.style.width = `${clamped}%`;
    }

    function determineStage(statusText) {
      const normalized = statusText.toLowerCase();
      if (normalized.includes('generating ai summary')) {
        return 3;
      }
      if (normalized.includes('ocr')) {
        return 2;
      }
      return 1;
    }

    function startTimeline() {
      if (timelineState.active) {
        return;
      }
      console.log('[UI] Timeline started');
      timelineState.active = true;
      timelineState.stage = 1;
      timelineState.completed = false;
      timelineElement.classList.remove('is-complete');
      timelineElement.classList.add('is-active');
      timelineElement.setAttribute('aria-hidden', 'false');
      resetStepVisuals();
      setStepState(1);
      updateLinearProgress(stageProgress[1].base);
      summaryController.obscure('Preparing summary');
      setResetAvailability(false);
      uploadSection.classList.add('is-hidden-upload');
      updateProcessingHeading(1);
    }

    function updateTimeline(statusText) {
      if (!statusText) {
        return;
      }
      startTimeline();
      const stage = determineStage(statusText);
      timelineState.stage = stage;
      setStepState(stage);
      const progress = computeProgress(stage, statusText);
      updateLinearProgress(Math.min(progress, 95));
      timelineStatus.textContent = statusText;
      summaryController.update(statusText);
      updateProcessingHeading(stage);
      console.log('[UI] Status update:', { stage, statusText, progress });
    }

    function completeTimeline(message) {
      if (!timelineState.active || timelineState.completed) {
        return;
      }
      console.log('[UI] Timeline complete');
      timelineState.completed = true;
      setStepState(STEP_COUNT + 1);
      updateLinearProgress(100);
      timelineStatus.textContent = message || 'Summary ready';
      summaryController.reveal();
      timelineElement.classList.add('is-complete');
      setResetAvailability(true);
      window.setTimeout(() => {
        timelineElement.classList.remove('is-active', 'is-complete');
        timelineElement.setAttribute('aria-hidden', 'true');
        updateLinearProgress(0);
        resetStepVisuals();
        timelineState.active = false;
        timelineState.stage = 0;
      }, 600);
    }

    function resetTimeline() {
      console.log('[UI] Timeline reset');
      timelineElement.classList.remove('is-active', 'is-complete');
      timelineElement.setAttribute('aria-hidden', 'true');
      updateLinearProgress(0);
      resetStepVisuals();
      timelineStatus.textContent = 'Initializing…';
      timelineState.active = false;
      timelineState.completed = false;
      timelineState.stage = 0;
      summaryController.reset();
      setResetAvailability(false);
      uploadSection.classList.remove('is-hidden-upload');
      updateProcessingHeading(1);
    }

    const summaryObserver = new MutationObserver(() => {
      if (timelineState.active && timelineState.stage === 3 && !timelineState.completed) {
        completeTimeline();
      }
    });

    summaryObserver.observe(summaryContent, { childList: true, subtree: true, characterData: true });

    if (typeof window.showProcessingSection === 'function') {
      const originalShowProcessingSection = window.showProcessingSection;
      window.showProcessingSection = function patchedShowProcessingSection(...args) {
        console.log('[UI] showProcessingSection invoked');
        startTimeline();
        originalShowProcessingSection.apply(this, args);
      };
    }

    if (typeof window.updateProcessingStatus === 'function') {
      const originalUpdateProcessingStatus = window.updateProcessingStatus;
      window.updateProcessingStatus = function patchedUpdateProcessingStatus(statusText) {
        console.log('[UI] updateProcessingStatus interception', statusText);
        updateTimeline(statusText);
        return originalUpdateProcessingStatus.call(this, statusText);
      };
    }

    if (typeof window.displaySummary === 'function') {
      const originalDisplaySummary = window.displaySummary;
      window.displaySummary = function patchedDisplaySummary(summaryText) {
        console.log('[UI] displaySummary interception');
        const result = originalDisplaySummary.call(this, summaryText);
        completeTimeline();
        return result;
      };
    }

    if (typeof window.resetApplication === 'function') {
      const originalResetApplication = window.resetApplication;
      window.resetApplication = function patchedResetApplication(...args) {
        console.log('[UI] resetApplication interception');
        const result = originalResetApplication.apply(this, args);
        resetTimeline();
        return result;
      };
    }

    window.addEventListener('beforeunload', () => {
      summaryObserver.disconnect();
    });

    resetTimeline();
  });
})();
