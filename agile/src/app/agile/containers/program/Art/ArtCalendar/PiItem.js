import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import { Popover, Progress } from 'choerodon-ui';
import { extendMoment } from 'moment-range';
import StatusTag from '../../../../components/StatusTag';

import './PiItem.scss';

const moment = extendMoment(Moment);
const STATUSCODES = {
  sprint_planning: 'todo',
  started: 'doing',
  closed: 'done',
};
const STATUSNAMES = {
  todo: '未开启',
  doing: '进行中',
  done: '已完成',
};
const STATUS = {
  cancel: {
    borderColor: '#393E46',
    backgroundColor: '#EBEBEB',
    sprintBorder: '#C0C0C0',
  },
  todo: {
    borderColor: '#FFB100',
    backgroundColor: '#FFF8E7',
    sprintBorder: '#F9D88E',
  },
  doing: {
    borderColor: '#4D90FE',
    backgroundColor: '#E9F1FF',
    sprintBorder: '#A2C1F6',
  },
  done: {
    borderColor: '#00BFA5',
    backgroundColor: '#E5F9F6',
    sprintBorder: '#98D8CF',
  },
};
const SprintItem = ({
  borderColor, sprint,
}) => (
  <div className="PiItem-pi-sprint" style={{ borderColor }}>
    <Popover
      getPopupContainer={triggerNode => triggerNode.parentNode}
      content={<CardTitle data={sprint} type="sprint" />}
      title={null}
      placement="bottomLeft"
    >
      <div>
        {sprint.sprintName}
      </div>
    </Popover>
  </div>
);
const CardTitle = ({
  data,
  type,
}) => {
  const {
    name, sprintName, statusCode, startDate, endDate, 
  } = data;
  const status = type === 'sprint' ? STATUSCODES[statusCode] : statusCode;
  return (
    <div style={{ height: 63, padding: 10 }}>
      <div style={{ display: 'flex' }}>
        <div>{type === 'sprint' ? sprintName : name}</div>
        <div style={{ flex: 1, visibility: 'hidden' }} />
        <StatusTag categoryCode={status} name={STATUSNAMES[status]} />
      </div>
      <div style={{ margin: '10px 0', color: '#9B9B9B' }}>
        {`${moment(startDate).format('YYYY-MM-DD')} ~ ${moment(endDate).format('YYYY-MM-DD')}`}        
      </div>    
    </div>
  );
};
const CardBody = () => (
  <div>
    <Progress percent={50} strokeColor="#4D90FE" />
    <div style={{ margin: '10px 0' }}>
     故事点:68 / 120       
    </div>
  </div>
);
class PiItem extends Component {
  render() {
    const { pi } = this.props;
    const {
      startDate, endDate, name, statusCode, sprintCalendarDOList,
    } = pi;
    const flex = moment.range(startDate, endDate).diff('days');
    const title = 'PI-001';   
    const style = STATUS[statusCode];
    return (
      <div
        className="PiItem"
        style={{
          flex,
        }}
      >
        <div className="PiItem-pi">
          <div className="PiItem-pi-title" style={{ borderColor: style.borderColor, background: style.backgroundColor }}>
 
            <Popover
              // autoAdjustOverflow={false}
              getPopupContainer={triggerNode => triggerNode.parentNode}
              content={<CardTitle data={pi} type="pi" />}
              title={null}
              placement="bottomLeft"
            >
              <div>
                {name}
              </div>
            </Popover>
          </div>
          <div className="PiItem-pi-sprints">
            {sprintCalendarDOList.map(sprint => (
              <SprintItem borderColor={style.sprintBorder} sprint={sprint} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

PiItem.propTypes = {

};

export default PiItem;
