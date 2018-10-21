import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NameSvgComponent } from './name-svg.component';

describe('NameSvgComponent', () => {
  let component: NameSvgComponent;
  let fixture: ComponentFixture<NameSvgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NameSvgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NameSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
