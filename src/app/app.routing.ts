import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DoneComponent } from "./done/done.component";

const routes: Routes = [
  {
    path: "done",
    component: DoneComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
