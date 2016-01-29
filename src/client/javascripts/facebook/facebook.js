import FB from 'fb';
import debug from 'debug';
import {EventEmitter} from 'events';

const dbg = debug('mirage:facebook');

export default new class Facebook {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.isLogged = false;
    this.posts = [];
    window.checkLoginState = this.checkLoginState.bind(this);
  }

  init() {
    dbg('Initialize');

    if (this.appId) {
      FB.init({
        appId: this.appId,
        xfbml: true,
        version: 'v2.5',
      });
    } else {
      dbg('App ID is not defined');
    }
  }

  setAppId(appId) {
    this.appId = appId;
  }

  checkLoginState() {
    dbg('checkLoginState');
    FB.getLoginStatus(this.onLoginStatus.bind(this));
  }

  onLoginStatus(res) {
    if (res.status === 'connected') {
      this.isLogged = true;
      this.eventEmitter.emit(`login:status`, {err: null, res: res.authResponse});
    } else if (res.status === 'not_authorized') {
      this.eventEmitter.emit(`login:status`, {err: `Please log into the app.`});
    } else {
      this.eventEmitter.emit(`login:status`, {err: `Please log into Facebook.`});
    }
  }

  // getUserName() {
  //   if (this.isLogged == true) {
  //     FB.api('/me', (res) => {
  //       this.eventEmitter.emit(`get:name`, {err: null, name: res.name});
  //     });
  //   } else {
  //     this.eventEmitter.emit(`get:name`, {err: `Please log into the app.`});
  //   }
  // }
  //
  // getFeed() {
  //   if (this.isLogged == true) {
  //     FB.api('/me/feed', (feed) => {
  //       dbg('feed', feed);
  //       feed.data.forEach((post) => {
  //         FB.api(`/${post.id}?fields=full_picture,picture`, (postData) => {
  //           this.posts[post.id] = postData;
  //         });
  //       });
  //     });
  //     setTimeout(() => {
  //       dbg(this.posts);
  //     }, 4000);
  //   } else {
  //     this.eventEmitter.emit(`get:feed`, {err: `Please log into the app.`});
  //   }
  // }

  on() {
    this.eventEmitter.on(...arguments);
  }
};
