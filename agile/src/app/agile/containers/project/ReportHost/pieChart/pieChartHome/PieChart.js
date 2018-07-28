import React, { Component } from 'react';
import { observer } from 'mobx-react';
import echarts from 'echarts/lib/echarts';
import ReactEchartsCore from 'echarts-for-react/lib/core';
import 'echarts/lib/chart/pie';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Button, Select, Icon, Spin, Tooltip } from 'choerodon-ui';
import './pie.scss';
import SwitchChart from '../../Component/switchChart';
import VersionReportStore from '../../../../../stores/project/versionReport/VersionReport';

const Option = Select.Option;
const { AppState } = stores;

@observer
class ReleaseDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colors: [],
      type: '经办人',
    };
  }
  componentDidMount() {
    VersionReportStore.getPieDatas(AppState.currentMenuType.id, 'assignee');
  }

  getRich = () => {
    const data = VersionReportStore.getPieData;
    const rich = {};
    if (data.length) {
      data.map((item, index) => {
        if (item.jsonObject && item.jsonObject.assigneeImageUrl) {
          rich[index] = {
            width: 18,
            height: 18,
            borderRadius: 18,
            borderWidth: 1,
            align: 'center',
            backgroundColor: {
              image: item.jsonObject.assigneeImageUrl,
            },

          };
        } else if (item.jsonObject && !item.jsonObject.assigneeImageUrl) {
          rich[index] = {
            width: 18,
            height: 18,
            borderRadius: 18,
            borderWidth: 1,
            align: 'center',
            backgroundColor: '#c5cbe8',
            color: '#3f51b5',
          };
        }

        return rich;
      });
    }

    return rich;
  };

  getFirstName = (str) => {
    if (!str) {
      return '';
    }
    const re = /[\u4E00-\u9FA5]/g;
    for (let i = 0, len = str.length; i < len; i += 1) {
      if (re.test(str[i])) {
        return str[i];
      }
    }
    return str[0].toUpperCase();
  };

  getOption() {
    const colors = VersionReportStore.colors;
    const datas = VersionReportStore.pieData;
    return {
      // title : {
      //   text: '某站点用户访问来源',
      //   subtext: '统计图',
      //   x:'center'
      // },
      // color:['#9665E2','#F7667F','#FAD352', '#45A3FC','#56CA77'],
      color: colors,
      tooltip: {
        trigger: 'item',
        formatter: '问题: {c} {a} <br/>{b} : {d}%',
        padding: 10,
        textStyle: {
          color: '#000',
        },
        extraCssText: 'background: #FFFFFF;\n' +
        'border: 1px solid #DDDDDD;\n' +
        'box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20);',
      },
      series: [
        {
          name: '',
          type: 'pie',
          // radius: '55%',
          hoverAnimation: false,
          center: ['50%', '50%'],
          data: datas,
          label: {

            formatter: (value) => {
              if (value.data.name === null) {
                return '未分配';
              } else {
                if (this.state.type === '经办人' && value.data.jsonObject.assigneeImageUrl) {
                  return `{${value.dataIndex}|}${value.data.name}`;
                } else if (this.state.type === '经办人' && !value.data.jsonObject.assigneeImageUrl) {
                  return `{${value.dataIndex}|${this.getFirstName(value.data.name)}}${value.data.name}`;
                } else {
                  return value.data.name;
                }
              }
            },
            rich: this.state.type === '经办人' ? this.getRich() : {},
          },
          itemStyle: {
            normal: {
              borderWidth: 2,
              borderColor: '#ffffff',
            },
            // color: (data) => {
            //   return this.state.colors[data.dataIndex];
            // }
          },

        },
      ],
    };
  }
  changeType =(value, option) => {
    VersionReportStore.setPieData([]);
    VersionReportStore.getPieDatas(AppState.currentMenuType.id, value);
    this.setState({ type: option.key });
  };
  render() {
    const data = VersionReportStore.getPieData;
    let total = 0;
    for (let i = 0; i < data.length; i += 1) {
      total += data[i].value;
    }
    const colors = VersionReportStore.colors;
    const urlParams = AppState.currentMenuType;
    const type = [
      { title: '经办人', value: 'assignee' },
      { title: '模块', value: 'component' },
      { title: '问题类型', value: 'issueType' },
      { title: '修复版本', value: 'fixVersion' },
      { title: '优先级', value: 'priority' },
      { title: '状态', value: 'status' },
      { title: '冲刺', value: 'sprint' },
      { title: '史诗', value: 'epic' },
      { title: '解决结果', value: 'resolution' },
    ];
    return (
      <Page className="pie-chart">
        <Header
          title="统计图"
          backPath={`/agile/reporthost?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}`}
        >
          <SwitchChart
            history={this.props.history}
            current="pieReport"
          />
          <Button><Icon type="refresh" />刷新</Button>
        </Header>
        <Content
          title={`项目"${AppState.currentMenuType.name}"下的问题统计图`}
          description="了解每个冲刺中完成、进行和退回待办的工作。这有助于您确定您团队的工作量是否超额，更直观的查看冲刺的范围与工作量。"
        >
          <Spin spinning={VersionReportStore.pieLoading}>
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              defaultValue={'assignee'}
              label="统计类型"
              style={{
                width: 512,
                marginBottom: 32,
              }}
              onChange={this.changeType}
            >
              {
                type.map(item => (
                  <Option value={item.value} key={item.title}>{item.title}</Option>
                ))
              }
            </Select>
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <ReactEchartsCore
                ref={(pie) => { this.pie = pie; }}
                style={{ width: '58%', height: 500 }}
                echarts={echarts}
                option={this.getOption()}
              />
              <div className="pie-title">
                <p className="pie-legend-title">数据统计</p>
                <table>
                  <thead>
                    <tr>
                      <td style={{ paddingRight: 106 }}>{this.state.type}</td>
                      <td style={{ paddingRight: 68 }}>问题</td>
                      <td>百分比</td>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr>
                        <td>
                          <div className="pie-legend-icon" style={{ background: colors[index] }} />
                          <Tooltip title={item.name && item.name}>
                            {this.state.type === '经办人' ? <div className="pie-legend-text" >{item.name ? item.jsonObject.email : '未分配'}</div> : <div className="pie-legend-text" >{item.name ? item.name : '未分配'}</div> }

                          </Tooltip>
                        </td>
                        <td>{item.value}</td>
                        <td style={{ paddingTop: 12 }}>{`${((item.value / total) * 100).toFixed(2)} %`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Spin>
        </Content>
      </Page>
    );
  }
}

export default ReleaseDetail;

