import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Tooltip } from 'choerodon-ui';
import classnames from 'classnames';
import _ from 'lodash';
import TypeTag from '../../../../../components/TypeTag';
import UserHead from '../../../../../components/UserHead';
import StatusTag from '../../../../../components/StatusTag';
import PriorityTag from '../../../../../components/PriorityTag';
import './SprintIssue.scss';
import BacklogStore from '../../../../../stores/project/backlog/BacklogStore';

@observer
class SprintIssue extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (JSON.stringify(nextProps) === JSON.stringify(this.props)) {
      return false;
    }
    return true;
  }

  render() {
    const {
      item, epicVisible, versionVisible, issueDisplay, selected,
    } = this.props;
    return (
      <div className={classnames('c7n-backlog-IssueCard')}>
        <div
          label="sprintIssue"
          className={classnames('c7n-backlog-IssueCard-left')}
        >
          <TypeTag
            data={item.issueTypeDTO}
          />
          <div className="c7n-backlog-IssueCard-left-summaryContainer">
            <span className="c7n-backlog-IssueCard-left-issueNum">
              {`${item.issueNum}`}
            </span>
            <Tooltip title={item.summary} placement="topLeft">
              <span className="c7n-backlog-IssueCard-left-issueSummary">{item.summary}</span>
            </Tooltip>
          </div>

        </div>
        <div
          className={classnames('c7n-backlog-IssueCard-right')}
        >
          <div className={classnames('line-two-left')}>
            {item.versionNames.length > 0 ? (
              <Tooltip title={`版本: ${item.versionNames.join(', ')}`}>
                <span className="c7n-backlog-IssueCard-right-version container">
                  {item.versionNames.join(', ')}
                </span>
              </Tooltip>
            ) : ''}
            {!_.isNull(item.epicName) ? (
              <Tooltip title={`史诗: ${item.epicName}`}>
                <span
                  label="sprintIssue"
                  className="c7n-backlog-IssueCard-right-epic container"
                  style={{
                    color: item.color || item.epicColor,
                    border: `1px solid ${item.color || item.epicColor}`,
                  }}
                >
                  {item.epicName}
                </span>
              </Tooltip>
            ) : ''}
            {item.assigneeId && (
              <UserHead
                user={{
                  id: item.assigneeId,
                  loginName: '',
                  realName: item.assigneeName,
                  avatar: item.imageUrl,
                }}
              />
            )}
          </div>
          <div className={classnames('line-two-right')}>
            <Tooltip title={`状态: ${item.statusMapDTO ? item.statusMapDTO.name : ''}`}>
              <div className="c7n-backlog-IssueCard-right-status">
                <StatusTag
                  data={item.statusMapDTO}
                />
              </div>
            </Tooltip>
            <Tooltip title={`优先级: ${item.priorityDTO ? item.priorityDTO.name : ''}`}>
              <PriorityTag priority={item.priorityDTO} />
            </Tooltip>
            <Tooltip title={`故事点: ${item.storyPoints}`}>
              <div
                label="sprintIssue"
                className={classnames('c7n-backlog-IssueCard-right-storyPoint', {
                  visible: item.storyPoints && item.issueTypeDTO && item.issueTypeDTO.typeCode === 'story',
                })}
              >
                {item.storyPoints}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}

export default SprintIssue;
