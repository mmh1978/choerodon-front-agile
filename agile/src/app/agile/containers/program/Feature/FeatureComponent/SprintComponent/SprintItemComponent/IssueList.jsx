import React, { Component } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { observer } from 'mobx-react';
import IssueItem from './IssueItem';

@observer
class IssueList extends Component {
  myOnMouseDown = (e, item) => {
    e.stopPropagation();
    const { sprintId, store, piId } = this.props;
    if (!(e.shiftKey && (e.ctrlKey || e.metaKey))) {
      if (e.shiftKey) {
        store.dealWithMultiSelect(sprintId || piId, item, 'shift');
      } else if (e.ctrlKey || e.metaKey) {
        store.dealWithMultiSelect(sprintId || piId, item, 'ctrl');
      } else {
        store.clickedOnce(sprintId || piId, item);
      }
    }
  };

  render() {
    const { sprintId, piId, store } = this.props;
    // const getSelect = store.getSelectIssue;

    return store.getIssueMap.get(sprintId || piId).map((item, index) => (
      <Draggable key={item.issueId} draggableId={item.issueId} index={index}>
        {(provided, snapshot) => (
          <div
            key={item.issueId}
            className="c7n-backlog-sprintIssue"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <IssueItem
              key={item.issueId}
              item={item}
              onClick={this.myOnMouseDown}
            />
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    ));
  }
}

export default IssueList;
