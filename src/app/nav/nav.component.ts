import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  links: NavigationLinks[] = [
    { label: 'about', location: 'about' },
    { label: 'experience', location: 'experience' },
    { label: 'contact', location: 'contact' }
  ];

  constructor() {}

  ngOnInit() {}
}

export class NavigationLinks {
  label: string;
  location: string;
}
