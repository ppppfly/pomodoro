import React from 'react';
import styles from './SadMan.css';

const SadMan = () => {
  return (
    <div className={styles.man_container}>

      <div className={styles.man}>
        <div className={styles.head}/>
        <div className={styles.body}/>
        <div className={styles.feet}>
          <div className={styles.foot}/>
          <div className={styles.foot}/>
        </div>
      </div>

    </div>
  );
};

SadMan.propTypes = {
};

export default SadMan;
