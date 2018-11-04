import { NgtUniversalModule } from '@ng-toolkit/universal';
import { CommonModule } from '@angular/common';
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routing";
import { FooterComponent } from "./footer/footer.component";
import { NameSvgComponent } from "./name-svg/name-svg.component";

@NgModule({
  declarations: [AppComponent, FooterComponent, NameSvgComponent],
  imports:[
 CommonModule,
NgtUniversalModule,
  AppRoutingModule],
  providers: [],
})
export class AppModule {}
