import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Page, Header, Content, stores, Permission } from 'choerodon-front-boot';
import { Button, Table, Menu, Dropdown, Icon, Modal, Radio, Select, Spin, Tooltip } from 'choerodon-ui';
import { Action } from 'choerodon-front-boot';
import { withRouter } from 'react-router-dom';
import DragSortingTable from '../ReleaseComponent/DragSortingTable';
import AddRelease from '../ReleaseComponent/AddRelease';
import ReleaseStore from '../../../../stores/project/release/ReleaseStore';
import './ReleaseHome.scss';
import EditRelease from '../ReleaseComponent/EditRelease';
import PublicRelease from '../ReleaseComponent/PublicRelease';
import emptyVersion from '../../../../assets/image/emptyVersion.png';
import DeleteReleaseWithIssues from '../ReleaseComponent/DeleteReleaseWithIssues';
import CombineRelease from '../ReleaseComponent/CombineRelease';

const confirm = Modal.confirm;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const { Sidebar } = Modal;
const { AppState } = stores;
const COLOR_MAP = {
  规划中: '#ffb100',
  已发布: '#00bfa5',
  归档: 'rgba(0, 0, 0, 0.3)',
};

@observer
class ReleaseHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editRelease: false,
      addRelease: false,
      pagination: {
        current: 1,
        total: 0,
        pageSize: 10,
      },
      selectItem: {},
      versionDelete: {},
      versionDelInfo: {},
      publicVersion: false,
      radioChose: null,
      selectChose: null,
      combineVisible: false,
      loading: false,
      sourceList: [],
    };
  }
  componentWillMount() {
    this.refresh(this.state.pagination);
  }
  refresh(pagination) {
    this.setState({
      loading: true,
    });
    ReleaseStore.axiosGetVersionList({
      page: pagination.current - 1,
      size: pagination.pageSize,
    }).then((data) => {
      ReleaseStore.setVersionList(data.content);
      this.setState({
        loading: false,
        pagination: {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data.totalElements,
        },
      });
    }).catch((error) => {
    });
  }
  handleClickMenu(record, e) {
    const that = this;
    if (e.key.indexOf('0') !== -1) {
      if (record.statusCode === 'version_planning') {
        ReleaseStore.axiosGetPublicVersionDetail(record.versionId)
          .then((res) => {
            ReleaseStore.setPublicVersionDetail(res);
            ReleaseStore.setVersionDetail(record);
            this.setState({ publicVersion: true }); 
          }).catch((error) => {
          });
      } else {
        ReleaseStore.axiosUnPublicRelease(
          record.versionId).then((res2) => {
          this.refresh(this.state.pagination);
        }).catch((error) => {
        });
      }
    }
    if (e.key.indexOf('4') !== -1) {
      if (ReleaseStore.getVersionList.length > 1) {
        ReleaseStore.axiosVersionIssueStatistics(record.versionId).then((res) => {
          if (res.fixIssueCount > 0 || res.influenceIssueCount > 0) {
            this.setState({
              versionDelInfo: {
                versionName: record.name,
                versionId: record.versionId,
                ...res,
              },
            });
          } else {
            this.setState({
              versionDelete: record,
            });
          }
        }).catch((error) => {
        });
      } else {
        this.setState({
          versionDelete: record,
        });
      }
    }
    if (e.key.indexOf('5') !== -1) {
      ReleaseStore.axiosGetVersionDetail(record.versionId).then((res) => {
        ReleaseStore.setVersionDetail(res);
        this.setState({
          selectItem: record,
          editRelease: true,
        });
      }).catch((error) => {
      });
    }
    if (e.key.indexOf('3') !== -1) {
      if (record.statusCode === 'archived') {
        // 撤销归档
        ReleaseStore.axiosUnFileVersion(record.versionId).then((res) => {
          this.refresh(this.state.pagination);
        }).catch((error) => {
        });
      } else {
        // 归档
        ReleaseStore.axiosFileVersion(record.versionId).then((res) => {
          this.refresh(this.state.pagination);
        }).catch((error) => {
        });
      }
    }
  }
  handleChangeTable(pagination, filters, sorter) {
    this.refresh({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }
  handleCombineRelease() {
    ReleaseStore.axiosGetVersionListWithoutPage().then((res) => {
      this.setState({
        combineVisible: true,
        sourceList: res,
      });
    }).catch((error) => {
    });
  }

  handleDrag =(res, postData) => {
    ReleaseStore.setVersionList(res);
    ReleaseStore.handleDataDrag(AppState.currentMenuType.id, postData)
      .then(() => {
        this.refresh(this.state.pagination);
      }).catch((error) => {
      this.refresh(this.state.pagination);
      });
  };
  render() {
    const menu = AppState.currentMenuType;
    const { type, id: projectId, organizationId: orgId } = menu;
    const versionData = ReleaseStore.getVersionList.length > 0 ? ReleaseStore.getVersionList : [];
    const versionColumn = [{
      title: '版本',
      dataIndex: 'name',
      key: 'name',
      width: '94px',
      render: (text, record) => (
       <Tooltip title={ text }>
         <div
            role="none"
            style={{maxWidth: '94px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
        >
            <a
              role={"none"}
              onClick={() => {
              const { history } = this.props;
              const urlParams = AppState.currentMenuType;
              history.push(`/agile/release/detail/${record.versionId}?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}`);
            }}>
              {text}
            </a>
          </div>
        </Tooltip>
      ),
    }, {
      title: '版本状态',
      dataIndex: 'status',
      key: 'key',
      render: text => (
        <p style={{ marginBottom: 0 }}>
          <span 
            style={{ 
              color: '#fff',
              background: COLOR_MAP[text],
              display: 'inline-block',
              lineHeight: '20px',
              borderRadius: '3px',
              padding: '0 10px',
            }}
          >
            {text === '归档' ? '已归档' : text}
          </span>
        </p>
      ),
    }, {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: text => (text ? <p style={{ marginBottom: 0 }}>{text.split(' ')[0]}</p> : ''),
    }, {
      title: '结束日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: text => (text ? <p style={{ marginBottom: 0 }}>{text.split(' ')[0]}</p> : ''),
    }, {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    }, {
      title: '',
      dataIndex: 'option',
      key: 'option',
      render: (text, record) => (
        <Action
          data={record.statusCode === 'archived' ? [
            {
              service: record.statusCode === 'archived' ? ['agile-service.product-version.revokeArchivedVersion'] : ['agile-service.product-version.archivedVersion'],
              text: record.statusCode === 'archived' ? '撤销归档' : '归档',
              action: this.handleClickMenu.bind(this, record, { key: '3' }),
            },
            {
              service: ['agile-service.product-version.updateVersion'],
              text: '编辑',
              action: this.handleClickMenu.bind(this, record, { key: '5' }),
            }] : [
            {
              service: record.statusCode === 'version_planning' ? ['agile-service.product-version.releaseVersion'] : ['agile-service.product-version.revokeReleaseVersion'],
              text: record.statusCode === 'version_planning' ? '发布' : '撤销发布',
              action: this.handleClickMenu.bind(this, record, { key: '0' }),
            },
            {
              service: record.statusCode === 'archived' ? ['agile-service.product-version.revokeArchivedVersion'] : ['agile-service.product-version.archivedVersion'],
              text: record.statusCode === 'archived' ? '撤销归档' : '归档',
              action: this.handleClickMenu.bind(this, record, { key: '3' }),
            },
            {
              service: ['agile-service.product-version.deleteVersion'],
              text: '删除',
              action: this.handleClickMenu.bind(this, record, { key: '4' }),
            },
            {
              service: ['agile-service.product-version.updateVersion'],
              text: '编辑',
              action: this.handleClickMenu.bind(this, record, { key: '5' }),
            }]}
        />
      ),
    }];
    return (
      <Page
        service={[
          'agile-service.product-version.releaseVersion',
          'agile-service.product-version.revokeReleaseVersion',
          'agile-service.product-version.revokeArchivedVersion',
          'agile-service.product-version.archivedVersion',
          'agile-service.product-version.deleteVersion',
          'agile-service.product-version.updateVersion',
          'agile-service.product-version.createVersion',
          'agile-service.product-version.mergeVersion',
          'agile-service.product-version.listByProjectId',
        ]}
      >
        <Header title="发布版本">
          <Permission type={type} projectId={projectId} organizationId={orgId} service={['agile-service.product-version.createVersion']}>
            <Button
              onClick={() => {
                this.setState({
                  addRelease: true,
                });
              }}
              className="leftBtn"
              funcType="flat"
            >
              <Icon type="playlist_add" />创建发布版本
            </Button>
          </Permission>
          <Permission service={['agile-service.product-version.mergeVersion']} type={type} projectId={projectId} organizationId={orgId}>
            <Button 
              className="leftBtn2" 
              funcType="flat"
              onClick={this.handleCombineRelease.bind(this)}
            >
              <Icon type="device_hub" />版本合并
            </Button>
          </Permission>
          <Button className="leftBtn2" funcType="flat" onClick={this.refresh.bind(this, this.state.pagination)}>
            <Icon type="refresh" />刷新
          </Button>
        </Header>
        <Content
          title={`项目“${AppState.currentMenuType.name}”的发布版本`}
          description="根据项目周期，可以对软件项目追踪不同的版本，同时可以将对应的问题分配到版本中。例如：v1.0.0、v0.5.0等。"
          link="http://v0-8.choerodon.io/zh/docs/user-guide/agile/release/"
        >
          <Spin spinning={this.state.loading}>
            {
              versionData.length > 0 ? (
                <DragSortingTable
                  handleDrag={this.handleDrag}
                  columns={versionColumn}
                  dataSource={versionData}
                  pagination={this.state.pagination}
                  onChange={this.handleChangeTable.bind(this)}
                />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: 800,
                      height: 280,
                      border: '1px dashed rgba(0,0,0,0.54)',
                      justifyContent: 'center',
                    }}
                  >
                    <img style={{ width: 237, height: 200 }} src={emptyVersion} alt="emptyVersion" />
                    <div style={{ marginLeft: 50 }}>
                      <p style={{ color: 'rgba(0,0,0,0.65)' }}>您还没有为此项目添加任何版本</p>
                      <p style={{ fontSize: '20px', lineHeight: '34px' }}>版本是一个项目的时间点，并帮助<br />您组织和安排工作</p>
                    </div>
                  </div>
                </div>
              )
            }
          </Spin>
          <AddRelease
            visible={this.state.addRelease}
            onCancel={() => {
              this.setState({
                addRelease: false,
              });
            }}
            refresh={this.refresh.bind(this, this.state.pagination)}
          />
          <Modal
            title={`删除版本 ${this.state.versionDelete.name}`}
            visible={JSON.stringify(this.state.versionDelete) !== '{}'}
            closable={false}
            okText="删除"
            onOk={() => {
              const data2 = {
                projectId: AppState.currentMenuType.id,
                versionId: this.state.versionDelete.versionId,
              };
              ReleaseStore.axiosDeleteVersion(data2).then((data) => {
                this.refresh(this.state.pagination);
                this.setState({
                  versionDelete: {},
                });
              }).catch((error) => {
              });
            }}
            onCancel={() => {
              this.setState({
                versionDelete: {},
              });
            }}
          >
            <div style={{ marginTop: 20 }}>
              {`确定要删除 V${this.state.versionDelete.name}?`}
            </div>
          </Modal>
          <CombineRelease
            onRef={(ref) => {
              this.combineRelease = ref;
            }}
            sourceList={this.state.sourceList}
            visible={this.state.combineVisible}
            onCancel={() => {
              this.setState({
                combineVisible: false,
              });
            }}
            refresh={this.refresh.bind(this, this.state.pagination)}
          />
          <DeleteReleaseWithIssues
            versionDelInfo={this.state.versionDelInfo}
            onCancel={() => {
              this.setState({
                versionDelInfo: {},
                versionDelete: {},
              });
            }}
            refresh={this.refresh.bind(this, this.state.pagination)}
            changeState={(k, v) => {
              this.setState({
                [k]: v,
              });
            }}
          />
          {this.state.editRelease ? (
            <EditRelease
              visible={this.state.editRelease}
              onCancel={() => {
                this.setState({
                  editRelease: false,
                  selectItem: {},
                });
              }}
              refresh={this.refresh.bind(this, this.state.pagination)}
              data={this.state.selectItem}
            />
          ) : ''}
          <PublicRelease
            visible={this.state.publicVersion}
            onCancel={() => {
              this.setState({
                publicVersion: false,
              });
            }}
            refresh={this.refresh.bind(this, this.state.pagination)}
          />
        </Content>
      </Page>
    );
  }
}

export default withRouter(ReleaseHome);

