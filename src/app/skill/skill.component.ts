import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.css']
})
export class SkillComponent implements OnInit {
  skills = [
    { skill: 'Javascript', rank: 4 },
    { skill: 'Angular', rank: 5 },
    { skill: 'Webpack', rank: 4 },
    { skill: 'C#', rank: 3 },
    { skill: 'Tensorflow', rank: 2 },
    { skill: 'Python', rank: 3 },
    { skill: 'Vim', rank: 4 }
  ];

  constructor() {}

  ngOnInit() {}
}

export class Skill {
  skill: string;
  rank: number;
}
