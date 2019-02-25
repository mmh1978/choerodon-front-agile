import React, { Component } from 'react';
import { stores, axios, Permission } from 'choerodon-front-boot';
import { withRouter } from 'react-router-dom';
import _ from 'lodash';
import TimeAgo from 'timeago-react';
import {
  Select, Input, DatePicker, Button, Modal, Tabs, InputNumber,
  Tooltip, Progress, Dropdown, Menu, Spin, Icon, Popover,
} from 'choerodon-ui';
import {
  STATUS, COLOR, TYPE, ICON, TYPE_NAME,
} from '../../common/Constant';
import './EditIssueNarrow.scss';
import {
  UploadButtonNow, ReadAndEdit, IssueDescription, DatetimeAgo,
} from '../CommonComponent';
import {
  delta2Html, handleFileUpload, text2Delta, beforeTextUpload, formatDate, returnBeforeTextUpload,
} from '../../common/utils';
import {
  loadBranchs, loadDatalogs, updateStatus, loadLinkIssues, loadLabels,
  loadIssue, loadWorklogs, updateIssue, loadPriorities,
  loadComponents, loadVersions, loadEpics, createCommit,
  deleteIssue, updateIssueType, loadSprints, loadStatus,
  loadWikies, deleteWiki,
} from '../../api/NewIssueApi';
import { getSelf, getUsers, getUser } from '../../api/CommonApi';
import WYSIWYGEditor from '../WYSIWYGEditor';
import FullEditor from '../FullEditor';
import DailyLog from '../DailyLog';
import CreateSubTask from '../CreateSubTask';
import CreateLinkTask from '../CreateLinkTask';
import UserHead from '../UserHead';
import Comment from './Component/Comment';
import WikiItem from './Component/WikiItem';
import Log from './Component/Log';
import DataLogs from './Component/DataLogs';
import DataLog from './Component/DataLog';
import IssueList from './Component/IssueList';
import LinkList from './Component/LinkList';
import CopyIssue from '../CopyIssue';
import TransformSubIssue from '../TransformSubIssue';
import TransformFromSubIssue from '../TransformFromSubIssue';
import CreateBranch from '../CreateBranch';
import Commits from '../Commits';
import MergeRequest from '../MergeRequest';
import Assignee from '../Assignee';
import ChangeParent from '../ChangeParent';
import TypeTag from '../TypeTag';
import Wiki from '../Wiki';
import ScrumBoardStore from '../../stores/project/scrumBoard/ScrumBoardStore';

const { AppState } = stores;
const { Option, blur } = Select;
const { TextArea } = Input;
const { confirm } = Modal;
let sign = true;
let filterSign = false;
const STATUS_SHOW = {
  opened: '开放',
  merged: '已合并',
  closed: '关闭',
};

const storyPointList = ['0.5', '1', '2', '3', '4', '5', '8', '13'];

let loginUserId;
let hasPermission;
class CreateSprint extends Component {
  debounceFilterIssues = _.debounce((input) => {
    this.setState({
      selectLoading: true,
    });
    getUsers(input).then((res) => {
      this.setState({
        originUsers: res.content,
        selectLoading: false,
      });
    });
  }, 500);

  constructor(props) {
    super(props);
    this.needBlur = true;
    this.componentRef = React.createRef();
    this.state = {
      createdById: undefined,
      issueLoading: false,
      flag: undefined,
      selectLoading: true,
      saveLoading: false,
      rollup: false,
      edit: false,
      addCommit: false,
      addCommitDes: '',
      dailyLogShow: false,
      createLoading: false,
      createSubTaskShow: false,
      createLinkTaskShow: false,
      createBranchShow: false,
      assigneeShow: false,
      changeParentShow: false,
      editDesShow: false,
      copyIssueShow: false,
      transformSubIssueShow: false,
      origin: {},
      loading: true,
      nav: 'detail',
      editDes: undefined,
      editCommentId: undefined,
      editComment: undefined,
      editLogId: undefined,
      editLog: undefined,
      currentRae: undefined,
      issueId: undefined,
      assigneeId: undefined,
      assigneeName: '',
      assigneeImageUrl: undefined,
      epicId: undefined,
      estimateTime: undefined,
      remainingTime: undefined,
      epicName: '',
      issueNum: undefined,
      typeCode: 'story',
      issueTypeDTO: {},
      parentIssueId: undefined,
      reporterId: undefined,
      reporterImageUrl: undefined,
      sprintId: undefined,
      sprintName: '',
      statusId: undefined,
      statusCode: undefined,
      statusMapDTO: {},
      storyPoints: undefined,
      creationDate: undefined,
      lastUpdateDate: undefined,
      statusName: '',
      priorityName: '',
      priorityId: false,
      priorityColor: '#FFFFFF',
      priorityDTO: {},
      reporterName: '',
      summary: '',
      description: '',
      versionIssueRelDTOList: [],
      componentIssueRelDTOList: [],
      activeSprint: {},
      closeSprint: [],
      worklogs: [],
      datalogs: [],
      fileList: [],
      issueCommentDTOList: [],
      issueLinkDTOList: [],
      labelIssueRelDTOList: [],
      subIssueDTOList: [],
      linkIssues: [],
      fixVersions: [],
      influenceVersions: [],
      fixVersionsFixed: [],
      influenceVersionsFixed: [],
      branchs: {},
      originStatus: [],
      originPriorities: [],
      originComponents: [],
      originVersions: [],
      originLabels: [],
      originEpics: [],
      originUsers: [],
      originSprints: [],
      originFixVersions: [],
      originInfluenceVersions: [],
      transformId: false,
      addWiki: false,
      wikies: [],
    };
  }

  componentDidMount() {
    const { onRef, issueId } = this.props;
    if (onRef) {
      onRef(this);
    }
    this.firstLoadIssue(issueId);
    document.getElementById('scroll-area').addEventListener('scroll', (e) => {
      if (sign) {
        const { nav } = this.state;
        const currentNav = this.getCurrentNav(e);
        if (nav !== currentNav && currentNav) {
          this.setState({
            nav: currentNav,
          });
        }
      }
    });

    axios.all([
      axios.get('/iam/v1/users/self'),
      axios.post('/iam/v1/permissions/checkPermission', [{
        code: 'agile-service.project-info.updateProjectInfo',
        organizationId: AppState.currentMenuType.organizationId,
        projectId: AppState.currentMenuType.id,
        resourceType: 'project',
      }]),
    ])
      .then(axios.spread((users, permission) => {
        loginUserId = users.id;
        hasPermission = permission[0].approve;
      }));
  }

  componentWillReceiveProps(nextProps) {
    const { issueId } = this.props;
    if (nextProps.issueId && nextProps.issueId !== issueId) {
      this.setState({
        currentRae: undefined,
      });
      this.firstLoadIssue(nextProps.issueId);
    }
  }

  onFilterChange(input) {
    if (!filterSign) {
      this.setState({
        selectLoading: true,
      });
      getUsers(input).then((res) => {
        this.setState({
          originUsers: res.content,
          selectLoading: false,
        });
      });
      filterSign = true;
    } else {
      this.debounceFilterIssues(input);
    }
  }

  getCurrentNav = (e) => {
    const { issueTypeDTO } = this.state;
    let eles;
    if (issueTypeDTO && issueTypeDTO.typeCode === 'sub_task') {
      eles = ['detail', 'des', 'attachment', 'wiki', 'commit', 'log', 'branch'];
    } else {
      eles = ['detail', 'des', 'attachment', 'wiki', 'commit', 'log', 'sub_task', 'link_task', 'branch'];
    }
    return _.find(eles, i => this.isInLook(document.getElementById(i)));
  }

  scrollToAnchor = (anchorName) => {
    if (anchorName) {
      const anchorElement = document.getElementById(anchorName);
      if (anchorElement) {
        sign = false;
        anchorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'end',
        });
        setTimeout(() => {
          sign = true;
        }, 2000);
      }
    }
  }

  /**
   * Attachment
   */
  addFileToFileList = (data) => {
    this.reloadIssue();
  }

  setAnIssueToState = (paramIssue) => {
    const { origin } = this.state;
    const issue = paramIssue || origin;
    const {
      activeSprint,
      assigneeId,
      assigneeName,
      assigneeImageUrl,
      closeSprint,
      componentIssueRelDTOList,
      creationDate,
      description,
      epicId,
      epicName,
      epicColor,
      estimateTime,
      issueCommentDTOList,
      issueId,
      issueLinkDTOList,
      issueNum,
      labelIssueRelDTOList,
      lastUpdateDate,
      objectVersionNumber,
      parentIssueId,
      parentIssueNum,
      priorityDTO,
      projectId,
      remainingTime,
      reporterId,
      reporterName,
      reporterImageUrl,
      sprintId,
      sprintName,
      statusId,
      statusCode,
      statusName,
      statusMapDTO,
      storyPoints,
      summary,
      typeCode,
      issueTypeDTO,
      versionIssueRelDTOList,
      subIssueDTOList,
    } = issue;
    const fileList = _.map(issue.issueAttachmentDTOList, issueAttachment => ({
      uid: issueAttachment.attachmentId,
      name: issueAttachment.fileName,
      url: issueAttachment.url,
    }));
    const fixVersionsTotal = _.filter(versionIssueRelDTOList, { relationType: 'fix' }) || [];
    const fixVersionsFixed = _.filter(fixVersionsTotal, { statusCode: 'archived' }) || [];
    const fixVersions = _.filter(fixVersionsTotal, v => v.statusCode !== 'archived') || [];
    const influenceVersions = _.filter(versionIssueRelDTOList, { relationType: 'influence' }) || [];
    // const influenceVersionsFixed = _.filter(influenceVersionsTotal, { statusCode: 'archived' }) || [];
    // const influenceVersions = _.filter(influenceVersionsTotal, v => v.statusCode !== 'archived') || [];
    this.setState({
      origin: issue,
      activeSprint: activeSprint || {},
      assigneeId,
      assigneeName,
      assigneeImageUrl,
      closeSprint,
      componentIssueRelDTOList,
      creationDate,
      editDes: description,
      description,
      epicId,
      epicName,
      epicColor,
      estimateTime,
      fileList,
      issueCommentDTOList,
      issueId,
      issueLinkDTOList,
      issueNum,
      labelIssueRelDTOList,
      lastUpdateDate,
      objectVersionNumber,
      parentIssueId,
      parentIssueNum,
      priorityDTO,
      priorityId: priorityDTO.id,
      priorityName: priorityDTO.name,
      priorityColor: priorityDTO.colour,
      projectId,
      remainingTime,
      reporterId,
      reporterName,
      reporterImageUrl,
      sprintId,
      sprintName,
      statusId: statusMapDTO.id,
      statusCode: statusMapDTO.type,
      statusName: statusMapDTO.name,
      storyPoints,
      summary,
      typeCode,
      issueTypeDTO,
      versionIssueRelDTOList,
      subIssueDTOList,
      fixVersions,
      influenceVersions,
      fixVersionsFixed,
      issueLoading: false,
    });
  }

  /**
   * Attachment
   */
  setFileList = (data) => {
    this.setState({ fileList: data });
  };

  /**
   * Attachment
   */
  onChangeFileList = (arr) => {
    const { origin } = this.state;
    if (arr.length > 0 && arr.some(one => !one.url)) {
      const config = {
        issueId: origin.issueId,
        fileName: arr[0].name || 'AG_ATTACHMENT',
        projectId: AppState.currentMenuType.id,
      };
      handleFileUpload(arr, this.addFileToFileList, config);
    }
  };

  onDeleteWiki = async (id) => {
    const { origin } = this.state;
    const { issueId } = origin;
    await deleteWiki(id);
    const res = await loadWikies(issueId);
    this.setState({
      wikies: res || [],
    });
  };

  onWikiCreate = async () => {
    const { origin } = this.state;
    const { issueId } = origin;
    this.setState({ addWiki: false });
    const res = await loadWikies(issueId);
    this.setState({
      wikies: res || [],
    });
  };

  renderWiki = () => {
    const { wikies } = this.state;
    return (
      <div>
        {
          wikies && wikies.wikiRelationList
          && wikies.wikiRelationList.map(wiki => (
            <WikiItem
              key={wiki.id}
              wiki={wiki}
              onDeleteWiki={this.onDeleteWiki}
              wikiHost={wikies.wikiHost}
              type="narrow"
            />
          ))
        }
      </div>
    );
  };


  /**
   * Comment
   */
  createCommit = (commit) => {
    createCommit(commit).then((res) => {
      this.reloadIssue();
      this.setState({
        addCommit: false,
        addCommitDes: '',
      });
    });
  };

  handleDeleteIssue = (issueId) => {
    const that = this;
    const { issueNum, subIssueDTOList } = this.state;
    confirm({
      width: 560,
      title: `删除问题${issueNum}`,
      content:
        (
          <div>
            <p style={{ marginBottom: 10 }}>请确认您要删除这个问题。</p>
            <p style={{ marginBottom: 10 }}>这个问题将会被彻底删除。包括所有附件和评论。</p>
            <p style={{ marginBottom: 10 }}>如果您完成了这个问题，通常是已解决或者已关闭，而不是删除。</p>
            {
              subIssueDTOList.length ? <p style={{ color: '#d50000' }}>{`注意：问题的${subIssueDTOList.length}子任务将被删除。`}</p> : null
            }
          </div>
        ),
      onOk() {
        return deleteIssue(issueId)
          .then((res) => {
            that.props.onDeleteIssue();
          });
      },
      onCancel() { },
      okText: '删除',
      okType: 'danger',
    });
  }

  handleTitleChange = (e) => {
    this.setState({ summary: e.target.value });
    this.needBlur = false;
    // 由于 OnChange 和 OnBlur 几乎同时执行，不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序
    setTimeout(() => { this.needBlur = true; }, 100);
  };

  handleEpicNameChange = (e) => {
    this.setState({ epicName: e.target.value });
  };

  handleStoryPointsChange = (e) => {
    this.setState({ storyPoints: (e && (e > 999.9 ? 999.9 : e)) || '' });
  };

  handleRemainingTimeChange = (e) => {
    this.setState({ remainingTime: (e && (e > 999.9 ? 999.9 : e)) || '' });
  };

  handleChangeStoryPoint = (value) => {
    const { storyPoints } = this.state;
    // 只允许输入整数，选择时可选0.5
    if (value === '0.5') {
      this.setState({
        storyPoints: '0.5',
      });
    } else if (/^(0|[1-9][0-9]*)(\[0-9]*)?$/.test(value) || value === '') {
      this.setState({
        storyPoints: String(value).slice(0, 3), // 限制最长三位,
      });
    } else if (value.toString().charAt(value.length - 1) === '.') {
      this.setState({
        storyPoints: value.slice(0, -1),
      });
    } else {
      this.setState({
        storyPoints,
      });
    }
  };

  handleChangeRemainingTime = (value) => {
    const { remainingTime } = this.state;
    // 只允许输入整数，选择时可选0.5
    if (value === '0.5') {
      this.setState({
        remainingTime: '0.5',
      });
    } else if (/^(0|[1-9][0-9]*)(\[0-9]*)?$/.test(value) || value === '') {
      this.setState({
        remainingTime: String(value).slice(0, 3), // 限制最长三位,
      });
    } else if (value.toString().charAt(value.length - 1) === '.') {
      this.setState({
        remainingTime: value.slice(0, -1),
      });
    } else {
      this.setState({
        remainingTime,
      });
    }
  };

  getWorkloads = () => {
    const { worklogs } = this.state;
    if (!Array.isArray(worklogs)) {
      return 0;
    }
    const workTimeArr = _.reduce(worklogs, (sum, v) => sum + (v.workTime || 0), 0);
    return workTimeArr;
  };

  refresh = () => {
    const { origin } = this.state;
    loadIssue(origin.issueId).then((res) => {
      this.setAnIssueToState(res);
      this.setState({
        createdById: res.createdBy,
      });
    });
    loadWorklogs(origin.issueId).then((res) => {
      this.setState({
        worklogs: res,
      });
    });
  };

  loadIssueStatus = () => {
    const {
      issueTypeDTO,
      issueId,
      origin,
    } = this.state;
    const typeId = issueTypeDTO.id;
    this.setAnIssueToState();
    loadStatus(origin.statusId, issueId, typeId).then((res) => {
      this.setState({
        originStatus: res,
        selectLoading: false,
      });
    });
  };

  statusOnChange = (e, item) => {
    // e.preventDefault();
    const that = this;
    if (that.needBlur) {
      setTimeout(() => {
        if (document.getElementsByClassName(that.state.currentRae).length) {
          that.needBlur = false;
          document.getElementsByClassName(that.state.currentRae)[0].click();
        }
      }, 10);
    }
  };

  updateVersionSelect = (originPros, pros) => {
    const { state } = this;
    const { issueId, origin: { objectVersionNumber } } = this.state;
    const { onUpdate, onCreateVersion } = this.props;
    const obj = {
      issueId,
      objectVersionNumber,
      versionType: pros === 'fixVersions' ? 'fix' : 'influence',
    };
    const origin = state[originPros];
    let target;
    let transPros;
    let newSign = false;
    if (!state[pros].length) {
      transPros = [];
    } else if (typeof state[pros][0] !== 'string') {
      transPros = this.transToArr(state[pros], 'name', 'array');
    } else {
      transPros = state[pros];
    }
    const out = _.map(transPros, (pro) => {
      if (origin.length && origin[0].name) {
        target = _.find(origin, { name: pro });
      }
      if (target) {
        return ({
          ...target,
          relationType: pros === 'fixVersions' ? 'fix' : 'influence',
        });
      } else {
        newSign = true;
        return ({
          name: pro,
          relationType: pros === 'fixVersions' ? 'fix' : 'influence',
          projectId: AppState.currentMenuType.id,
        });
      }
    });
    obj.versionIssueRelDTOList = out;
    updateIssue(obj)
      .then((res) => {
        this.reloadIssue();
        if (onUpdate) {
          onUpdate();
        }
        if (newSign && onCreateVersion) {
          onCreateVersion();
        }
      });
  };

  updateIssue = (pro) => {
    const { state } = this;
    const {
      origin,
      issueId,
      transformId,
    } = this.state;
    const { onUpdate } = this.props;
    const obj = {
      issueId,
      objectVersionNumber: origin.objectVersionNumber,
    };
    if ((pro === 'description') || (pro === 'editDes')) {
      if (state[pro]) {
        returnBeforeTextUpload(state[pro], obj, updateIssue, 'description')
          .then((res) => {
            this.reloadIssue(state.origin.issueId);
          });
      }
    } else if (pro === 'assigneeId' || pro === 'reporterId') {
      obj[pro] = state[pro] ? JSON.parse(state[pro]).id || 0 : 0;
      updateIssue(obj)
        .then((res) => {
          this.reloadIssue();
          if (onUpdate) {
            onUpdate();
          }
        });
    } else if (pro === 'storyPoints' || pro === 'remainingTime') {
      obj[pro] = state[pro] === '' ? null : state[pro];
      updateIssue(obj)
        .then((res) => {
          this.reloadIssue();
          if (onUpdate) {
            onUpdate();
          }
        });
    } else if (pro === 'statusId') {
      if (transformId) {
        updateStatus(transformId, issueId, origin.objectVersionNumber)
          .then((res) => {
            this.reloadIssue();
            if (onUpdate) {
              onUpdate();
            }
            this.setState({
              transformId: false,
            });
          });
      }
    } else {
      obj[pro] = state[pro] || 0;
      updateIssue(obj)
        .then((res) => {
          this.reloadIssue();
          if (onUpdate) {
            onUpdate();
          }
        });
    }
  };

  updateIssueSelect = (originPros, pros) => {
    const { state } = this;
    const { issueId, origin: { objectVersionNumber } } = this.state;
    const { onUpdate } = this.props;
    const obj = {
      issueId,
      objectVersionNumber,
    };
    const origin = state[originPros];
    let target;
    let transPros;
    if (originPros === 'originLabels') {
      if (!state[pros].length) {
        transPros = [];
      } else if (typeof state[pros][0] !== 'string') {
        transPros = this.transToArr(state[pros], 'labelName', 'array');
      } else {
        transPros = state[pros];
      }
    } else if (!state[pros].length) {
      transPros = [];
    } else if (typeof state[pros][0] !== 'string') {
      transPros = this.transToArr(state[pros], 'name', 'array');
    } else {
      transPros = state[pros];
    }
    const out = _.map(transPros, (pro) => {
      if (origin.length && origin[0].name) {
        target = _.find(origin, { name: pro });
      } else {
        target = _.find(origin, { labelName: pro });
      }
      // const target = _.find(origin, { name: pro });
      if (target) {
        return target;
      } else if (originPros === 'originLabels') {
        return ({
          labelName: pro,
          // created: true,
          projectId: AppState.currentMenuType.id,
        });
      } else {
        return ({
          name: pro,
          // created: true,
          projectId: AppState.currentMenuType.id,
        });
      }
    });
    obj[pros] = out;
    updateIssue(obj)
      .then((res) => {
        this.reloadIssue();
        if (onUpdate) {
          onUpdate();
        }
      });
  };

  isInLook = (ele) => {
    const a = ele.offsetTop;
    const target = document.getElementById('scroll-area');
    // return a >= target.scrollTop && a < (target.scrollTop + target.offsetHeight);
    return a + ele.offsetHeight > target.scrollTop;
  }

  resetStoryPoints(value) {
    this.setState({ storyPoints: value });
  }

  resetRemainingTime(value) {
    this.setState({ remainingTime: value });
  }

  resetAssigneeId(value) {
    this.setState({ assigneeId: value });
  }

  resetReporterId(value) {
    this.setState({ reporterId: value });
  }

  resetSummary(value) {
    this.setState({ summary: value });
  }

  resetEpicName(value) {
    this.setState({ epicName: value });
  }

  resetPriorityId(value) {
    this.setState({ priorityId: value });
  }

  resetStatusId(value) {
    this.setState({ statusId: value });
  }

  resetEpicId(value) {
    this.setState({ epicId: value });
  }

  resetSprintId(value) {
    this.setState({ sprintId: value });
  }

  resetComponentIssueRelDTOList(value) {
    this.setState({ componentIssueRelDTOList: value });
  }

  resetInfluenceVersions(value) {
    this.setState({ influenceVersions: value });
  }

  resetFixVersions(value) {
    this.setState({ fixVersions: value });
  }

  resetlabelIssueRelDTOList(value) {
    this.setState({ labelIssueRelDTOList: value });
  }

  firstLoadIssue(paramIssueId) {
    const { origin } = this.state;
    const issueId = paramIssueId || origin.issueId;
    this.setState({
      addCommit: false,
      addCommitDes: '',
      editDesShow: undefined,
      editDes: undefined,
      editCommentId: undefined,
      editComment: undefined,
      editLogId: undefined,
      editLog: undefined,
      issueLoading: true,
      addWiki: false,
    }, () => {
      loadIssue(issueId).then((res) => {
        this.setAnIssueToState(res);
        // store.setClickIssueDetail(res);
        this.setState({
          createdById: res.createdBy,
          creationDate: res.creationDate,
        });
      });
      loadWorklogs(issueId).then((res) => {
        this.setState({
          worklogs: res,
        });
      });
      loadLinkIssues(issueId).then((res) => {
        this.setState({
          linkIssues: res,
        });
      });
      loadDatalogs(issueId).then((res) => {
        this.setState({
          datalogs: res,
        });
      });
      loadBranchs(issueId).then((res) => {
        this.setState({
          branchs: res || {},
        });
      });
      loadWikies(issueId).then((res) => {
        this.setState({
          wikies: res || [],
        });
      });
      this.setState({
        editDesShow: false,
      });
    });
  }

  reloadIssue(paramIssueId) {
    const { onUpdate, store } = this.props;
    this.firstLoadIssue(paramIssueId);
    if (onUpdate) {
      onUpdate();
    }
  }

  /**
   * Comment
   */

  handleCreateCommit() {
    const { addCommitDes, origin: { issueId: extra } } = this.state;
    if (addCommitDes) {
      beforeTextUpload(addCommitDes, { issueId: extra, commentText: '' }, this.createCommit, 'commentText');
    } else {
      this.createCommit({ issueId: extra, commentText: '' });
    }
  }

  transToArr(arr, pro, type = 'string') {
    if (!arr.length) {
      return type === 'string' ? '无' : [];
    } else if (typeof arr[0] === 'object') {
      return type === 'string' ? _.map(arr, pro).join() : _.map(arr, pro);
    } else {
      return type === 'string' ? arr.join() : arr;
    }
  }

  handleCreateSubIssue(subIssue) {
    const { onUpdate } = this.props;
    this.reloadIssue();
    this.setState({
      createSubTaskShow: false,
    });
    if (onUpdate) {
      onUpdate();
    }
  }

  handleCreateLinkIssue() {
    const { onUpdate } = this.props;
    this.reloadIssue();
    this.setState({
      createLinkTaskShow: false,
    });
    if (onUpdate) {
      onUpdate();
    }
  }

  handleCopyIssue() {
    const { onUpdate } = this.props;
    this.reloadIssue();
    this.setState({
      copyIssueShow: false,
    });
    if (onUpdate) {
      onUpdate();
    }
    if (onUpdate) {
      onUpdate();
    }
  }

  handleTransformSubIssue() {
    const { onUpdate } = this.props;
    this.reloadIssue();
    this.setState({
      transformSubIssueShow: false,
    });
    if (onUpdate) {
      onUpdate();
    }
    if (onUpdate) {
      onUpdate();
    }
  }

  handleTransformFromSubIssue() {
    const { onUpdate } = this.props;
    this.reloadIssue();
    this.setState({
      transformFromSubIssueShow: false,
    });
    if (onUpdate) {
      onUpdate();
    }
    if (onUpdate) {
      onUpdate();
    }
  }

  handleClickMenu(e) {
    const { origin: { issueId } } = this.state;
    if (e.key === '0') {
      this.setState({ dailyLogShow: true });
    } else if (e.key === '1') {
      const { createdById } = this.state;
      this.handleDeleteIssue(issueId);
    } else if (e.key === '2') {
      this.setState({ createSubTaskShow: true });
    } else if (e.key === '3') {
      this.setState({ copyIssueShow: true });
    } else if (e.key === '4') {
      this.setState({ transformSubIssueShow: true });
    } else if (e.key === '5') {
      this.setState({ transformFromSubIssueShow: true });
    } else if (e.key === '6') {
      this.setState({ createBranchShow: true });
    } else if (e.key === '7') {
      this.setState({ assigneeShow: true });
    } else if (e.key === '8') {
      this.setState({ changeParentShow: true });
    }
  }

  handleChangeType(type) {
    const { issueId, summary, origin } = this.state;
    const { issueId: id, onUpdate } = this.props;
    const issueupdateTypeDTO = {
      epicName: type.key === 'issue_epic' ? summary : undefined,
      issueId,
      objectVersionNumber: origin.objectVersionNumber,
      typeCode: type.key,
      issueTypeId: type.item.props.value,
    };
    updateIssueType(issueupdateTypeDTO)
      .then((res) => {
        loadIssue(id).then((response) => {
          this.setState({
            createdById: res.createdBy,
          });
          this.reloadIssue(origin.issueId);
          onUpdate();
        });
      });
  }

  changeRae(currentRae) {
    this.setState({
      currentRae,
    });
  }

  /**
   * Comment
   */
  renderCommits() {
    const { addCommitDes, addCommit, issueCommentDTOList } = this.state;
    const delta = text2Delta(addCommitDes);
    return (
      <div>
        {
          addCommit && (
            <div className="line-start mt-10">
              <WYSIWYGEditor
                bottomBar
                value={delta}
                style={{ height: 200, width: '100%' }}
                onChange={(value) => {
                  this.setState({ addCommitDes: value });
                }}
                handleDelete={() => {
                  this.setState({
                    addCommit: false,
                    addCommitDes: '',
                  });
                }}
                handleSave={() => this.handleCreateCommit()}
                handleClickOutSide={() => this.handleCreateCommit()}
              />
            </div>
          )
        }
        {
          issueCommentDTOList.map(comment => (
            <Comment
              key={comment.commentId}
              comment={comment}
              onDeleteComment={() => this.reloadIssue()}
              onUpdateComment={() => this.reloadIssue()}
            />
          ))
        }
      </div>
    );
  }

  /**
   * Log
   */
  renderLogs() {
    const { worklogs } = this.state;
    return (
      <div>
        {
          worklogs.map(worklog => (
            <Log
              key={worklog.logId}
              worklog={worklog}
              onDeleteLog={() => this.reloadIssue()}
              onUpdateLog={() => this.reloadIssue()}
            />
          ))
        }
      </div>
    );
  }

  /**
   * DataLog
   */
  renderDataLogs() {
    const {
      datalogs: stateDatalogs, typeCode, createdById, creationDate, origin,
    } = this.state;
    const datalogs = _.filter(stateDatalogs, v => v.field !== 'Version');
    const {
      createdBy,
      createrImageUrl, createrEmail,
      createrName, issueTypeDTO,
    } = origin;
    const createLog = {
      email: createrEmail,
      field: issueTypeDTO && issueTypeDTO.typeCode,
      imageUrl: createrImageUrl,
      name: createrName,
      lastUpdateDate: origin.creationDate,
      lastUpdatedBy: createdBy,
      newString: 'issueNum',
      newValue: 'issueNum',
    };
    return <DataLogs datalogs={[...datalogs, createLog]} typeCode={typeCode} createdById={createdById} creationDate={creationDate} />;
  }

  /**
   * SubIssue
   */
  renderSubIssues() {
    const { subIssueDTOList } = this.state;
    return (
      <div className="c7n-tasks">
        {
          subIssueDTOList.map((subIssue, i) => this.renderIssueList(subIssue, i))
        }
      </div>
    );
  }

  renderLinkIssues() {
    const { linkIssues } = this.state;
    const group = _.groupBy(linkIssues, 'ward');
    return (
      <div className="c7n-tasks">
        {
          _.map(group, (v, k) => (
            <div key={k}>
              <div style={{ margin: '7px auto' }}>{k}</div>
              {
                _.map(v, (linkIssue, i) => this.renderLinkList(linkIssue, i))
              }
            </div>
          ))
        }
      </div>
    );
  }

  /**
   * IssueList
   * @param {*} issue
   * @param {*} i
   */
  renderIssueList(issue, i) {
    const { origin } = this.state;
    return (
      <IssueList
        key={issue.issueId}
        issue={{
          ...issue,
          typeCode: issue.typeCode || 'sub_task',
        }}
        i={i}
        onOpen={() => {
          this.reloadIssue(issue.issueId);
        }}
        onRefresh={() => {
          this.reloadIssue(origin.issueId);
        }}
      />
    );
  }

  renderLinkList(link, i) {
    const { origin } = this.state;
    return (
      <LinkList
        issue={{
          ...link,
          typeCode: link.typeCode,
        }}
        i={i}
        onOpen={(issueId, linkedIssueId) => {
          this.reloadIssue(issueId === origin.issueId ? linkedIssueId : issueId);
        }}
        onRefresh={() => {
          this.reloadIssue(origin.issueId);
        }}
      />
    );
  }

  /**
   * Des
   */
  renderDes() {
    let delta;
    const { editDesShow, description, editDes } = this.state;
    if (editDesShow === undefined) {
      return null;
    }
    if (!description || editDesShow) {
      delta = text2Delta(editDes);
      return (
        <div className="line-start mt-10">
          <WYSIWYGEditor
            bottomBar
            value={text2Delta(editDes)}
            style={{ height: 200, width: '100%' }}
            onChange={(value) => {
              this.setState({ editDes: value });
            }}
            handleDelete={() => {
              this.setState({
                editDesShow: false,
                editDes: description,
              });
            }}
            handleSave={() => {
              this.setState({
                editDesShow: false,
                description: editDes || '',
              });
              this.updateIssue('editDes');
            }}
            handleClickOutSide={() => {
              this.setState({
                editDesShow: false,
                description: editDes || '',
              });
              this.updateIssue('editDes');
            }}
          />
        </div>
      );
    } else {
      delta = delta2Html(description);
      return (
        <div className="c7n-content-wrapper">
          <div
            className="line-start mt-10 c7n-description"
            role="none"
          >
            <IssueDescription data={delta} />
          </div>
        </div>
      );
    }
  }

  renderBranchs() {
    const { branchs } = this.state;
    return (
      <div>
        {
          branchs.branchCount ? (
            <div>
              {
                [].length === 0 ? (
                  <div style={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', padding: '8px 26px', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px',
                  }}
                  >
                    <div style={{ display: 'inline-flex', justifyContent: 'space-between', flex: 1 }}>
                      <span
                        style={{ color: '#3f51b5', cursor: 'pointer' }}
                        role="none"
                        onClick={() => {
                          this.setState({
                            commitShow: true,
                          });
                        }}
                      >
                        {branchs.totalCommit || '0'}
                        {'提交'}
                      </span>
                    </div>
                    <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                      <span style={{ marginRight: 12, marginLeft: 63 }}>已更新</span>
                      <span style={{ width: 60, display: 'inline-block' }}>
                        {
                          branchs.commitUpdateTime ? (
                            <Popover
                              title="提交修改时间"
                              content={branchs.commitUpdateTime}
                              placement="left"
                            >
                              <TimeAgo
                                datetime={branchs.commitUpdateTime}
                                locale={Choerodon.getMessage('zh_CN', 'en')}
                              />
                            </Popover>
                          ) : ''
                        }
                      </span>
                    </div>
                  </div>
                ) : null
              }
              {
                branchs.totalMergeRequest ? (
                  <div style={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', padding: '8px 26px', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px',
                  }}
                  >
                    <div style={{ display: 'inline-flex', justifyContent: 'space-between', flex: 1 }}>
                      <span
                        style={{ color: '#3f51b5', cursor: 'pointer' }}
                        role="none"
                        onClick={() => {
                          this.setState({
                            mergeRequestShow: true,
                          });
                        }}
                      >
                        {branchs.totalMergeRequest}
                        {'合并请求'}
                      </span>
                      <span style={{
                        width: 36, height: 20, borderRadius: '2px', color: '#fff', background: '#4d90fe', textAlign: 'center',
                      }}
                      >
                        {['opened', 'merged', 'closed'].includes(branchs.mergeRequestStatus) ? STATUS_SHOW[branchs.mergeRequestStatus] : ''}
                      </span>
                    </div>
                    <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                      <span style={{ marginRight: 12, marginLeft: 63 }}>已更新</span>
                      <span style={{ width: 60, display: 'inline-block' }}>
                        {
                          branchs.mergeRequestUpdateTime ? (
                            <Popover
                              title="合并请求修改时间"
                              content={branchs.mergeRequestUpdateTime}
                              placement="left"
                            >
                              <TimeAgo
                                datetime={branchs.mergeRequestUpdateTime}
                                locale={Choerodon.getMessage('zh_CN', 'en')}
                              />
                            </Popover>
                          ) : ''
                        }
                      </span>
                    </div>
                  </div>
                ) : null
              }
            </div>
          ) : (
            <div style={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', padding: '8px 26px', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px',
            }}
            >
              <span style={{ marginRight: 12 }}>暂无</span>
            </div>
          )
        }
      </div>
    );
  }

  render() {
    const menu = AppState.currentMenuType;
    this.needBlur = true;
    const { type, id: projectId, organizationId: orgId } = menu;
    const {
      store,
      backUrl,
      history,
      onCancel,
      style,
      resetIssue,
    } = this.props;
    const {
      activeSprint,
      branchs,
      closeSprint,
      sprintId,
      originSprints,
      issueTypeDTO,
      flag,
      assigneeId,
      assigneeName,
      assigneeImageUrl,
      assigneeShow,
      fileList,
      createLinkTaskShow,
      createSubTaskShow,
      mergeRequestShow,
      changeParentShow,
      copyIssueShow,
      editDes,
      edit,
      linkIssues,
      createBranchShow,
      originPriorities,
      selectLoading,
      currentRae,
      priorityId,
      priorityName,
      priorityColor,
      issueId,
      originStatus,
      statusId,
      statusCode,
      statusName,
      creationDate,
      dailyLogShow,
      lastUpdateDate,
      reporterId,
      reporterName,
      reporterImageUrl,
      epicId,
      epicColor,
      epicName,
      originEpics,
      origin,
      description,
      nav,
      issueLoading,
      transformSubIssueShow,
      transformFromSubIssueShow,
      commitShow,
      issueNum,
      parentIssueId,
      parentIssueNum,
      summary,
      storyPoints,
      remainingTime,
      originComponents,
      originUsers,
      componentIssueRelDTOList,
      labelIssueRelDTOList,
      originLabels,
      influenceVersions,
      originVersions,
      fixVersionsFixed,
      fixVersions,
      addWiki,
      wikies,
    } = this.state;
    const issueTypeData = store.getIssueTypes ? store.getIssueTypes : [];
    const typeCode = issueTypeDTO ? issueTypeDTO.typeCode : '';
    const typeId = issueTypeDTO ? issueTypeDTO.id : '';
    const currentType = issueTypeData.find(t => t.id === typeId);
    let issueTypes = [];
    if (currentType) {
      issueTypes = issueTypeData.filter(t => (t.stateMachineId === currentType.stateMachineId
        && t.typeCode !== typeCode && t.typeCode !== 'sub_task'
      ));
    }
    const getMenu = () => {
      const { createdById } = this.state;
      return (
        <Menu onClick={this.handleClickMenu.bind(this)}>
          <Menu.Item key="0">
            {'登记工作日志'}
          </Menu.Item>
          {
            <Menu.Item
              key="1"
              disabled={loginUserId !== createdById && !hasPermission}
            >
              {'删除'}
            </Menu.Item>
          }
          {
            typeCode !== 'sub_task' && (
              <Menu.Item key="2">
                {'创建子任务'}
              </Menu.Item>
            )
          }
          <Menu.Item key="3">
            {'复制问题'}
          </Menu.Item>
          {
            typeCode !== 'sub_task' && origin.subIssueDTOList && origin.subIssueDTOList.length === 0 && (
              <Menu.Item key="4">
                {'转化为子任务'}
              </Menu.Item>
            )
          }
          {
            typeCode === 'sub_task' && (
              <Menu.Item key="5">
                {'转化为任务'}
              </Menu.Item>
            )
          }
          <Menu.Item key="6">
            {'创建分支'}
          </Menu.Item>
          <Menu.Item key="7">
            {'分配问题'}
          </Menu.Item>
          {
            typeCode === 'sub_task' && (
              <Menu.Item key="8">
                {'修改父级'}
              </Menu.Item>
            )
          }
        </Menu>
      );
    };
    const callback = (value) => {
      this.setState({
        description: value,
        edit: false,
      }, () => {
        this.updateIssue('description');
      });
    };
    const callbackUpload = (newFileList) => {
      this.setState({ fileList: newFileList });
    };
    const typeList = (
      <Menu
        style={{
          background: '#fff',
          boxShadow: '0 5px 5px -3px rgba(0, 0, 0, 0.20), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)',
          borderRadius: '2px',
          // marginTop: 50,
        }}
        onClick={this.handleChangeType.bind(this)}
      >
        {
          issueTypes.map(t => (
            <Menu.Item key={t.typeCode} value={t.id}>
              <TypeTag
                data={t}
                showName
              />
            </Menu.Item>
          ))
        }
      </Menu>
    );
    const urlParams = AppState.currentMenuType;
    return (
      <div className="choerodon-modal-editIssue" style={style}>
        {
          issueLoading ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(255, 255, 255, 0.65)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Spin />
            </div>
          ) : null
        }
        <div className="c7n-nav">
          <div>
            <Dropdown overlay={typeList} trigger={['click']} disabled={typeCode === 'sub_task'}>
              <div
                style={{
                  height: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TypeTag
                  data={issueTypeDTO}
                />
                <Icon
                  type="arrow_drop_down"
                  style={{ fontSize: 16 }}
                />
              </div>
            </Dropdown>
          </div>
          <ul className="c7n-nav-ul" style={{ padding: 0 }}>
            <Tooltip placement="right" title="详情">
              <li id="DETAILS-nav" className={`c7n-li ${nav === 'detail' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="error_outline c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'detail' });
                    this.scrollToAnchor('detail');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="描述">
              <li id="DESCRIPTION-nav" className={`c7n-li ${nav === 'des' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="subject c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'des' });
                    this.scrollToAnchor('des');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="附件">
              <li id="ATTACHMENT-nav" className={`c7n-li ${nav === 'attachment' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="attach_file c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'attachment' });
                    this.scrollToAnchor('attachment');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="Wiki文档">
              <li id="WIKI-nav" className={`c7n-li ${nav === 'wiki' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="library_books c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'wiki' });
                    this.scrollToAnchor('wiki');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="评论">
              <li id="COMMIT-nav" className={`c7n-li ${nav === 'commit' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="sms_outline c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'commit' });
                    this.scrollToAnchor('commit');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="工作日志">
              <li id="LOG-nav" className={`c7n-li ${nav === 'log' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="work_log c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'log' });
                    this.scrollToAnchor('log');
                  }}
                />
              </li>
            </Tooltip>
            <Tooltip placement="right" title="活动日志">
              <li
                id="DATA_LOG-nav"
                className={`c7n-li ${nav === 'data_log' ? 'c7n-li-active' : ''}`}
              >
                <Icon
                  type="insert_invitation c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'data_log' });
                    this.scrollToAnchor('data_log');
                  }}
                />
              </li>
            </Tooltip>
            {
              typeCode !== 'sub_task' && (
                <Tooltip placement="right" title="子任务">
                  <li id="SUB_TASKS-nav" className={`c7n-li ${nav === 'sub_task' ? 'c7n-li-active' : ''}`}>
                    <Icon
                      type="filter_none c7n-icon-li"
                      role="none"
                      onClick={() => {
                        this.setState({ nav: 'sub_task' });
                        this.scrollToAnchor('sub_task');
                      }}
                    />
                  </li>
                </Tooltip>
              )
            }
            {
              typeCode !== 'sub_task' && (
                <Tooltip placement="right" title="问题链接">
                  <li id="LINK_TASKS-nav" className={`c7n-li ${nav === 'link_task' ? 'c7n-li-active' : ''}`}>
                    <Icon
                      type="link c7n-icon-li"
                      role="none"
                      onClick={() => {
                        this.setState({ nav: 'link_task' });
                        this.scrollToAnchor('link_task');
                      }}
                    />
                  </li>
                </Tooltip>
              )
            }
            <Tooltip placement="right" title="开发">
              <li id="BRANCH-nav" className={`c7n-li ${nav === 'branch' ? 'c7n-li-active' : ''}`}>
                <Icon
                  type="branch c7n-icon-li"
                  role="none"
                  onClick={() => {
                    this.setState({ nav: 'branch' });
                    this.scrollToAnchor('branch');
                  }}
                />
              </li>
            </Tooltip>
          </ul>
        </div>
        <div className="c7n-content">
          <div className="c7n-content-top">
            <div className="c7n-header-editIssue">
              <div className="c7n-content-editIssue" style={{ overflowY: 'hidden' }}>
                <div
                  className="line-justify"
                  style={{
                    height: '28px',
                    alignItems: 'center',
                    marginTop: '10px',
                    marginBottom: '3px',
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: '28px', fontWeight: 500 }}>
                    {
                      typeCode === 'sub_task' ? (
                        <span>
                          <span
                            role="none"
                            style={{ color: 'rgb(63, 81, 181)', cursor: 'pointer' }}
                            onClick={() => {
                              this.firstLoadIssue(parentIssueId);
                              if (resetIssue) {
                                resetIssue(parentIssueId);
                              }
                            }
                            }
                          >
                            {parentIssueNum}
                          </span>
                          <span style={{ paddingLeft: 10, paddingRight: 10 }}>/</span>
                        </span>
                      ) : null
                    }
                    {
                      typeCode === 'sub_task' ? (
                        <span>
                          {issueNum}
                        </span>
                      ) : (
                        <a
                          role="none"
                          onClick={() => {
                            // const backUrl = this.props.backUrl || 'backlog';
                            history.push(`/agile/issue?type=${urlParams.type}&id=${urlParams.id}&name=${encodeURIComponent(urlParams.name)}&organizationId=${urlParams.organizationId}&paramName=${origin.issueNum}&paramIssueId=${origin.issueId}&paramUrl=${backUrl || 'backlog'}`);
                            return false;
                          }}
                        >
                          {issueNum}
                        </a>
                      )
                    }
                  </div>
                  <div
                    style={{
                      cursor: 'pointer', fontSize: '13px', lineHeight: '20px', display: 'flex', alignItems: 'center',
                    }}
                    role="none"
                    onClick={() => {
                      onCancel();
                    }}
                  >
                    <Icon type="last_page" style={{ fontSize: '18px', fontWeight: '500' }} />
                    <span>隐藏详情</span>
                  </div>
                </div>
                <div className="line-justify" style={{ marginBottom: 5, alignItems: 'flex-start' }}>
                  <ReadAndEdit
                    callback={this.changeRae.bind(this)}
                    thisType="summary"
                    line
                    current={currentRae}
                    origin={origin.summary}
                    onInit={() => this.setAnIssueToState()}
                    onOk={this.updateIssue.bind(this, 'summary')}
                    onCancel={this.resetSummary.bind(this)}
                    readModeContent={(
                      <div className="c7n-summary">
                        {summary}
                      </div>
                    )}
                  >
                    <TextArea
                      maxLength={44}
                      value={summary}
                      size="small"
                      onChange={this.handleTitleChange.bind(this)}
                      onPressEnter={() => {
                        this.updateIssue('summary');
                        this.setState({
                          currentRae: undefined,
                        });
                      }}
                    // onBlur={() => this.statusOnChange()}
                    />
                  </ReadAndEdit>
                  <div style={{ flexShrink: 0, color: 'rgba(0, 0, 0, 0.65)' }}>
                    <Dropdown overlay={getMenu()} trigger={['click']}>
                      <Button icon="more_vert" />
                    </Dropdown>
                  </div>
                </div>
                <div className="line-start">
                  {
                    issueId && typeCode === 'story' ? (
                      <div style={{ display: 'flex', marginRight: 25 }}>
                        <span>故事点：</span>
                        <div style={{ maxWidth: 130 }}>
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="storyPoints"
                            current={currentRae}
                            handleEnter
                            origin={origin.storyPoints}
                            onInit={() => this.setAnIssueToState(origin)}
                            onOk={this.updateIssue.bind(this, 'storyPoints')}
                            onCancel={this.resetStoryPoints.bind(this)}
                            readModeContent={(
                              <span>
                                {storyPoints === undefined || storyPoints === null ? '无' : `${storyPoints} 点`}
                              </span>
                            )}
                          >
                            <Select
                              value={storyPoints && storyPoints.toString()}
                              mode="combobox"
                              // onBlur={e => this.statusOnChange(e)}
                              ref={(e) => {
                                this.componentRef = e;
                              }}
                              onPopupFocus={(e) => {
                                this.componentRef.rcSelect.focus();
                              }}
                              tokenSeparators={[',']}
                              // getPopupContainer={triggerNode => triggerNode.parentNode}
                              style={{ marginTop: 0, paddingTop: 0 }}
                              onChange={value => this.handleChangeStoryPoint(value)}
                            >
                              {storyPointList.map(sp => (
                                <Option key={sp.toString()} value={sp}>
                                  {sp}
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                    ) : null
                  }
                  {
                    issueId && typeCode !== 'issue_epic' ? (
                      <div style={{ display: 'flex' }}>
                        <span>预估时间：</span>
                        <div style={{ maxWidth: 150 }}>
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="remainingTime"
                            current={currentRae}
                            handleEnter
                            origin={remainingTime}
                            onInit={() => this.setAnIssueToState(origin)}
                            onOk={this.updateIssue.bind(this, 'remainingTime')}
                            onCancel={this.resetRemainingTime.bind(this)}
                            readModeContent={(
                              <span>
                                {remainingTime === undefined || remainingTime === null ? '无' : `${remainingTime} 小时`}
                              </span>
                            )}
                          >
                            <Select
                              value={remainingTime && remainingTime.toString()}
                              mode="combobox"
                              ref={(e) => {
                                this.componentRef = e;
                              }}
                              onPopupFocus={(e) => {
                                this.componentRef.rcSelect.focus();
                              }}
                              tokenSeparators={[',']}
                              style={{ marginTop: 0, paddingTop: 0 }}
                              onChange={value => this.handleChangeRemainingTime(value)}
                            >
                              {storyPointList.map(sp => (
                                <Option key={sp.toString()} value={sp}>
                                  {sp}
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                    ) : null
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="c7n-content-bottom" id="scroll-area" style={{ position: 'relative' }}>
            <section className="c7n-body-editIssue">
              <div className="c7n-content-editIssue">
                <div className="c7n-details">
                  <div id="detail">
                    <div className="c7n-title-wrapper" style={{ marginTop: 0 }}>
                      <div className="c7n-title-left">
                        <Icon type="error_outline c7n-icon-title" />
                        <span>详情</span>
                      </div>
                      <div style={{
                        flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                      }}
                      />
                    </div>
                    <div className="c7n-content-wrapper">
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'状态：'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="statusId"
                            current={currentRae}
                            handleEnter
                            origin={statusId}
                            onOk={this.updateIssue.bind(this, 'statusId')}
                            onCancel={this.resetStatusId.bind(this)}
                            onInit={this.loadIssueStatus}
                            readModeContent={(
                              <div>
                                {
                                  statusId ? (
                                    <div
                                      style={{
                                        background: STATUS[statusCode],
                                        color: '#fff',
                                        borderRadius: '2px',
                                        padding: '0 8px',
                                        display: 'inline-block',
                                        margin: '2px auto 2px 0',
                                      }}
                                    >
                                      {statusName}
                                    </div>
                                  ) : '无'
                                }
                              </div>
                            )}
                          >
                            <Select
                              value={originStatus.length ? statusId : statusName}
                              style={{ width: 150 }}
                              loading={selectLoading}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              // onBlur={() => this.statusOnChange()}
                              onChange={(value, item) => {
                                this.setState({
                                  statusId: value,
                                  transformId: item.key,
                                });
                                this.needBlur = false;
                                // 由于 OnChange 和 OnBlur 几乎同时执行，不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序
                                // setTimeout(() => { this.needBlur = true; }, 100);
                              }}
                            >
                              {
                                originStatus && originStatus.length
                                  ? originStatus.map(transform => (transform.statusDTO ? (
                                    <Option key={transform.id} value={transform.endStatusId}>
                                      {transform.statusDTO.name}
                                    </Option>
                                  ) : ''))
                                  : null
                              }
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'优先级：'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="priorityId"
                            current={currentRae}
                            origin={priorityId}
                            handleEnter
                            onOk={this.updateIssue.bind(this, 'priorityId')}
                            onCancel={this.resetPriorityId.bind(this)}
                            onInit={() => {
                              this.setAnIssueToState();
                              loadPriorities().then((res) => {
                                this.setState({
                                  originPriorities: res,
                                });
                              });
                            }}
                            readModeContent={(
                              <div>
                                {priorityId ? (
                                  <div
                                    className="c7n-level"
                                    style={{
                                      backgroundColor: `${priorityColor}1F`,
                                      color: priorityColor,
                                      borderRadius: '2px',
                                      padding: '0 8px',
                                      display: 'inline-block',
                                    }}
                                  >
                                    {priorityName}
                                  </div>
                                ) : '无'
                                }
                              </div>
                            )}
                          >
                            <Select
                              dropdownStyle={{ minWidth: 185 }}
                              value={originPriorities.length ? priorityId : priorityName}
                              style={{ width: '150px' }}
                              loading={selectLoading}
                              // onBlur={() => this.statusOnChange()}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              onFocus={() => {
                                this.setState({
                                  selectLoading: true,
                                });
                                loadPriorities().then((res) => {
                                  this.setState({
                                    originPriorities: res,
                                    selectLoading: false,
                                  });
                                });
                              }}
                              onChange={(value) => {
                                const priority = _.find(originPriorities,
                                  { id: value });
                                this.setState({
                                  priorityId: value,
                                  priorityName: priority.name,
                                });
                                // 由于 OnChange 和 OnBlur 几乎同时执行，不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序

                                // setTimeout(() => { this.needBlur = true; }, 10);
                              }}
                            >
                              {
                                originPriorities.map(priority => (
                                  <Option key={priority.id} value={priority.id}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px' }}>
                                      <div
                                        className="c7n-level"
                                        style={{
                                          borderRadius: '2px',
                                          padding: '0 8px',
                                          display: 'inline-block',
                                        }}
                                      >
                                        {priority.name}
                                      </div>
                                    </div>
                                  </Option>
                                ))
                              }
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                      {
                        typeCode !== 'sub_task' ? (
                          <div className="line-start mt-10">
                            <div className="c7n-property-wrapper">
                              <span className="c7n-property">
                                {'模块：'}
                              </span>
                            </div>
                            <div className="c7n-value-wrapper c7n-value-component-wrapper">
                              <ReadAndEdit
                                callback={this.changeRae.bind(this)}
                                thisType="componentIssueRelDTOList"
                                handleEnter
                                current={currentRae}
                                origin={componentIssueRelDTOList}
                                onInit={() => this.setAnIssueToState(origin)}
                                onOk={this.updateIssueSelect.bind(this, 'originComponents', 'componentIssueRelDTOList')}
                                onCancel={this.resetComponentIssueRelDTOList.bind(this)}
                                readModeContent={(
                                  <div style={{ color: '#3f51b5' }}>
                                    <p style={{ color: '#3f51b5', wordBreak: 'break-word', marginTop: 2 }}>
                                      {this.transToArr(componentIssueRelDTOList, 'name')}
                                    </p>
                                  </div>
                                )}
                              >
                                <Select
                                  value={this.transToArr(componentIssueRelDTOList, 'name', 'array')}
                                  loading={selectLoading}
                                  ref={(e) => {
                                    this.componentRef = e;
                                  }}
                                  mode={hasPermission ? 'tags' : 'multiple'}
                                  onPopupFocus={(e) => {
                                    this.componentRef.rcSelect.focus();
                                  }}
                                  // onBlur={e => this.statusOnChange(e)}
                                  getPopupContainer={triggerNode => triggerNode.parentNode}
                                  tokenSeparators={[',']}
                                  style={{ width: '200px', marginTop: 0, paddingTop: 0 }}
                                  onFocus={() => {
                                    this.setState({
                                      selectLoading: true,
                                    });
                                    loadComponents().then((res) => {
                                      this.setState({
                                        originComponents: res.content,
                                        selectLoading: false,
                                      });
                                    });
                                  }}
                                  onChange={(value) => {
                                    this.setState({
                                      componentIssueRelDTOList: value.filter(v => v && v.trim()).map(
                                        item => item.trim().substr(0, 10),
                                      ),
                                    });
                                  }}
                                >
                                  {originComponents && originComponents.map(component => (
                                    <Option
                                      key={component.name}
                                      value={component.name}
                                    >
                                      {component.name}
                                    </Option>
                                  ))}
                                </Select>
                              </ReadAndEdit>
                            </div>
                          </div>
                        ) : null
                      }
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'标签'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="labelIssueRelDTOList"
                            current={currentRae}
                            origin={labelIssueRelDTOList}
                            onInit={() => this.setAnIssueToState(origin)}
                            onOk={this.updateIssueSelect.bind(this, 'originLabels', 'labelIssueRelDTOList')}
                            onCancel={this.resetlabelIssueRelDTOList.bind(this)}
                            readModeContent={(
                              <div>
                                {
                                  labelIssueRelDTOList.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                      {
                                        this.transToArr(labelIssueRelDTOList, 'labelName', 'array').map(label => (
                                          <div
                                            key={label}
                                            style={{
                                              color: '#000',
                                              borderRadius: '100px',
                                              fontSize: '13px',
                                              lineHeight: '24px',
                                              padding: '2px 12px',
                                              background: 'rgba(0, 0, 0, 0.08)',
                                              marginRight: '8px',
                                              marginBottom: 3,
                                            }}
                                          >
                                            {label}
                                          </div>
                                        ))
                                      }
                                    </div>
                                  ) : '无'
                                }
                              </div>
                            )}
                          >
                            <Select
                              value={this.transToArr(labelIssueRelDTOList, 'labelName', 'array')}
                              mode="tags"
                              loading={selectLoading}
                              onPopupFocus={(e) => {
                                this.componentRef.rcSelect.focus();
                              }}
                              tokenSeparators={[',']}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              style={{ width: '200px', marginTop: 0, paddingTop: 0 }}
                              // onBlur={() => this.statusOnChange()}
                              onFocus={() => {
                                this.setState({
                                  selectLoading: true,
                                });
                                loadLabels().then((res) => {
                                  this.setState({
                                    originLabels: res,
                                    selectLoading: false,
                                  });
                                });
                              }}
                              onChange={(value) => {
                                this.setState({
                                  labelIssueRelDTOList: value.map(
                                    item => item.substr(0, 10),
                                  ),
                                });
                                // 由于 OnChange 和 OnBlur 几乎同时执行，
                                // 不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序
                                // this.needBlur = false;
                                // if (this.changeTimer > 0) {
                                //   clearTimeout(this.changeTimer);
                                //   this.changeTimer = 0;
                                // }
                                // this.changeTimer = setTimeout(() => {
                                //   this.needBlur = true;
                                // }, 1000);
                              }}
                            >
                              {originLabels.map(label => (
                                <Option
                                  key={label.labelName}
                                  value={label.labelName}
                                >
                                  {label.labelName}
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                      {
                        typeCode === 'bug' ? (
                          <div className="line-start mt-10">
                            <div className="c7n-property-wrapper">
                            <Tooltip title="对于非当前版本所发现的bug进行版本选择">
                              <span className="c7n-property">
                                {'影响的版本：'}
                              </span>
                            </Tooltip>
                            </div>
                            <div className="c7n-value-wrapper">
                              <ReadAndEdit
                                callback={this.changeRae.bind(this)}
                                thisType="influenceVersions"
                                current={currentRae}
                                origin={influenceVersions}
                                onInit={() => this.setAnIssueToState(origin)}
                                onOk={this.updateVersionSelect.bind(this, 'originVersions', 'influenceVersions')}
                                onCancel={this.resetInfluenceVersions.bind(this)}
                                readModeContent={(
                                  <div>
                                    {
                                      !influenceVersions.length ? '无' : (
                                        <div>
                                          <p style={{ color: '#3f51b5', wordBreak: 'break-word' }}>
                                            {_.map(influenceVersions, 'name').join(' , ')}
                                          </p>
                                        </div>
                                      )
                                    }
                                  </div>
                                )}
                              >
                                <Select
                                  label="影响的版本"
                                  value={this.transToArr(influenceVersions, 'name', 'array')}
                                  mode={hasPermission ? 'tags' : 'multiple'}
                                  // onBlur={() => this.statusOnChange()}
                                  onPopupFocus={(e) => {
                                    this.componentRef.rcSelect.focus();
                                  }}
                                  loading={selectLoading}
                                  getPopupContainer={triggerNode => triggerNode.parentNode}
                                  tokenSeparators={[',']}
                                  style={{ width: '200px', marginTop: 0, paddingTop: 0 }}
                                  onFocus={() => {
                                    this.setState({
                                      selectLoading: true,
                                    });
                                    loadVersions([]).then((res) => {
                                      this.setState({
                                        originVersions: res,
                                        selectLoading: false,
                                      });
                                    });
                                  }}
                                  onChange={(value) => {
                                    this.setState({
                                      influenceVersions: value.filter(v => v && v.trim()).map(
                                        item => item.trim().substr(0, 10),
                                      ),
                                    });
                                  }}
                                >
                                  {originVersions.map(version => (
                                    <Option
                                      key={version.name}
                                      value={version.name}
                                    >
                                      {version.name}
                                    </Option>
                                  ))}
                                </Select>
                              </ReadAndEdit>
                            </div>
                          </div>
                        ) : null
                      }
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'版本：'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <ReadAndEdit
                            callback={this.changeRae.bind(this)}
                            thisType="fixVersions"
                            current={currentRae}
                            origin={fixVersions}
                            onInit={() => this.setAnIssueToState(origin)}
                            onOk={this.updateVersionSelect.bind(this, 'originVersions', 'fixVersions')}
                            onCancel={this.resetFixVersions.bind(this)}
                            readModeContent={(
                              <div style={{ color: '#3f51b5' }}>
                                {
                                  !fixVersionsFixed.length && !fixVersions.length ? '无' : (
                                    <div>
                                      <div style={{ color: '#000' }}>
                                        {_.map(fixVersionsFixed, 'name').join(' , ')}
                                      </div>
                                      <p style={{ color: '#3f51b5', wordBreak: 'break-word' }}>
                                        {_.map(fixVersions, 'name').join(' , ')}
                                      </p>
                                    </div>
                                  )
                                }
                              </div>
                            )}
                          >
                            {
                              fixVersionsFixed.length ? (
                                <div>
                                  <span>已归档版本：</span>
                                  <span>
                                    {_.map(fixVersionsFixed, 'name').join(' , ')}
                                  </span>
                                </div>
                              ) : null
                            }
                            <Select
                              label="未归档版本"
                              value={this.transToArr(fixVersions, 'name', 'array')}
                              mode={hasPermission ? 'tags' : 'multiple'}
                              loading={selectLoading}
                              // onBlur={() => this.statusOnChange()}
                              onPopupFocus={(e) => {
                                this.componentRef.rcSelect.focus();
                              }}
                              tokenSeparators={[',']}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              style={{ width: '200px', marginTop: 0, paddingTop: 0 }}
                              onFocus={() => {
                                this.setState({
                                  selectLoading: true,
                                });
                                loadVersions(['version_planning', 'released']).then((res) => {
                                  this.setState({
                                    originVersions: res,
                                    selectLoading: false,
                                  });
                                });
                              }}
                              onChange={(value) => {
                                this.setState({
                                  fixVersions: value.filter(v => v && v.trim()).map(
                                    item => item.trim().substr(0, 10),
                                  ),
                                });
                              }}
                            >
                              {originVersions.map(version => (
                                <Option
                                  key={version.name}
                                  value={version.name}
                                >
                                  {version.name}
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                        </div>
                      </div>
                      {
                        typeCode !== 'issue_epic' && typeCode !== 'sub_task' ? (
                          <div className="line-start mt-10">
                            <div className="c7n-property-wrapper">
                              <span className="c7n-property">
                                {'史诗：'}
                              </span>
                            </div>
                            <div className="c7n-value-wrapper">
                              <ReadAndEdit
                                callback={this.changeRae.bind(this)}
                                thisType="epicId"
                                current={currentRae}
                                origin={epicId}
                                onOk={this.updateIssue.bind(this, 'epicId')}
                                onCancel={this.resetEpicId.bind(this)}
                                onInit={() => {
                                  this.setAnIssueToState(origin);
                                  loadEpics().then((res) => {
                                    this.setState({
                                      originEpics: res,
                                    });
                                  });
                                }}
                                readModeContent={(
                                  <div>
                                    {
                                      epicId ? (
                                        <div
                                          style={{
                                            color: epicColor,
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            borderColor: epicColor,
                                            borderRadius: '2px',
                                            fontSize: '13px',
                                            lineHeight: '20px',
                                            padding: '0 8px',
                                            display: 'inline-block',
                                          }}
                                        >
                                          {epicName}
                                        </div>
                                      ) : '无'
                                    }
                                  </div>
                                )}
                              >
                                <Select
                                  value={
                                    originEpics.length
                                      ? epicId || undefined
                                      : epicName || undefined
                                  }
                                  getPopupContainer={triggerNode => triggerNode.parentNode}
                                  style={{ width: '150px' }}
                                  // onBlur={() => this.statusOnChange()}
                                  allowClear
                                  loading={selectLoading}
                                  onFocus={() => {
                                    this.setState({
                                      selectLoading: true,
                                    });
                                    loadEpics().then((res) => {
                                      this.setState({
                                        originEpics: res,
                                        selectLoading: false,
                                      });
                                    });
                                  }}
                                  onChange={(value) => {
                                    const epic = _.find(originEpics,
                                      { issueId: value * 1 });
                                    this.setState({
                                      epicId: value,
                                      // epicName: epic.epicName,
                                    });
                                    this.needBlur = false;
                                    // 由于 OnChange 和 OnBlur 几乎同时执行，
                                    // 不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序
                                    // setTimeout(() => { this.needBlur = true; }, 100);
                                  }}
                                >
                                  {originEpics.map(epic => <Option key={`${epic.issueId}`} value={epic.issueId}>{epic.epicName}</Option>)}
                                </Select>
                              </ReadAndEdit>
                            </div>
                          </div>
                        ) : null
                      }
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'冲刺：'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper">
                          {
                            typeCode !== 'sub_task' ? (
                              <ReadAndEdit
                                callback={this.changeRae.bind(this)}
                                thisType="sprintId"
                                current={currentRae}
                                origin={activeSprint.sprintId}
                                onOk={this.updateIssue.bind(this, 'sprintId')}
                                onCancel={this.resetSprintId.bind(this)}
                                onInit={() => {
                                  this.setAnIssueToState(origin);
                                  loadSprints(['sprint_planning', 'started']).then((res) => {
                                    this.setState({
                                      originSprints: res,
                                      sprintId: activeSprint.sprintId,
                                    });
                                  });
                                }}
                                readModeContent={(
                                  <div>
                                    {
                                      !closeSprint.length && !activeSprint.sprintId ? '无' : (
                                        <div>
                                          <div>
                                            {_.map(closeSprint, 'sprintName').join(' , ')}
                                          </div>
                                          {
                                            activeSprint.sprintId && (
                                              <div
                                                style={{
                                                  color: '#4d90fe',
                                                  // border: '1px solid #4d90fe',
                                                  // borderRadius: '2px',
                                                  fontSize: '13px',
                                                  lineHeight: '20px',
                                                  // padding: '0 8px',
                                                  display: 'inline-block',
                                                  marginTop: 5,
                                                }}
                                              >
                                                {activeSprint.sprintName}
                                              </div>
                                            )
                                          }
                                        </div>
                                      )
                                    }
                                  </div>
                                )}
                              >
                                {
                                  closeSprint.length ? (
                                    <div>
                                      <span>已结束冲刺：</span>
                                      <span>
                                        {_.map(closeSprint, 'sprintName').join(' , ')}
                                      </span>
                                    </div>
                                  ) : null
                                }
                                <Select
                                  label="活跃冲刺"
                                  value={sprintId || undefined}
                                  getPopupContainer={triggerNode => triggerNode.parentNode}
                                  style={{ width: '150px' }}
                                  // onBlur={() => this.statusOnChange()}
                                  onPopupFocus={(e) => {
                                    this.componentRef.rcSelect.focus();
                                  }}
                                  allowClear
                                  loading={selectLoading}
                                  onFocus={() => {
                                    this.setState({
                                      selectLoading: true,
                                    });
                                    loadSprints(['sprint_planning', 'started']).then((res) => {
                                      this.setState({
                                        originSprints: res,
                                        selectLoading: false,
                                      });
                                    });
                                  }}
                                  onChange={(value) => {
                                    const sprint = _.find(originSprints,
                                      { sprintId: value * 1 });
                                    this.setState({
                                      sprintId: value,
                                      // sprintName: sprint.sprintName,
                                    });
                                    // 由于 OnChange 和 OnBlur 几乎同时执行，
                                    // 不能确定先后顺序，所以需要 setTimeout 修改事件循环先后顺序
                                    // this.needBlur = false;
                                    // if (this.changeTimer > 0) {
                                    //   clearTimeout(this.changeTimer);
                                    //   this.changeTimer = 0;
                                    // }
                                    // this.changeTimer = setTimeout(() => {
                                    //   this.needBlur = true;
                                    // }, 1000);
                                  }}
                                >
                                  {originSprints.map(sprint => <Option key={`${sprint.sprintId}`} value={sprint.sprintId}>{sprint.sprintName}</Option>)}
                                </Select>
                              </ReadAndEdit>
                            ) : (
                              <div>
                                {
                                    activeSprint.sprintId ? (
                                      <div
                                        style={{
                                          color: '#4d90fe',
                                          // border: '1px solid #4d90fe',
                                          // borderRadius: '2px',
                                          fontSize: '13px',
                                          lineHeight: '20px',
                                          // padding: '0 8px',
                                          display: 'inline-block',
                                        }}
                                      >
                                        {activeSprint.sprintName}
                                      </div>
                                    ) : '无'
                                  }
                              </div>
                            )
                          }
                        </div>
                      </div>
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">
                            {'时间跟踪：'}
                          </span>
                        </div>
                        <div className="c7n-value-wrapper" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Progress
                            style={{ width: 100 }}
                            percent={
                              this.getWorkloads() !== 0
                                ? (this.getWorkloads() * 100)
                                / (this.getWorkloads() + (origin.remainingTime || 0))
                                : 0
                            }
                            size="small"
                            status="success"
                          />
                          <span>
                            {this.getWorkloads()}
                            {'小时/'}
                            {this.getWorkloads() + (origin.remainingTime || 0)}
                            {'小时'}
                          </span>
                          <span
                            role="none"
                            style={{
                              marginLeft: '8px',
                              color: '#3f51b5',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              this.setState({
                                dailyLogShow: true,
                              });
                            }}
                          >
                            {'登记工作'}
                          </span>
                        </div>
                      </div>
                      {
                        typeCode === 'issue_epic' ? (
                          <div className="line-start mt-10">
                            <div className="c7n-property-wrapper">
                              <span className="c7n-property">
                                {'Epic名：'}
                              </span>
                            </div>
                            <div className="c7n-value-wrapper" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                              <ReadAndEdit
                                callback={this.changeRae.bind(this)}
                                thisType="epicName"
                                current={currentRae}
                                handleEnter
                                line
                                origin={epicName}
                                onInit={() => this.setAnIssueToState()}
                                onOk={this.updateIssue.bind(this, 'epicName')}
                                onCancel={this.resetEpicName.bind(this)}
                                readModeContent={(
                                  <div>
                                    <p style={{ wordBreak: 'break-word', marginBottom: 0 }}>
                                      {epicName}
                                    </p>
                                  </div>
                                )}
                              >
                                <TextArea
                                  maxLength={10}
                                  style={{ width: '200px' }}
                                  value={epicName}
                                  size="small"
                                  autosize={{ minRows: 2, maxRows: 6 }}
                                  onChange={this.handleEpicNameChange.bind(this)}
                                  onPressEnter={() => {
                                    this.updateIssue('epicName');
                                    this.setState({
                                      currentRae: undefined,
                                    });
                                  }}
                                />
                              </ReadAndEdit>
                            </div>
                          </div>
                        ) : null
                      }
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-subtitle">
                            {'人员'}
                          </span>
                        </div>
                      </div>
                      <div className="line-start mt-10 assignee">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">报告人：</span>
                        </div>
                        <div className="c7n-value-wrapper" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <ReadAndEdit
                            style={{ marginBottom: 5 }}
                            callback={this.changeRae.bind(this)}
                            thisType="reporterId"
                            current={currentRae}
                            origin={reporterId}
                            onOk={this.updateIssue.bind(this, 'reporterId')}
                            onCancel={this.resetReporterId.bind(this)}
                            onInit={() => {
                              this.setAnIssueToState(origin);
                              if (reporterId) {
                                this.setState({
                                  flag: 'loading',
                                });
                                getUser(reporterId).then((res) => {
                                  this.setState({
                                    reporterId: JSON.stringify(res.content[0]),
                                    originUsers: res.content.length ? [res.content[0]] : [],
                                    flag: 'finish',
                                  });
                                });
                              } else {
                                this.setState({
                                  reporterId: undefined,
                                  originUsers: [],
                                });
                              }
                            }}
                            readModeContent={(
                              <div>
                                {
                                  reporterId && reporterName ? (
                                    <UserHead
                                      user={{
                                        id: reporterId,
                                        loginName: '',
                                        realName: reporterName,
                                        avatar: reporterImageUrl,
                                      }}
                                    />
                                  ) : '无'
                                }
                              </div>
                            )}
                          >
                            <Select
                              value={flag === 'loading' ? undefined : reporterId || undefined}
                              style={{ width: 150 }}
                              loading={selectLoading}
                              // onBlur={() => this.statusOnChange()}
                              allowClear
                              filter
                              onFilterChange={this.onFilterChange.bind(this)}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              onChange={(value) => {
                                this.setState({ reporterId: value });
                              }}
                            >
                              {originUsers.filter(u => u.enabled).map(user => (
                                <Option key={JSON.stringify(user)} value={JSON.stringify(user)}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px' }}>
                                    <UserHead
                                      user={{
                                        id: user && user.id,
                                        loginName: user && user.loginName,
                                        realName: user && user.realName,
                                        avatar: user && user.imageUrl,
                                      }}
                                    />
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                          <span
                            role="none"
                            style={{
                              color: '#3f51b5',
                              cursor: 'pointer',
                              marginTop: '-5px',
                              display: 'inline-block',
                              marginBottom: 5,
                            }}
                            onClick={() => {
                              getSelf().then((res) => {
                                if (res.id !== reporterId) {
                                  this.setState({
                                    currentRae: undefined,
                                    reporterId: JSON.stringify(res),
                                    reporterName: `${res.loginName}${res.realName}`,
                                    reporterImageUrl: res.imageUrl,
                                  }, () => {
                                    this.updateIssue('reporterId');
                                  });
                                }
                              });
                            }}
                          >
                            {'分配给我'}
                          </span>
                        </div>
                      </div>
                      <div className="line-start mt-10 assignee">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">经办人：</span>
                        </div>
                        <div className="c7n-value-wrapper" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <ReadAndEdit
                            style={{ marginBottom: 5 }}
                            callback={this.changeRae.bind(this)}
                            thisType="assigneeId"
                            current={currentRae}
                            origin={assigneeId}
                            onOk={this.updateIssue.bind(this, 'assigneeId')}
                            onCancel={this.resetAssigneeId.bind(this)}
                            onInit={() => {
                              this.setAnIssueToState(origin);
                              if (assigneeId) {
                                this.setState({
                                  flag: 'loading',
                                });
                                getUser(assigneeId).then((res) => {
                                  this.setState({
                                    assigneeId: JSON.stringify(res.content[0]),
                                    originUsers: res.content.length ? [res.content[0]] : [],
                                    flag: 'finish',
                                  });
                                });
                              } else {
                                this.setState({
                                  assigneeId: undefined,
                                  originUsers: [],
                                });
                              }
                            }}
                            readModeContent={(
                              <div>
                                {
                                  assigneeId && assigneeName ? (
                                    <UserHead
                                      user={{
                                        id: assigneeId,
                                        loginName: '',
                                        realName: assigneeName,
                                        avatar: assigneeImageUrl,
                                      }}
                                    />
                                  ) : '无'
                                }
                              </div>
                            )}
                          >
                            <Select
                              value={flag === 'loading' ? undefined : assigneeId || undefined}
                              style={{ width: 150 }}
                              loading={selectLoading}
                              allowClear
                              filter
                              onFilterChange={this.onFilterChange.bind(this)}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              onChange={(value) => {
                                this.setState({ assigneeId: value });
                              }}
                            >
                              {originUsers.filter(u => u.enabled).map(user => (
                                <Option key={JSON.stringify(user)} value={JSON.stringify(user)}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px' }}>
                                    <UserHead
                                      user={{
                                        id: user && user.id,
                                        loginName: user && user.loginName,
                                        realName: user && user.realName,
                                        avatar: user && user.imageUrl,
                                      }}
                                    />
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </ReadAndEdit>
                          <span
                            role="none"
                            style={{
                              color: '#3f51b5',
                              cursor: 'pointer',
                              marginTop: '-5px',
                              display: 'inline-block',
                              marginBottom: 5,
                            }}
                            onClick={() => {
                              getSelf().then((res) => {
                                if (res.id !== assigneeId) {
                                  this.setState({
                                    currentRae: undefined,
                                    assigneeId: JSON.stringify(res),
                                    assigneeName: `${res.loginName}${res.realName}`,
                                    assigneeImageUrl: res.imageUrl,
                                  }, () => {
                                    this.updateIssue('assigneeId');
                                  });
                                }
                              });
                            }}
                          >
                            {'分配给我'}
                          </span>
                        </div>
                      </div>
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-subtitle">日期</span>
                        </div>
                      </div>
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">创建时间：</span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <DatetimeAgo
                            date={creationDate}
                          />
                        </div>
                      </div>
                      <div className="line-start mt-10">
                        <div className="c7n-property-wrapper">
                          <span className="c7n-property">更新时间：</span>
                        </div>
                        <div className="c7n-value-wrapper">
                          <DatetimeAgo
                            date={lastUpdateDate}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="des">
                    <div className="c7n-title-wrapper">
                      <div className="c7n-title-left">
                        <Icon type="subject c7n-icon-title" />
                        <span>描述</span>
                      </div>
                      <div style={{
                        flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                      }}
                      />
                      <div className="c7n-title-right" style={{ marginLeft: '14px', position: 'relative' }}>
                        <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ edit: true })}>
                          <Icon type="zoom_out_map icon" style={{ marginRight: 2 }} />
                          <span>全屏编辑</span>
                        </Button>
                        <Icon
                          className="c7n-des-edit"
                          style={{ position: 'absolute', top: 8, right: -20 }}
                          role="none"
                          type="mode_edit mlr-3 pointer"
                          onClick={() => {
                            this.setState({
                              editDesShow: true,
                              editDes: description,
                            });
                          }}
                        />
                      </div>
                    </div>
                    {this.renderDes()}
                  </div>
                </div>
                <div id="attachment">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="attach_file c7n-icon-title" />
                      <span>附件</span>
                    </div>
                    <div style={{
                      flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px', marginRight: '114.67px',
                    }}
                    />
                  </div>
                  <div className="c7n-content-wrapper" style={{ marginTop: '-47px' }}>
                    <UploadButtonNow
                      onRemove={this.setFileList}
                      onBeforeUpload={this.setFileList}
                      updateNow={this.onChangeFileList}
                      fileList={fileList}
                    />
                  </div>
                </div>
                <div id="wiki">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="library_books c7n-icon-title" />
                      <span>Wiki 文档</span>
                    </div>
                    <div style={{
                      flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                    }}
                    />
                    <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                      <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ addWiki: true })}>
                        <Icon type="add_box icon" />
                        <span>添加文档</span>
                      </Button>
                    </div>
                  </div>
                  {this.renderWiki()}
                </div>
                <div id="commit">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="sms_outline c7n-icon-title" />
                      <span>评论</span>
                    </div>
                    <div style={{
                      flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                    }}
                    />
                    <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                      <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ addCommit: true })}>
                        <Icon type="playlist_add icon" />
                        <span>添加评论</span>
                      </Button>
                    </div>
                  </div>
                  {this.renderCommits()}
                </div>
                <div id="log">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="work_log c7n-icon-title" />
                      <span>工作日志</span>
                    </div>
                    <div style={{
                      flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                    }}
                    />
                    <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                      <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ dailyLogShow: true })}>
                        <Icon type="playlist_add icon" />
                        <span>登记工作</span>
                      </Button>
                    </div>
                  </div>
                  {this.renderLogs()}
                </div>
                <div id="data_log">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="insert_invitation c7n-icon-title" />
                      <span>活动日志</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                        marginLeft: '14px',
                      }}
                    />
                  </div>
                  {this.renderDataLogs()}
                </div>
                {
                  typeCode !== 'sub_task' && (
                    <div id="sub_task">
                      <div className="c7n-title-wrapper">
                        <div className="c7n-title-left">
                          <Icon type="filter_none c7n-icon-title" />
                          <span>子任务</span>
                        </div>
                        <div style={{
                          flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                        }}
                        />
                        <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                          <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ createSubTaskShow: true })}>
                            <Icon type="playlist_add icon" />
                            <span>创建子任务</span>
                          </Button>
                        </div>
                      </div>
                      {this.renderSubIssues()}
                    </div>
                  )
                }
                {
                  typeCode !== 'sub_task' && (
                    <div id="link_task">
                      <div className="c7n-title-wrapper">
                        <div className="c7n-title-left">
                          <Icon type="link c7n-icon-title" />
                          <span>问题链接</span>
                        </div>
                        <div style={{
                          flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                        }}
                        />
                        <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                          <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ createLinkTaskShow: true })}>
                            <Icon type="relate icon" />
                            <span>创建链接</span>
                          </Button>
                        </div>
                      </div>
                      {this.renderLinkIssues()}
                    </div>
                  )
                }
                <div id="branch">
                  <div className="c7n-title-wrapper">
                    <div className="c7n-title-left">
                      <Icon type="branch c7n-icon-title" />
                      <span>开发</span>
                    </div>
                    <div style={{
                      flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
                    }}
                    />
                    <div className="c7n-title-right" style={{ marginLeft: '14px' }}>
                      <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ createBranchShow: true })}>
                        <Icon type="playlist_add icon" />
                        <span>创建分支</span>
                      </Button>
                    </div>
                  </div>
                  {this.renderBranchs()}
                </div>
              </div>
            </section>
          </div>
        </div>
        {
          edit ? (
            <FullEditor
              initValue={text2Delta(editDes)}
              visible={edit}
              onCancel={() => this.setState({ edit: false })}
              onOk={callback}
            />
          ) : null
        }
        {
          addWiki ? (
            <Wiki
              issueId={origin.issueId}
              visible={addWiki}
              onCancel={() => this.setState({ addWiki: false })}
              onOk={this.onWikiCreate}
              checkIds={wikies ? wikies.wikiRelationList.map(wiki => wiki.wikiUrl) : []}
            />
          ) : null
        }
        {
          dailyLogShow ? (
            <DailyLog
              issueId={origin.issueId}
              issueNum={issueNum}
              visible={dailyLogShow}
              onCancel={() => this.setState({ dailyLogShow: false })}
              onOk={() => {
                this.reloadIssue(origin.issueId);
                this.setState({ dailyLogShow: false });
              }}
            />
          ) : null
        }
        {
          createSubTaskShow ? (
            <CreateSubTask
              issueId={origin.issueId}
              visible={createSubTaskShow}
              onCancel={() => this.setState({ createSubTaskShow: false })}
              onOk={this.handleCreateSubIssue.bind(this)}
              store={store}
            />
          ) : null
        }
        {
          createLinkTaskShow ? (
            <CreateLinkTask
              issueId={origin.issueId}
              visible={createLinkTaskShow}
              onCancel={() => this.setState({ createLinkTaskShow: false })}
              onOk={this.handleCreateLinkIssue.bind(this)}
            />
          ) : null
        }
        {
          copyIssueShow ? (
            <CopyIssue
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              issue={origin}
              issueLink={linkIssues}
              issueSummary={origin.summary}
              visible={copyIssueShow}
              onCancel={() => this.setState({ copyIssueShow: false })}
              onOk={this.handleCopyIssue.bind(this)}
            />
          ) : null
        }
        {
          transformSubIssueShow ? (
            <TransformSubIssue
              visible={transformSubIssueShow}
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              ovn={origin.objectVersionNumber}
              onCancel={() => this.setState({ transformSubIssueShow: false })}
              onOk={this.handleTransformSubIssue.bind(this)}
              store={store}
            />
          ) : null
        }
        {
          transformFromSubIssueShow ? (
            <TransformFromSubIssue
              visible={transformFromSubIssueShow}
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              ovn={origin.objectVersionNumber}
              onCancel={() => this.setState({ transformFromSubIssueShow: false })}
              onOk={this.handleTransformFromSubIssue.bind(this)}
              store={store}
            />
          ) : null
        }
        {
          createBranchShow ? (
            <CreateBranch
              issueId={origin.issueId}
              typeCode={typeCode}
              issueNum={origin.issueNum}
              onOk={() => {
                this.setState({ createBranchShow: false });
                this.reloadIssue();
              }}
              onCancel={() => this.setState({ createBranchShow: false })}
              visible={createBranchShow}
            />
          ) : null
        }
        {
          commitShow ? (
            <Commits
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              time={branchs.commitUpdateTime}
              onCancel={() => {
                this.setState({ commitShow: false });
              }}
              visible={commitShow}
            />
          ) : null
        }
        {
          mergeRequestShow ? (
            <MergeRequest
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              num={branchs.totalMergeRequest}
              onCancel={() => {
                this.setState({ mergeRequestShow: false });
              }}
              visible={mergeRequestShow}
            />
          ) : null
        }
        {
          assigneeShow ? (
            <Assignee
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              visible={assigneeShow}
              assigneeId={assigneeId}
              objectVersionNumber={origin.objectVersionNumber}
              onOk={() => {
                this.setState({ assigneeShow: false });
                this.reloadIssue();
              }}
              onCancel={() => {
                this.setState({ assigneeShow: false });
              }}
            />
          ) : null
        }
        {
          changeParentShow ? (
            <ChangeParent
              issueId={origin.issueId}
              issueNum={origin.issueNum}
              visible={changeParentShow}
              objectVersionNumber={origin.objectVersionNumber}
              onOk={() => {
                this.setState({ changeParentShow: false });
                this.reloadIssue();
              }}
              onCancel={() => {
                this.setState({ changeParentShow: false });
              }}
            />
          ) : null
        }
      </div>
    );
  }
}
export default withRouter(CreateSprint);
