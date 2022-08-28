import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  @ViewChild("terminal") terminal?: ElementRef;
  @ViewChild("terminalInput") terminalInput?: ElementRef;
  title = 'metamud-frontend';
  @Input() cmd: string = '';
  output = {type: 'text', data: 'Type "posts" for the latest posts!'} as any;
  latestPosts = [] as any[];
  latestPost = {} as any;
  token = {} as any;
  readyForCommand: boolean = true;
  postsTimeout: any;
  defaultHashtags: any = "";
  following: any[] = [];

  constructor(private apiService: ApiService) {
    try {
      const token = JSON.parse(localStorage.getItem('login') || "{}");
      this.token = token;
    } catch (e) {}
  }

  ngAfterViewInit() {
    const height = this.terminal?.nativeElement.offsetHeight;
    this.terminal?.nativeElement.setAttribute('style', `max-height: ${height}px`);

    this.apiService.getFollow(this.token.access).subscribe((data: any) => {
      this.following = data;
      this.posts([]);
    }, error => {
      console.log("Error", error);

      if (error.status === 401) {
        this.output = {type: 'text', data: "You are currently not logged in! Do `register <token> <email> <username> <password>` to get started!"};
      }

      this.token = {};
      localStorage.setItem('login', JSON.stringify({}));
    });
  }

  focusTerminal() {
    this.terminalInput?.nativeElement.focus();
  }

  cmds = {
    'login': (args: any[]) => this.login(args),
    'posts': (args: any[]) => this.posts(args),
    'ask': (args: any[]) => this.newPost(args),
    'like': (args: any[]) => this.likePost(args),
    'post': (args: any[]) => this.viewPost(args),
    'clear': (args: any[]) => this.clear(args),
    'say': (args: any[]) => this.commentPost(args),
    'help': (args: any[]) => this.help(args),
    'logout': (args: any[]) => this.logout(args),
    'register': (args: any[]) => this.register(args),
    'refresh': (args: any[]) => this.refresh(args),
    'roll': (args: any[]) => this.rollComment(args),
    'encounter': (args: any[]) => this.newEncounter(args),
    'attack': (args: any[]) => this.simpleAttack(args),
    'follow': (args: any[]) => this.follow(args),
    'all': (args: any[]) => this.all(args),
    'edit': (args: any[]) => this.editPost(args),
    'following': (args: any[]) => this.followingList(args),
  } as any;

  cmdsHelp = {
    'login': '<username> <password>',
    'ask': '<hashtag> <content...>',
    'like': '<post_id|comment_id>',
    'post': '<post_id>',
    'say': '<comment...>',
    'posts': '[hashtag]',
    'register': '<token> <email> <username> <password>',
    'roll': '[dice_count:1] [dice_size:20]',
    'encounter': '<hashtag> <Encounter Name> <Encounter Type> <level> <Description...>',
    'attack': '<Description...>',
    'follow': '<hashtag>',
    'edit': '<post_id|comment_id> <location|> <new value...>'
  } as any;

  selectCmd(cmd: string) {
    const tokens = this.cmd.trim().split(" ");

    if (tokens[0] !== cmd) {
      this.cmd = `${cmd} `;
    }

    this.focusTerminal();
  }

  getCmdList() {
    let allCommands = Object.keys(this.cmds);
    const tokens = this.cmd.trim().split(" ");

    const selectedCmd = allCommands.find(cmd => tokens[0] && cmd === tokens[0]);

    if (selectedCmd) {
      return [`${selectedCmd} ${this.cmdsHelp[selectedCmd] || ""}`];
    }

    allCommands = allCommands.filter(cmd => !tokens[0] || cmd.startsWith(tokens[0]))

    if (allCommands.length === 0) {
      allCommands = ['clear']
    }

    return allCommands;
  }

  help(args: any[]) {
    this.output = {type: 'text', data: "There is no help, sorry lol."};
  }

  followingList(args: any[]) {
    this.output = {type: 'text', data: this.following.map(h => h.hashtag).join(", ")};
  }

  register(args: any[]) {
    if (this.token.access) {
      this.output = {type: 'text', data: "Please do /logout before registering a new account!"};
      return;
    }

    if (args.length < 3) {
      this.output = {type: 'text', data: "Failed to log in. /login <username> <password>"};
      return;
    }

    this.output = {type: 'text', data: "Logging in..."};

    const token = args[0];
    const email = args[1]
    const username = args[2];
    const password = args[3];

    this.apiService.postRegister(token, email, username, password).subscribe((data: any) => {
      console.log("Data", data);
      this.output = {type: 'text', data: "Register success!"};
      localStorage.setItem('login', JSON.stringify(data));
      this.token = data;
      this.login([username, password]);
    }, (error: any) => {
      console.log("Error", error);
      this.output = {type: 'text', data: `Failed to create an account! Errors:\r\n\r\n${Object.keys(error.error).map(
        (e: any) => `${e}: ${error.error[e].join(", ")}`).join("\r\n- ")}`};
    });

  }

  logout(args: any[]) {
    this.output = {type: 'text', data: "Logged out!"};
    localStorage.setItem('login', JSON.stringify({}));
    this.token = undefined;
  }

  refresh(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};

    if (this.latestPost) {
      this.viewPostById([this.latestPost.id]);
    } else {
      this.posts([this.defaultHashtags]);
    }
  }

  editPost(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    if (args.length < 3) {
      return;
    }
    
    const pid = +args[0];
    let post: any;
    let comment: any;

    if (this.latestPost) {
      if (pid === 0) {
        post = this.latestPost;
      } else {
        comment = this.latestPost.comments.find((c: any) => c._id === pid);
      }
    } else {
      post = this.latestPosts.find(data => data._id === pid);
    }
    
    const editKey = args[1];
    const editValue = args.slice(2).join(" ");

    if (post) {
      this.apiService.postEditPost(this.token.access, post.id, editKey, editValue).subscribe((data: any) => {
        console.log("Data", data);
        post.location = data.location;
        this.viewPostById([post.id]);
      });
    }

    if (comment) {
      this.apiService.postEditComment(this.token.access, comment.id, editKey, editValue).subscribe((data: any) => {
        comment.location = data.location;
        this.output = {type: 'posts', data: [this.latestPost]}
      });
    }
  }

  viewPost(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    if (args.length < 1) {
      return;
    }
    
    const pid = +args[0];
    const post = this.latestPosts.find(data => data._id === pid);

    if (!post) {
      this.output = {type: 'text', data: "Post not found."}
      return;
    }

    this.latestPost = post;

    this.apiService.getPost(this.token.access, post.id).subscribe((data: any) => {
      console.log("Data", data);
      this.latestPost = data[0];
      this.latestPost._id = pid;
      this.latestPost._timestamp = new Date(post.timestamp);
      this.latestPost._timedate = `${post._timestamp.toLocaleDateString()} ${post._timestamp.toLocaleTimeString()}`

      this.latestPost.comments.map((comment: any, cid: number) => {
        comment._id = cid+1;
        comment._timestamp = new Date(comment.timestamp);
        comment._timedate = `${comment._timestamp.toLocaleDateString()} ${comment._timestamp.toLocaleTimeString()}`
      });

      this.output = {type: 'posts', data}
    })
  }
  
  follow(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};

    if (args.length < 1) {
      this.output = {type: 'text', data: "Failed to get post."};
    }

    const pid = args[0];

    this.apiService.postFollow(this.token.access, pid).subscribe((data: any) => {
      this.following.push(data);
      this.posts([]);
    })
  }

  viewPostById(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};

    if (args.length < 1) {
      this.output = {type: 'text', data: "Failed to get post."};
    }

    const pid = args[0];

    this.apiService.getPost(this.token.access, pid).subscribe((data: any) => {
      this.latestPost = data[0];
      this.latestPost._id = pid;
      this.latestPost._timestamp = new Date(this.latestPost.timestamp);
      this.latestPost._timedate = `${this.latestPost._timestamp.toLocaleDateString()} ${this.latestPost._timestamp.toLocaleTimeString()}`
      this.latestPost.comments.map((comment: any, cid: number) => {
        comment._id = cid+1;
        comment._timestamp = new Date(comment.timestamp);
        comment._timedate = `${comment._timestamp.toLocaleDateString()} ${comment._timestamp.toLocaleTimeString()}`
      });
      
      this.output = {type: 'posts', data}
    })
  }

  likePost(args: any[]) {
    if (args.length < 1) {
      this.output = {type: 'text', data: "/like <id>"};
      return;
    }

    const pid = +args[0];
    let post: any;
    let comment: any;

    if (this.latestPost) {
      if (pid === 0) {
        post = this.latestPost;
      } else {
        comment = this.latestPost.comments.find((c: any) => c._id === pid);
      }
    } else {
      post = this.latestPosts.find(data => data._id === pid);
    }

    if (post) {
      this.apiService.postLike(this.token.access, post.id).subscribe((data: any) => {
        console.log(data);
        post.likes.push(data);
      });
    }

    if (comment) {
      this.apiService.postLikeComment(this.token.access, comment.id).subscribe((data: any) => {
        console.log(data);
        comment.likes.push(data);
      });
    }
  }

  commentPost(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    if (args.length < 1) {
      this.output = {type: 'text', data: "/like [id] <text...>"};
      return;
    }

    let pid = +args[0];
    let comment;

    if (this.latestPost) {
      pid = this.latestPost.id;
      comment = args.join(" ");
      console.log("Pid", this.latestPost, this.latestPost.id);
    } else {
      const post = this.latestPosts.find(data => data._id === pid);
      
      if (!post) {
        this.output = {type: 'text', data: "Post not found."};
        return;
      }

      pid = post.id;
      comment = args.slice(1).join(" ");
    }

    this.apiService.postComment(this.token.access, pid, comment).subscribe((data: any) => {
      console.log(data);
      this.viewPostById([pid]);
    });
  }

  rollComment(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    let pid = +args[0];
    let comment;
    let dice_count;
    let dice_size;

    if (this.latestPost) {
      pid = this.latestPost.id;

      dice_count = +args[0] ? +args[0] : 1;
      dice_size = +args[1] ? +args[1] : 20;

      console.log("Pid", this.latestPost, this.latestPost.id);
    } else {
      if (args.length < 1) {
        this.output = {type: 'text', data: "/roll <post_id> [dice_count] [dice_size]"};
        return;
      }
  
      const post = this.latestPosts.find(data => data._id === pid);
      
      if (!post) {
        this.output = {type: 'text', data: "Post not found."};
        return;
      }

      dice_count = +args[1] ? +args[1] : 1;
      dice_size = +args[2] ? +args[2] : 20;

      pid = post.id;
      comment = args.slice(1).join(" ");
    }

    if (dice_count < 1 || dice_size < 2) {
      this.output = {type: 'text', data: "/roll <post_id> [dice_count (greater than 0)] [dice_size (greater than 1)]"};
      return;
    }

    this.apiService.postCommentRoll(this.token.access, pid, dice_count, dice_size).subscribe((data: any) => {
      console.log(data);
      this.viewPostById([pid]);
    });
  }

  clear(args: any[]) {
    this.output = {type: 'text', data: "Type 'help' for help."};
  }

  newEncounter(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    if (args.length < 5) {
      return;
    }

    const hashtag = args[0];
    const action_name = args[1];
    const action_type = args[2];
    const action_level = args[3];
    const post = args.slice(4).join(" ").trim();

    this.apiService.postEncounter(this.token.access, hashtag, action_name,
        action_type, action_level, post).subscribe((data: any) => {
      console.log(data);
      this.viewPostById([data.id]);
    });
  }

  newPost(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};

    if (args.length < 2) {
      return;
    }

    const hashtag = args[0];
    const post = args.slice(1).join(" ").trim();

    if (!post || !hashtag) return;

    this.apiService.postPost(this.token.access, hashtag, post).subscribe((data: any) => {
      console.log(data);
      this.viewPostById([data.id]);
    });
  }

  simpleAttack(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    
    let pid: number;
    let comment;

    if (this.latestPost) {
      pid = this.latestPost.id;
      comment = args.join(" ");
      console.log("Pid", this.latestPost, this.latestPost.id);
    } else {
      this.output = {type: 'text', data: "Post not found."};
      return;
    }

    this.apiService.postSimpleAttack(this.token.access, pid, comment).subscribe((data: any) => {
      console.log(data);
      this.viewPostById([pid]);
    });
  }

  all(args: any[]) {
    this.apiService.getPosts(this.token.access).subscribe((d: any) => {
      this.latestPosts = d.map((post: any, pid: number) => {
        post._id = pid+1
        post._timestamp = new Date(post.timestamp);
        post._timedate = `${post._timestamp.toLocaleDateString()} ${post._timestamp.toLocaleTimeString()}`
        return post;
      });

      console.log(this.latestPosts);

      this.output = {type: 'posts', data: []};
      let renderCount = 0;
      const maxRender = this.latestPosts.length;

      console.log("max Ren")

      this.postsTimeout = setInterval(() => {
        if (renderCount < maxRender) {
          this.output = {
            type: 'posts',
            data: this.latestPosts.slice(0, renderCount+1)
          }
          renderCount++;
        } else {
          clearInterval(this.postsTimeout);
        }
      }, 100);
    });
  }

  posts(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    this.latestPost = undefined;
    let hashtags = this.following.map(h => h.hashtag);

    if (args.length > 0) {
      hashtags = args;
      this.defaultHashtags = hashtags;
    }

    this.defaultHashtags = hashtags;

    this.apiService.getPosts(this.token.access, hashtags).subscribe((d: any) => {
      this.latestPosts = d.map((post: any, pid: number) => {
        post._id = pid+1
        post._timestamp = new Date(post.timestamp);
        post._timedate = `${post._timestamp.toLocaleDateString()} ${post._timestamp.toLocaleTimeString()}`
        return post;
      });

      console.log(this.latestPosts);

      this.output = {type: 'posts', data: []};
      let renderCount = 0;
      const maxRender = this.latestPosts.length;

      console.log("max Ren")

      this.postsTimeout = setInterval(() => {
        if (renderCount < maxRender) {
          this.output = {
            type: 'posts',
            data: this.latestPosts.slice(0, renderCount+1)
          }
          renderCount++;
        } else {
          clearInterval(this.postsTimeout);
        }
      }, 100);
    });
  }

  login(args: any[]) {
    if (args.length < 2) {
      this.output = {type: 'text', data: "Failed to log in. /login <username> <password>"};
      return;
    }

    this.output = {type: 'text', data: "Logging in..."};

    this.apiService.getLogin(args[0], args[1]).subscribe((data: any) => {
      console.log("Data", data);
      localStorage.setItem('login', JSON.stringify(data));
      this.token = data;
      this.posts([]);
    });
  }

  submitData() {
    if (!this.readyForCommand) return;
    clearInterval(this.postsTimeout);

    const tokens = this.cmd.trim().split(" ");
    const cmd = tokens[0]?.toLowerCase();
    console.log("Found cmd", cmd);
    const cmdToRun = this.cmds[cmd];

    if (cmdToRun) {
      tokens.shift()
      cmdToRun(tokens);
    } else {
      this.output = {type: 'text', data: "Command not found."};
    }

    console.log("Sent", this.cmd);
    this.cmd = "";
  }
}
