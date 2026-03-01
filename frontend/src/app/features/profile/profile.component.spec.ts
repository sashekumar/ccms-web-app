import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be a standalone component', () => {
    const componentMetadata = (ProfileComponent as any).ɵcmp;
    expect(componentMetadata.standalone).toBe(true);
  });

  it('should display "My Profile" title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');

    expect(title?.textContent).toContain('My Profile');
  });

  it('should display placeholder message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const message = compiled.querySelector('p');

    expect(message?.textContent).toContain('Profile management coming soon');
  });

  it('should have white background card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.bg-white');

    expect(card).toBeTruthy();
  });
});
