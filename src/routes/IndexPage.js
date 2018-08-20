import React from 'react';
import {connect} from 'dva';
import styles from './IndexPage.css';
import {Col, Row} from 'antd';
import 'antd/dist/antd.css';
import SadMan from "../components/SadMan/SadMan";
import PomodoroTimer from "../components/PomodoroTimer/PomodoroTimer";

function IndexPage() {
  return (
    <div className={styles.normal}>

      <Row style={{'height': '100%'}}>
        <Col xs={2} sm={4} md={6} lg={8} xl={6} className={styles.full}>

          <SadMan/>

        </Col>
        <Col xs={2} sm={4} md={6} lg={8} xl={18} className={styles.full}>

          <PomodoroTimer/>

        </Col>
      </Row>

    </div>
  );
}

IndexPage.propTypes = {
};

export default connect()(IndexPage);
