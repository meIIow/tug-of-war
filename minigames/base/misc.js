
const timer = function(totalMs, increments) {

  const sectionWidth = 5; // px
  const increment = totalMs / increments;
  const sections = [];
  let lock = 0;
  let parent = $(`<div class="timer-container"></div>`);
  this.root = parent;


  for (let i = 0; i < increments; i ++) {
    // const section = $(`<div class="timer" id="timer-${i}"></div>`);
    const section = $(`<div class="timer"></div>`);
    const size = (increments - i) * sectionWidth * 2;
    sections.push(section);

    section.css({
      'width': size,
      'height': size,
      'border-radius': size / 2,
    });

    parent.append(section);
    parent = section;
  }

  this.countdown = (lock, startTimeMs, i) => {
    if (this.lock != lock) return;
    const elapsed = new Date().getTime() - startTimeMs;
    sections[i-1].css({ 'background-color': 'transparent' });

    if (i >= increments) return;
    const nextInverval =
      startTimeMs + ((i + 1) * increment) - new Date().getTime();
    setTimeout(() => this.countdown(lock, startTimeMs, i + 1), nextInverval);
  }

  this.reset = () => {
    lock ++;
    for (const section in sections) {
      sections[section].css({ 'background-color': 'Grey' });
    }
  }

  this.appendTo = (element) => {
    element.append(this.root);
  }

}

module.exports = { timer };
