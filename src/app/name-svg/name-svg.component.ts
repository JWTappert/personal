import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-name-svg",
  templateUrl: "./name-svg.component.html",
  styleUrls: ["./name-svg.component.css"]
})
export class NameSvgComponent implements OnInit {
  @Input()
  color: string;

  constructor() {}

  ngOnInit() {}
}
