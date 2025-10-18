import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-education-employment-form',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  form: FormGroup;
  submitted = false;
  showSummary = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      panCard: ['', [Validators.required, Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)]],

      hasEducation: ['', Validators.required],
      education: this.createEducationGroup(),

      hasEmployment: ['', Validators.required],
      employer: this.createEmployerGroup(),

      hasPreviousEmployment: ['', Validators.required],
      previousEmployer: this.createPrevEmployerGroup()
    });
  }

  createEducationGroup(): FormGroup {
    return this.fb.group({
      instituteName: [''],
      address: this.fb.group({
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        pincode: ['']
      }),
      courseName: [''],
      startDate: [''],
      endDate: [''],
      description: ['']
    });
  }

  createEmployerGroup(): FormGroup {
    return this.fb.group({
      companyName: [''],
      address: this.fb.group({
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        pincode: ['']
      }),
      startDate: [''],
      endDate: [''],
      salary: [''],
      jobTitle: [''],
      jobDescription: [''],
      workPhone: [''],
      description: ['']
    });
  }

  createPrevEmployerGroup(): FormGroup {
    return this.fb.group({
      companyName: [''],
      address: this.fb.group({
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        pincode: ['']
      }),
      startDate: [''],
      endDate: [''],
      jobTitle: [''],
      jobDescription: [''],
      contactNo: [''],
      supervisorName: [''],
      description: ['']
    });
  }

  onSubmit() {
    this.submitted = true;
    this.showSummary = false;

    this.applyValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.showSummary = true;
  }

  applyValidators() {
    this.applySectionValidators('education', this.form.get('hasEducation')?.value === 'yes');
    this.applySectionValidators('employer', this.form.get('hasEmployment')?.value === 'yes');
    this.applySectionValidators('previousEmployer', this.form.get('hasPreviousEmployment')?.value === 'yes');
  }

  applySectionValidators(section: string, enable: boolean) {
    const sec = this.form.get(section) as FormGroup;
    if (!sec) return;

    Object.keys(sec.controls).forEach(key => {
      const control = sec.get(key);
      if (key === 'address') {
        const addr = sec.get('address') as FormGroup;
        Object.keys(addr.controls).forEach(aKey => {
          const addrCtrl = addr.get(aKey);
          if (aKey === 'street2') {
            addrCtrl?.clearValidators();
          } else {
            enable
              ? addrCtrl?.setValidators(
                  aKey === 'pincode'
                    ? [Validators.required, Validators.pattern(/^\d{6}$/)]
                    : Validators.required
                )
              : addrCtrl?.clearValidators();
          }
          addrCtrl?.updateValueAndValidity();
        });
      } else if (key === 'supervisorName' || key === 'description') {
        control?.clearValidators();
      } else {
        enable
          ? control?.setValidators(this.getValidatorsForField(key))
          : control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });
  }

  getValidatorsForField(key: string) {
    switch (key) {
      case 'pincode':
        return [Validators.required, Validators.pattern(/^\d{6}$/)];
      case 'workPhone':
      case 'contactNo':
        return [Validators.required, Validators.pattern(/^\d{10}$/)];
      case 'salary':
        return [Validators.required, Validators.min(0)];
      default:
        return [Validators.required];
    }
  }

  hasError(controlPath: string, errorType: string): boolean {
    const control = this.form.get(controlPath);
    return !!(control && control.hasError(errorType) && (control.touched || this.submitted));
  }
}
