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
  output = {type: 'text', data: 'Type "help" for help!'} as any;
  latestPosts = [] as any[];
  latestPost = {} as any;
  token = {} as any;
  readyForCommand: boolean = true;
  postsTimeout: any;

  constructor(private apiService: ApiService) {
    try {
      const token = JSON.parse(localStorage.getItem('login') || "{}");
      this.token = token;
    } catch (e) {}
  }

  ngAfterViewInit() {
    const height = this.terminal?.nativeElement.offsetHeight;
    this.terminal?.nativeElement.setAttribute('style', `max-height: ${height}px`);
  }

  focusTerminal() {
    this.terminalInput?.nativeElement.focus();
  }

  cmds = {
    'login': (args: any[]) => this.login(args),
    'posts': (args: any[]) => this.posts(args),
    'post': (args: any[]) => this.newPost(args),
    'like': (args: any[]) => this.likePost(args),
    'view': (args: any[]) => this.viewPost(args),
    'clear': (args: any[]) => this.viewPost(args),
    'comment': (args: any[]) => this.commentPost(args),
    'help': (args: any[]) => this.help(args),
  } as any;

  cmdsHelp = {
    'login': '<username> <password>',
    'post': '<content>',
    'like': '<post_id>',
    'view': '<post_id>',
    'comment': '<comment>'
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
      this.latestPost.comments.map((comment: any, cid: number) => {
        comment._id = cid+1;
      });

      this.output = {type: 'posts', data}
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
      this.latestPost.comments.map((comment: any, cid: number) => {
        comment._id = cid+1;
      });
      
      this.output = {type: 'posts', data}
    })
  }

  likePost(args: any[]) {
    if (args.length < 1) {
      this.output = {type: 'text', data: "/like <id>"};
      return;
    }

    this.apiService.postLike(this.token.access, args[0]).subscribe((data: any) => {
      console.log(data);
    });
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

  clear(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
  }

  newPost(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};

    const post = args.join(" ").trim();

    if (!post) return;

    this.apiService.postPost(this.token.access, post).subscribe((data: any) => {
      console.log(data);
      this.posts([]);
    });
  }

  posts(args: any[]) {
    this.output = {type: 'text', data: "Loading..."};
    this.latestPost = undefined;

    this.apiService.getPosts(this.token.access).subscribe((d: any) => {
      this.latestPosts = d.map((post: any, pid: number) => {
        post._id = pid+1
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
      this.output = {type: 'text', data: "Logged in!"};
      localStorage.setItem('login', JSON.stringify(data));
      this.token = data;
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
