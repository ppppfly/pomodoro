import React from 'react';
import styles from './PomodoroTimer.css';
import 'font-awesome/css/font-awesome.css';
import './font.css';
import './sound/pomodoro_ring.mp3';
import './sound/pomodoro_ring.ogg';
import './sound/pomodoro_tick.mp3';
import './sound/pomodoro_tick.ogg';
import './sound/pomodoro_turn.mp3';
import './sound/pomodoro_turn.ogg';
import {Howl} from 'howler';
import {TweenMax, Power1} from 'gsap';

class PomodoroTimer extends React.Component {

  static defaultProps = {
    pixelWidth: 630,
    secondsWidth: 25,
    timeMultiplier: 1000 * 60,
    turnSoundDist: 25 / 2,
    tickSound: new Howl({
      src: ['./sound/pomodoro_tick.ogg', './sound/pomodoro_tick.mp3'],
      loop: true,
      volume:0.5
    }),
    turnSound: new Howl({
      src: ['./sound/pomodoro_turn.ogg', './sound/pomodoro_turn.mp3']
    }),
    ringSound: new Howl({
      src: ['./sound/pomodoro_ring.ogg', './sound/pomodoro_ring.mp3'],
      volume: 1.0
    }),
  };

  state = {
    isDragging: false,
    oldPosX: 0,
    pixelPos: 0,
    timePos: 0,
    isTickPlaying: false,
    lastTurnPos: 0,
    lastTick: Date.now(),
  };

  tomatoMouseDown = (e) => {
    e.preventDefault();
    this.setState({isDragging: true})
  };

  renderTimerStyle = () => {
    return {
      'transform': `translateX(-${this.state.pixelPos}px)`
    }
  };

  onTouchMove = (e) => {
    const {secondsWidth, pixelWidth, timeMultiplier, turnSoundDist} = this.props;
    const {turnSound} = this.props;

    let lastTurnPos = this.state.lastTurnPos;
    let pixelPos = this.state.pixelPos;
    let timePos = this.state.timePos;
    let oldPosX = this.state.oldPosX;

    if (this.state.isDragging) {
      let moveX = e.pageX - oldPosX;
      pixelPos -= moveX;
      pixelPos = Math.max(0, Math.min(pixelPos, pixelWidth));
      timePos = Math.ceil((pixelPos / pixelWidth) * (secondsWidth * timeMultiplier));

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

    this.setState({timePos, pixelPos, lastTurnPos, oldPosX});
  };

  onContainerMouseMove = (e) => {
    e.preventDefault();
    this.onTouchMove(e)
  };

  onContainerMouseUp = (e) => {
    e.preventDefault();
    this.setState({isDragging: false})
  };

  onTouchEnd = (e) => {
    this.setState({isDragging: false})
  };

  doTick = () => {

    const {tickSound, ringSound, secondsWidth, timeMultiplier, pixelWidth} = this.props;
    let {lastTick, isDragging, timePos, isTickPlaying, pixelPos} = this.state;

    setTimeout(this.doTick, 10); //setTimeout so the timer will continue running even if in the background
    let tickDuration = Date.now() - lastTick;
    lastTick = Date.now();
    if (isDragging || timePos <= 0) {
      if (isTickPlaying) {
        tickSound.stop();
        this.setState({isTickPlaying: false, lastTick})
      }
      return;
    }
    if (!isTickPlaying) {
      tickSound.play();
      isTickPlaying = true
    }
    timePos -= tickDuration;
    timePos = Math.max(0, Math.min(timePos, secondsWidth * timeMultiplier));
    pixelPos = timePos / secondsWidth * pixelWidth / timeMultiplier;
    if (timePos === 0) {
      this.wiggle(this.mainRef.current);
      ringSound.stop().play();
    }
    this.setState({lastTick, isDragging, timePos, isTickPlaying, pixelPos})
  };

  wiggle = element => {

    /**************
     Rotation
     **************/
    TweenMax.fromTo(element, .07, {
      x: -4
    }, {
      x: 4,
      ease: Power1.easeInOut,
      yoyo: true,
      repeat: 21,
      onCompleteParams: [element],
      onComplete: this.resetWiggle
    });
  };

  resetWiggle = element => {
    TweenMax.to(element, .05, {
      x: 0,
      ease: Power1.easeInOut
    });
  };

  // $('.sound').click(function (e) {
  //   e.preventDefault();
  //   if ($(this).hasClass('mute')) {
  //     $(this).removeClass('mute');
  //     tickSound.volume(0.5);
  //   } else {
  //     $(this).addClass('mute');
  //     tickSound.volume(0.0);
  //   }
  // });

  componentDidMount = () => {
    this.mainRef = React.createRef();
    this.doTick();
    console.log('---> componentDidMount');
  };

  render() {

    return (
      <div className={styles.container}
           onMouseMove={this.onContainerMouseMove} onTouchMove={this.onContainerMouseMove}
           onMouseUp={this.onTouchMove} onTouchEnd={this.onTouchEnd}>

        <svg style={{'display': 'none'}}>
          <defs>
            <path id="stempath"
                  d="M45.263 56.325c-4.153 2.877-8.688 3.997-13.684 2.947-6.75-1.42-12.658-.133-17.343 5.274-.444.513-1.154.795-1.945.841 8.279-12.713 19.369-20.347 35.181-19.185-1.142-4.912-2.697-9.386-8.229-10.989 8.393-2.329 14.908.648 20.39 6.482 4.967-3.077 7.65-6.526 12.7-16.222 2.45 6.292 1.399 11.899-3.969 20.682 3.378 1.556 6.882 2.05 10.168.448 3.099-1.51 5.857-3.72 9.176-5.891-1.793 6.643-5.919 10.74-11.471 13.709-5.747 3.074-11.571 1.879-16.764.42l-9.355 19.685c-4.165-4.978-4.672-11.17-4.276-17.6l.219-.991-.798.39z"/>
          </defs>
        </svg>

        <div className={styles.main} ref={this.mainRef}>
          <div className="sound"/>
          <svg className={styles.stem} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <use xlinkHref="#stempath"/>
          </svg>
          <div className={styles.tomato} onMouseDown={this.tomatoMouseDown}>
            <div style={this.renderTimerStyle()} className={styles.timeline} />
          </div>
        </div>

      </div>
    )
  }
}

PomodoroTimer.propTypes = {
};

export default PomodoroTimer;
