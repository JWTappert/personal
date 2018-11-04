import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Component, Inject, OnInit, PLATFORM_ID } from "@angular/core";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  randColor: string;
  constructor(@Inject(PLATFORM_ID) private platformId: any, @Inject(DOCUMENT) private document: any) {}

  ngOnInit(): void {
    this.getRandomColors();
    if (!isPlatformBrowser(this.platformId)) {
      const bases = this.document.getElementsByTagName("base");

      if (bases.length > 0) {
        bases[0].setAttribute("href", environment.baseHref);
      }
    }
  }

  getRandomColors(): void {
    const num = Math.floor(Math.random() * 100);
    this.randColor = color[num];
  }
}

const color = [
  "#9c3b68",
  "#56d768",
  "#a43bb9",
  "#65b727",
  "#8451ce",
  "#b0c323",
  "#576ce7",
  "#98c43e",
  "#e36adc",
  "#21bd58",
  "#bf36a4",
  "#41b243",
  "#dd3999",
  "#7ecf59",
  "#a377ea",
  "#4b951c",
  "#6150b6",
  "#d0b930",
  "#3c7ae7",
  "#e2a822",
  "#4f70c9",
  "#e99223",
  "#689ae9",
  "#90a521",
  "#c47ad9",
  "#3cca7c",
  "#b32c7c",
  "#86b748",
  "#a358b1",
  "#398f3d",
  "#d93672",
  "#50ca98",
  "#e23c56",
  "#3fc9d5",
  "#d23e29",
  "#55b4e3",
  "#e5682b",
  "#206fa9",
  "#e5a73f",
  "#674698",
  "#bcc154",
  "#923c8e",
  "#689029",
  "#ea85d8",
  "#81c170",
  "#d95da9",
  "#339c6e",
  "#ea6a90",
  "#2f7038",
  "#db99dd",
  "#5a7722",
  "#a486d4",
  "#b3a235",
  "#7a589e",
  "#868d29",
  "#746bb0",
  "#dcb355",
  "#485c97",
  "#be7121",
  "#5092c3",
  "#ab4819",
  "#2ea59b",
  "#b13135",
  "#76c7a6",
  "#e36666",
  "#1a6447",
  "#e97150",
  "#667fbb",
  "#ac8424",
  "#afa7e7",
  "#7b6512",
  "#94548c",
  "#89a853",
  "#c76491",
  "#5d945c",
  "#a94153",
  "#3d876b",
  "#eb93ba",
  "#476025",
  "#ba7aac",
  "#595e1a",
  "#8f5273",
  "#b4bf7a",
  "#8c4850",
  "#667f42",
  "#e08991",
  "#909d61",
  "#ba6663",
  "#ada257",
  "#c2654a",
  "#7c7d3e",
  "#ee8f7d",
  "#7c5a25",
  "#dcba7b",
  "#914d27",
  "#dca379",
  "#947f42",
  "#e89558",
  "#aa7647",
  "#c79054"
];
