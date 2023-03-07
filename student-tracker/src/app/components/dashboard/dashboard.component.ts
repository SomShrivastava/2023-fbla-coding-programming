import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Subject, takeUntil } from 'rxjs';
import { Constants } from 'src/app/app.constants';
import { History } from 'src/app/interfaces/history.interface';
import { User } from 'src/app/interfaces/user.interface';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();

  userId: string;

  user: User;

  users: User[];

  currentTab: string = "Dashboard";

  history: History[];

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private authService: AuthService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {
    this.userId = this.activeRoute.snapshot.queryParamMap.get("userId");
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user.id) {
        this.user = user;
      } else {
        this.db.collection("users").doc(this.userId).ref.get()
          .then(doc => {
            if (doc.exists) {
             this.user = doc.data() as User; 
             this.authService.user.next(this.user);
            }
          })
      }
    });
    this.db.collection("users").valueChanges().pipe(takeUntil(this.destroy$)).subscribe(users => {
      if (users.length > 0) {
        this.users = users as User[];
        this.users = this.users.filter(user => user.quarter == this.authService.quarter);
        this.users.sort((a, b) => a.points - b.points).reverse();
      };
    });
    this.db.collection("history").valueChanges().pipe(takeUntil(this.destroy$)).subscribe(history => {
      if (history.length > 0) {
        this.history = history as History[];
      };
    });

    let today = Timestamp.now().toMillis();
    if (today == Constants.q1initial || today == Constants.q2initial || today == Constants.q3initial || today == Constants.q4initial) {
      let date = `${this.authService.quarter}-${new Date().getFullYear()}`;
      if (!this.history[date]) {
        let differential = this.users[0].points - this.users[1].points;
        let topWinnerPrize = "";
        if (differential >= 50) {
          topWinnerPrize = Constants.prizes[2];
        } else if (differential >= 25) {
          topWinnerPrize = Constants.prizes[1];
        } else if (differential >= 0) {
          topWinnerPrize = Constants.prizes[0];
        }
        const newHistory: History = {
          date: date,
          topWinner: {
            id: this.users[0].id,
            prize: topWinnerPrize
          },
          randomWinner: {
            id: this.users[Math.random() * this.users.length].id,
            prize: Constants.prizes[Math.random() * 3]
          }
        };
        this.db.collection("history").doc(date).set(newHistory);
      }
    }
  }

  onAttendanceChange(index: number, event: any) {
    this.user.events[index].attended = event.value;
    this.authService.updateUser(this.user);
  }

  onAttendanceTypeChange(index: number, event: any) {
    this.user.events[index].type = event.value;
    this.authService.updateUser(this.user);
  }

  getUserName(userId: string) {
    return this.users.filter(user => user.id == userId)[0].name;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
