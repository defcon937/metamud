import { Component, Input } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  title = 'metamud-frontend';
  @Input() cmd: string = '';
  output = 'Type /help for help!';
  token = {} as any;

  constructor(private apiService: ApiService) {}

  cmds = {
    'login': (args: any[]) => this.login(args),
    'swords': (args: any[]) => this.swords(args)
  } as any;

  swords(args: any[]) {
    this.output = "Loading...";
    this.apiService.getSwords(this.token.access).subscribe((data: any) => {
      console.log(data);
      this.output = JSON.stringify(data, null, 2)
    });
  }

  login(args: any[]) {
    if (args.length < 2) {
      this.output = "Failed to log in. /login <username> <password>";
      return;
    }

    this.output = "Logging in...";

    this.apiService.getLogin(args[0], args[1]).subscribe((data: any) => {
      console.log("Data", data);
      this.output = "Logged in!";
      this.token = data;
    });
  }

  submitData() {
    const tokens = this.cmd.split(" ");
    const cmd = tokens[0].substring(1, tokens[0].length);
    console.log("Found cmd", cmd);
    const cmdToRun = this.cmds[cmd];

    if (cmdToRun) {
      tokens.shift()
      cmdToRun(tokens);
    } else {
      this.output = "Command not found.";
    }

    console.log("Sent", this.cmd);
    this.cmd = "";
  }
}
