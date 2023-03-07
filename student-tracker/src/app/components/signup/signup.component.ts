import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'src/app/interfaces/user.interface';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();

  user: User;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit() {
    // load user from auth service
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user.id) {
        this.user = user;
      } else {
        // if the user is not initialized in auth service, take user to login page
        this.router.navigate(["login"]);
        this.messageService.add({ severity: 'error', summary: 'Sign Up', detail: 'There was an error loading your details, log in again' });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // validate form and then update the user after submission
  onSubmit() {
    // check if the user entered the grade
    if (this.user.grade) {
      // check if the user entered the school id
      if (this.user.schoolId.length > 0) {
        this.authService.addNewUser(this.user);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Sign Up', detail: 'Please put in an ID number in order to sign up' });
      }
    } else {
      this.messageService.add({ severity: 'error', summary: 'Sign Up', detail: 'Please pick a grade in order to sign up' });
    }
  }
}
