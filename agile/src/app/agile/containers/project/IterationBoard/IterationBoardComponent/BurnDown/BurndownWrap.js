import React, { Component } from 'react';
import { stores, axios } from 'choerodon-front-boot';
import Card from '../Card';
import Burndown from './BurnDown';

const { AppState } = stores;

class BurndownWrap extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
  }

  render() {
    return (
      <Card
        title={'燃尽图'}
      >
        <Burndown />
      </Card>
    );
  }
}
export default BurndownWrap;