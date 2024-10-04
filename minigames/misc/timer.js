const timer = function(totalMs, increments, sectionGenerator, color) {

  const increment = totalMs / increments;
  const parent = $(`<div></div>`);
  let lock = 0;
  this.root = parent;

  const sections = sectionGenerator(increments, parent, color);

  this.countdown = (lock, startTimeMs, i, timeoutCallback) => {
    if (this.lock != lock) return;
    const elapsed = new Date().getTime() - startTimeMs;
    sections[i-1].css({ 'background-color': 'transparent' });

    console.log("hello")

    if (i >= increments) return timeoutCallback();
    const nextInverval =
      startTimeMs + ((i + 1) * increment) - new Date().getTime();
    setTimeout(() => this.countdown(lock, startTimeMs, i + 1, timeoutCallback), nextInverval);
  }

  this.reset = () => {
    lock ++;
    for (const section in sections) {
      sections[section].css({ 'background-color': color });
    }
  }

  this.appendTo = (element) => {
    element.append(this.root);
  }

}

const createRundownTimerSections = function(increments, parent, color) {
    const sections = []
    const incrementHeight = Math.floor(100 / increments);
    for (let i = 0; i < increments; i ++) {
        const section = $(`<div class="rundown-timer"></div>`);
        const height = `${(increments - i) * incrementHeight}%`;
        sections.push(section);
    
        section.css({
          'width': '100%',
          'height': height,
          'position': 'absolute',
          'bottom': 0,
          'left': 0,
          'background-color': color
        });
    
        parent.append(section);
        // parent = section;
    }
    return sections
}

//   let parent = $(`<div class="input-timer-container"></div>`);
// const circleInTimerVisual = function(increments, parent, sectionWidth) {
//     const sections = []
//     for (let i = 0; i < increments; i ++) {
//         const section = $(`<div class="timer"></div>`);
//         const size = (increments - i) * sectionWidth * 2;
//         sections.push(section);
    
//         section.css({
//           'width': size,
//           'height': size,
//           'border-radius': size / 2,
//         });
    
//         parent.append(section);
//         parent = section;
//     }
//     return sections
// }

const rundownTimer = function(totalMs, increments, color) {
    return new timer(totalMs, increments, createRundownTimerSections, color)
}

module.exports = { timer , rundownTimer };
