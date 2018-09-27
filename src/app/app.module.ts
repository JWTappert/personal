import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AboutMeComponent } from './about-me/about-me.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { ExperienceComponent } from './experience/experience.component';
import { SkillsComponent } from './skills/skills.component';
import { NavComponent } from './nav/nav.component';
import { ContactComponent } from './contact/contact.component';
import { FooterComponent } from './footer/footer.component';
import { RankComponent } from './rank/rank.component';
import { SkillComponent } from './skill/skill.component';

@NgModule({
  declarations: [AppComponent, AboutMeComponent, ExperienceComponent, SkillsComponent, NavComponent, ContactComponent, FooterComponent, RankComponent, SkillComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
