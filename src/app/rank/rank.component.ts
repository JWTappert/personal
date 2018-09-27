import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.css']
})
export class RankComponent implements OnInit {
  @Input()
  stars: number;
  @Input()
  skill: string;

  star = `<i class="fas fa-star"></i>`;
  empty = `<i class="far fa-star"></i>`;

  rank = '';

  constructor() {}

  ngOnInit() {
    for (let i = 0; i < 5; i++) {
      if (i < this.stars) {
        this.rank += this.star;
      } else {
        this.rank += this.empty;
      }
    }
  }
}
