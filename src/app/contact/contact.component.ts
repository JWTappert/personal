import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {}

  handleForm(form: Object) {
    this.http
      .post(
        '/',
        {
          body: {
            'form-name': 'contact',
            ...form
          }
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .subscribe(response => {
        console.log(response);
      });
  }
}
