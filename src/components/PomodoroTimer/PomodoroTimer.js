import React from 'react';
import styles from './PomodoroTimer.css';
import 'font-awesome/css/font-awesome.css';
import './font.css';
import {Howl} from 'howler';
import {Power1, TweenMax} from 'gsap';
import {Drawer, Radio, Collapse, Slider, Switch, Icon, Tooltip} from 'antd';

import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog, faVolumeOff, faVolumeUp} from '@fortawesome/free-solid-svg-icons';
import Responsive from 'react-responsive';

library.add(faVolumeUp, faVolumeOff, faCog);
const RadioGroup = Radio.Group;
const Panel = Collapse.Panel;
const Mobile = props => <Responsive {...props} maxWidth={499} />;
const Default = props => <Responsive {...props} minWidth={500} />;

class PomodoroTimer extends React.Component {

  static defaultProps = {
    pixelWidth: 630,
    secondsWidth: 25,
    timeMultiplier: 1000 * 60,
    turnSoundDist: 25 / 2,
    tickSounds: [
      new Howl({src: ['./sound/tick/timer.mp3'], loop: true, volume: 0.6}),
      new Howl({src: ['./sound/tick/clock.mp3'], loop: true, volume: 0.6}),
    ],
    restSounds: [
      new Howl({src: ['./sound/rest/rest.mp3'], loop: true, volume: 0.6})
    ],
    turnSounds: [
      new Howl({src: ['./sound/pomodoro_turn.mp3'], volume: 1.0}),
    ],
    ringSounds: [
      new Howl({src: ['./sound/pomodoro_ring.mp3'], volume: 0.6}),
    ],
    dingSounds: [
      new Howl({src: ['./sound/ding.mp3'], volume: 0.6}),
    ],
  };

  state = {
    isDragging: false,
    oldPosX: 0,
    pixelPos: 0,
    timePos: 0,
    isTickPlaying: false,
    lastTurnPos: 0,
    lastTick: Date.now(),
    isMute: false,
    showDrawer: false,
    fileList: [],
    isRest: false,
    volume: 0.6,
    tickSound: this.props.tickSounds[0],
    ringSound: this.props.ringSounds[0],
    turnSound: this.props.turnSounds[0],
    dingSound: this.props.dingSounds[0],
    restSound: this.props.restSounds[0],
    touchPageX: 0,
    isDingRing: false, // 标记：是否已经提醒了：倒数一分钟，提醒用户准备结束工作
    willLastMinuteCheck: false, //设置：是否开启 最后一分钟提醒
    willContinueHalfMinute: false, //设置：是否开启 结束后马上半分钟脑波音乐
    willContinueAfterWork: false, //设置：是否开启 工作结束后，马上休息
    willContinueAfterRest: false, //设置：是否开启 休息结束后，马上工作
  };

  static storageGet(key) {
    const value = localStorage.getItem(key);
    if (!isNaN(value)) return +value;
    if (value == null) return null;
    if (value === 'false') return false;
    if (value === 'true') return true;
    else return value;
  }

  componentDidMount = () => {
    this.mainRef = React.createRef();
    this.doTick();

    let willLastMinuteCheck = PomodoroTimer.storageGet('willLastMinuteCheck') || false;
    let willContinueHalfMinute = PomodoroTimer.storageGet('willContinueHalfMinute') || false;
    let willContinueAfterWork = PomodoroTimer.storageGet('willContinueAfterWork') || false;
    let willContinueAfterRest = PomodoroTimer.storageGet('willContinueAfterRest') || false;

    this.setState({
      willLastMinuteCheck,
      willContinueHalfMinute,
      willContinueAfterWork,
      willContinueAfterRest
    })
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

  handleMove(pageX) {
    const {secondsWidth, pixelWidth, timeMultiplier, turnSoundDist} = this.props;
    const {turnSound, restSound} = this.state;
    let {lastTurnPos, pixelPos, timePos, oldPosX, isDingRing} = this.state;

    if (this.state.isDragging) {
      restSound.stop();
      let moveX = pageX - oldPosX;
      pixelPos -= moveX;
      pixelPos = Math.max(0, Math.min(pixelPos, pixelWidth));
      timePos = Math.ceil((pixelPos / pixelWidth) * (secondsWidth * timeMultiplier));

      if (moveX > 0) {
        lastTurnPos = pageX;
        isDingRing = timePos <= timeMultiplier;
      }

      if (pageX - lastTurnPos < -turnSoundDist) {
        if (pixelPos < pixelWidth) {
          turnSound.play();
        }
        lastTurnPos = pageX;
      }
    } else {
      lastTurnPos = pageX;
    }
    oldPosX = pageX;

    this.setState({timePos, pixelPos, lastTurnPos, oldPosX, isDingRing});
  }

  onContainerMouseMove = (e) => {
    e.preventDefault();
    this.handleMove.bind(this)(e.pageX)
  };

  onContainerMouseUp = (e) => {
    e.preventDefault();
    this.setState({isDragging: false})
  };

  playRestSound(duration, seek=82) {

    const {restSound} = this.state;

    if (duration && duration>=0) {
      if (seek) {
        restSound.stop().seek(seek);
      }
      restSound.play();

      // 限制音乐的播放时间
      setTimeout(() => {
        // 停止时，有1.5秒的衰变，听起来不会太突兀
        restSound.fade(restSound.volume(), 0.0, 1500);

        // 不要马上骤停，但也不要一直播放
        setTimeout(() => {
          restSound.stop();
        }, 2000)

      }, duration);

    } else {
      if (seek) {
        restSound.stop().seek(seek);
      }
      restSound.play();
    }
  }

  doTick = () => {

    const {secondsWidth, timeMultiplier, pixelWidth} = this.props;
    const {tickSound, ringSound, dingSound} = this.state;
    let {lastTick, isDragging, timePos, isTickPlaying, pixelPos, isDingRing} = this.state;
    // 配置项
    let {willLastMinuteCheck} = this.state;

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

    if (willLastMinuteCheck && timePos <= timeMultiplier && !isDingRing) {
      dingSound.stop().play();
      isDingRing = true;
    }

    if (timePos === 0) {
      this.wiggle(this.mainRef.current);
      ringSound.stop().play();

      const {isRest, willContinueHalfMinute} = this.state;

      // 功能：工作番茄后，来一段30秒的脑波音乐
      if (!isRest && willContinueHalfMinute) {
        this.playRestSound(30*1000)
      }

      const {willContinueAfterWork, willContinueAfterRest} = this.state;
      if (!isRest && willContinueAfterWork) {
        tickSound.stop();
        this.startRest();
        return;
      }

      if (isRest && willContinueAfterRest) {
        tickSound.stop();
        this.startWork();
        return;
      }

    }
    this.setState({lastTick, isDragging, timePos, isTickPlaying, pixelPos, isDingRing})
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

  getIconName(){
    if (this.state.isMute) {
      return 'volume-off'
    }
    return 'volume-up'
  }

  muteOrOpen(){
    const {volume, tickSound, ringSound, dingSound, restSound} = this.state;

    if (this.state.isMute) {
      tickSound.volume(volume);
      ringSound.volume(volume);
      dingSound.volume(volume);
      restSound.volume(volume);
      this.setState({isMute: false})
    } else {
      tickSound.volume(0.0);
      ringSound.volume(0.0);
      dingSound.volume(0.0);
      restSound.volume(0.0);
      this.setState({isMute: true})
    }

  }

  showDrawer() {
    this.setState({showDrawer: true})
  }

  onDrawerOpenChange() {
    this.setState({showDrawer: !this.state.showDrawer})
  }

  onVolumeChange(volume){
    const {tickSound, ringSound, dingSound, restSound} = this.state;
    tickSound.volume(volume/100);
    ringSound.volume(volume/100);
    dingSound.volume(volume/100);
    restSound.volume(volume/100);
    this.setState({volume: volume/100})
  }

  getOnTickSoundChange(e) {
    const value = e.target.value;
    const {tickSounds} = this.props;
    let {tickSound, isTickPlaying} = this.state;
    if (isTickPlaying) {
      tickSound.stop();
      tickSound = tickSounds[value];
      tickSound.play();
    } else {
      tickSound = tickSounds[value];
      tickSound.play();
      setInterval(()=>{
        tickSound.stop();
      }, 2100)
    }
    this.setState({tickSound});
  }

  shiftWork() {

    const {isTickPlaying, tickSound, restSound} = this.state;

    if (isTickPlaying) {
      tickSound.stop();
    }

    restSound.stop();

    this.setState({
      isRest: false,
      tickSound: this.props.tickSounds[0],
      isDragging: false,
      oldPosX: 0,
      pixelPos: 0,
      timePos: 0,
      isTickPlaying: false,
      lastTurnPos: 0,
      lastTick: Date.now(),
      isDingRing: false,
    })

  }

  shiftRest() {

    const {isTickPlaying, tickSound, restSound} = this.state;

    if (isTickPlaying) {
      tickSound.stop();
    }

    restSound.stop();

    this.setState({
      isRest: true,
      tickSound: this.props.restSounds[0],
      isDragging: false,
      oldPosX: 0,
      pixelPos: 0,
      timePos: 0,
      isTickPlaying: false,
      lastTurnPos: 0,
      lastTick: Date.now(),
      isDingRing: false,
    });
  }

  static handlePreventDefault(event) {
    // 判断默认行为是否可以被禁用
    if (event.cancelable) {
      // 判断默认行为是否已经被禁用
      if (!event.defaultPrevented) {
        event.preventDefault();
      }
    }
  }

  onTouchStart(e) {
    // PomodoroTimer.handlePreventDefault(e);
    const pageX = e.touches[0].pageX;
    this.setState({
      isDragging: true,
      oldPosX: pageX,
      lastTurnPos: pageX,
    });
  }

  onTouchMove(e) {
    // PomodoroTimer.handlePreventDefault(e);
    const pageX = e.touches[0].pageX;
    this.handleMove.bind(this)(pageX);
  }

  onTouchEnd(e) {
    // PomodoroTimer.handlePreventDefault(e);
    this.setState({isDragging: false});
  }

  onClose = () => {
    this.setState({showDrawer: false});
  };

  static genRestInlineStyle(isRest) {
    let restStyle = {
      container: {}
    };

    if (isRest) {
      restStyle.container.backgroundColor = '#68a662';
    }

    return restStyle;
  }

  onLastMinuteTipChange() {
    let new_value = !this.state.willLastMinuteCheck;
    this.setState({willLastMinuteCheck: new_value});
    localStorage.setItem('willLastMinuteCheck', new_value);
  }

  onWorkContinueHalfMinuteChange() {
    let new_value = !this.state.willContinueHalfMinute;
    this.setState({willContinueHalfMinute: new_value});
    localStorage.setItem('willContinueHalfMinute', new_value);
  }

  onContinueAfterWorkChange() {
    let new_value = !this.state.willContinueAfterWork;
    this.setState({
      willContinueAfterWork: new_value,
      willContinueHalfMinute: false
    });
    localStorage.setItem('willContinueAfterWork', new_value);
    localStorage.setItem('willContinueHalfMinute', false);
  }

  onContinueAfterRestChange() {
    let new_value = !this.state.willContinueAfterRest;
    this.setState({willContinueAfterRest: new_value});
    localStorage.setItem('willContinueAfterRest', new_value);
  }

  startWork(minutes=25) {
    const {secondsWidth, timeMultiplier} = this.props;
    minutes = Math.min(secondsWidth, minutes);
    this.setState({
      lastTick: Date.now(),
      timePos: minutes * timeMultiplier,
      isRest: false,
      tickSound: this.props.tickSounds[0],
      isDragging: false,
      oldPosX: 0,
      isTickPlaying: false,
      isDingRing: false,
    })
  }

  startRest(minutes=5) {
    const {secondsWidth, timeMultiplier} = this.props;
    minutes = Math.min(secondsWidth, minutes);
    this.setState({
      lastTick: Date.now(),
      timePos: minutes * timeMultiplier,
      isRest: true,
      tickSound: this.props.restSounds[0],
      isDragging: false,
      oldPosX: 0,
      isTickPlaying: false,
      isDingRing: false,
    })
  }

  componentPomodoro(myStyle, isMobile) {

    const {isRest, volume} = this.state;

    const marks = {0: '0', 50: '50', 100: '100'};

    const restStyle = PomodoroTimer.genRestInlineStyle(isRest);
    const volumeIcon = <FontAwesomeIcon className={myStyle.sound} icon={this.getIconName()} onClick={this.muteOrOpen.bind(this)}/>;

    return <div className={myStyle.container} style={restStyle.container}>

      <FontAwesomeIcon className={styles.config} icon="cog" onClick={this.onDrawerOpenChange.bind(this)}/>

      <div className={styles.icon_wrapper}>
        { isMobile ? volumeIcon : ''}
      </div>

      <Drawer
        title="设置"
        placement="left"
        closable={true}
        onClose={this.onClose}
        visible={this.state.showDrawer}
        width={300}
      >
        <Collapse>
          <Panel header="模式控制" key="1">
            <h4>最后一分钟提醒</h4>
            <Switch checked={this.state.willLastMinuteCheck}
                    onChange={this.onLastMinuteTipChange.bind(this)}/>
            <h4>工作番茄后，持续30秒的脑波音乐</h4>
            <div className={styles["switch-wrapper"]}>
              <Switch checked={this.state.willContinueHalfMinute}
                      onChange={this.onWorkContinueHalfMinuteChange.bind(this)}
                      disabled={this.state.willContinueAfterWork}/>
              <Tooltip placement="top" title="连续番茄模式下，会强制关闭 30 秒脑波音乐">
                <Icon type="question-circle"/>
              </Tooltip>
            </div>
            <h4>工作番茄后，立即开始休息番茄</h4>
            <Switch checked={this.state.willContinueAfterWork}
                    onChange={this.onContinueAfterWorkChange.bind(this)} />
            <h4>休息番茄后，立即开始工作番茄</h4>
            <Switch checked={this.state.willContinueAfterRest}
                    onChange={this.onContinueAfterRestChange.bind(this)} />
          </Panel>
          <Panel header="音量控制" key="2">
            <Slider marks={marks} value={volume*100} onChange={this.onVolumeChange.bind(this)}/>
          </Panel>
          <Panel header="声音：滴答声" key="3">
            <RadioGroup onChange={this.getOnTickSoundChange.bind(this)} defaultValue={0}>
              <Radio value={0}>计时器</Radio>
              <Radio value={1}>钟表（感谢叶开提供）</Radio>
            </RadioGroup>
          </Panel>
        </Collapse>
      </Drawer>

      <div className={this.state.isRest ? myStyle.mainRest : myStyle.main } ref={this.mainRef}>

        {isMobile ? '' : volumeIcon}

        <svg className={myStyle.stem} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <use xlinkHref="#stempath"/>
        </svg>
        <div className={styles.tomato} onMouseDown={this.tomatoMouseDown.bind(this)} onTouchStart={this.onTouchStart.bind(this)}>
          <div className={styles.title}>番茄钟</div>
          <div style={this.renderTimerStyle()} className={styles.timeline} />
        </div>
        <div className={myStyle.shifter}>
          <div className={styles.work} onClick={this.shiftWork.bind(this)}/>
          <div className={styles.rest} onClick={this.shiftRest.bind(this)}/>
        </div>
      </div>

    </div>;
  }

  static genStyle(type) {
    return {
      container: styles[`container-${type}`],
      main: styles[`main-${type}`],
      mainRest: styles[`main-${type}-rest`],
      stem: styles[`stem-${type}`],
      shifter: styles[`shifter-${type}`],
      sound: styles[`sound-${type}`],
    };
  }

  render() {

    const styleDesktop = PomodoroTimer.genStyle('desktop');
    const styleMobile = PomodoroTimer.genStyle('mobile');

    return (
      <div className={styles["container-mobile"]}
           onTouchMove={this.onTouchMove.bind(this)}
           onTouchEnd={this.onTouchEnd.bind(this)}
           onMouseMove={this.onContainerMouseMove.bind(this)}
           onMouseUp={this.onContainerMouseUp.bind(this)}
      >

        <svg style={{'display': 'none'}}>
          <defs>
            <path id="stempath"
                  d="M45.263 56.325c-4.153 2.877-8.688 3.997-13.684 2.947-6.75-1.42-12.658-.133-17.343 5.274-.444.513-1.154.795-1.945.841 8.279-12.713 19.369-20.347 35.181-19.185-1.142-4.912-2.697-9.386-8.229-10.989 8.393-2.329 14.908.648 20.39 6.482 4.967-3.077 7.65-6.526 12.7-16.222 2.45 6.292 1.399 11.899-3.969 20.682 3.378 1.556 6.882 2.05 10.168.448 3.099-1.51 5.857-3.72 9.176-5.891-1.793 6.643-5.919 10.74-11.471 13.709-5.747 3.074-11.571 1.879-16.764.42l-9.355 19.685c-4.165-4.978-4.672-11.17-4.276-17.6l.219-.991-.798.39z"/>
          </defs>
        </svg>

        <Mobile>

          {this.componentPomodoro(styleMobile, true)}

        </Mobile>
        <Default>

          {this.componentPomodoro(styleDesktop, false)}

        </Default>
      </div>
    )
  }
}

PomodoroTimer.propTypes = {
};

export default PomodoroTimer;
