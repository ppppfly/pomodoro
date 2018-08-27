import React from 'react';
import {connect} from 'dva';
import styles from './IndexPage.css';
import 'antd/dist/antd.css';
import PomodoroTimer from "../components/PomodoroTimer/PomodoroTimer";

function IndexPage() {
  return (
    <div className={styles.normal}>

      <PomodoroTimer/>

    </div>
  );
}

IndexPage.propTypes = {
};

export default connect()(IndexPage);
