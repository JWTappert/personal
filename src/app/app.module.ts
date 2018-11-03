import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routing";
import { FooterComponent } from "./footer/footer.component";
import { NameSvgComponent } from "./name-svg/name-svg.component";
import { DoneComponent } from './done/done.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [AppComponent, FooterComponent, NameSvgComponent, DoneComponent, HomeComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
