import React from 'react';
import styles from './PomodoroTimer.css';

class PomodoroTimer extends React.Component {

  state = {
    isDragging: false,
    oldPosX: 0,
    pixelPos: 0,
    timePos: 0,
    pixelWidth: 630,
    secondsWidth: 25,
    timeMultiplier: 1000 * 60,
  };

  let tickSound = new Howl({
    urls: ['http://reneroth.org/projects/codepen/pomodoro_tick.ogg', 'http://reneroth.org/projects/codepen/pomodoro_tick.mp3'],
    loop: true,
    volume:0.5
  });
  let turnSound = new Howl({
    urls: ['http://reneroth.org/projects/codepen/pomodoro_turn.ogg', 'http://reneroth.org/projects/codepen/pomodoro_turn.mp3']
  });
  let isTickPlaying = false;
  let turnSoundDist = 25 / 2;
  let ringSound = new Howl({
    urls: ['http://reneroth.org/projects/codepen/pomodoro_ring.ogg', 'http://reneroth.org/projects/codepen/pomodoro_ring.mp3'],
    volume: 1.0
  });

  tomatoMouseDown = (e) => {
    e.preventDefault();
    this.setState({
      isDragging: true
    })
  };

  const renderTimerStyle = () => {
    return {
      'transform': `translateX(-${pixelPos}px)`,
      '-ms-transform': `translateX(-${pixelPos}px)`,
      '-moz-transform': `translateX(-${pixelPos}px)`,
      '-webkit-transform': `translateX(-${pixelPos}px)`,
    }
  };

  let lastTurnPos = 0;

  onContainerMouseMover = (e) => {
    e.preventDefault();
    if (isDragging) {
      let moveX = e.pageX - oldPosX;
      pixelPos -= moveX;
      pixelPos = Math.max(0, Math.min(pixelPos, pixelWidth));
      timePos = Math.ceil(pixelPos * secondsWidth / pixelWidth * timeMultiplier);
      this.setState();
      if (moveX > 0) {
        lastTurnPos = e.pageX;
      }
      if (e.pageX - lastTurnPos < -turnSoundDist) {
        if (pixelPos < pixelWidth) {
          turnSound.play();
        }
        lastTurnPos = e.pageX;
      }
    } else {
      lastTurnPos = e.pageX;
    }
    oldPosX = e.pageX;
  };

  render() {
    return (
      <div className={styles.container} onMouseMove={this.onContainerMouseMover}>

        <svg style={{'display': 'none'}}>
          <defs>
            <path id="stempath"
                  d="M45.263 56.325c-4.153 2.877-8.688 3.997-13.684 2.947-6.75-1.42-12.658-.133-17.343 5.274-.444.513-1.154.795-1.945.841 8.279-12.713 19.369-20.347 35.181-19.185-1.142-4.912-2.697-9.386-8.229-10.989 8.393-2.329 14.908.648 20.39 6.482 4.967-3.077 7.65-6.526 12.7-16.222 2.45 6.292 1.399 11.899-3.969 20.682 3.378 1.556 6.882 2.05 10.168.448 3.099-1.51 5.857-3.72 9.176-5.891-1.793 6.643-5.919 10.74-11.471 13.709-5.747 3.074-11.571 1.879-16.764.42l-9.355 19.685c-4.165-4.978-4.672-11.17-4.276-17.6l.219-.991-.798.39z"/>
          </defs>
        </svg>

        <div className={styles.main}>
          <div className={styles.sound}/>
          <svg className="stem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <use xlinkHref="#stempath"/>
          </svg>
          <div className="tomato" onMouseDown={this.tomatoMouseDown}>
            <div id="timeline" className={styles.timeline} />
          </div>
        </div>

      </div>
    )
  }
}

PomodoroTimer.propTypes = {
};

export default PomodoroTimer;
