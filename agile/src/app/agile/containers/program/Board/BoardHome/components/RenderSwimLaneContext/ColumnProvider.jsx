
import React from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import BoardStore from '../../../../../../stores/Program/Board/BoardStore';
import ColumnCouldDragOn from './ColumnCouldDragOn';
import CSSBlackMagic from '../../../../../../components/CSSBlackMagic';

@CSSBlackMagic
@observer
export default class ColumnProvider extends React.Component {
  getColumn(columnObj) {
    const {
      children, column_status_RelationMap, className, keyId,
    } = this.props;
    const { columnId, categoryCode } = columnObj;
    // const columnConstraintsIsOn = BoardStore.getAllColumnCount.size > 0;
    const subStatusArr = column_status_RelationMap.get(columnId);
    return (
      <React.Fragment key={columnId}>
        <ColumnCouldDragOn keyId={keyId} dragOn={BoardStore.getCurrentDrag === keyId} />
        <div
          className={classnames('c7n-swimlaneContext-itemBodyColumn', `${className} ${keyId} ${categoryCode}`, {
            // greaterThanMax: columnConstraintsIsOn && columnObj.maxNum !== null && BoardStore.getAllColumnCount.get(columnObj.columnId) > columnObj.maxNum,
            // lessThanMin: columnConstraintsIsOn && columnObj.minNum !== null && BoardStore.getAllColumnCount.get(columnObj.columnId) < columnObj.minNum,
          })}
        >
          {children(subStatusArr, columnId, categoryCode)}
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { columnStructure, column_status_RelationMap } = this.props;
    return columnStructure.filter(column => column_status_RelationMap.get(column.columnId).length > 0).map(column => this.getColumn(column));
  }
}
