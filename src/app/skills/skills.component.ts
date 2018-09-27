import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css']
})
export class SkillsComponent implements OnInit {
  skills = [
    { skill: 'Javascript', rank: 4 },
    { skill: 'Angular', rank: 5 },
    { skill: 'Webpack', rank: 4 },
    { skill: 'C#', rank: 3 },
    { skill: 'Tensorflow', rank: 2 },
    { skill: 'Python', rank: 3 },
    { skill: 'Vim', rank: 4 },
    { skill: 'Pandas', rank: 4 },
    { skill: 'Go', rank: 1 },
    { skill: 'Rust', rank: 0 }
  ];

  constructor() {}

  ngOnInit() {}
}

export class Skill {
  skill: string;
  rank: number;
}
