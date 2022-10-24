import * as React from 'react';
import styles from './Birthday.module.scss';
import { IBirthdayProps } from './IBirthdayProps';
import { IBirthdayStates } from './IBirthdayStates';
import { IEmailProperties } from "@pnp/sp/sputilities";
import { Input } from '@material-ui/core';
import { UncontrolledPopover } from 'reactstrap';

export default class Birthday extends React.Component<IBirthdayProps, IBirthdayStates> {
  constructor(props: IBirthdayProps) {
    super(props);
    this.state = {
      BirthdaysList: [],
      EvLocation: '',
      EmailText: '',
      IsSent: null,
      IsLoading: true,
      IsModal: false,
      People: null
    };
  }

  componentDidMount() {
    console.clear()
    this.getBirthdayList()
  }

  getBirthdayList = async () => {
    try {
      const date = new Date();
      const currDate = this.convertToSpDate(date)
      const futureDate = this.convertToSpDate(new Date(date.setDate(date.getDate() + 7)))
      // get birthdays from sharepoint list - ימי הולדת
      const items: any[] = await this.props.sp.web.lists.getById(this.props.BirthdayListId).items.select('Title, Email, BirthdayDate, Picture').filter(`IsShown ne true and BirthdayDate ge datetime'${currDate}' and BirthdayDate le datetime'${futureDate}'`)();
      // set isOpen for email modal
      items.forEach((item) => {
        item.isOpen = false
        return item;
      })
      this.setState({
        BirthdaysList: items,
        IsLoading: false
      })
    } catch (err) {
      console.log('err:', err)
      this.setState({ IsLoading: false })
    }
  }

  convertToSpDate = (ReleventDate: any): string => {
    // Get day,month and year
    let dd = String(ReleventDate.getDate());
    let mm = String(ReleventDate.getMonth() + 1); //January is 0!
    let yyyy = String(ReleventDate.getFullYear());
    if (parseInt(dd) < 10) {
      dd = '0' + dd;
    }
    if (parseInt(mm) < 10) {
      mm = '0' + mm;
    }
    // Create sp date
    let FormattedReleventDate = yyyy + '-' + mm + '-' + dd + 'T00:00:00Z';
    return FormattedReleventDate;
  }

  openModal = (ev: any, itemIndex: number, People: any): void => {
    ev.stopPropagation();
    this.setState({ IsModal: true, People })
    // open relevant modal and close else
    const newState = this.state.BirthdaysList.map((i: any, idx: number) => {
      if (idx === itemIndex) i.isOpen = true
      else i.isOpen = false
      return i;
    })
    this.setState({ BirthdaysList: newState })
  }

  closeModal = (ev?: any): void => {
    if (ev) ev.stopPropagation();
    this.setState({ IsModal: false })
    const newState = this.state.BirthdaysList.map((i: any) => {
      i.isOpen = false
      return i;
    })
    this.setState({ BirthdaysList: newState })
  }

  sendEmail = async (email: string): Promise<boolean> => {
    try {
      if (!this.state.EmailText) return
      const user = await this.props.sp.web.currentUser();
      const emailProps: IEmailProperties = {
        To: [email],
        From: user.Email,
        Subject: `You've got a new greeting from ${user.Title}! (${user.Email})`,
        Body: this.state.EmailText
      };
      await this.props.sp.utility.sendEmail(emailProps);
      this.setState({ IsSent: true })
      return true;
    } catch (err) {
      console.log('err:', err)
      this.setState({ IsSent: false })
      return false;
    } finally {
      setTimeout(() => {
        this.setState({ IsModal: false, IsSent: null, EmailText: '' })
        this.closeModal()
      }, 3000)
    }
  }

  Loader = () => {
    // number of blank profiles for loader
    const avatarArray = [1, 2, 3, 4, 5]
    return (
      <div className={styles['ph-item'] + ' ' + styles.loaderContainer}>
        {avatarArray.map(() =>
          <div className={styles['ph-col-1']}>
            <div className={styles['ph-avatar']}></div>
            <div className={styles['ph-row']}>
              <div className={styles['ph-col-4']}></div>
              <div className={styles['ph-col-4']}></div>
              <div className={styles['ph-col-4']}></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  public render(): React.ReactElement<IBirthdayProps> {

    if (this.state.IsLoading) return (<this.Loader />)

    const placeholderStyle = {
      'input': {
        '&::placeholder': {
          fontFamily: 'Rubik !important',
        }
      }
    }

    return (
      <div className={styles.birthday}>
        <span>happy birthday</span>
        <ul
          className={this.state.BirthdaysList.length > 6 ? styles.peopleListWithAnimation : styles.peopleList}
          style={{ animationPlayState: this.state.IsModal ? 'paused' : '', justifyContent: this.state.BirthdaysList.length > 6 ? 'space-between' : 'space-evenly' }}
        >
          {this.state.BirthdaysList.map((People, idx) =>
            <li id={`popover_${idx}`} className={styles.birthdayPeople} onClick={(ev) => this.openModal(ev, idx, People)}>
              <img src={People.Picture.Url} alt="" className={styles.peopleImg} />
              <span>{People.BirthdayDate.slice(5, 10).split('-').reverse().join('/')}</span>
              {/* Email modal */}
              <UncontrolledPopover popperClassName={styles.popoverContainer} className={styles.popoverContainer} placement="top-start" isOpen={People.isOpen} target={`popover_${idx}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'column',
                  width: '272px',
                  height: '230px',
                  backgroundColor: '#eeeded',
                  boxShadow: '4px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '25px',
                }}
              >
                <div className={styles.modalTriangle}></div>
                {this.state.IsSent === null && <>
                  <span className={styles.modalHeader}>Happy Birthday {People.Title}!</span>
                  <img src={People.Picture.Url} alt="" className={styles.peopleImg} />
                  <div className={styles.inputContainer}>
                    <Input
                      type='text'
                      value={this.state.EmailText}
                      className='shadow-none'
                      autoFocus={true}
                      disableUnderline={true}
                      placeholder={`Congratulate ${People.Title}...`}
                      inputProps={{ className: styles.placeholderStyle }}
                      onKeyDown={(ev) => ev.key === 'Enter' ? this.sendEmail(People.Email) : null}
                      onChange={(ev) => this.setState({ EmailText: ev.target.value })}
                    />
                    <img src={require('../../assets/birthdayModalArrow.png')} alt="" onClick={() => this.sendEmail(People.Email)} />
                  </div>
                </>}
                {/* Email sent */}
                {this.state.IsSent && <div className={styles.emailSend}>
                  <img className={styles.emailImg} src={require('../../assets/EmailSentV.png')} alt="" />
                  <span className={styles.emailMsg}>An email has been sent to {People.Title}</span>
                </div>}
                {/* Email not sent */}
                {this.state.IsSent === false && <div className={styles.emailSend}>
                  <span className={styles.redX}>X</span>
                  <span className={styles.emailMsg}>Your email could not be sent to {People.Title}</span>
                </div>}
              </UncontrolledPopover>
            </li>
          )}
        </ul>
        {this.state.IsModal && <div className={styles.closeModalContainer} onClick={(ev) => this.closeModal(ev)}></div>}
      </div >
    )
  }
}