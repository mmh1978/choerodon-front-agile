import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Button, Tabs, Table, Select, Icon, Tooltip, Dropdown, Menu, Spin } from 'choerodon-ui';
import SwithChart from '../../Component/switchChart';
import StatusTag from '../../../../../components/StatusTag';
import PriorityTag from '../../../../../components/PriorityTag';
import TypeTag from '../../../../../components/TypeTag';
import ES from '../../../../../stores/project/epicReport';
import './EpicReport.scss';

const TabPane = Tabs.TabPane;
const { AppState } = stores;
const Option = Select.Option;
const MONTH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

@observer
class EpicReport extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    ES.loadEpicAndChartAndTableData();
  }
  
  getOption() {
    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        orient: 'horizontal', // 'vertical'
        x: 'center', // 'center' | 'left' | {number},
        y: 0, // 'center' | 'bottom' | {number}
        padding: [0, 50, 0, 0],
        itemWidth: 14,
        data: [
          {
            name: `已完成 ${ES.getChartYAxisName}`,
            icon: 'rectangle',
          },
          {
            name: `总计 ${ES.getChartYAxisName}`,
            icon: 'rectangle',
          },
          {
            name: '问题数量',
            icon: 'line',
          },
          {
            name: '未预估问题数',
            icon: 'line',
          },
        ],
      },
      grid: {
        y2: 10,
        top: '30',
        left: 0,
        right: '50',
        containLabel: true,
      },
      calculable: true,
      xAxis: {
        name: '日期',
        nameLocation: 'end',
        nameTextStyle: {
          color: '#000',
          // verticalAlign: 'bottom',
          padding: [35, 0, 0, 0],
        },
        nameGap: -10,
        type: 'category',
        axisTick: { show: false },
        splitNumber: 3,
        axisLine: { // 轴线
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          show: true,
          interval: 0,
          margin: 13,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
            fontStyle: 'normal',
            // fontWeight: 'bold',
          },
          formatter(value, index) {
            return `${value.split('-')[2]}/${MONTH[value.split('-')[1] * 1]}月`;
          },
        },
        splitArea: {
          show: false,
          interval: 0,
          color: 'rgba(0, 0, 0, 0.16)',
        },
        splitLine: {
          show: true,
          onGap: false,
          interval: 0,
          lineStyle: {
            color: ['#eee'],
            width: 1,
            type: 'solid',
          }, 
        },
        boundaryGap: true,
        data: ES.getChartDataX,
      },
      yAxis: [{
        nameTextStyle: {
          color: '#000',
        },
        type: 'value',
        axisTick: { show: false },
        axisLine: { // 轴线
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          show: true,
          interval: 'auto',
          margin: 18,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
            fontStyle: 'normal',
            // fontWeight: 'bold',
          },
          formatter(value, index) {
            if (value && ES.beforeCurrentUnit === 'remain_time') {
              return `${value}h`;
            }
            return value;
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 1,
          },
        },
      }, {
        name: '问题计数',
        nameTextStyle: {
          color: '#000',
        },
        type: 'value',
        axisTick: { show: false },
        axisLine: { // 轴线
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          show: true,
          interval: 'auto',
          margin: 18,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
            fontStyle: 'normal',
            // fontWeight: 'bold',
          },
        },
        splitLine: {
          show: false,
          // lineStyle: {
          //   color: '#eee',
          //   type: 'solid',
          //   width: 1,
          // },
        },
      }],
      series: [
        {
          name: '问题数量',
          type: 'line',
          step: true,
          symbol: 'none',
          itemStyle: {
            color: 'rgba(48, 63, 159, 1)',
          },
          yAxisIndex: 1,
          data: ES.getChartDataYIssueCountAll,
        },
        {
          name: '未预估问题数',
          type: 'line',
          step: true,
          symbol: 'none',
          itemStyle: {
            color: '#ff9915',
          },
          yAxisIndex: 1,
          data: ES.getChartDataYIssueCountUnEstimate,
        },
        {
          name: `已完成 ${ES.getChartYAxisName}`,
          type: 'line',
          step: true,
          symbol: 'none',
          yAxisIndex: 0,
          data: ES.getChartDataYCompleted,
          itemStyle: {
            color: '#4e90fe',
          },
          areaStyle: {
            color: 'rgba(77, 144, 254, 0.1)',
          },
        },
        {
          name: `总计 ${ES.getChartYAxisName}`,
          type: 'line',
          step: true,
          symbol: 'none',
          yAxisIndex: 0,
          data: ES.getChartDataYAll,
          itemStyle: {
            color: 'rgba(0, 0, 0, 0.16)',
          },
          areaStyle: {
            color: 'rgba(245, 245, 245, 0.5)',
          },
        },
      ],
    };
  }

  getTableDta(type) {
    if (type === 'compoleted') {
      return ES.tableData.filter(v => v.completed === 1);
    }
    if (type === 'unFinish') {
      return ES.tableData.filter(v => v.completed === 0);
    }
    if (type === 'unFinishAndunEstimate') {
      return ES.tableData.filter(v => v.completed === 0 && v.storyPoints === null);
    }
    return [];
  }

  refresh() {
    ES.loadEpicAndChartAndTableData();
  }

  handleChangeCurrentEpic(epicId) {
    ES.setCurrentEpic(epicId);
    ES.loadChartData();
    ES.loadTableData();
  }

  handleChangeCurrentUnit(unit) {
    ES.setCurrentUnit(unit);
    ES.loadChartData();
  }

  transformRemainTime(remainTime) {
    if (!remainTime) {
      return '0';
    }
    let time = remainTime * 1;
    const w = Math.floor(time / 40);
    time -= 40 * w;
    const d = Math.floor(time / 8);
    time -= 8 * d;
    return `${w ? `${w}w ` : ''}${d ? `${d}d ` : ''}${time ? `${time}h ` : ''}`;
  }

  renderTable(type) {
    const column = [
      {
        width: '15%',
        title: '关键字',
        dataIndex: 'issueNum',
        render: (issueNum, record) => (
          <span
            style={{ 
              color: '#3f51b5',
              cursor: 'pointer',
            }}
            role="none"
            onClick={() => {
              const { history } = this.props;
              const urlParams = AppState.currentMenuType;
              history.push(`/agile/issue?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}&paramName=${issueNum}&paramIssueId=${record.issueId}&paramUrl=reporthost/EpicReport`);
            }}
          >{issueNum} {record.addIssue ? '*' : ''}</span>
        ),
      }, {
        width: '30%',
        title: '概要',
        dataIndex: 'summary',
        render: summary => (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <Tooltip placement="topLeft" mouseEnterDelay={0.5} title={summary}>
              <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 0 }}>
                {summary}
              </p>
            </Tooltip>
          </div>
        ),
      }, {
        width: '15%',
        title: '问题类型',
        dataIndex: 'typeCode',
        render: (typeCode, record) => (
          <div>
            <Tooltip mouseEnterDelay={0.5} title={`任务类型： ${record.typeCode}`}>
              <div>
                <TypeTag
                  type={{
                    typeCode: record.typeCode,
                  }}
                  showName
                />
              </div>
            </Tooltip>
          </div>
        ),
      }, {
        width: '15%',
        title: '优先级',
        dataIndex: 'priorityCode',
        render: (priorityCode, record) => (
          <div>
            <Tooltip mouseEnterDelay={0.5} title={`优先级： ${record.priorityName}`}>
              <div style={{ marginRight: 12 }}>
                <PriorityTag
                  priority={{
                    priorityCode: record.priorityCode,
                    priorityName: record.priorityName,
                  }}
                />
              </div>
            </Tooltip>
          </div>
        ),
      }, {
        width: '15%',
        title: '状态',
        dataIndex: 'statusCode',
        render: (statusCode, record) => (
          <div>
            <Tooltip mouseEnterDelay={0.5} title={`任务状态： ${record.statusName}`}>
              <div>
                <StatusTag
                  style={{ display: 'inline-block' }}
                  status={{
                    statusColor: record.statusColor,
                    statusName: record.statusName,
                  }}
                />
              </div>
            </Tooltip>
          </div>
        ),
      }, {
        width: '10%',
        title: '故事点',
        dataIndex: 'storyPoints',
        render: (storyPoints, record) => (
          <div>
            {record.typeCode === 'story' ? storyPoints || '0' : ''}
          </div>
        ),
      },
    ];
    return (
      <Table
        rowKey={record => record.issueId}
        dataSource={this.getTableDta(type)}
        columns={column}
        scroll={{ x: true }}
        loading={ES.tableLoading}
      />
    );
  }

  render() {
    const { history } = this.props;
    const urlParams = AppState.currentMenuType;
    return (
      <Page className="c7n-epicReport">
        <Header 
          title="史诗报告图"
          backPath={`/agile/reporthost?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}`}
        >
          <SwithChart
            history={this.props.history}
            current="epicReport"
          />
          <Button 
            funcType="flat" 
            onClick={this.refresh.bind(this)}
          >
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <Content
          title="史诗报告图"
          description="随时了解一个史诗的完成进度。这有助于您跟踪未完成或未分配问题来管理团队的开发进度。"
          // link="http://v0-8.choerodon.io/zh/docs/user-guide/agile/report/sprint/"
        >
          <div style={{ display: 'flex' }}>
            <Select
              style={{ width: 244 }}
              label="史诗选择"
              value={ES.currentEpicId}
              onChange={this.handleChangeCurrentEpic.bind(this)}
            >
              {
                ES.epics.map(epic => (
                  <Option key={epic.issueId} value={epic.issueId}>{epic.epicName}</Option>
                ))
              }
            </Select>
            <Select
              style={{ width: 244, marginLeft: 24 }}
              label="单位选择"
              value={ES.currentUnit}
              onChange={this.handleChangeCurrentUnit.bind(this)}
            >
              <Option key="story_point" value="story_point">故事点</Option>
              <Option key="issue_count" value="issue_count">问题计数</Option>
              <Option key="remain_time" value="remain_time">剩余时间</Option>
            </Select>
          </div>
          <Spin spinning={ES.chartLoading}>
            <div className="c7n-report">
              <div className="c7n-chart">
                <ReactEcharts option={this.getOption()} style={{ height: 400 }} />
              </div>
              <div className="c7n-toolbar">
                <h2>汇总</h2>
                <h4>问题汇总</h4>
                <ul>
                  <li>
                    <span className="c7n-tip">合计：</span>
                    <span>
                      {ES.getLatest.issueCount}
                    </span>
                  </li>
                  <li><span className="c7n-tip">已完成：</span><span>{ES.getLatest.issueCompletedCount}</span></li>
                  <li><span className="c7n-tip">未预估：</span><span>{ES.getLatest.unEstimateIssueCount}</span></li>
                </ul>
                {
                  ES.beforeCurrentUnit !== 'issue_count' ? (
                    <div>
                      <h4>{`${ES.getChartYAxisName}`}汇总</h4>
                      <ul>
                        <li>
                          <span className="c7n-tip">合计：</span>
                          <span>
                            {ES.beforeCurrentUnit === 'story_point' ? ES.getLatest.allStoryPoints : this.transformRemainTime(ES.getLatest.allRemainTimes)}
                          </span>
                        </li>
                        <li>
                          <span className="c7n-tip">已完成：</span>
                          <span>
                            {ES.beforeCurrentUnit === 'story_point' ? ES.getLatest.completedStoryPoints : this.transformRemainTime(ES.getLatest.completedRemainTimes)}
                          </span>
                        </li>
                      </ul>
                    </div>
                  ) : null
                }
                <p
                  style={{ 
                    color: '#3F51B5',
                    cursor: 'pointer',                
                  }}
                  role="none"
                  onClick={() => {
                    this.props.history.push(`/agile/issue?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}&paramType=epic&paramId=${ES.currentEpicId}&paramName=${ES.epics.find(x => x.issueId === ES.currentEpicId).epicName}下的问题&paramUrl=reporthost/EpicReport`);
                  }}
                >
                  在“问题管理”中查看
                  <Icon style={{ fontSize: 13 }} type="open_in_new" />
                </p>
              </div>
            </div>
          </Spin>
          <Tabs>
            <TabPane tab="已完成的问题" key="done">
              {this.renderTable('compoleted')}
            </TabPane>
            <TabPane tab="未完成的问题" key="todo">
              {this.renderTable('unFinish')}
            </TabPane>
            <TabPane tab="未完成的未预估问题" key="undo">
              {this.renderTable('unFinishAndunEstimate')}
            </TabPane>
          </Tabs>
        </Content>
      </Page>
    );
  }
}

export default EpicReport;