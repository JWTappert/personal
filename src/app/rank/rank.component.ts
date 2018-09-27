import { Component, Input, OnInit } from '@angular/core';
import { Skill } from '../skill/skill.component';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.css']
})
export class RankComponent implements OnInit {
  @Input()
  skill: Skill;

  star = `<i class="fas fa-star"></i>`;
  empty = `<i class="far fa-star"></i>`;

  rank = '';

  constructor() {}

  ngOnInit() {
    for (let i = 0; i < 5; i++) {
      if (i < this.skill.rank) {
        this.rank += this.star;
      } else {
        this.rank += this.empty;
      }
    }
  }
}
