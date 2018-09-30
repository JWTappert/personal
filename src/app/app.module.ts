import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AboutMeComponent } from './about-me/about-me.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { ContactComponent } from './contact/contact.component';
import { ExperienceComponent } from './experience/experience.component';
import { FooterComponent } from './footer/footer.component';
import { NavComponent } from './nav/nav.component';
import { RankComponent } from './rank/rank.component';
import { SkillsComponent } from './skills/skills.component';
import { SuccessComponent } from './success/success.component';
import { HeroComponent } from './hero/hero.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutMeComponent,
    ExperienceComponent,
    SkillsComponent,
    NavComponent,
    ContactComponent,
    FooterComponent,
    RankComponent,
    SuccessComponent,
    HeroComponent
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
