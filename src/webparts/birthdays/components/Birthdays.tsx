import * as React from 'react';
import styles from './Birthdays.module.scss';
import { IBirthdaysProps } from './IBirthdaysProps';
import { escape } from '@microsoft/sp-lodash-subset';
import Birthday from './Birthday/Birthday';
export default class Birthdays extends React.Component<IBirthdaysProps, {}> {
  constructor(props: any) {
    super(props);
    // Set States (information managed within the component), When state changes, the component responds by re-rendering
    this.state = {
      description: ""
    };
  }

  public render(): React.ReactElement<IBirthdaysProps> {
    return (
      <div>
        <div >
          <Birthday sp={this.sp} BirthdayListId={this.props.BirthdayId} />
        </div>
      </div>
    );
  }
}
